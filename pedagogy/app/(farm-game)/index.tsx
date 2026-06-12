/**
 * FarmGame3D.tsx — Isometric 2.5D Farm Game (Three.js + Expo)
 *
 * v3 — Liquid glass + status bar:
 *  • Header verde agora cobre também a área da status bar (edge-to-edge),
 *    com ícones claros (light-content) e translucent no Android.
 *  • Footer redesenhado: botões FLUTUAM sobre o cenário 3D com efeito
 *    liquid glass (expo-blur) — dock de ferramentas, FABs de Seeds /
 *    Next Day e chip da semente selecionada, tudo em vidro.
 *  • A dica contextual virou um chip de vidro flutuando no topo do cenário.
 *
 * v2 — Correções e melhorias:
 *  • FIX: plantas agora aparecem e crescem até a colheita (plantas 3D
 *    procedurais com 3 estágios; os sprites de emoji eram invisíveis no RN).
 *  • HUD: badge de nível, ouro animado, XP com %, badges de contagem,
 *    banner de LEVEL UP.
 *
 * Install dependencies:
 *   npx expo install expo-gl expo-three three
 *   npx expo install expo-blur react-native-safe-area-context
 *   npx expo install @expo-google-fonts/fredoka-one expo-font
 *
 * Usage:
 *   import FarmGame3D from './FarmGame3D';
 *   <FarmGame3D />
 */

import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import { BlurView } from "expo-blur";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
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
const COLS = 5;
const ROWS = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

type CropId = "wheat" | "corn" | "carrot" | "tomato" | "sunflower";
type TileState = "empty" | "tilled" | "planted" | "growing" | "ready";
type ToolId = "till" | "seed" | "harvest" | "water";

interface Crop {
  id: CropId;
  emoji: string;
  name: string;
  growTime: number; // ms
  price: number;
  seedCost: number;
  xp: number;
  color: string;
}

interface Tile {
  id: number;
  state: TileState;
  cropId?: CropId;
  plantedAt?: number;
  watered: boolean;
  waterCount: number;
}

interface FloatingLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  anim: Animated.Value;
}

interface GameState {
  tiles: Tile[];
  gold: number;
  xp: number;
  level: number;
  selectedTool: ToolId;
  selectedCrop: CropId;
  day: number;
  totalHarvested: number;
}

// ─── Crop Catalog ─────────────────────────────────────────────────────────────

const CROPS: Record<CropId, Crop> = {
  wheat: {
    id: "wheat",
    emoji: "🌾",
    name: "Wheat",
    growTime: 20_000,
    price: 15,
    seedCost: 5,
    xp: 10,
    color: "#F59E0B",
  },
  corn: {
    id: "corn",
    emoji: "🌽",
    name: "Corn",
    growTime: 35_000,
    price: 30,
    seedCost: 10,
    xp: 20,
    color: "#FCD34D",
  },
  carrot: {
    id: "carrot",
    emoji: "🥕",
    name: "Carrot",
    growTime: 25_000,
    price: 22,
    seedCost: 8,
    xp: 15,
    color: "#F97316",
  },
  tomato: {
    id: "tomato",
    emoji: "🍅",
    name: "Tomato",
    growTime: 45_000,
    price: 50,
    seedCost: 15,
    xp: 30,
    color: "#EF4444",
  },
  sunflower: {
    id: "sunflower",
    emoji: "🌻",
    name: "Sunflower",
    growTime: 60_000,
    price: 80,
    seedCost: 25,
    xp: 50,
    color: "#EAB308",
  },
};

const LEVEL_THRESHOLDS = [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 8000];
const XP_FOR_LEVEL = (lvl: number) =>
  LEVEL_THRESHOLDS[Math.min(lvl, LEVEL_THRESHOLDS.length - 1)];

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialTiles = (): Tile[] =>
  Array.from({ length: ROWS * COLS }, (_, i) => ({
    id: i,
    state: "empty",
    watered: false,
    waterCount: 0,
  }));

const INITIAL_STATE: GameState = {
  tiles: initialTiles(),
  gold: 100,
  xp: 0,
  level: 1,
  selectedTool: "till",
  selectedCrop: "wheat",
  day: 1,
  totalHarvested: 0,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "TILL"; id: number }
  | { type: "PLANT"; id: number }
  | { type: "WATER"; id: number }
  | { type: "HARVEST"; id: number; gold: number; xp: number }
  | { type: "SELECT_TOOL"; tool: ToolId }
  | { type: "SELECT_CROP"; crop: CropId }
  | { type: "TICK" }
  | { type: "NEXT_DAY" }
  | { type: "RESET" };

function xpToLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 1; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "TILL": {
      const tile = state.tiles[action.id];
      if (tile.state !== "empty") return state;
      const tiles = [...state.tiles];
      tiles[action.id] = { ...tile, state: "tilled" };
      return { ...state, tiles };
    }
    case "PLANT": {
      const tile = state.tiles[action.id];
      if (tile.state !== "tilled") return state;
      const crop = CROPS[state.selectedCrop];
      if (state.gold < crop.seedCost) return state;
      const tiles = [...state.tiles];
      tiles[action.id] = {
        ...tile,
        state: "planted",
        cropId: state.selectedCrop,
        plantedAt: Date.now(),
        watered: false,
        waterCount: 0,
      };
      return { ...state, tiles, gold: state.gold - crop.seedCost };
    }
    case "WATER": {
      const tile = state.tiles[action.id];
      if (tile.state !== "planted" && tile.state !== "growing") return state;
      if (tile.watered) return state;
      const tiles = [...state.tiles];
      tiles[action.id] = {
        ...tile,
        watered: true,
        waterCount: tile.waterCount + 1,
      };
      return { ...state, tiles };
    }
    case "HARVEST": {
      const tile = state.tiles[action.id];
      if (tile.state !== "ready") return state;
      const tiles = [...state.tiles];
      tiles[action.id] = {
        id: tile.id,
        state: "tilled",
        watered: false,
        waterCount: 0,
      };
      const newXp = state.xp + action.xp;
      return {
        ...state,
        tiles,
        gold: state.gold + action.gold,
        xp: newXp,
        level: xpToLevel(newXp),
        totalHarvested: state.totalHarvested + 1,
      };
    }
    case "SELECT_TOOL":
      return { ...state, selectedTool: action.tool };
    case "SELECT_CROP":
      return { ...state, selectedCrop: action.crop };
    case "TICK": {
      const now = Date.now();
      const tiles = state.tiles.map((t) => {
        if (t.state !== "planted" && t.state !== "growing") return t;
        const crop = CROPS[t.cropId!];
        const boost = t.waterCount > 0 ? 0.7 : 1;
        const elapsed = now - t.plantedAt!;
        const effective = elapsed / boost;
        if (effective >= crop.growTime)
          return { ...t, state: "ready" as TileState };
        if (effective >= crop.growTime * 0.5 && t.state === "planted")
          return { ...t, state: "growing" as TileState, watered: false };
        return t;
      });
      return { ...state, tiles };
    }
    case "NEXT_DAY": {
      const tiles = state.tiles.map((t) => ({ ...t, watered: false }));
      return { ...state, tiles, day: state.day + 1 };
    }
    case "RESET":
      return INITIAL_STATE;
    default:
      return state;
  }
}

