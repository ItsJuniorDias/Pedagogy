/**
 * PongGame3D.tsx — NEON PONG 🏓 (Three.js + Expo)
 *
 * v3 — Raquetes de verdade 🏓:
 *  • Os "quadrados" viraram RAQUETES 3D: lâmina circular com borracha
 *    colorida na face, aro NEON brilhante (ciano p/ você, magenta p/ CPU)
 *    e cabo de madeira.
 *  • Ao deslizar o dedo, a raquete acompanha e INCLINA na direção do
 *    movimento, como se você estivesse arrastando ela pela mesa.
 *  • Colisão ajustada ao diâmetro da lâmina (mesma física de antes).
 *
 * v2 — Identidade visual própria (bem diferente do FarmGame):
 *  • Tema: arcade noturno NEON — fundo azul-espacial, piso em grade tron,
 *    mesa escura com linhas ciano brilhantes, raquete CIANO (você) vs
 *    MAGENTA (CPU), bola amarela neon, luzes coloridas e orbes flutuantes.
 *  • HUD totalmente nova: sem header sólido — o cenário ocupa a tela
 *    inteira e tudo flutua em DARK GLASS (vidro escuro):
 *      – Scoreboard flutuante no topo com placar gigante + rally + best
 *        + linha de velocidade neon embutida
 *      – Barra de controle única embaixo: ⏸ / dificuldade segmentada / ↺
 *      – Dica em texto neon pulsante, overlay "TAP TO PLAY" estilo arcade
 *  • Controle mantido: arraste o dedo e a raquete acompanha (movimentação
 *    direta da raquete).
 *  • Mesma fonte Fredoka One.
 *
 * Install dependencies:
 *   npx expo install expo-gl expo-three three
 *   npx expo install expo-blur react-native-safe-area-context
 *   npx expo install @expo-google-fonts/fredoka-one expo-font
 *
 * Usage:
 *   import PongGame3D from './PongGame3D';
 *   <PongGame3D />
 */

import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import { BlurView } from "expo-blur";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  LayoutChangeEvent,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as THREE from "three";

// ─── Constants ─────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");

const WIN_SCORE = 7;

// Mesa (unidades de mundo). Eixo X = largura, Z = comprimento.
const TABLE = { w: 5, l: 8, halfW: 2.5, halfL: 4, topY: 0.09 };
// Raquete: a colisão usa o diâmetro da lâmina (halfW = raio da lâmina)
const RACKET = { r: 0.55, thick: 0.07 };
const PADDLE = { w: RACKET.r * 2, halfW: RACKET.r, d: 0.3, z: 3.55 };
const BALL_R = 0.13;
const BALL_Y = TABLE.topY + BALL_R + 0.02;

// ─── Neon palette (UI) ────────────────────────────────────────────────────────

const NEON = {
  bg: "#0B1026", // azul-espacial
  panel: "rgba(13,20,45,0.50)", // vidro escuro
  edge: "rgba(96,165,250,0.35)", // borda azulada do vidro
  cyan: "#22D3EE", // jogador
  magenta: "#F472B6", // CPU
  yellow: "#FDE047", // bola / velocidade
  mint: "#34D399",
  amber: "#FBBF24",
  rose: "#FB7185",
  text: "#E2E8F0",
  dim: "#7C8DB5",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "idle" | "serving" | "play" | "paused" | "over";
type DiffId = "easy" | "normal" | "hard";

interface Diff {
  id: DiffId;
  label: string;
  emoji: string;
  color: string;
  aiSpeed: number; // velocidade máx. da raquete da CPU (un/s)
  ballSpeed: number; // velocidade base da bola (un/s)
}

const DIFFS: Record<DiffId, Diff> = {
  easy: {
    id: "easy",
    label: "EASY",
    emoji: "🐢",
    color: NEON.mint,
    aiSpeed: 2.3,
    ballSpeed: 4.2,
  },
  normal: {
    id: "normal",
    label: "NORMAL",
    emoji: "⚡",
    color: NEON.amber,
    aiSpeed: 3.4,
    ballSpeed: 5.0,
  },
  hard: {
    id: "hard",
    label: "HARD",
    emoji: "🔥",
    color: NEON.rose,
    aiSpeed: 4.8,
    ballSpeed: 5.8,
  },
};

const DIFF_LIST: Diff[] = [DIFFS.easy, DIFFS.normal, DIFFS.hard];

interface FloatingLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  anim: Animated.Value;
}

