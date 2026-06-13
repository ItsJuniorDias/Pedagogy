/**
 * usePongGame.ts — Cérebro do jogo.
 *
 * Concentra TODO o estado, os refs vivos, o loop de física/render (GL) e os
 * handlers de toque. A camada visual (PingPongGame.tsx) apenas consome o que
 * este hook retorna — nenhum JSX ou estilo mora aqui.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Vibration,
} from "react-native";
import { Renderer } from "expo-three";
import * as THREE from "three";

import {
  BALL_R,
  BALL_Y,
  DIFFS,
  PADDLE,
  TABLE,
  WIN_SCORE,
} from "../constants";
import { buildArena, buildRacket, buildTable, neon } from "../scene";
import { C3D, NEON } from "../theme";
import type { DiffId, FloatingLabel, Phase, SceneRefs } from "../types";

export function usePongGame() {
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
    targetX: 0,
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

  const onHit = useCallback(() => {
    const r = refs.current;
    r.rally += 1;
    setRally(r.rally);
    if (r.rally > bestRef.current) {
      bestRef.current = r.rally;
      setBestRally(r.rally);
    }
    setSpeedMul(r.speedMul);
    Vibration.vibrate(10);
  }, []);
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
    r.camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 100);
    r.camera.position.set(0, 5.3, 8.1);
    r.camera.lookAt(0, -0.4, -1.2);

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
      player.position.x += (tx - player.position.x) * Math.min(1, dt * 16);
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
        // CPU: segue a bola quando ela vem, senão volta ao centro
        const aiTarget = v.z < 0 ? ball.position.x : 0;
        const dx = aiTarget - ai.position.x;
        const maxMove = diffCfg.aiSpeed * dt;
        ai.position.x = THREE.MathUtils.clamp(
          ai.position.x + THREE.MathUtils.clamp(dx, -maxMove, maxMove),
          -limX,
          limX,
        );
        const aiLean = THREE.MathUtils.clamp(dx * 0.4, -0.35, 0.35);
        ai.rotation.z += (aiLean - ai.rotation.z) * Math.min(1, dt * 10);

        // Física da bola
        const prevZ = ball.position.z;
        let nx = ball.position.x + v.x * dt;
        let nz = ball.position.z + v.z * dt;

        // Paredes de vidro laterais
        const maxX = TABLE.halfW - BALL_R;
        if (nx > maxX) {
          nx = maxX - (nx - maxX);
          v.x = -Math.abs(v.x);
        } else if (nx < -maxX) {
          nx = -maxX + (-maxX - nx);
          v.x = Math.abs(v.x);
        }

        // Colisão com raquete (checa o cruzamento do plano p/ não atravessar)
        const tryPaddle = (
          paddle: THREE.Object3D,
          dirSign: 1 | -1,
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
          if (Math.abs(hitX - paddle.position.x) > PADDLE.halfW + BALL_R * 0.7)
            return false;

          // Rebatida: acelera e angula conforme o ponto de impacto
          r.speedMul = Math.min(2, r.speedMul * 1.05);
          const base = diffCfg.ballSpeed * r.speedMul;
          let vx = v.x + (hitX - paddle.position.x) * 3.1;
          vx = THREE.MathUtils.clamp(vx, -base * 0.8, base * 0.8);
          const minVz = base * 0.62;
          const vz = Math.max(
            minVz,
            Math.sqrt(Math.max(base * base - vx * vx, minVz * minVz)),
          );
          v.x = vx;
          v.z = -dirSign * vz;
          nz = plane;
          (paddle as any).hitAt = now;
          onHitRef.current();
          return true;
        };

        tryPaddle(player, 1);
        tryPaddle(ai, -1);

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