// ─── Toolbar data ─────────────────────────────────────────────────────────────

const TOOLS: { id: ToolId; emoji: string; label: string; color: string }[] = [
  { id: "till", emoji: "⛏️", label: "Till", color: "#78716C" },
  { id: "seed", emoji: "🌱", label: "Plant", color: "#22C55E" },
  { id: "water", emoji: "💧", label: "Water", color: "#3B82F6" },
  { id: "harvest", emoji: "🧺", label: "Harvest", color: "#F59E0B" },
];

// ─── 3D color map per tile state ──────────────────────────────────────────────

const TILE_TOP_COLOR: Record<TileState | "watered", number> = {
  empty: 0xc4a882,
  tilled: 0x8b5e3c,
  planted: 0x7a5234,
  growing: 0x6b4a2e,
  watered: 0x4e3a28,
  ready: 0x8b5e3c,
};
const TILE_SIDE_COLOR: Record<TileState | "watered", number> = {
  empty: 0xa08060,
  tilled: 0x6b4423,
  planted: 0x5e3c1f,
  growing: 0x52351c,
  watered: 0x3a2c1c,
  ready: 0x6b4423,
};
const TILE_HOVER_TOP = 0xa3e635;
const TILE_HOVER_SIDE = 0x65a30d;

// Grass / ground colors
const GRASS_GROUND = 0x4caf50;
const GRASS_TUFTS = [0x2e7d32, 0x388e3c, 0x43a047, 0x66bb6a];
const FLOWER_COLORS = [0xffeb3b, 0xff7043, 0xf06292, 0xffffff];

// ─── Tile geometry helpers ────────────────────────────────────────────────────

const TILE_W = 1.1;
const TILE_H = 0.2;
const TILE_GAP = 0.07;
const STRIDE = TILE_W + TILE_GAP;
const FIELD_HALF = (COLS * STRIDE) / 2;
const GRASS_BORDER = 4.5;

function tileWorldPos(id: number): THREE.Vector3 {
  const col = id % COLS;
  const row = Math.floor(id / COLS);
  const cx = (COLS - 1) / 2;
  const cy = (ROWS - 1) / 2;
  return new THREE.Vector3((col - cx) * STRIDE, 0, (row - cy) * STRIDE);
}

function makeTileMaterials(
  topColor: number,
  sideColor: number,
): THREE.MeshLambertMaterial[] {
  const side = new THREE.MeshLambertMaterial({ color: sideColor });
  const top = new THREE.MeshLambertMaterial({ color: topColor });
  // BoxGeometry face order: +x, -x, +y (top), -y, +z, -z
  return [side, side, top, side, side, side];
}

function tileStateKey(tile: Tile): TileState | "watered" {
  if ((tile.state === "planted" || tile.state === "growing") && tile.watered)
    return "watered"; // terra escura/úmida
  return tile.state;
}

function applyTileMat(mesh: THREE.Mesh, tile: Tile, hovered = false) {
  if (hovered) {
    mesh.material = makeTileMaterials(TILE_HOVER_TOP, TILE_HOVER_SIDE);
  } else {
    const key = tileStateKey(tile);
    mesh.material = makeTileMaterials(
      TILE_TOP_COLOR[key],
      TILE_SIDE_COLOR[key],
    );
  }
}

// ─── Procedural plant meshes ──────────────────────────────────────────────────
// Plantas 3D reais (3 estágios). Geometrias e materiais compartilhados a
// nível de módulo para custo praticamente zero por tile.

const PLANT_MAT = {
  sprout: new THREE.MeshLambertMaterial({ color: 0x86efac }),
  stem: new THREE.MeshLambertMaterial({ color: 0x16a34a }),
  leaf: new THREE.MeshLambertMaterial({ color: 0x22c55e }),
  leafDark: new THREE.MeshLambertMaterial({ color: 0x15803d }),
  wheat: new THREE.MeshLambertMaterial({ color: 0xd9a02b }),
  wheatTip: new THREE.MeshLambertMaterial({ color: 0xfbbf24 }),
  corn: new THREE.MeshLambertMaterial({ color: 0xfcd34d }),
  cornHusk: new THREE.MeshLambertMaterial({ color: 0x65a30d }),
  carrot: new THREE.MeshLambertMaterial({ color: 0xf97316 }),
  tomato: new THREE.MeshLambertMaterial({ color: 0xef4444 }),
  sunPetal: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
  sunCenter: new THREE.MeshLambertMaterial({ color: 0x78350f }),
};