// ─── 3D colors ────────────────────────────────────────────────────────────────

const C3D = {
  fog: 0x0b1026,
  tableTop: 0x111a3a,
  tableSide: 0x0a1128,
  lines: 0x22d3ee, // linhas neon (material unlit = brilham)
  net: 0x93c5fd,
  glassWall: 0x60a5fa,
  legs: 0x1e293b,
  floor: 0x0d1330,
  gridA: 0x2563eb,
  gridB: 0x16275f,
  player: 0x22d3ee,
  ai: 0xf472b6,
  rubberPlayer: 0x0e7490, // borracha ciano-escura da face
  rubberAi: 0x9d2f63, // borracha magenta-escura da face
  rubberBack: 0x1f2937, // verso preto da lâmina
  wood: 0xd6a35c, // cabo de madeira
  ball: 0xfde047,
  orbs: [0x22d3ee, 0xf472b6, 0x818cf8, 0xfde047],
};

// ─── Scene refs ───────────────────────────────────────────────────────────────

interface SceneRefs {
  renderer: Renderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  ball: THREE.Mesh | null;
  player: THREE.Group | null;
  ai: THREE.Group | null;
  orbs: THREE.Mesh[];
  vel: { x: number; z: number };
  targetX: number; // alvo da raquete do jogador (arrasto do dedo)
  phase: Phase;
  serveAt: number;
  serveDir: 1 | -1; // 1 = em direção ao jogador, -1 = em direção à CPU
  speedMul: number;
  rally: number;
  animFrame: number;
  t: number; // tempo acumulado p/ animações ambientes
}

// ─── Scene builders ───────────────────────────────────────────────────────────

function lambert(color: number, opts: Partial<THREE.MeshLambertMaterial> = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

// Material "neon": não reage à luz → cor pura, parece emissivo
function neon(color: number, opts: Partial<THREE.MeshBasicMaterial> = {}) {
  return new THREE.MeshBasicMaterial({ color, ...opts });
}

function buildArena(scene: THREE.Scene, r: SceneRefs) {
  // Piso escuro + grade estilo tron
  const floorY = -1.35;
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(30, 0.16, 30),
    lambert(C3D.floor),
  );
  floor.position.set(0, floorY, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(28, 28, C3D.gridA, C3D.gridB);
  grid.position.y = floorY + 0.09;
  scene.add(grid);

  // Orbes neon flutuantes ao redor da arena (ambiente)
  const orbGeo = new THREE.SphereGeometry(0.09, 8, 8);
  for (let i = 0; i < 14; i++) {
    let x = 0;
    let z = 0;
    do {
      x = (Math.random() * 2 - 1) * 11;
      z = (Math.random() * 2 - 1) * 11;
    } while (
      Math.abs(x) < TABLE.halfW + 1.2 &&
      Math.abs(z) < TABLE.halfL + 1.2
    );
    const orb = new THREE.Mesh(
      orbGeo,
      neon(C3D.orbs[i % C3D.orbs.length], {
        transparent: true,
        opacity: 0.85,
      }),
    );
    const baseY = -0.4 + Math.random() * 1.6;
    orb.position.set(x, baseY, z);
    orb.userData.baseY = baseY;
    orb.userData.spd = 0.6 + Math.random() * 1.4;
    orb.userData.off = Math.random() * Math.PI * 2;
    scene.add(orb);
    r.orbs.push(orb);
  }
}

function buildTable(scene: THREE.Scene) {
  // Tampo escuro
  const top = new THREE.Mesh(new THREE.BoxGeometry(TABLE.w, 0.18, TABLE.l), [
    lambert(C3D.tableSide),
    lambert(C3D.tableSide),
    lambert(C3D.tableTop),
    lambert(C3D.tableSide),
    lambert(C3D.tableSide),
    lambert(C3D.tableSide),
  ]);
  top.position.set(0, 0, 0);
  top.receiveShadow = true;
  scene.add(top);

  // Linhas NEON ciano (borda + linha central)
  const lineMat = neon(C3D.lines);
  const mkLine = (w: number, l: number, x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, l), lineMat);
    m.position.set(x, TABLE.topY + 0.007, z);
    scene.add(m);
  };
  mkLine(TABLE.w, 0.06, 0, TABLE.halfL - 0.03); // borda perto do jogador
  mkLine(TABLE.w, 0.06, 0, -(TABLE.halfL - 0.03)); // borda da CPU
  mkLine(0.06, TABLE.l, TABLE.halfW - 0.03, 0); // laterais
  mkLine(0.06, TABLE.l, -(TABLE.halfW - 0.03), 0);
  mkLine(0.05, TABLE.l, 0, 0); // linha central

  // Rede translúcida azulada
  const net = new THREE.Mesh(
    new THREE.BoxGeometry(TABLE.w + 0.3, 0.3, 0.035),
    new THREE.MeshBasicMaterial({
      color: C3D.net,
      transparent: true,
      opacity: 0.3,
    }),
  );
  net.position.set(0, TABLE.topY + 0.15, 0);
  scene.add(net);
  const postGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.34, 8);
  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(postGeo, lambert(C3D.legs));
    post.position.set(side * (TABLE.halfW + 0.15), TABLE.topY + 0.17, 0);
    scene.add(post);
  });

  // Paredes laterais de vidro (seguram a bola) — azuladas no tema neon
  const glassMat = new THREE.MeshBasicMaterial({
    color: C3D.glassWall,
    transparent: true,
    opacity: 0.16,
  });
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.42, TABLE.l),
      glassMat,
    );
    wall.position.set(side * (TABLE.halfW + 0.04), TABLE.topY + 0.21, 0);
    scene.add(wall);
  });

  // Pernas
  const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.3, 8);
  [
    [TABLE.halfW - 0.4, TABLE.halfL - 0.5],
    [-(TABLE.halfW - 0.4), TABLE.halfL - 0.5],
    [TABLE.halfW - 0.4, -(TABLE.halfL - 0.5)],
    [-(TABLE.halfW - 0.4), -(TABLE.halfL - 0.5)],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, lambert(C3D.legs));
    leg.position.set(x, -0.72, z);
    scene.add(leg);
  });
}

