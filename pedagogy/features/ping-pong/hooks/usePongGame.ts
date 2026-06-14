/**
 * usePongGame.ts — Cérebro do jogo.
 *
 * Concentra TODO o estado, os refs vivos, o loop de física/render (GL) e os
 * handlers de toque. A camada visual (PingPongGame.tsx) apenas consome o que
 * este hook retorna — nenhum JSX ou estilo mora aqui.
 */

import { Renderer } from "expo-three";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, Vibration } from "react-native";
import * as THREE from "three";

import {
  AI,
  BALL_R,
  BALL_Y,
  CATCH_ASSIST,
  DIFFS,
  FATIGUE,
  PADDLE,
  RALLY,
  SPIN,
  TABLE,
  WIN_SCORE,
} from "../constants";
import { buildArena, buildRacket, buildTable, neon } from "../scene";
import type { MatchResult } from "../storage";
import { C3D, NEON } from "../theme";
import type { DiffId, FloatingLabel, Phase, SceneRefs } from "../types";

export interface UsePongGameOptions {
  /**
   * Chamado UMA vez quando a partida termina (alguém chega em WIN_SCORE),
   * com o resultado já fechado. É o gancho para registrar o ranking.
   */
  onMatchEnd?: (result: MatchResult) => void;
}

export function usePongGame(options: UsePongGameOptions = {}) {
  // Mantém o callback num ref para o loop/closure sempre ver a versão atual.
  const onMatchEndRef = useRef(options.onMatchEnd);
  useEffect(() => {
    onMatchEndRef.current = options.onMatchEnd;
  }, [options.onMatchEnd]);
  // UI state (espelha os refs do loop)
  const [score, setScore] = useState({ p: 0, c: 0 });
  const [phase, setPhase] = useState<Phase>("idle");
  const [rally, setRally] = useState(0);
  const [bestRally, setBestRally] = useState(0);
  const [speedMul, setSpeedMul] = useState(1);
  const [diff, setDiff] = useState<DiffId>("normal");
  const [overVisible, setOverVisible] = useState(false);
  const [floatLabels, setFloatLabels] = useState<FloatingLabel[]>([]);

  // Refs vivos para o loop (fora do ciclo do React)
  const scoreRef = useRef(score);
  const diffRef = useRef<DiffId>(diff);
  const bestRef = useRef(0);
  useEffect(() => {
    diffRef.current = diff;
  }, [diff]);

  const viewSize = useRef({ w: 1, h: 1 });

  const refs = useRef<SceneRefs>({
    renderer: null,
    scene: null,
    camera: null,
    ball: null,
    player: null,
    ai: null,
    orbs: [],
    vel: { x: 0, z: 0 },
    spin: 0,
    targetX: 0,
    phase: "idle",
    serveAt: 0,
    serveDir: -1,
    speedMul: 1,
    rally: 0,
    animFrame: 0,
    t: 0,
    playTime: 0,
    prevVZSign: 0,
    aiAimErr: 0,
    tiredShown: false,
  });

  const setPhaseBoth = useCallback((p: Phase) => {
    refs.current.phase = p;
    setPhase(p);
  }, []);

  // ── Pulso contínuo (texto de dica / start) ────────────────────────────────

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ]),
    ).start();
  }, []);
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  // ── Floating label (centro da quadra) ─────────────────────────────────────

  const spawnLabel = useCallback((text: string, color: string) => {
    const { w, h } = viewSize.current;
    const anim = new Animated.Value(0);
    const id = `${Date.now()}_${Math.random()}`;
    setFloatLabels((prev) => [
      ...prev,
      { id, x: w / 2, y: h * 0.42, text, color, anim },
    ]);
    Animated.timing(anim, {
      toValue: 1,
      duration: 1300,
      useNativeDriver: true,
    }).start(() => {
      setFloatLabels((prev) => prev.filter((l) => l.id !== id));
    });
  }, []);

  // ── Saque / reset ──────────────────────────────────────────────────────────

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
    const r = refs.current;
    scoreRef.current = { p: 0, c: 0 };
    setScore({ p: 0, c: 0 });
    r.rally = 0;
    setRally(0);
    // zera o cansaço: a CPU começa cada partida descansada
    r.playTime = 0;
    r.prevVZSign = 0;
    r.aiAimErr = 0;
    r.tiredShown = false;
    setOverVisible(false);
    scheduleServe(-1, 650); // primeiro saque vai para a CPU
  }, [scheduleServe]);

  const togglePause = useCallback(() => {
    const r = refs.current;
    if (r.phase === "play" || r.phase === "serving") {
      setPhaseBoth("paused");
    } else if (r.phase === "paused") {
      // retoma com um novo saque curto para não punir o jogador
      scheduleServe(r.serveDir, 600);
    }
  }, [scheduleServe, setPhaseBoth]);

  const resetGame = useCallback(() => {
    scoreRef.current = { p: 0, c: 0 };
    setScore({ p: 0, c: 0 });
    refs.current.rally = 0;
    setRally(0);
    bestRef.current = 0;
    setBestRally(0);
    refs.current.playTime = 0;
    refs.current.prevVZSign = 0;
    refs.current.aiAimErr = 0;
    refs.current.tiredShown = false;
    resetBall();
    setOverVisible(false);
    setPhaseBoth("idle");
  }, [resetBall, setPhaseBoth]);

  // ── Ponto marcado ────────────────────────────────────────────────────────

  const onPoint = useCallback(
    (who: "player" | "cpu") => {
      const isPlayer = who === "player";
      const prev = scoreRef.current;
      const ns = {
        p: prev.p + (isPlayer ? 1 : 0),
        c: prev.c + (isPlayer ? 0 : 1),
      };
      scoreRef.current = ns;
      setScore(ns);
      refs.current.rally = 0;
      setRally(0);
      // Cansaço é POR PONTO: a cada ponto a CPU volta a ficar descansada.
      refs.current.playTime = 0;
      refs.current.prevVZSign = 0;
      refs.current.aiAimErr = 0;
      refs.current.tiredShown = false;

      spawnLabel(
        isPlayer ? "🎉 POINT!" : "🤖 CPU POINT",
        isPlayer ? NEON.cyan : NEON.magenta,
      );
      Vibration.vibrate(isPlayer ? [0, 30, 50, 30] : 60);

      if (ns.p >= WIN_SCORE || ns.c >= WIN_SCORE) {
        setPhaseBoth("over");
        resetBall();
        setOverVisible(true);
        Vibration.vibrate([0, 60, 80, 60, 80, 120]);

        // ── Marcação de ponto depois da partida ──
        // Fecha o resultado e avisa quem estiver ouvindo (ranking persistente).
        onMatchEndRef.current?.({
          mode: "solo",
          result: ns.p >= WIN_SCORE ? "win" : "loss",
          playerScore: ns.p,
          cpuScore: ns.c,
          diff: diffRef.current,
          bestRally: bestRef.current,
        });
      } else {
        // o saque vai em direção a quem perdeu o ponto
        scheduleServe(isPlayer ? -1 : 1);
      }
    },
    [resetBall, scheduleServe, setPhaseBoth, spawnLabel],
  );
  const onPointRef = useRef(onPoint);
  useEffect(() => {
    onPointRef.current = onPoint;
  }, [onPoint]);

  // ── Rebatida ───────────────────────────────────────────────────────────────

  const onHit = useCallback(
    (spinMag = 0, isPlayer = false) => {
      const r = refs.current;
      r.rally += 1;
      setRally(r.rally);
      if (r.rally > bestRef.current) {
        bestRef.current = r.rally;
        setBestRally(r.rally);
      }
      setSpeedMul(r.speedMul);
      // Corte forte do jogador: aviso + vibração diferenciada
      if (isPlayer && spinMag >= SPIN.labelAt) {
        spawnLabel("🌀 EFFECT!", NEON.cyan);
        Vibration.vibrate([0, 14, 22, 14]);
      } else {
        Vibration.vibrate(10);
      }
    },
    [spawnLabel],
  );
  const onHitRef = useRef(onHit);
  useEffect(() => {
    onHitRef.current = onHit;
  }, [onHit]);

  // ── GL context + loop do jogo ──────────────────────────────────────────────

  const onContextCreate = useCallback(async (gl: WebGLRenderingContext) => {
    const r = refs.current;
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;

    // @ts-ignore — expo-three Renderer accepts the gl context
    r.renderer = new Renderer({ gl });
    r.renderer!.setSize(w, h);
    r.renderer!.shadowMap.enabled = true;

    r.scene = new THREE.Scene();
    r.scene.background = null;
    r.scene.fog = new THREE.Fog(C3D.fog, 14, 30);

    // Iluminação noturna: ambiente fraca + luzes pontuais coloridas
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

    // Câmera atrás do jogador, olhando mesa abaixo
    r.camera = new THREE.PerspectiveCamera(56, w / h, 0.1, 100);
    r.camera.position.set(0, 5.6, 9.0);
    r.camera.lookAt(0, -0.4, -1.0);

    buildArena(r.scene, r);
    buildTable(r.scene);

    // Raquetes de verdade 🏓 (lâmina + aro neon + cabo)
    r.player = buildRacket(C3D.rubberPlayer, C3D.player);
    r.player.position.set(0, 0, PADDLE.z);
    r.scene.add(r.player);

    r.ai = buildRacket(C3D.rubberAi, C3D.ai);
    r.ai.position.set(0, 0, -PADDLE.z);
    r.ai.rotation.y = Math.PI; // a face de borracha encara o jogador
    r.scene.add(r.ai);

    // Bola amarela neon
    r.ball = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_R, 16, 16),
      neon(C3D.ball),
    );
    r.ball.castShadow = true;
    r.ball.position.set(0, BALL_Y, 0);
    r.scene.add(r.ball);

    // ── Loop ──
    let lastT = performance.now();
    const animate = () => {
      r.animFrame = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.034, (now - lastT) / 1000);
      lastT = now;
      r.t += dt;

      const ball = r.ball!;
      const player = r.player!;
      const ai = r.ai!;
      const v = r.vel;
      const diffCfg = DIFFS[diffRef.current];

      // Orbes ambientes flutuam
      r.orbs.forEach((orb) => {
        orb.position.y =
          orb.userData.baseY +
          0.18 * Math.sin(r.t * orb.userData.spd + orb.userData.off);
      });

      // Raquete do jogador persegue o dedo (suave) e INCLINA ao deslizar
      const limX = TABLE.halfW - PADDLE.halfW;
      const tx = THREE.MathUtils.clamp(r.targetX, -limX, limX);
      const playerPrevX = player.position.x;
      player.position.x += (tx - player.position.x) * Math.min(1, dt * 24);
      // Velocidade lateral da raquete (un/s) — fonte do efeito/corte
      player.userData.vx =
        (player.position.x - playerPrevX) / Math.max(dt, 1e-4);
      const lean = THREE.MathUtils.clamp(
        (player.position.x - tx) * 0.55,
        -0.38,
        0.38,
      );
      player.rotation.z += (lean - player.rotation.z) * Math.min(1, dt * 14);

      // Saque
      if (r.phase === "serving" && now >= r.serveAt) {
        const base = diffCfg.ballSpeed;
        v.z = r.serveDir * base * 0.95;
        v.x = (Math.random() * 2 - 1) * base * 0.32;
        r.phase = "play";
        setPhase("play");
      }

      if (r.phase === "play") {
        // ── Cansaço da CPU ──────────────────────────────────────────────────
        // Conta o tempo REAL de bola em jogo e deriva um fator 0→1. Quanto mais
        // cansada, mais lenta, mais erra a leitura e menos alcança.
        r.playTime += dt;
        const fatigue = THREE.MathUtils.clamp(
          (r.playTime - FATIGUE.graceSec) / FATIGUE.rampSec,
          0,
          1,
        );
        const effAiSpeed = diffCfg.aiSpeed * (1 - fatigue * FATIGUE.slowFrac);
        const effAiCatch = Math.max(
          0,
          diffCfg.aiCatch - fatigue * FATIGUE.catchShrink,
        );
        const errFloor = diffCfg.aiError + fatigue * FATIGUE.errorAdd;
        if (!r.tiredShown && fatigue >= FATIGUE.tiredAt) {
          r.tiredShown = true;
          spawnLabel("😮‍💨 CPU GETTING TIRED", NEON.amber);
        }

        // Nova aproximação à CPU (a bola passou a vir na direção dela) → rola um
        // erro de leitura. Bola mais rápida = erro maior (mais difícil p/ ela).
        const vzSign = Math.sign(v.z);
        if (vzSign < 0 && r.prevVZSign >= 0) {
          const mag = errFloor * (AI.errBase + AI.errBySpeed * r.speedMul);
          r.aiAimErr = (Math.random() * 2 - 1) * mag;
        }
        r.prevVZSign = vzSign;

        // CPU: mira ONDE a bola vai chegar (lê a RETA) p/ rebater de verdade.
        // Ela ignora a curva do efeito → um corte forte a tira do lugar.
        let aiTarget = 0;
        if (v.z < 0) {
          const aiPlaneZ = -(PADDLE.z - BALL_R - PADDLE.d / 2);
          const tReach = (aiPlaneZ - ball.position.z) / (v.z || -1e-6);
          let predX = ball.position.x + v.x * Math.max(0, tReach);
          // dobra a previsão pelas paredes laterais (reflexão triangular)
          const mX = TABLE.halfW - BALL_R;
          const period = 4 * mX;
          const p = (((predX + mX) % period) + period) % period;
          aiTarget = (p <= 2 * mX ? p : period - p) - mX;
          // erro de leitura + cegueira ao efeito: corte ativo desloca a mira dela
          aiTarget += r.aiAimErr - r.spin * AI.spinBlind;
        }
        const dx = aiTarget - ai.position.x;
        const maxMove = effAiSpeed * dt; // ← velocidade já reduzida pelo cansaço
        const aiPrevX = ai.position.x;
        ai.position.x = THREE.MathUtils.clamp(
          ai.position.x + THREE.MathUtils.clamp(dx, -maxMove, maxMove),
          -limX,
          limX,
        );
        ai.userData.vx = (ai.position.x - aiPrevX) / Math.max(dt, 1e-4);
        const aiLean = THREE.MathUtils.clamp(dx * 0.4, -0.35, 0.35);
        ai.rotation.z += (aiLean - ai.rotation.z) * Math.min(1, dt * 10);

        // ── Efeito (sidespin): curva a trajetória de forma fluida ──
        // Rotaciona o vetor velocidade um pouco por quadro (mantém a rapidez,
        // só muda a direção) e deixa o efeito decair suavemente.
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

        // Física da bola
        const prevZ = ball.position.z;
        let nx = ball.position.x + v.x * dt;
        let nz = ball.position.z + v.z * dt;

        // Paredes de vidro laterais
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

        // Colisão com raquete (checa o cruzamento do plano p/ não atravessar).
        // catchAssist é a margem de alcance: generosa p/ você, menor p/ a CPU.
        const tryPaddle = (
          paddle: THREE.Object3D,
          dirSign: 1 | -1,
          catchAssist: number,
        ): boolean => {
          if (Math.sign(v.z) !== dirSign) return false;
          const plane = dirSign * (PADDLE.z - BALL_R - PADDLE.d / 2);
          const crossed =
            dirSign === 1
              ? prevZ <= plane && nz >= plane
              : prevZ >= plane && nz <= plane;
          if (!crossed) return false;
          const tFrac = (plane - prevZ) / (nz - prevZ || 1e-6);
          const hitX = ball.position.x + v.x * dt * tFrac;
          if (
            Math.abs(hitX - paddle.position.x) >
            PADDLE.halfW + BALL_R + catchAssist
          )
            return false;

          // Velocidade lateral da raquete no impacto → corte/efeito
          const paddleVX = (paddle.userData.vx as number) ?? 0;
          // Rebatida acelera a bola; um CORTE (deslize rápido) acelera MAIS,
          // deixando a bola difícil de pegar p/ quem está do outro lado.
          const boost =
            RALLY.baseBoost +
            Math.min(RALLY.cutBoostMax, Math.abs(paddleVX) * RALLY.cutBoost);
          r.speedMul = Math.min(RALLY.maxMul, r.speedMul * boost);
          const base = diffCfg.ballSpeed * r.speedMul;
          let vx =
            v.x +
            (hitX - paddle.position.x) * 3.1 + // ângulo pelo ponto de impacto
            paddleVX * SPIN.kick; // empurrão imediato do deslize
          vx = THREE.MathUtils.clamp(vx, -base * 0.8, base * 0.8);
          const minVz = base * 0.62;
          const vz = Math.max(
            minVz,
            Math.sqrt(Math.max(base * base - vx * vx, minVz * minVz)),
          );
          v.x = vx;
          v.z = -dirSign * vz;
          // Efeito persistente: curva a bola no ar no sentido do deslize.
          // dirSign embute a orientação correta da curva p/ cada lado da mesa.
          r.spin = THREE.MathUtils.clamp(
            paddleVX * SPIN.gain * -dirSign,
            -SPIN.max,
            SPIN.max,
          );
          nz = plane;
          (paddle as any).hitAt = now;
          onHitRef.current(Math.abs(r.spin), dirSign === 1);
          return true;
        };

        tryPaddle(player, 1, CATCH_ASSIST); // você: alcance generoso
        tryPaddle(ai, -1, effAiCatch); // CPU: alcance menor e que encolhe cansada

        ball.position.x = nx;
        ball.position.z = nz;

        // Ponto?
        if (nz > TABLE.halfL + 1.1) onPointRef.current("cpu");
        else if (nz < -(TABLE.halfL + 1.1)) onPointRef.current("player");
      }

      // "Twang" da raquete ao rebater (incha e volta)
      [player, ai].forEach((p) => {
        const hitAt = (p as any).hitAt ?? 0;
        const k = Math.max(0, 1 - (now - hitAt) / 160);
        const sw = 1 + 0.18 * k;
        p.scale.set(sw, sw, 1 - 0.2 * k);
      });

      // Bola "respira" enquanto espera o saque
      if (r.phase === "serving" || r.phase === "idle") {
        const sBall = 1 + 0.12 * Math.sin(r.t * 6);
        ball.scale.set(sBall, sBall, sBall);
      } else {
        ball.scale.set(1, 1, 1);
      }
      ball.rotation.x += v.z * dt * 2;
      ball.rotation.z -= v.x * dt * 2;
      ball.rotation.y += r.spin * dt * 3; // giro visível do efeito

      r.renderer!.render(r.scene!, r.camera!);
      (gl as any).endFrameEXP?.();
    };
    animate();
  }, []);

  // ── Touch: arrastar move a raquete diretamente ─────────────────────────────

  const onCanvasLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    viewSize.current = { w: width, h: height };
  }, []);

  const moveFromTouch = useCallback((locationX: number) => {
    const { w } = viewSize.current;
    if (w <= 1) return;
    const nx = (locationX / w) * 2 - 1; // -1..1
    refs.current.targetX = nx * (TABLE.halfW - PADDLE.halfW) * 1.12;
  }, []);

  const onTouchStart = useCallback(
    (e: any) => moveFromTouch(e.nativeEvent.locationX),
    [moveFromTouch],
  );
  const onTouchMove = useCallback(
    (e: any) => moveFromTouch(e.nativeEvent.locationX),
    [moveFromTouch],
  );

  // ── Cleanup ────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cancelAnimationFrame(refs.current.animFrame);
      refs.current.renderer?.dispose?.();
    };
  }, []);

  return {
    // state
    score,
    phase,
    rally,
    bestRally,
    speedMul,
    diff,
    setDiff,
    overVisible,
    floatLabels,
    // animated
    pulseOpacity,
    pulseScale,
    // handlers
    startGame,
    togglePause,
    resetGame,
    onContextCreate,
    onCanvasLayout,
    onTouchStart,
    onTouchMove,
  };
}