const PLANT_GEO = {
  sproutLeaf: new THREE.ConeGeometry(0.05, 0.2, 5),
  stem: new THREE.CylinderGeometry(0.028, 0.042, 0.34, 6),
  leaf: new THREE.ConeGeometry(0.07, 0.2, 5),
  stalk: new THREE.CylinderGeometry(0.018, 0.028, 0.5, 5),
  stalkTip: new THREE.ConeGeometry(0.05, 0.16, 5),
  tallStem: new THREE.CylinderGeometry(0.035, 0.05, 0.62, 6),
  ear: new THREE.SphereGeometry(0.1, 8, 8),
  bush: new THREE.SphereGeometry(0.24, 10, 10),
  fruit: new THREE.SphereGeometry(0.075, 8, 8),
  carrotTop: new THREE.ConeGeometry(0.09, 0.14, 8),
  tuft: new THREE.ConeGeometry(0.045, 0.28, 5),
  sunStem: new THREE.CylinderGeometry(0.03, 0.045, 0.68, 6),
  sunHead: new THREE.CylinderGeometry(0.17, 0.17, 0.05, 14),
  sunCore: new THREE.SphereGeometry(0.08, 8, 8),
};

function pm(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

/** Estágio 1 — broto recém-plantado (igual p/ todas as culturas) */
function buildSprout(): THREE.Group {
  const g = new THREE.Group();
  const l1 = pm(PLANT_GEO.sproutLeaf, PLANT_MAT.sprout);
  l1.position.set(0.035, 0.1, 0);
  l1.rotation.z = -0.35;
  const l2 = pm(PLANT_GEO.sproutLeaf, PLANT_MAT.sprout);
  l2.position.set(-0.035, 0.08, 0);
  l2.rotation.z = 0.35;
  g.add(l1, l2);
  return g;
}

/** Estágio 2 — planta jovem (caule + folhas) */
function buildYoung(): THREE.Group {
  const g = new THREE.Group();
  const stem = pm(PLANT_GEO.stem, PLANT_MAT.stem);
  stem.position.y = 0.17;
  g.add(stem);
  for (let i = 0; i < 3; i++) {
    const leaf = pm(PLANT_GEO.leaf, PLANT_MAT.leaf);
    const pivot = new THREE.Group();
    leaf.position.set(0.1, 0, 0);
    leaf.rotation.z = -1.0;
    pivot.add(leaf);
    pivot.position.y = 0.13 + i * 0.08;
    pivot.rotation.y = i * ((Math.PI * 2) / 3);
    g.add(pivot);
  }
  return g;
}

/** Estágio 3 — planta madura, visual único por cultura */
function buildMature(cropId: CropId): THREE.Group {
  const g = new THREE.Group();

  if (cropId === "wheat") {
    const offsets: [number, number][] = [
      [0, 0],
      [0.12, 0.06],
      [-0.12, 0.04],
      [0.05, -0.11],
      [-0.07, -0.1],
    ];
    offsets.forEach(([x, z], i) => {
      const stalk = pm(PLANT_GEO.stalk, PLANT_MAT.wheat);
      stalk.position.set(x, 0.25, z);
      stalk.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.07;
      const tip = pm(PLANT_GEO.stalkTip, PLANT_MAT.wheatTip);
      tip.position.set(x, 0.55, z);
      tip.rotation.z = stalk.rotation.z;
      g.add(stalk, tip);
    });
  } else if (cropId === "corn") {
    const stem = pm(PLANT_GEO.tallStem, PLANT_MAT.cornHusk);
    stem.position.y = 0.31;
    g.add(stem);
    const ear = pm(PLANT_GEO.ear, PLANT_MAT.corn);
    ear.scale.set(1, 1.7, 1);
    ear.position.set(0.1, 0.34, 0);
    ear.rotation.z = -0.2;
    g.add(ear);
    for (let i = 0; i < 2; i++) {
      const leaf = pm(PLANT_GEO.leaf, PLANT_MAT.leaf);
      leaf.position.set(i === 0 ? 0.12 : -0.12, 0.56, 0);
      leaf.rotation.z = i === 0 ? -1.1 : 1.1;
      g.add(leaf);
    }
  } else if (cropId === "carrot") {
    // topo da cenoura aparecendo na terra + ramas verdes
    const top = pm(PLANT_GEO.carrotTop, PLANT_MAT.carrot);
    top.position.y = 0.06;
    g.add(top);
    for (let i = 0; i < 4; i++) {
      const tuft = pm(PLANT_GEO.tuft, PLANT_MAT.leafDark);
      const pivot = new THREE.Group();
      tuft.position.y = 0.14;
      tuft.rotation.z = 0.35;
      pivot.add(tuft);
      pivot.position.y = 0.1;
      pivot.rotation.y = i * (Math.PI / 2) + 0.4;
      g.add(pivot);
    }
  } else if (cropId === "tomato") {
    const bush = pm(PLANT_GEO.bush, PLANT_MAT.leafDark);
    bush.scale.set(1, 0.85, 1);
    bush.position.y = 0.2;
    g.add(bush);
    const fruitPos: [number, number, number][] = [
      [0.16, 0.26, 0.1],
      [-0.14, 0.18, 0.14],
      [0.02, 0.32, -0.16],
    ];
    fruitPos.forEach(([x, y, z]) => {
      const f = pm(PLANT_GEO.fruit, PLANT_MAT.tomato);
      f.position.set(x, y, z);
      g.add(f);
    });
  } else {
    // sunflower
    const stem = pm(PLANT_GEO.sunStem, PLANT_MAT.stem);
    stem.position.y = 0.34;
    g.add(stem);
    const head = pm(PLANT_GEO.sunHead, PLANT_MAT.sunPetal);
    head.position.set(0, 0.7, 0.04);
    head.rotation.x = -0.95; // inclina o disco para "olhar" para a câmera
    const core = pm(PLANT_GEO.sunCore, PLANT_MAT.sunCenter);
    core.scale.set(1, 0.5, 1);
    core.position.y = 0.04; // ao longo do eixo do disco
    head.add(core);
    g.add(head);
    const leaf = pm(PLANT_GEO.leaf, PLANT_MAT.leaf);
    leaf.position.set(0.1, 0.3, 0);
    leaf.rotation.z = -1.1;
    g.add(leaf);
  }

  return g;
}

/** Chave de cache: só reconstruímos o mesh quando o estágio muda */
function plantKey(t: Tile): string | null {
  if (t.state === "planted") return "planted";
  if (t.state === "growing") return "growing";
  if (t.state === "ready" && t.cropId) return `ready:${t.cropId}`;
  return null;
}

function buildPlant(t: Tile): THREE.Group | null {
  if (t.state === "planted") return buildSprout();
  if (t.state === "growing") return buildYoung();
  if (t.state === "ready" && t.cropId) return buildMature(t.cropId);
  return null;
}

// ─── Grass field builder ──────────────────────────────────────────────────────

function buildGrassField(scene: THREE.Scene) {
  const groundSize = FIELD_HALF * 2 + GRASS_BORDER * 2;
  const groundGeo = new THREE.BoxGeometry(groundSize, 0.14, groundSize);
  const groundMat = new THREE.MeshLambertMaterial({ color: GRASS_GROUND });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.set(0, -TILE_H / 2 - 0.07, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  const tuftGeo = new THREE.ConeGeometry(0.07, 0.22, 5);
  const tuftMats = GRASS_TUFTS.map(
    (c) => new THREE.MeshLambertMaterial({ color: c }),
  );
  const margin = 0.25;
  const outer = FIELD_HALF + GRASS_BORDER - 0.3;

  const randomBorderPos = (): [number, number] => {
    let x = 0;
    let z = 0;
    do {
      x = (Math.random() * 2 - 1) * outer;
      z = (Math.random() * 2 - 1) * outer;
    } while (
      Math.abs(x) < FIELD_HALF + margin &&
      Math.abs(z) < FIELD_HALF + margin
    );
    return [x, z];
  };

  for (let i = 0; i < 110; i++) {
    const [x, z] = randomBorderPos();
    const tuft = new THREE.Mesh(
      tuftGeo,
      tuftMats[Math.floor(Math.random() * tuftMats.length)],
    );
    const sc = 0.7 + Math.random() * 0.8;
    tuft.scale.set(sc, sc, sc);
    tuft.position.set(x, -TILE_H / 2 + 0.11 * sc, z);
    tuft.rotation.y = Math.random() * Math.PI;
    tuft.castShadow = true;
    scene.add(tuft);
  }

  const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 5);
  const stemMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
  const headGeo = new THREE.SphereGeometry(0.05, 8, 8);

  for (let i = 0; i < 18; i++) {
    const [x, z] = randomBorderPos();
    const flower = new THREE.Group();
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.08;
    const head = new THREE.Mesh(
      headGeo,
      new THREE.MeshLambertMaterial({
        color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
      }),
    );
    head.position.y = 0.18;
    flower.add(stem, head);
    flower.position.set(x, -TILE_H / 2, z);
    scene.add(flower);
  }
}

// ─── Three.js Scene Manager (ref object) ─────────────────────────────────────

interface SceneRefs {
  renderer: Renderer | null;
  scene: THREE.Scene | null;
  camera: THREE.OrthographicCamera | null;
  tileObjs: THREE.Mesh[];
  plantObjs: (THREE.Group | null)[];
  animFrame: number;
  readyAnim: number;
}

// ─── Liquid Glass wrapper ─────────────────────────────────────────────────────
// BlurView (expo-blur) + véu branco translúcido + borda clara = "liquid glass".
// No Android, experimentalBlurMethod ativa blur real; sem ele cai num
// fallback semitransparente que continua bonito.

const Glass: React.FC<{
  style?: any;
  intensity?: number;
  children: React.ReactNode;
}> = ({ style, intensity = 45, children }) => (
  <BlurView
    intensity={intensity}
    tint="light"
    experimentalBlurMethod="dimezisBlurView"
    style={[s.glass, style]}
  >
    {children}
  </BlurView>
);

// ─── Animated Gold Counter ────────────────────────────────────────────────────

const GoldCounter: React.FC<{ gold: number }> = ({ gold }) => {
  const anim = useRef(new Animated.Value(gold)).current;
  const [display, setDisplay] = useState(gold);

  useEffect(() => {
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: gold,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [gold]);

  return (
    <View style={s.goldChip}>
      <Text style={s.goldIcon}>💰</Text>
      <Text style={s.goldTxt}>{display.toLocaleString()}</Text>
    </View>
  );
};

// ─── XP Bar ───────────────────────────────────────────────────────────────────

const XPBar: React.FC<{ xp: number; level: number }> = ({ xp, level }) => {
  const curXp = XP_FOR_LEVEL(level - 1);
  const nxtXp = XP_FOR_LEVEL(level);
  const progress = nxtXp > curXp ? (xp - curXp) / (nxtXp - curXp) : 1;
  const pct = Math.round(progress * 100);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 450,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [progress]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={s.xpWrap}>
      <View style={s.xpTrack}>
        <Animated.View style={[s.xpFill, { width: barWidth }]}>
          <View style={s.xpShine} />
        </Animated.View>
      </View>
      <View style={s.xpRow}>
        <Text style={s.xpText}>
          {xp - curXp} / {nxtXp - curXp} XP
        </Text>
        <Text style={s.xpPct}>{pct}%</Text>
      </View>
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

// ─── Shop Modal ───────────────────────────────────────────────────────────────

const ShopModal: React.FC<{
  visible: boolean;
  gold: number;
  selectedCrop: CropId;
  onSelectCrop: (id: CropId) => void;
  onClose: () => void;
}> = ({ visible, gold, selectedCrop, onSelectCrop, onClose }) => {
  const slide = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Animated.View
          style={[s.shopPanel, { transform: [{ translateY: slide }] }]}
        >
          <Pressable>
            <View style={s.shopHandle} />
            <Text style={s.shopTitle}>🌿 Seed Shop</Text>
            <Text style={s.shopGold}>💰 {gold} coins available</Text>

            {(Object.values(CROPS) as Crop[]).map((crop) => {
              const canAfford = gold >= crop.seedCost;
              const selected = selectedCrop === crop.id;
              return (
                <TouchableOpacity
                  key={crop.id}
                  style={[
                    s.cropRow,
                    selected && s.cropRowSel,
                    !canAfford && s.cropRowDim,
                  ]}
                  onPress={() => {
                    onSelectCrop(crop.id);
                    onClose();
                  }}
                  disabled={!canAfford}
                  activeOpacity={0.75}
                >
                  <Text style={s.cropEm}>{crop.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cropName}>{crop.name}</Text>
                    <Text style={s.cropDet}>
                      ⏱ {crop.growTime / 1000}s · 🌾 Sell: {crop.price} · 🌱
                      Seed: {crop.seedCost}
                    </Text>
                  </View>
                  <View style={[s.xpBadge, { backgroundColor: crop.color }]}>
                    <Text style={s.xpBadgeTxt}>+{crop.xp}XP</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeBtnTxt}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// ─── Day Modal ────────────────────────────────────────────────────────────────

const DayModal: React.FC<{
  visible: boolean;
  day: number;
  gold: number;
  totalHarvested: number;
  onClose: () => void;
}> = ({ visible, day, gold, totalHarvested, onClose }) => {
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

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View style={[s.dayOverlay, { opacity: op }]}>
        <Animated.View style={[s.dayCard, { transform: [{ scale: sc }] }]}>
          <Text style={s.daySun}>🌅</Text>
          <Text style={s.dayTitle}>Day {day} Complete!</Text>
          <Text style={s.dayStat}>💰 Total coins: {gold}</Text>
          <Text style={s.dayStat}>🧺 Total harvested: {totalHarvested}</Text>
          <TouchableOpacity style={s.dayBtn} onPress={onClose}>
            <Text style={s.dayBtnTxt}>Next Day ➡</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const FF = "FredokaOne_400Regular";

function FarmGameInner() {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const insets = useSafeAreaInsets();

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [shopVisible, setShopVisible] = useState(false);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [floatLabels, setFloatLabels] = useState<FloatingLabel[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // GL drawing buffer size (PHYSICAL pixels)
  const glSize = useRef({ w: 1, h: 1 });
  // GLView layout size (LOGICAL points — same unit as touch locationX/Y)
  const viewSize = useRef({ w: 1, h: 1 });

  const refs = useRef<SceneRefs>({
    renderer: null,
    scene: null,
    camera: null,
    tileObjs: [],
    plantObjs: [],
    animFrame: 0,
    readyAnim: 0,
  });

  const hoveredId = useRef(-1);

  // ── HUD animations ──────────────────────────────────────────────────────────

  // Pulso contínuo (usado no badge de "pronto p/ colher")
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ]),
    ).start();
  }, []);
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  // Banner de LEVEL UP
  const prevLevel = useRef(state.level);
  const lvlAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state.level > prevLevel.current) {
      setShowLevelUp(true);
      lvlAnim.setValue(0);
      Animated.sequence([
        Animated.spring(lvlAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
        }),
        Animated.delay(1000),
        Animated.timing(lvlAnim, {
          toValue: 2,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => setShowLevelUp(false));
      Vibration.vibrate([0, 40, 60, 40]);
    }
    prevLevel.current = state.level;
  }, [state.level]);
  const lvlScale = lvlAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.3, 1, 1.15],
  });
  const lvlOpacity = lvlAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 1, 0],
  });

  // ── Floating label spawn ────────────────────────────────────────────────────

  const spawnLabel = useCallback(
    (tileId: number, text: string, color: string) => {
      const r = refs.current;
      const { w, h } = viewSize.current;
      let x = w / 2;
      let y = h / 2;

      if (r.camera) {
        const p = tileWorldPos(tileId).clone();
        p.y += TILE_H / 2 + 0.4;
        p.project(r.camera);
        x = ((p.x + 1) / 2) * w;
        y = ((1 - p.y) / 2) * h;
      }

      const anim = new Animated.Value(0);
      const id = `${tileId}_${Date.now()}`;
      setFloatLabels((prev) => [...prev, { id, x, y, text, color, anim }]);
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start(() => {
        setFloatLabels((prev) => prev.filter((l) => l.id !== id));
      });
    },
    [],
  );

  // ── Game logic: tile interaction ────────────────────────────────────────────

  const handleTilePress = useCallback(
    (tileId: number) => {
      const st = stateRef.current;
      const tile = st.tiles[tileId];
      const tool = st.selectedTool;

      if (tool === "till") {
        if (tile.state !== "empty") return;
        dispatch({ type: "TILL", id: tileId });
        Vibration.vibrate(30);
        return;
      }
      if (tool === "seed") {
        if (tile.state !== "tilled") return;
        const crop = CROPS[st.selectedCrop];
        if (st.gold < crop.seedCost) {
          spawnLabel(tileId, "❌ No coins!", "#EF4444");
          return;
        }
        dispatch({ type: "PLANT", id: tileId });
        spawnLabel(tileId, `-${crop.seedCost}💰`, "#F97316");
        Vibration.vibrate(20);
        return;
      }
      if (tool === "water") {
        if (tile.state !== "planted" && tile.state !== "growing") return;
        if (tile.watered) {
          spawnLabel(tileId, "Already watered!", "#94A3B8");
          return;
        }
        dispatch({ type: "WATER", id: tileId });
        spawnLabel(tileId, "💧 Watered!", "#3B82F6");
        Vibration.vibrate(15);
        return;
      }
      if (tool === "harvest") {
        if (tile.state !== "ready" || !tile.cropId) return;
        const crop = CROPS[tile.cropId];
        const goldEarned =
          crop.price + (tile.waterCount > 0 ? Math.floor(crop.price * 0.2) : 0);
        dispatch({
          type: "HARVEST",
          id: tileId,
          gold: goldEarned,
          xp: crop.xp,
        });
        spawnLabel(tileId, `+${goldEarned}💰`, "#22C55E");
        setTimeout(() => spawnLabel(tileId, `+${crop.xp}XP`, "#A78BFA"), 220);
        Vibration.vibrate([0, 30, 50, 30]);
      }
    },
    [spawnLabel],
  );

  // ── Sync Three.js scene when game state changes ─────────────────────────────
  // Gerencia plantas 3D por estágio. O mesh só é reconstruído quando o
  // estágio muda (planted → growing → ready).

  useEffect(() => {
    const r = refs.current;
    if (!r.scene) return;
    state.tiles.forEach((tile, id) => {
      const mesh = r.tileObjs[id];
      if (!mesh) return;
      applyTileMat(mesh, tile, hoveredId.current === id);

      const want = plantKey(tile);
      const cur = r.plantObjs[id];
      if (cur && cur.userData.key === want) return; // estágio inalterado

      if (cur) {
        r.scene!.remove(cur);
        r.plantObjs[id] = null;
      }
      if (!want) return;

      const g = buildPlant(tile)!;
      g.userData.key = want;
      g.userData.spawnAt = performance.now(); // anima o "pop" de entrada
      const pos = tileWorldPos(id);
      g.position.set(pos.x, TILE_H / 2, pos.z);
      g.rotation.y = (id % 7) * 0.9; // variação determinística entre tiles
      r.scene!.add(g);
      r.plantObjs[id] = g;
    });
  }, [state.tiles]);

  // ── Game tick ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, []);

  // ── GL context creation ──────────────────────────────────────────────────────

  const onContextCreate = useCallback(async (gl: WebGLRenderingContext) => {
    const r = refs.current;
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    glSize.current = { w, h };

    // @ts-ignore — expo-three Renderer accepts the gl context
    r.renderer = new Renderer({ gl });
    r.renderer!.setSize(w, h);
    r.renderer!.shadowMap.enabled = true;

    r.scene = new THREE.Scene();
    r.scene.background = null;

    r.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xfffbe0, 1.1);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    r.scene.add(dir);

    const aspect = w / h;
    const VIEW = 4.6;
    r.camera = new THREE.OrthographicCamera(
      -VIEW * aspect,
      VIEW * aspect,
      VIEW,
      -VIEW,
      0.1,
      100,
    );
    r.camera.position.set(8, 10, 8);
    r.camera.lookAt(0, 0, 0);
    r.camera.updateProjectionMatrix();

    buildGrassField(r.scene);

    const geo = new THREE.BoxGeometry(TILE_W, TILE_H, TILE_W);
    for (let id = 0; id < ROWS * COLS; id++) {
      const mat = makeTileMaterials(
        TILE_TOP_COLOR.empty,
        TILE_SIDE_COLOR.empty,
      );
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      const pos = tileWorldPos(id);
      mesh.position.copy(pos);
      (mesh as any).tileId = id;
      r.scene.add(mesh);
      r.tileObjs[id] = mesh;
    }

    // Caso o estado já tenha plantas (hot reload), sincroniza uma vez
    stateRef.current.tiles.forEach((tile, id) => {
      const want = plantKey(tile);
      if (!want) return;
      const g = buildPlant(tile)!;
      g.userData.key = want;
      g.userData.spawnAt = performance.now();
      const pos = tileWorldPos(id);
      g.position.set(pos.x, TILE_H / 2, pos.z);
      g.rotation.y = (id % 7) * 0.9;
      r.scene!.add(g);
      r.plantObjs[id] = g;
      applyTileMat(r.tileObjs[id], tile);
    });

    // Render loop — pop-in das plantas + balanço das prontas
    let lastT = performance.now();
    const animate = () => {
      r.animFrame = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      lastT = now;

      r.readyAnim += dt * 2;
      const tiles = stateRef.current.tiles;
      tiles.forEach((t, i) => {
        const g = r.plantObjs[i];
        if (!g) return;

        // animação de entrada (pop)
        const age = now - (g.userData.spawnAt ?? now);
        let sc = 1;
        if (age < 350) sc = 0.4 + 0.6 * Math.min(1, age / 350);

        if (t.state === "ready") {
          sc *= 1 + 0.06 * Math.sin(r.readyAnim + i);
          g.rotation.z = 0.05 * Math.sin(r.readyAnim * 1.3 + i);
        } else {
          g.rotation.z = 0.02 * Math.sin(r.readyAnim * 0.7 + i); // brisa leve
        }
        g.scale.set(sc, sc, sc);
      });

      r.renderer!.render(r.scene!, r.camera!);
      (gl as any).endFrameEXP?.();
    };
    animate();
  }, []);

  // ── Touch → tile picking ─────────────────────────────────────────────────────

  const pickTile = useCallback((px: number, py: number): number => {
    const r = refs.current;
    if (!r.camera || !r.scene) return -1;
    const { w, h } = viewSize.current;
    if (w <= 1 || h <= 1) return -1;
    const nx = (px / w) * 2 - 1;
    const ny = -(py / h) * 2 + 1;

    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(nx, ny), r.camera);
    const hits = ray.intersectObjects(r.tileObjs.filter(Boolean), false);
    if (hits.length > 0) return (hits[0].object as any).tileId as number;
    return -1;
  }, []);

  const onCanvasLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    viewSize.current = { w: width, h: height };
  }, []);

  const onTouchStart = useCallback(
    (e: any) => {
      const { locationX, locationY } = e.nativeEvent;
      const id = pickTile(locationX, locationY);
      if (id >= 0) {
        const r = refs.current;
        if (hoveredId.current >= 0 && r.tileObjs[hoveredId.current]) {
          applyTileMat(
            r.tileObjs[hoveredId.current],
            stateRef.current.tiles[hoveredId.current],
          );
        }
        hoveredId.current = id;
        if (r.tileObjs[id]) {
          applyTileMat(r.tileObjs[id], stateRef.current.tiles[id], true);
        }
      }
    },
    [pickTile],
  );

  const onTouchEnd = useCallback(
    (e: any) => {
      const { locationX, locationY } = e.nativeEvent;
      let id = pickTile(locationX, locationY);
      if (id < 0) id = hoveredId.current;

      const r = refs.current;
      if (hoveredId.current >= 0 && r.tileObjs[hoveredId.current]) {
        applyTileMat(
          r.tileObjs[hoveredId.current],
          stateRef.current.tiles[hoveredId.current],
        );
      }
      hoveredId.current = -1;
      if (id >= 0) handleTilePress(id);
    },
    [pickTile, handleTilePress],
  );

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cancelAnimationFrame(refs.current.animFrame);
      refs.current.renderer?.dispose?.();
    };
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const c: Record<ToolId, number> = {
      till: 0,
      seed: 0,
      water: 0,
      harvest: 0,
    };
    state.tiles.forEach((t) => {
      if (t.state === "empty") c.till++;
      else if (t.state === "tilled") c.seed++;
      else if ((t.state === "planted" || t.state === "growing") && !t.watered)
        c.water++;
      else if (t.state === "ready") c.harvest++;
    });
    return c;
  }, [state.tiles]);

  const readyCount = counts.harvest;

  const HINT: Record<ToolId, string> = {
    till: "Tap empty tiles to till the soil",
    seed: `Planting ${CROPS[state.selectedCrop].name} — tap tilled tiles`,
    water: "Tap crops to water · faster + 20% bonus",
    harvest: "Tap glowing crops to harvest",
  };

  const activeTool = TOOLS.find((t) => t.id === state.selectedTool)!;
  const crop = CROPS[state.selectedCrop];

  if (!fontsLoaded) return null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      {/* Status bar translúcida — o verde do header aparece por trás */}
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Header (paddingTop = inset → o verde cobre a status bar) ── */}
      <View style={[s.headerWrap, { paddingTop: insets.top + 6 }]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.lvlBadge}>
              <Text style={s.lvlNum}>{state.level}</Text>
              <Text style={s.lvlLbl}>LVL</Text>
            </View>
            <View>
              <Text style={s.title}>Happy Farm</Text>
              <View style={s.dayPill}>
                <Text style={s.dayPillTxt}>☀️ Day {state.day}</Text>
              </View>
            </View>
          </View>

          <View style={s.chips}>
            <GoldCounter gold={state.gold} />
            {readyCount > 0 && (
              <Animated.View
                style={[s.readyChip, { transform: [{ scale: pulseScale }] }]}
              >
                <Text style={s.readyChipTxt}>🧺 {readyCount}</Text>
              </Animated.View>
            )}
          </View>
        </View>

        <XPBar xp={state.xp} level={state.level} />
      </View>

      {/* ── 3D Canvas — vai até o fim da tela; HUD flutua por cima ── */}
      <View style={s.canvasWrap} onLayout={onCanvasLayout}>
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={onContextCreate}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />

        {/* Dica contextual — chip de vidro flutuante */}
        <Glass style={s.hintChip} intensity={35}>
          <View style={[s.hintDot, { backgroundColor: activeTool.color }]} />
          <Text style={s.hintTxt}>
            {activeTool.emoji} {HINT[state.selectedTool]}
          </Text>
        </Glass>

        {/* Floating labels overlay */}
        {floatLabels.map((lbl) => (
          <View
            key={lbl.id}
            style={[s.floatWrap, { left: lbl.x - 40, top: lbl.y - 20 }]}
            pointerEvents="none"
          >
            <FloatLabel label={lbl} />
          </View>
        ))}

        {/* LEVEL UP banner */}
        {showLevelUp && (
          <Animated.View
            style={[
              s.lvlUpBanner,
              { opacity: lvlOpacity, transform: [{ scale: lvlScale }] },
            ]}
            pointerEvents="none"
          >
            <Text style={s.lvlUpStar}>⭐</Text>
            <Text style={s.lvlUpTxt}>LEVEL {state.level}!</Text>
          </Animated.View>
        )}

        {/* ── Footer flutuante em liquid glass ── */}
        <View
          style={[s.floatFooter, { bottom: insets.bottom + 14 }]}
          pointerEvents="box-none"
        >
          {/* Linha de FABs + chip da semente */}
          <View style={s.fabRow} pointerEvents="box-none">
            <TouchableOpacity
              onPress={() => setShopVisible(true)}
              activeOpacity={0.8}
              style={s.floatShadow}
            >
              <Glass style={s.fab}>
                <Text style={s.fabEm}>🌿</Text>
                <Text style={s.fabLbl}>Seeds</Text>
              </Glass>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShopVisible(true)}
              activeOpacity={0.85}
              style={s.floatShadow}
            >
              <Glass style={s.cropChip}>
                <Text style={s.cropChipEm}>{crop.emoji}</Text>
                <View>
                  <Text style={s.cropChipName}>{crop.name}</Text>
                  <Text style={s.cropChipCost}>🌱 {crop.seedCost} coins</Text>
                </View>
              </Glass>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDayModalVisible(true)}
              activeOpacity={0.8}
              style={s.floatShadow}
            >
              <Glass style={s.fab}>
                <Text style={s.fabEm}>🌅</Text>
                <Text style={s.fabLbl}>Day</Text>
              </Glass>
            </TouchableOpacity>
          </View>

          {/* Dock de ferramentas em vidro */}
          <View style={s.floatShadow}>
            <Glass style={s.toolDock} intensity={55}>
              {TOOLS.map((tool) => {
                const active = state.selectedTool === tool.id;
                const count = counts[tool.id];
                return (
                  <TouchableOpacity
                    key={tool.id}
                    style={[
                      s.toolBtn,
                      active && { backgroundColor: tool.color },
                    ]}
                    onPress={() =>
                      dispatch({ type: "SELECT_TOOL", tool: tool.id })
                    }
                    activeOpacity={0.8}
                  >
                    {count > 0 && (
                      <View
                        style={[s.toolCount, { backgroundColor: tool.color }]}
                      >
                        <Text style={s.toolCountTxt}>{count}</Text>
                      </View>
                    )}
                    <Text style={s.toolEm}>{tool.emoji}</Text>
                    <Text style={[s.toolLbl, active && s.toolLblActive]}>
                      {tool.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Glass>
          </View>
        </View>
      </View>

      {/* ── Modals ── */}
      <ShopModal
        visible={shopVisible}
        gold={state.gold}
        selectedCrop={state.selectedCrop}
        onSelectCrop={(c) => dispatch({ type: "SELECT_CROP", crop: c })}
        onClose={() => setShopVisible(false)}
      />
      <DayModal
        visible={dayModalVisible}
        day={state.day}
        gold={state.gold}
        totalHarvested={state.totalHarvested}
        onClose={() => {
          dispatch({ type: "NEXT_DAY" });
          setDayModalVisible(false);
        }}
      />
    </View>
  );
}

export default function FarmGame3D() {
  return (
    <SafeAreaProvider>
      <FarmGameInner />
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const P = {
  green1: "#14532D",
  green2: "#22C55E",
  green3: "#DCFCE7",
  greenDeep: "#052E16",
  brown1: "#78350F",
  brown2: "#A16207",
  cream: "#FEF9C3",
  gold: "#F59E0B",
  goldLight: "#FBBF24",
  white: "#FFFFFF",
  gray1: "#F5F5F4",
  ink: "#14532D", // texto escuro sobre vidro
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#87CEEB" },

  // Header (cobre a status bar)
  headerWrap: { backgroundColor: P.green1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  lvlBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: P.greenDeep,
    borderWidth: 2,
    borderColor: P.goldLight,
    alignItems: "center",
    justifyContent: "center",
  },
  lvlNum: {
    fontFamily: FF,
    fontSize: 18,
    color: P.goldLight,
    lineHeight: 20,
  },
  lvlLbl: {
    fontFamily: FF,
    fontSize: 7,
    color: "#86EFAC",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 21,
    fontFamily: FF,
    color: P.white,
    letterSpacing: 0.5,
  },
  dayPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  dayPillTxt: { fontSize: 10, fontFamily: FF, color: "#BBF7D0" },

  chips: { flexDirection: "row", gap: 6, alignItems: "center" },
  goldChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: P.greenDeep,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.55)",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goldIcon: { fontSize: 13 },
  goldTxt: { color: P.goldLight, fontFamily: FF, fontSize: 13 },
  readyChip: {
    backgroundColor: P.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.goldLight,
  },
  readyChipTxt: { color: P.brown1, fontFamily: FF, fontSize: 12 },

  // XP
  xpWrap: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    paddingBottom: 10,
  },
  xpTrack: {
    height: 9,
    backgroundColor: P.greenDeep,
    borderRadius: 5,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    backgroundColor: "#4ADE80",
    borderRadius: 5,
    overflow: "hidden",
  },
  xpShine: {
    position: "absolute",
    top: 1,
    left: 4,
    right: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  xpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
  },
  xpText: { color: "#D1FAE5", fontFamily: FF, fontSize: 10 },
  xpPct: { color: "#86EFAC", fontFamily: FF, fontSize: 10 },

  // Canvas
  canvasWrap: {
    flex: 1,
    backgroundColor: "#87CEEB",
    position: "relative",
  },

  // ── Liquid glass base ──
  glass: {
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.30)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.60)",
  },
  floatShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#0F3D22",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
      },
      android: {},
    }),
  },

  // Hint chip (vidro, topo do cenário)
  hintChip: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
  },
  hintDot: { width: 8, height: 8, borderRadius: 4 },
  hintTxt: { fontFamily: FF, fontSize: 11, color: P.ink },

  // Level up banner
  lvlUpBanner: {
    position: "absolute",
    top: "30%",
    alignSelf: "center",
    backgroundColor: "rgba(20,83,45,0.92)",
    borderWidth: 2,
    borderColor: P.goldLight,
    borderRadius: 18,
    paddingHorizontal: 26,
    paddingVertical: 14,
    alignItems: "center",
    gap: 2,
  },
  lvlUpStar: { fontSize: 30 },
  lvlUpTxt: {
    fontFamily: FF,
    fontSize: 20,
    color: P.goldLight,
    letterSpacing: 1,
  },

  // ── Footer flutuante ──
  floatFooter: {
    position: "absolute",
    left: 14,
    right: 14,
    gap: 10,
  },
  fabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  fabEm: { fontSize: 22 },
  fabLbl: { fontFamily: FF, fontSize: 8, color: P.ink, marginTop: 1 },
  cropChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 26,
  },
  cropChipEm: { fontSize: 21 },
  cropChipName: { fontSize: 12, fontFamily: FF, color: P.ink },
  cropChipCost: { fontSize: 9, fontFamily: FF, color: P.brown2 },

  // Dock de ferramentas (vidro)
  toolDock: {
    flexDirection: "row",
    gap: 5,
    padding: 6,
    borderRadius: 26,
  },
  toolBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 20,
    gap: 1,
  },
  toolCount: {
    position: "absolute",
    top: 2,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
    zIndex: 2,
  },
  toolCountTxt: { color: P.white, fontFamily: FF, fontSize: 9 },
  toolEm: { fontSize: 20 },
  toolLbl: { fontSize: 9, fontFamily: FF, color: P.ink },
  toolLblActive: { color: P.white },

  // Floating labels
  floatWrap: {
    position: "absolute",
    width: 80,
    alignItems: "center",
  },
  floatText: {
    fontFamily: FF,
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Shop modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "flex-end",
  },
  shopPanel: {
    backgroundColor: P.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    maxHeight: "88%",
  },
  shopHandle: {
    width: 38,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  shopTitle: { fontSize: 19, fontFamily: FF, color: P.green1, marginBottom: 3 },
  shopGold: { fontSize: 13, fontFamily: FF, color: P.brown2, marginBottom: 14 },
  cropRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 11,
    borderRadius: 13,
    backgroundColor: P.gray1,
    marginBottom: 7,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cropRowSel: { borderColor: P.green2, backgroundColor: P.green3 },
  cropRowDim: { opacity: 0.4 },
  cropEm: { fontSize: 27 },
  cropName: { fontSize: 14, fontFamily: FF, color: "#1F2937" },
  cropDet: { fontSize: 11, fontFamily: FF, color: "#6B7280", marginTop: 2 },
  xpBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  xpBadgeTxt: { color: P.white, fontFamily: FF, fontSize: 10 },
  closeBtn: {
    marginTop: 7,
    backgroundColor: "#F3F4F6",
    padding: 13,
    borderRadius: 11,
    alignItems: "center",
  },
  closeBtnTxt: { fontFamily: FF, color: "#374151", fontSize: 13 },

  // Day modal
  dayOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCard: {
    backgroundColor: P.white,
    borderRadius: 22,
    padding: 30,
    alignItems: "center",
    width: SCREEN_W * 0.78,
    gap: 11,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  daySun: { fontSize: 52 },
  dayTitle: { fontSize: 22, fontFamily: FF, color: P.green1 },
  dayStat: { fontSize: 15, fontFamily: FF, color: "#374151" },
  dayBtn: {
    marginTop: 8,
    backgroundColor: P.green2,
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 13,
  },
  dayBtnTxt: { color: P.white, fontFamily: FF, fontSize: 15 },
});