function buildRacket(rubberColor: number, edgeColor: number): THREE.Group {
  const g = new THREE.Group();
  const R = RACKET.r;
  const bladeY = TABLE.topY + R + 0.06; // centro da lâmina, base quase encostando na mesa

  // Lâmina: disco em pé, de frente para a mesa (normal no eixo Z)
  // Ordem dos materiais do cilindro: [lateral, tampa +Y, tampa -Y]
  // Após rotation.x = π/2 → tampa -Y vira a FACE que olha para a rede
  const blade = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, RACKET.thick, 28),
    [
      lambert(0x111827), // lateral da borracha
      lambert(C3D.rubberBack), // verso (preto)
      lambert(rubberColor), // face de borracha colorida
    ],
  );
  blade.rotation.x = Math.PI / 2;
  blade.position.y = bladeY;
  blade.castShadow = true;
  g.add(blade);

  // Aro NEON ao redor da lâmina (brilha — identidade de cada lado)
  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.03, 8, 36),
    neon(edgeColor),
  );
  edge.position.y = bladeY;
  g.add(edge);

  // Cabo de madeira, inclinado para trás (em direção a quem segura)
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.07, 0.42, 10),
    lambert(C3D.wood),
  );
  handle.position.set(0, bladeY - R - 0.13, 0.11);
  handle.rotation.x = 0.5;
  handle.castShadow = true;
  g.add(handle);

  // Anel do cabo na cor do time (detalhe)
  const grip = new THREE.Mesh(
    new THREE.TorusGeometry(0.072, 0.018, 6, 14),
    neon(edgeColor),
  );
  grip.position.set(0, bladeY - R - 0.02, 0.06);
  grip.rotation.x = Math.PI / 2 - 0.5;
  g.add(grip);

  return g;
}

// ─── Dark Glass wrapper ───────────────────────────────────────────────────────
// Vidro ESCURO (tint dark + véu azul-noite + borda azulada) — identidade
// própria deste jogo, diferente do vidro claro do FarmGame.

const Glass: React.FC<{
  style?: any;
  intensity?: number;
  children: React.ReactNode;
}> = ({ style, intensity = 50, children }) => (
  <BlurView
    intensity={intensity}
    tint="dark"
    experimentalBlurMethod="dimezisBlurView"
    style={[s.glass, style]}
  >
    {children}
  </BlurView>
);

