/**
 * useNetPong.ts — Motor do PONG em rede (host-autoritativo).
 *
 * Reaproveita a MESMA cena 3D e física do modo solo, mas troca a IA por um
 * oponente humano:
 *
 *  • HOST  simula tudo (física, colisões, efeito, placar) e transmite o estado
 *          ~30x/s. A raquete de longe é movida pelo INPUT do guest.
 *  • GUEST não simula: envia só o toque da própria raquete e renderiza o estado
 *          recebido, ESPELHANDO X e Z para também se ver na parte de baixo.
 *
 * Cada jogador controla sempre a raquete CIANO embaixo (perto da câmera) — a UX
 * correta de pong online. O espelhamento (X,Z → -X,-Z) cuida disso de forma
 * simétrica e limpa.
 */

import { Renderer } from "expo-three";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, Vibration } from "react-native";
import * as THREE from "three";

import { BALL_R, BALL_Y, CATCH_ASSIST, DIFFS, PADDLE, SPIN, TABLE, WIN_SCORE } from "../constants";
import type { NetChannel, NetEvent, NetState } from "../net";
import { buildArena, buildRacket, buildTable, neon } from "../scene";
import { DEFAULT_MMR } from "../storage";
import type { MatchResult } from "../storage";
import { C3D, NEON } from "../theme";
import type { FloatingLabel, Phase } from "../types";

const BALL_SPEED = DIFFS.normal.ballSpeed; // velocidade base fixa no multiplayer

interface NetRefs {
  renderer: Renderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  ball: THREE.Mesh | null;
  player: THREE.Group | null; // minha raquete (perto, ciano)
  opp: THREE.Group | null; // raquete do oponente (longe, magenta)
  orbs: THREE.Mesh[];
  vel: { x: number; z: number };
  spin: number;
  targetX: number; // alvo da minha raquete (meu dedo)
  oppTargetX: number; // host: alvo da raquete do guest (já no host frame)
  // alvos autoritativos recebidos (guest renderiza por lerp):
  netBall: { x: number; z: number };
  netOpp: number;
  phase: Phase;
  serveAt: number;
  serveDir: 1 | -1;
  speedMul: number;
  rally: number;
  animFrame: number;
  t: number;
}

export interface UseNetPongOptions {
  net: NetChannel;
  /** Meu MMR ranked atual — anunciado ao oponente no aperto de mão. */
  selfMMR?: number;
  /** Identidade do oponente (para registrar a partida ranked no ranking). */
  opponent?: { nick: string; emoji: string };
  /** Chamado UMA vez quando a partida termina (registra a partida). */
  onMatchEnd?: (m: MatchResult) => void;
  onExit?: () => void;
}