// ─── Speed line (embutida no scoreboard) ──────────────────────────────────────

const SpeedLine: React.FC<{ speedMul: number }> = ({ speedMul }) => {
  const progress = Math.min(1, (speedMul - 1) / 1); // 1x → 2x
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 350,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [progress]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["3%", "100%"],
  });

  return (
    <View style={s.speedRow}>
      <Text style={s.speedLbl}>SPD</Text>
      <View style={s.speedTrack}>
        <Animated.View style={[s.speedFill, { width: barWidth }]} />
      </View>
      <Text style={s.speedVal}>{speedMul.toFixed(2)}x</Text>
    </View>
  );
};

// ─── Floating Label ───────────────────────────────────────────────────────────

const FloatLabel: React.FC<{ label: FloatingLabel }> = ({ label }) => {
  const ty = label.anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });
  const op = label.anim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });
  return (
    <Animated.Text
      style={[
        s.floatText,
        { color: label.color, transform: [{ translateY: ty }], opacity: op },
      ]}
    >
      {label.text}
    </Animated.Text>
  );
};

// ─── Game Over Modal (dark neon) ──────────────────────────────────────────────

const GameOverModal: React.FC<{
  visible: boolean;
  playerWon: boolean;
  score: { p: number; c: number };
  bestRally: number;
  onPlayAgain: () => void;
}> = ({ visible, playerWon, score, bestRally, onPlayAgain }) => {
  const sc = useRef(new Animated.Value(0.5)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sc, { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.timing(op, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      sc.setValue(0.5);
      op.setValue(0);
    }
  }, [visible]);

  const accent = playerWon ? NEON.cyan : NEON.magenta;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onPlayAgain}
    >
      <Animated.View style={[s.overOverlay, { opacity: op }]}>
        <Animated.View
          style={[
            s.overCard,
            { borderColor: accent, transform: [{ scale: sc }] },
          ]}
        >
          <Text style={s.overEm}>{playerWon ? "🏆" : "🤖"}</Text>
          <Text style={[s.overTitle, { color: accent }]}>
            {playerWon ? "YOU WIN" : "CPU WINS"}
          </Text>
          <View style={s.overScoreRow}>
            <Text style={[s.overScore, { color: NEON.cyan }]}>{score.p}</Text>
            <Text style={s.overDash}>—</Text>
            <Text style={[s.overScore, { color: NEON.magenta }]}>
              {score.c}
            </Text>
          </View>
          <Text style={s.overStat}>🔥 Best rally: {bestRally}</Text>
          <TouchableOpacity
            style={[s.overBtn, { backgroundColor: accent }]}
            onPress={onPlayAgain}
          >
            <Text style={s.overBtnTxt}>PLAY AGAIN</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const FF = "FredokaOne_400Regular";

function PongGameInner() {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const insets = useSafeAreaInsets();

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

  // ── Pulso contínuo (texto de dica / start) ──────────────────────────────────

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

  // ── Floating label (centro da quadra) ───────────────────────────────────────

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

  // ── Saque / reset ────────────────────────────────────────────────────────────

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

  // ── Ponto marcado ────────────────────────────────────────────────────────────

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

  // ── Rebatida ─────────────────────────────────────────────────────────────────

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

  // ── GL context + loop do jogo ───────────────────────────────────────────────

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

  // ── Touch: arrastar move a raquete diretamente ──────────────────────────────

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

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cancelAnimationFrame(refs.current.animFrame);
      refs.current.renderer?.dispose?.();
    };
  }, []);

  // ── Derived UI ───────────────────────────────────────────────────────────────

  const HINT: Record<Phase, string> = {
    idle: "FIRST TO 7 POINTS",
    serving: "GET READY…",
    play: "DRAG TO MOVE YOUR PADDLE",
    paused: "PAUSED",
    over: "MATCH OVER",
  };

  const playerWon = score.p >= WIN_SCORE;
  const showStart = phase === "idle";

  if (!fontsLoaded) return null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Cenário em tela cheia — toda a HUD flutua em dark glass ── */}
      <View style={s.canvasWrap} onLayout={onCanvasLayout}>
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={onContextCreate}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        />

        {/* ── Scoreboard flutuante ── */}
        <View
          style={[s.scoreWrap, { top: insets.top + 10 }]}
          pointerEvents="none"
        >
          <View style={s.floatShadow}>
            <Glass style={s.scoreBoard} intensity={55}>
              <View style={s.scoreTop}>
                <View style={s.scoreSide}>
                  <View style={[s.sideDot, { backgroundColor: NEON.cyan }]} />
                  <Text style={[s.scoreName, { color: NEON.cyan }]}>YOU</Text>
                  <Text style={[s.scoreBig, { color: NEON.cyan }]}>
                    {score.p}
                  </Text>
                </View>

                <View style={s.scoreMid}>
                  <Text style={s.scoreVs}>VS</Text>
                  <Text style={s.rallyTxt}>🔥 {rally}</Text>
                  <Text style={s.bestTxt}>BEST {bestRally}</Text>
                </View>

                <View style={s.scoreSide}>
                  <View
                    style={[s.sideDot, { backgroundColor: NEON.magenta }]}
                  />
                  <Text style={[s.scoreName, { color: NEON.magenta }]}>
                    CPU
                  </Text>
                  <Text style={[s.scoreBig, { color: NEON.magenta }]}>
                    {score.c}
                  </Text>
                </View>
              </View>

              <SpeedLine speedMul={speedMul} />
            </Glass>
          </View>
        </View>

        {/* Floating labels */}
        {floatLabels.map((lbl) => (
          <View
            key={lbl.id}
            style={[s.floatWrap, { left: lbl.x - 70, top: lbl.y - 20 }]}
            pointerEvents="none"
          >
            <FloatLabel label={lbl} />
          </View>
        ))}

        {/* Overlay arcade de início */}
        {showStart && (
          <View style={s.startWrap} pointerEvents="box-none">
            <Animated.View
              style={[
                s.floatShadow,
                { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
              ]}
            >
              <TouchableOpacity onPress={startGame} activeOpacity={0.85}>
                <Glass style={s.startBtn} intensity={60}>
                  <Text style={s.startEm}>🏓</Text>
                  <Text style={s.startTxt}>TAP TO PLAY</Text>
                  <Text style={s.startSub}>drag your paddle · first to 7</Text>
                </Glass>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Dica neon pulsante acima da barra de controle */}
        <Animated.Text
          style={[
            s.hintTxt,
            { bottom: insets.bottom + 86, opacity: pulseOpacity },
          ]}
          pointerEvents="none"
        >
          {HINT[phase]}
        </Animated.Text>

        {/* ── Barra de controle única em dark glass ── */}
        <View
          style={[s.controlWrap, { bottom: insets.bottom + 14 }]}
          pointerEvents="box-none"
        >
          <View style={s.floatShadow}>
            <Glass style={s.controlBar} intensity={60}>
              {/* Pause / Play */}
              <TouchableOpacity
                onPress={togglePause}
                activeOpacity={0.8}
                disabled={phase === "idle" || phase === "over"}
                style={[
                  s.ctrlBtn,
                  (phase === "idle" || phase === "over") && s.ctrlDim,
                ]}
              >
                <Text style={s.ctrlEm}>{phase === "paused" ? "▶️" : "⏸"}</Text>
              </TouchableOpacity>

              <View style={s.ctrlDivider} />

              {/* Dificuldade segmentada */}
              <View style={s.segWrap}>
                {DIFF_LIST.map((d) => {
                  const active = diff === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        s.segBtn,
                        active && {
                          backgroundColor: d.color + "33", // 20% alpha
                          borderColor: d.color,
                        },
                      ]}
                      onPress={() => setDiff(d.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.segEm}>{d.emoji}</Text>
                      <Text style={[s.segLbl, active && { color: d.color }]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={s.ctrlDivider} />

              {/* Reset */}
              <TouchableOpacity
                onPress={resetGame}
                activeOpacity={0.8}
                style={s.ctrlBtn}
              >
                <Text style={s.ctrlEm}>↺</Text>
              </TouchableOpacity>
            </Glass>
          </View>
        </View>
      </View>

      {/* ── Game Over ── */}
      <GameOverModal
        visible={overVisible}
        playerWon={playerWon}
        score={score}
        bestRally={bestRally}
        onPlayAgain={startGame}
      />
    </View>
  );
}

export default function PongGame3D() {
  return (
    <SafeAreaProvider>
      <PongGameInner />
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NEON.bg },

  // Canvas em tela cheia
  canvasWrap: {
    flex: 1,
    backgroundColor: NEON.bg,
    position: "relative",
  },

  // ── Dark glass base ──
  glass: {
    overflow: "hidden",
    backgroundColor: NEON.panel,
    borderWidth: 1,
    borderColor: NEON.edge,
  },
  floatShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: {},
    }),
  },

  // ── Scoreboard flutuante ──
  scoreWrap: {
    position: "absolute",
    left: 18,
    right: 18,
  },
  scoreBoard: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 9,
  },
  scoreTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreSide: { alignItems: "center", minWidth: 64 },
  sideDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 2 },
  scoreName: {
    fontFamily: FF,
    fontSize: 9,
    letterSpacing: 2.5,
  },
  scoreBig: {
    fontFamily: FF,
    fontSize: 34,
    lineHeight: 38,
  },
  scoreMid: { alignItems: "center", gap: 1 },
  scoreVs: {
    fontFamily: FF,
    fontSize: 10,
    color: NEON.dim,
    letterSpacing: 3,
  },
  rallyTxt: { fontFamily: FF, fontSize: 13, color: NEON.text },
  bestTxt: {
    fontFamily: FF,
    fontSize: 8,
    color: NEON.dim,
    letterSpacing: 1.5,
  },

  // Linha de velocidade embutida
  speedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  speedLbl: {
    fontFamily: FF,
    fontSize: 8,
    color: NEON.dim,
    letterSpacing: 2,
  },
  speedTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(125,140,180,0.25)",
    overflow: "hidden",
  },
  speedFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: NEON.yellow,
  },
  speedVal: { fontFamily: FF, fontSize: 9, color: NEON.yellow },

  // Dica neon
  hintTxt: {
    position: "absolute",
    alignSelf: "center",
    fontFamily: FF,
    fontSize: 11,
    color: NEON.dim,
    letterSpacing: 2.5,
  },

  // Overlay de início
  startWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtn: {
    alignItems: "center",
    paddingHorizontal: 38,
    paddingVertical: 22,
    borderRadius: 28,
    gap: 3,
    borderColor: "rgba(34,211,238,0.5)",
  },
  startEm: { fontSize: 36 },
  startTxt: {
    fontFamily: FF,
    fontSize: 21,
    color: NEON.cyan,
    letterSpacing: 3,
  },
  startSub: {
    fontFamily: FF,
    fontSize: 9,
    color: NEON.dim,
    letterSpacing: 1.5,
  },

  // ── Barra de controle única ──
  controlWrap: {
    position: "absolute",
    left: 18,
    right: 18,
  },
  controlBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 6,
  },
  ctrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlDim: { opacity: 0.35 },
  ctrlEm: { fontSize: 19, color: NEON.text },
  ctrlDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(125,140,180,0.25)",
  },
  segWrap: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },
  segBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 0,
  },
  segEm: { fontSize: 15 },
  segLbl: {
    fontFamily: FF,
    fontSize: 8,
    color: NEON.dim,
    letterSpacing: 1.2,
  },

  // Floating labels
  floatWrap: {
    position: "absolute",
    width: 140,
    alignItems: "center",
  },
  floatText: {
    fontFamily: FF,
    fontSize: 18,
    letterSpacing: 1.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Game over modal (dark neon)
  overOverlay: {
    flex: 1,
    backgroundColor: "rgba(4,8,22,0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  overCard: {
    backgroundColor: "#0E1530",
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 30,
    alignItems: "center",
    width: SCREEN_W * 0.78,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  overEm: { fontSize: 50 },
  overTitle: {
    fontFamily: FF,
    fontSize: 24,
    letterSpacing: 3,
  },
  overScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 2,
  },
  overScore: { fontFamily: FF, fontSize: 38 },
  overDash: { fontFamily: FF, fontSize: 22, color: NEON.dim },
  overStat: { fontFamily: FF, fontSize: 13, color: NEON.text },
  overBtn: {
    marginTop: 10,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
  },
  overBtnTxt: {
    fontFamily: FF,
    fontSize: 14,
    color: "#0B1026",
    letterSpacing: 2,
  },
});