export function useNetPong({ net, selfMMR, opponent, onMatchEnd }: UseNetPongOptions) {
  const isHost = net.isHost;

  // UI state (espelha os refs do loop)
  const [score, setScore] = useState({ p: 0, c: 0 }); // p = eu, c = oponente
  const [phase, setPhase] = useState<Phase>("idle");
  const [rally, setRally] = useState(0);
  const [bestRally, setBestRally] = useState(0);
  const [speedMul, setSpeedMul] = useState(1);
  const [overVisible, setOverVisible] = useState(false);
  const [floatLabels, setFloatLabels] = useState<FloatingLabel[]>([]);
  const [waitingRematch, setWaitingRematch] = useState(false);

  const scoreRef = useRef(score);
  const bestRef = useRef(0);
  const viewSize = useRef({ w: 1, h: 1 });
  const isHostRef = useRef(isHost);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  // ── RANKED: opções "vivas" (refs) usadas no loop / handlers / handshake ─────
  const selfMMRRef = useRef(selfMMR ?? DEFAULT_MMR); // meu rating (anunciado)
  const oppMMRRef = useRef(DEFAULT_MMR); // rating do oponente (recebido)
  const opponentRef = useRef(opponent); // nick/emoji do oponente
  const onMatchEndRef = useRef(onMatchEnd); // callback de fim de partida
  const recordedRef = useRef(false); // já registrei ESTA partida?
  const helloRepliedRef = useRef(false); // já respondi o hello deste exchange?
  useEffect(() => {
    selfMMRRef.current = selfMMR ?? DEFAULT_MMR;
  }, [selfMMR]);
  useEffect(() => {
    opponentRef.current = opponent;
  }, [opponent]);
  useEffect(() => {
    onMatchEndRef.current = onMatchEnd;
  }, [onMatchEnd]);

  const refs = useRef<NetRefs>({
    renderer: null,
    scene: null,
    camera: null,
    ball: null,
    player: null,
    opp: null,
    orbs: [],
    vel: { x: 0, z: 0 },
    spin: 0,
    targetX: 0,
    oppTargetX: 0,
    netBall: { x: 0, z: 0 },
    netOpp: 0,
    phase: "idle",
    serveAt: 0,
    serveDir: -1,
    speedMul: 1,
    rally: 0,
    animFrame: 0,
    t: 0,
  });

  const setPhaseBoth = useCallback((p: Phase) => {
    refs.current.phase = p;
    setPhase(p);
  }, []);

  // ── Pulso (dicas) ──────────────────────────────────────────────────────────
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ]),
    ).start();
  }, []);
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  // ── Floating labels ───────────────────────────────────────────────────────
  const spawnLabel = useCallback((text: string, color: string) => {
    const { w, h } = viewSize.current;
    const anim = new Animated.Value(0);
    const id = `${Date.now()}_${Math.random()}`;
    setFloatLabels((prev) => [...prev, { id, x: w / 2, y: h * 0.42, text, color, anim }]);
    Animated.timing(anim, { toValue: 1, duration: 1300, useNativeDriver: true }).start(() => {
      setFloatLabels((prev) => prev.filter((l) => l.id !== id));
    });
  }, []);

  // ── RANKED: aperto de mão (troca de MMR pelo relay de "event") ─────────────
  // O servidor só repassa eventos, então isto não exige mudança no servidor.
  const sendHello = useCallback(() => {
    net.sendEvent({ kind: "hello", mmr: Math.round(selfMMRRef.current) });
  }, [net]);

  /** (Re)inicia a troca: libera a resposta e anuncia meu rating atual. */
  const handshake = useCallback(() => {
    helloRepliedRef.current = false;
    sendHello();
  }, [sendHello]);

  // ── Saque / reset (só o host usa) ──────────────────────────────────────────
  const resetBall = useCallback(() => {
    const r = refs.current;
    if (r.ball) r.ball.position.set(0, BALL_Y, 0);
    r.vel.x = 0;
    r.vel.z = 0;
    r.spin = 0;
    r.speedMul = 1;
    setSpeedMul(1);
  }, []);

  const scheduleServe = useCallback(
    (dir: 1 | -1, delay = 900) => {
      const r = refs.current;
      resetBall();
      r.serveDir = dir;
      r.serveAt = performance.now() + delay;
      setPhaseBoth("serving");
    },
    [resetBall, setPhaseBoth],
  );

  const startGame = useCallback(() => {
    if (!isHostRef.current) {
      // guest "pede" revanche; o host reinicia e o estado volta a fluir
      net.sendRematch();
      setWaitingRematch(true);
      handshake(); // reanuncia meu MMR (pode ter mudado) para a revanche
      return;
    }
    scoreRef.current = { p: 0, c: 0 };
    setScore({ p: 0, c: 0 });
    refs.current.rally = 0;
    setRally(0);
    setOverVisible(false);
    setWaitingRematch(false);
    handshake(); // reanuncia meu MMR no início da partida
    scheduleServe(-1, 650); // primeiro saque vai para o oponente (longe)
  }, [net, scheduleServe, handshake]);

  // ── Ponto (só o host marca; guest recebe via estado/evento) ─────────────────
  const onPoint = useCallback(
    (who: "host" | "guest") => {
      // No host frame: "host" = eu (perto) marquei; "guest" = oponente marcou.
      const meScored = who === "host";
      const prev = scoreRef.current;
      const ns = { p: prev.p + (meScored ? 1 : 0), c: prev.c + (meScored ? 0 : 1) };
      scoreRef.current = ns;
      setScore(ns);
      refs.current.rally = 0;
      setRally(0);

      spawnLabel(meScored ? "🎉 POINT!" : "😤 -1", meScored ? NEON.cyan : NEON.magenta);
      Vibration.vibrate(meScored ? [0, 30, 50, 30] : 60);
      net.sendEvent({ kind: "point", side: who });

      if (ns.p >= WIN_SCORE || ns.c >= WIN_SCORE) {
        setPhaseBoth("over");
        resetBall();
        setOverVisible(true);
        Vibration.vibrate([0, 60, 80, 60, 80, 120]);
        net.sendEvent({ kind: "over", winner: ns.p >= WIN_SCORE ? "host" : "guest" });
      } else {
        // saque vai em direção a quem perdeu o ponto
        scheduleServe(meScored ? -1 : 1);
      }
    },
    [net, resetBall, scheduleServe, setPhaseBoth, spawnLabel],
  );
  const onPointRef = useRef(onPoint);
  useEffect(() => {
    onPointRef.current = onPoint;
  }, [onPoint]);

  // ── Rebatida (host) ─────────────────────────────────────────────────────────
  const onHit = useCallback(
    (spinMag: number, side: "host" | "guest") => {
      const r = refs.current;
      r.rally += 1;
      setRally(r.rally);
      if (r.rally > bestRef.current) {
        bestRef.current = r.rally;
        setBestRally(r.rally);
      }
      setSpeedMul(r.speedMul);
      net.sendEvent({ kind: "hit", side });
      if (side === "host") Vibration.vibrate(10);
      if (spinMag >= SPIN.labelAt) {
        net.sendEvent({ kind: "effect", side });
        if (side === "host") {
          spawnLabel("🌀 EFFECT!", NEON.cyan);
          Vibration.vibrate([0, 14, 22, 14]);
        }
      }
    },
    [net, spawnLabel],
  );
  const onHitRef = useRef(onHit);
  useEffect(() => {
    onHitRef.current = onHit;
  }, [onHit]);

  // ── Handlers de rede (relay do oponente) ───────────────────────────────────
  useEffect(() => {
    net.setHandlers({
      // GUEST: recebe o estado autoritativo do host (host frame → espelha aqui).
      onState: (s: NetState) => {
        if (isHostRef.current) return;
        const r = refs.current;
        r.netBall.x = -s.bx;
        r.netBall.z = -s.bz;
        r.netOpp = -s.hp; // raquete do host (longe pra mim)
        r.phase = s.ph;
        setPhase(s.ph);
        if (s.ph === "serving" || s.ph === "play") {
          setOverVisible(false);
          setWaitingRematch(false);
        }
        const ns = { p: s.gs, c: s.hs }; // eu = guest, oponente = host
        scoreRef.current = ns;
        setScore(ns);
        setSpeedMul(s.sm);
        setRally(s.rl);
        if (s.rl > bestRef.current) {
          bestRef.current = s.rl;
          setBestRally(s.rl);
        }
        if (s.ph === "over") setOverVisible(true);
      },
      // HOST: recebe o input da raquete do guest (guest frame → -x no host frame).
      onInput: (targetX: number) => {
        if (!isHostRef.current) return;
        refs.current.oppTargetX = -targetX;
      },
      onEvent: (e: NetEvent) => {
        if (e.kind === "hello") {
          // RANKED: oponente anunciou o MMR dele. Guarda e responde uma vez,
          // garantindo a troca nos dois sentidos mesmo com ordem de chegada.
          oppMMRRef.current = e.mmr;
          if (!helloRepliedRef.current) {
            helloRepliedRef.current = true;
            sendHello();
          }
          return;
        }
        if (e.kind === "effect") {
          // mostra "EFFECT!" só para quem deu o corte
          const mine = isHostRef.current ? e.side === "host" : e.side === "guest";
          if (mine && isHostRef.current) return; // host já mostrou localmente
          if (mine) spawnLabel("🌀 EFFECT!", NEON.cyan);
        } else if (e.kind === "hit") {
          const mine = isHostRef.current ? e.side === "host" : e.side === "guest";
          if (mine && !isHostRef.current) Vibration.vibrate(10);
        } else if (e.kind === "point") {
          if (!isHostRef.current) {
            // guest: side "guest" = eu marquei
            const meScored = e.side === "guest";
            spawnLabel(meScored ? "🎉 POINT!" : "😤 -1", meScored ? NEON.cyan : NEON.magenta);
            Vibration.vibrate(meScored ? [0, 30, 50, 30] : 60);
          }
        } else if (e.kind === "over") {
          if (!isHostRef.current) {
            setOverVisible(true);
            Vibration.vibrate([0, 60, 80, 60, 80, 120]);
          }
        }
      },
      // HOST: guest pediu revanche → reinicia a partida.
      onRematch: () => {
        if (isHostRef.current) startGame();
      },
    });
  }, [net, spawnLabel, startGame, sendHello]);

  // ── RANKED: troca inicial de MMR assim que a partida monta (host e guest) ───
  useEffect(() => {
    const id = setTimeout(() => handshake(), 250);
    return () => clearTimeout(id);
  }, [handshake]);

  // ── RANKED: registra a partida no ranking UMA vez, quando ela termina ───────
  // Dispara no host e no guest (cada um registra o PRÓPRIO resultado local). O
  // placar vem do ref (já final quando a fase vira "over"); o vencedor é quem
  // chegou ao WIN_SCORE. Partidas incompletas (oponente saiu) não viram "over",
  // portanto não são registradas — de propósito.
  useEffect(() => {
    if (phase === "over") {
      if (!recordedRef.current) {
        recordedRef.current = true;
        const sc = scoreRef.current;
        const won = sc.p >= WIN_SCORE;
        const opp = opponentRef.current;
        onMatchEndRef.current?.({
          mode: "ranked",
          result: won ? "win" : "loss",
          playerScore: sc.p,
          cpuScore: sc.c,
          bestRally: bestRef.current,
          opponent: {
            nick: opp?.nick ?? "Player",
            emoji: opp?.emoji ?? "🎮",
            mmr: Math.round(oppMMRRef.current),
          },
        });
      }
    } else if (phase === "serving" || phase === "play") {
      recordedRef.current = false; // re-arma para a próxima partida (revanche)
    }
  }, [phase]);

  // ── Auto-start: o host começa a partida assim que a tela monta ──────────────
  useEffect(() => {
    if (!isHost) return;
    const id = setTimeout(() => startGame(), 1400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost]);

  // ── GL + loop ───────────────────────────────────────────────────────────────
  const lastNetInput = useRef(0);

  const onContextCreate = useCallback(async (gl: WebGLRenderingContext) => {
    const r = refs.current;
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;

    // @ts-ignore — expo-three Renderer aceita o contexto gl
    r.renderer = new Renderer({ gl });
    r.renderer!.setSize(w, h);
    r.renderer!.shadowMap.enabled = true;

    r.scene = new THREE.Scene();
    r.scene.background = null;
    r.scene.fog = new THREE.Fog(C3D.fog, 14, 30);

    r.scene.add(new THREE.AmbientLight(0x8899ff, 0.45));
    const dir = new THREE.DirectionalLight(0xbcd0ff, 0.7);
    dir.position.set(5, 10, 6);
    dir.castShadow = true;
    r.scene.add(dir);
    const cyanLight = new THREE.PointLight(C3D.player, 1.3, 16);
    cyanLight.position.set(-4, 3, 5);
    r.scene.add(cyanLight);
    const magentaLight = new THREE.PointLight(C3D.ai, 1.3, 16);
    magentaLight.position.set(4, 3, -5);
    r.scene.add(magentaLight);

    r.camera = new THREE.PerspectiveCamera(56, w / h, 0.1, 100);
    r.camera.position.set(0, 5.6, 9.0);
    r.camera.lookAt(0, -0.4, -1.0);

    buildArena(r.scene, r as any);
    buildTable(r.scene);

    // Minha raquete (ciano, perto) e a do oponente (magenta, longe)
    r.player = buildRacket(C3D.rubberPlayer, C3D.player);
    r.player.position.set(0, 0, PADDLE.z);
    r.scene.add(r.player);

    r.opp = buildRacket(C3D.rubberAi, C3D.ai);
    r.opp.position.set(0, 0, -PADDLE.z);
    r.opp.rotation.y = Math.PI;
    r.scene.add(r.opp);

    r.ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 16, 16), neon(C3D.ball));
    r.ball.castShadow = true;
    r.ball.position.set(0, BALL_Y, 0);
    r.scene.add(r.ball);

    let lastT = performance.now();
    const animate = () => {
      r.animFrame = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.034, (now - lastT) / 1000);
      lastT = now;
      r.t += dt;

      const ball = r.ball!;
      const player = r.player!;
      const opp = r.opp!;
      const v = r.vel;
      const limX = TABLE.halfW - PADDLE.halfW;

      r.orbs.forEach((orb) => {
        orb.position.y = orb.userData.baseY + 0.18 * Math.sin(r.t * orb.userData.spd + orb.userData.off);
      });

      // Minha raquete persegue meu dedo (igual nos dois papéis)
      const tx = THREE.MathUtils.clamp(r.targetX, -limX, limX);
      const playerPrevX = player.position.x;
      player.position.x += (tx - player.position.x) * Math.min(1, dt * 24);
      player.userData.vx = (player.position.x - playerPrevX) / Math.max(dt, 1e-4);
      const lean = THREE.MathUtils.clamp((player.position.x - tx) * 0.55, -0.38, 0.38);
      player.rotation.z += (lean - player.rotation.z) * Math.min(1, dt * 14);

      if (isHostRef.current) {
        // ───────────────── HOST: simula tudo ─────────────────
        // Raquete do oponente segue o input do guest (suave)
        const ot = THREE.MathUtils.clamp(r.oppTargetX, -limX, limX);
        const oppPrevX = opp.position.x;
        opp.position.x += (ot - opp.position.x) * Math.min(1, dt * 24);
        opp.userData.vx = (opp.position.x - oppPrevX) / Math.max(dt, 1e-4);
        const oppLean = THREE.MathUtils.clamp((opp.position.x - ot) * 0.55, -0.35, 0.35);
        opp.rotation.z += (oppLean - opp.rotation.z) * Math.min(1, dt * 12);

        if (r.phase === "serving" && now >= r.serveAt) {
          v.z = r.serveDir * BALL_SPEED * 0.95;
          v.x = (Math.random() * 2 - 1) * BALL_SPEED * 0.32;
          r.phase = "play";
          setPhase("play");
        }

        if (r.phase === "play") {
          // efeito (sidespin)
          if (r.spin !== 0) {
            const ang = r.spin * dt;
            const cs = Math.cos(ang);
            const sn = Math.sin(ang);
            const rvx = v.x * cs - v.z * sn;
            const rvz = v.x * sn + v.z * cs;
            v.x = rvx;
            v.z = rvz;
            r.spin *= Math.exp(-dt / SPIN.tau);
            if (Math.abs(r.spin) < 0.02) r.spin = 0;
          }

          const prevZ = ball.position.z;
          let nx = ball.position.x + v.x * dt;
          let nz = ball.position.z + v.z * dt;

          const maxX = TABLE.halfW - BALL_R;
          if (nx > maxX) {
            nx = maxX - (nx - maxX);
            v.x = -Math.abs(v.x);
            r.spin *= 0.5;
          } else if (nx < -maxX) {
            nx = -maxX + (-maxX - nx);
            v.x = Math.abs(v.x);
            r.spin *= 0.5;
          }

          const tryPaddle = (paddle: THREE.Object3D, dirSign: 1 | -1): boolean => {
            if (Math.sign(v.z) !== dirSign) return false;
            const plane = dirSign * (PADDLE.z - BALL_R - PADDLE.d / 2);
            const crossed = dirSign === 1 ? prevZ <= plane && nz >= plane : prevZ >= plane && nz <= plane;
            if (!crossed) return false;
            const tFrac = (plane - prevZ) / (nz - prevZ || 1e-6);
            const hitX = ball.position.x + v.x * dt * tFrac;
            if (Math.abs(hitX - paddle.position.x) > PADDLE.halfW + BALL_R + CATCH_ASSIST) return false;

            r.speedMul = Math.min(2, r.speedMul * 1.05);
            const base = BALL_SPEED * r.speedMul;
            const paddleVX = (paddle.userData.vx as number) ?? 0;
            let vx = v.x + (hitX - paddle.position.x) * 3.1 + paddleVX * SPIN.kick;
            vx = THREE.MathUtils.clamp(vx, -base * 0.8, base * 0.8);
            const minVz = base * 0.62;
            const vz = Math.max(minVz, Math.sqrt(Math.max(base * base - vx * vx, minVz * minVz)));
            v.x = vx;
            v.z = -dirSign * vz;
            r.spin = THREE.MathUtils.clamp(paddleVX * SPIN.gain * -dirSign, -SPIN.max, SPIN.max);
            nz = plane;
            (paddle as any).hitAt = now;
            // dirSign 1 = minha raquete (host), -1 = raquete do guest
            onHitRef.current(Math.abs(r.spin), dirSign === 1 ? "host" : "guest");
            return true;
          };

          tryPaddle(player, 1);
          tryPaddle(opp, -1);

          ball.position.x = nx;
          ball.position.z = nz;

          // Ponto? (host frame: perto = host/eu)
          if (nz > TABLE.halfL + 1.1) onPointRef.current("guest"); // passou de mim → guest marca
          else if (nz < -(TABLE.halfL + 1.1)) onPointRef.current("host"); // passou do guest → eu marco
        }

        // Transmite o estado autoritativo (throttle no canal)
        net.sendState({
          bx: ball.position.x,
          bz: ball.position.z,
          hp: player.position.x,
          gp: opp.position.x,
          hs: scoreRef.current.p,
          gs: scoreRef.current.c,
          ph: r.phase,
          sm: r.speedMul,
          rl: r.rally,
        });
      } else {
        // ───────────────── GUEST: renderiza o estado recebido ─────────────────
        // bola e raquete do oponente por lerp suave
        const k = Math.min(1, dt * 14);
        ball.position.x += (r.netBall.x - ball.position.x) * k;
        ball.position.z += (r.netBall.z - ball.position.z) * k;
        const oppPrevX = opp.position.x;
        opp.position.x += (r.netOpp - opp.position.x) * Math.min(1, dt * 18);
        opp.userData.vx = (opp.position.x - oppPrevX) / Math.max(dt, 1e-4);
        const oppLean = THREE.MathUtils.clamp((opp.position.x - r.netOpp) * 0.5, -0.35, 0.35);
        opp.rotation.z += (oppLean - opp.rotation.z) * Math.min(1, dt * 10);

        // Envia meu input ~30Hz (no meu frame; o host inverte)
        if (now - lastNetInput.current >= 33) {
          lastNetInput.current = now;
          net.sendInput(player.position.x);
        }
      }

      // "twang" das raquetes
      [player, opp].forEach((p) => {
        const hitAt = (p as any).hitAt ?? 0;
        const kk = Math.max(0, 1 - (now - hitAt) / 160);
        const sw = 1 + 0.18 * kk;
        p.scale.set(sw, sw, 1 - 0.2 * kk);
      });

      if (r.phase === "serving" || r.phase === "idle") {
        const sBall = 1 + 0.12 * Math.sin(r.t * 6);
        ball.scale.set(sBall, sBall, sBall);
      } else {
        ball.scale.set(1, 1, 1);
      }
      ball.rotation.x += v.z * dt * 2;
      ball.rotation.z -= v.x * dt * 2;

      r.renderer!.render(r.scene!, r.camera!);
      (gl as any).endFrameEXP?.();
    };
    animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Touch ───────────────────────────────────────────────────────────────────
  const onCanvasLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    viewSize.current = { w: width, h: height };
  }, []);

  const moveFromTouch = useCallback((locationX: number) => {
    const { w } = viewSize.current;
    if (w <= 1) return;
    const nx = (locationX / w) * 2 - 1;
    refs.current.targetX = nx * (TABLE.halfW - PADDLE.halfW) * 1.12;
  }, []);

  const onTouchStart = useCallback((e: any) => moveFromTouch(e.nativeEvent.locationX), [moveFromTouch]);
  const onTouchMove = useCallback((e: any) => moveFromTouch(e.nativeEvent.locationX), [moveFromTouch]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimationFrame(refs.current.animFrame);
      refs.current.renderer?.dispose?.();
    };
  }, []);

  return {
    isHost,
    score,
    phase,
    rally,
    bestRally,
    speedMul,
    overVisible,
    floatLabels,
    waitingRematch,
    pulseOpacity,
    pulseScale,
    startGame,
    onContextCreate,
    onCanvasLayout,
    onTouchStart,
    onTouchMove,
  };
}
