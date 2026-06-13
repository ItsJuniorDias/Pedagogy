import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  ScrollView,
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

import { useCoinStore, type StorePack } from "../../hooks/UseCoinStore";

// ─── Constants ─────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");
const COLS = 5;
const ROWS = 5;

const STORAGE_KEY = "@happyfarm/save/v4";
const SAVE_DEBOUNCE_MS = 600;

// ─── Types ────────────────────────────────────────────────────────────────────

type CropId =
  | "wheat"
  | "lettuce"
  | "carrot"
  | "potato"
  | "corn"
  | "tomato"
  | "strawberry"
  | "sunflower"
  | "pumpkin"
  | "watermelon"
  | "grape"
  | "dragonfruit"
  | "golden_wheat"
  | "crystal_rose"
  | "star_fruit";

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
type TileState = "empty" | "tilled" | "planted" | "growing" | "ready";
type ToolId = "till" | "seed" | "harvest" | "water";

/** 3D visual archetypes — agora um modelo dedicado por cultura */
type PlantVisual =
  | "wheat"
  | "lettuce"
  | "carrot"
  | "potato"
  | "corn"
  | "tomato"
  | "strawberry"
  | "sunflower"
  | "starfruit"
  | "pumpkin"
  | "watermelon"
  | "grape"
  | "dragonfruit"
  | "crystal";

interface Crop {
  id: CropId;
  emoji: string;
  name: string;
  growTime: number; // ms
  price: number;
  seedCost: number;
  xp: number;
  color: string;
  color3d: number; // main color of the mature 3D plant
  rarity: Rarity;
  minLevel: number;
  visual: PlantVisual;
  /** Chance (0-1) of appearing in the shop each new day. 1 = always. */
  appearChance: number;
  /** Stock per day when it appears. Infinity for commons. */
  stockPerDay: number;
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
  /** Daily stock of rare+ items rolled today. Absent = didn't appear. */
  dailyStock: Partial<Record<CropId, number>>;
  /** Total coins purchased in the market (analytics / achievements). */
  coinsPurchased: number;
}

// ─── Rarity meta ──────────────────────────────────────────────────────────────

const RARITY_META: Record<
  Rarity,
  { label: string; color: string; order: number }
> = {
  common: { label: "Common", color: "#78716C", order: 0 },
  uncommon: { label: "Uncommon", color: "#22C55E", order: 1 },
  rare: { label: "Rare", color: "#3B82F6", order: 2 },
  epic: { label: "Epic", color: "#A855F7", order: 3 },
  legendary: { label: "Legendary", color: "#F59E0B", order: 4 },
};

// ─── Crop Catalog ─────────────────────────────────────────────────────────────
// growTime scales strongly with price: commons take seconds, legendaries
// take tens of minutes. Expensive seeds + rare stock = pressure to buy
// coins in the market.

const CROPS: Record<CropId, Crop> = {
  // ── COMMON — always in the shop, cheap, fast ──
  wheat: {
    id: "wheat",
    emoji: "🌾",
    name: "Wheat",
    growTime: 20_000,
    price: 15,
    seedCost: 5,
    xp: 10,
    color: "#F59E0B",
    color3d: 0xd9a02b,
    rarity: "common",
    minLevel: 1,
    visual: "wheat",
    appearChance: 1,
    stockPerDay: Infinity,
  },
  lettuce: {
    id: "lettuce",
    emoji: "🥬",
    name: "Lettuce",
    growTime: 15_000,
    price: 10,
    seedCost: 4,
    xp: 7,
    color: "#84CC16",
    color3d: 0x84cc16,
    rarity: "common",
    minLevel: 1,
    visual: "lettuce",
    appearChance: 1,
    stockPerDay: Infinity,
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
    color3d: 0xf97316,
    rarity: "common",
    minLevel: 1,
    visual: "carrot",
    appearChance: 1,
    stockPerDay: Infinity,
  },
  potato: {
    id: "potato",
    emoji: "🥔",
    name: "Potato",
    growTime: 35_000,
    price: 28,
    seedCost: 10,
    xp: 18,
    color: "#A16207",
    color3d: 0xb8860b,
    rarity: "common",
    minLevel: 2,
    visual: "potato",
    appearChance: 1,
    stockPerDay: Infinity,
  },

  // ── UNCOMMON — always in the shop, level gated ──
  corn: {
    id: "corn",
    emoji: "🌽",
    name: "Corn",
    growTime: 50_000,
    price: 45,
    seedCost: 18,
    xp: 25,
    color: "#FCD34D",
    color3d: 0xfcd34d,
    rarity: "uncommon",
    minLevel: 3,
    visual: "corn",
    appearChance: 1,
    stockPerDay: Infinity,
  },
  tomato: {
    id: "tomato",
    emoji: "🍅",
    name: "Tomato",
    growTime: 70_000,
    price: 65,
    seedCost: 25,
    xp: 32,
    color: "#EF4444",
    color3d: 0xef4444,
    rarity: "uncommon",
    minLevel: 4,
    visual: "tomato",
    appearChance: 1,
    stockPerDay: Infinity,
  },
  strawberry: {
    id: "strawberry",
    emoji: "🍓",
    name: "Strawberry",
    growTime: 90_000,
    price: 85,
    seedCost: 32,
    xp: 40,
    color: "#FB7185",
    color3d: 0xfb7185,
    rarity: "uncommon",
    minLevel: 5,
    visual: "strawberry",
    appearChance: 1,
    stockPerDay: Infinity,
  },
  sunflower: {
    id: "sunflower",
    emoji: "🌻",
    name: "Sunflower",
    growTime: 120_000,
    price: 130,
    seedCost: 45,
    xp: 55,
    color: "#EAB308",
    color3d: 0xfacc15,
    rarity: "uncommon",
    minLevel: 6,
    visual: "sunflower",
    appearChance: 1,
    stockPerDay: Infinity,
  },

  // ── RARE — 35% chance per day, stock of 3 ──
  pumpkin: {
    id: "pumpkin",
    emoji: "🎃",
    name: "Pumpkin",
    growTime: 4 * 60_000,
    price: 320,
    seedCost: 110,
    xp: 90,
    color: "#EA580C",
    color3d: 0xea580c,
    rarity: "rare",
    minLevel: 7,
    visual: "pumpkin",
    appearChance: 0.35,
    stockPerDay: 3,
  },
  watermelon: {
    id: "watermelon",
    emoji: "🍉",
    name: "Watermelon",
    growTime: 6 * 60_000,
    price: 520,
    seedCost: 170,
    xp: 120,
    color: "#16A34A",
    color3d: 0x15803d,
    rarity: "rare",
    minLevel: 8,
    visual: "watermelon",
    appearChance: 0.35,
    stockPerDay: 3,
  },
  grape: {
    id: "grape",
    emoji: "🍇",
    name: "Grape",
    growTime: 8 * 60_000,
    price: 750,
    seedCost: 240,
    xp: 150,
    color: "#7C3AED",
    color3d: 0x7c3aed,
    rarity: "rare",
    minLevel: 9,
    visual: "grape",
    appearChance: 0.35,
    stockPerDay: 3,
  },

  // ── EPIC — 15% chance per day, stock of 2 ──
  dragonfruit: {
    id: "dragonfruit",
    emoji: "🐉",
    name: "Dragonfruit",
    growTime: 12 * 60_000,
    price: 1_600,
    seedCost: 480,
    xp: 260,
    color: "#EC4899",
    color3d: 0xec4899,
    rarity: "epic",
    minLevel: 10,
    visual: "dragonfruit",
    appearChance: 0.15,
    stockPerDay: 2,
  },
  golden_wheat: {
    id: "golden_wheat",
    emoji: "✨",
    name: "Golden Wheat",
    growTime: 15 * 60_000,
    price: 2_300,
    seedCost: 700,
    xp: 320,
    color: "#FBBF24",
    color3d: 0xffd700,
    rarity: "epic",
    minLevel: 11,
    visual: "wheat",
    appearChance: 0.15,
    stockPerDay: 2,
  },

  // ── LEGENDARY — 5% chance per day, stock of 1 ──
  crystal_rose: {
    id: "crystal_rose",
    emoji: "💎",
    name: "Crystal Rose",
    growTime: 25 * 60_000,
    price: 6_000,
    seedCost: 1_800,
    xp: 700,
    color: "#22D3EE",
    color3d: 0x22d3ee,
    rarity: "legendary",
    minLevel: 12,
    visual: "crystal",
    appearChance: 0.05,
    stockPerDay: 1,
  },
  star_fruit: {
    id: "star_fruit",
    emoji: "🌟",
    name: "Star Fruit",
    growTime: 40 * 60_000,
    price: 12_000,
    seedCost: 3_500,
    xp: 1_200,
    color: "#FDE047",
    color3d: 0xfde047,
    rarity: "legendary",
    minLevel: 13,
    visual: "starfruit",
    appearChance: 0.05,
    stockPerDay: 1,
  },
};

const CROP_LIST = Object.values(CROPS).sort(
  (a, b) =>
    RARITY_META[a.rarity].order - RARITY_META[b.rarity].order ||
    a.seedCost - b.seedCost,
);

const LEVEL_THRESHOLDS = [
  0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 8000, 12000, 17500, 25000,
  35000, 50000,
];
const XP_FOR_LEVEL = (lvl: number) =>
  LEVEL_THRESHOLDS[Math.min(lvl, LEVEL_THRESHOLDS.length - 1)];

const isLimited = (c: Crop) =>
  c.rarity === "rare" || c.rarity === "epic" || c.rarity === "legendary";

function fmtTime(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

// ─── Coin Market ──────────────────────────────────────────────────────────────
// The SKU catalog + purchase flow moved to ./useCoinStore.ts (expo-iap).
// Displayed prices come localized straight from the store.

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialTiles = (): Tile[] =>
  Array.from({ length: ROWS * COLS }, (_, i) => ({
    id: i,
    state: "empty",
    watered: false,
    waterCount: 0,
  }));

/** Rolls the daily stock of rare/epic/legendary items. */
function rollDailyStock(): Partial<Record<CropId, number>> {
  const stock: Partial<Record<CropId, number>> = {};
  for (const crop of CROP_LIST) {
    if (!isLimited(crop)) continue;
    if (Math.random() < crop.appearChance) {
      stock[crop.id] = crop.stockPerDay;
    }
  }
  return stock;
}

const INITIAL_STATE: GameState = {
  tiles: initialTiles(),
  gold: 50, // ↓ from 100 — tighter economy
  xp: 0,
  level: 1,
  selectedTool: "till",
  selectedCrop: "wheat",
  day: 1,
  totalHarvested: 0,
  dailyStock: {},
  coinsPurchased: 0,
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
  | { type: "BUY_COINS"; amount: number }
  | { type: "HYDRATE"; payload: Partial<GameState> }
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
      if (state.level < crop.minLevel) return state;

      // Limited items: must have stock rolled today
      let dailyStock = state.dailyStock;
      if (isLimited(crop)) {
        const left = state.dailyStock[crop.id] ?? 0;
        if (left <= 0) return state;
        dailyStock = { ...state.dailyStock, [crop.id]: left - 1 };
      }

      const tiles = [...state.tiles];
      tiles[action.id] = {
        ...tile,
        state: "planted",
        cropId: state.selectedCrop,
        plantedAt: Date.now(),
        watered: false,
        waterCount: 0,
      };
      return { ...state, tiles, dailyStock, gold: state.gold - crop.seedCost };
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
      let changed = false;
      const tiles = state.tiles.map((t) => {
        if (t.state !== "planted" && t.state !== "growing") return t;
        const crop = CROPS[t.cropId!];
        const boost = t.waterCount > 0 ? 0.7 : 1;
        const elapsed = now - t.plantedAt!;
        const effective = elapsed / boost;
        if (effective >= crop.growTime) {
          changed = true;
          return { ...t, state: "ready" as TileState };
        }
        if (effective >= crop.growTime * 0.5 && t.state === "planted") {
          changed = true;
          return { ...t, state: "growing" as TileState, watered: false };
        }
        return t;
      });
      return changed ? { ...state, tiles } : state;
    }
    case "NEXT_DAY": {
      const tiles = state.tiles.map((t) => ({ ...t, watered: false }));
      return {
        ...state,
        tiles,
        day: state.day + 1,
        dailyStock: rollDailyStock(), // 🎲 new rare roll
      };
    }
    case "BUY_COINS":
      return {
        ...state,
        gold: state.gold + action.amount,
        coinsPurchased: state.coinsPurchased + action.amount,
      };
    case "HYDRATE": {
      // Defensive merge: new schema fields fall back to defaults
      const p = action.payload;
      return {
        ...INITIAL_STATE,
        ...p,
        tiles:
          Array.isArray(p.tiles) && p.tiles.length === ROWS * COLS
            ? (p.tiles as Tile[])
            : initialTiles(),
        dailyStock: p.dailyStock ?? rollDailyStock(),
        level: xpToLevel(p.xp ?? 0),
      };
    }
    case "RESET":
      return { ...INITIAL_STATE, dailyStock: rollDailyStock() };
    default:
      return state;
  }
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

function toPersistable(state: GameState) {
  // Everything is serializable (plantedAt is epoch ms → free offline growth)
  const {
    tiles,
    gold,
    xp,
    level,
    selectedTool,
    selectedCrop,
    day,
    totalHarvested,
    dailyStock,
    coinsPurchased,
  } = state;
  return {
    tiles,
    gold,
    xp,
    level,
    selectedTool,
    selectedCrop,
    day,
    totalHarvested,
    dailyStock,
    coinsPurchased,
  };
}

async function loadSave(): Promise<Partial<GameState> | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<GameState>) : null;
  } catch (e) {
    console.warn("[FarmGame] Failed to load save:", e);
    return null;
  }
}

// ─── Toolbar data ─────────────────────────────────────────────────────────────

const TOOLS: { id: ToolId; emoji: string; label: string; color: string }[] = [
  { id: "till", emoji: "⛏️", label: "Till", color: "#78716C" },
  { id: "seed", emoji: "🌱", label: "Plant", color: "#22C55E" },
  { id: "water", emoji: "💧", label: "Water", color: "#3B82F6" },
  { id: "harvest", emoji: "🧺", label: "Harvest", color: "#F59E0B" },
];

// ─── Ground / grass colors ────────────────────────────────────────────────────

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

function tileStateKey(tile: Tile): TileState | "watered" {
  if ((tile.state === "planted" || tile.state === "growing") && tile.watered)
    return "watered"; // dark/moist soil
  return tile.state;
}

// ─── Realistic procedural soil ────────────────────────────────────────────────
// No DOM/Canvas in React Native, so soil maps are baked into DataTextures from a
// value-noise heightfield. PBR (MeshStandardMaterial) + a normal map gives the
// dirt real relief; per-state tints/roughness reuse one shared texture set.

/** Tiny fractal value-noise. Deterministic per seed. */
function makeNoise2D(seed = 1337) {
  const rand = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
    return n - Math.floor(n);
  };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const value = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = smooth(x - xi);
    const v = smooth(y - yi);
    return lerp(
      lerp(rand(xi, yi), rand(xi + 1, yi), u),
      lerp(rand(xi, yi + 1), rand(xi + 1, yi + 1), u),
      v,
    );
  };
  return (x: number, y: number, octaves = 4) => {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += value(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  };
}

const mix3 = (a: number[], b: number[], t: number) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Works on both modern three (colorSpace) and older expo-three (encoding). */
function setColorSpace(tex: THREE.Texture, srgb: boolean) {
  const T: any = THREE;
  if ("colorSpace" in tex) {
    (tex as any).colorSpace = srgb ? T.SRGBColorSpace : T.LinearSRGBColorSpace;
  } else {
    (tex as any).encoding = srgb ? T.sRGBEncoding : T.LinearEncoding;
  }
}

let _soilTex: { color: THREE.DataTexture; normal: THREE.DataTexture } | null =
  null;

/** Bakes the soil color map (sRGB) + normal map (linear). 128 px = POT → WebGL1. */
function getSoilTextures() {
  if (_soilTex) return _soilTex;
  const size = 128;
  const noise = makeNoise2D(20240607);
  const height = new Float32Array(size * size);
  const pebble = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const nx = (x / size) * 6;
      const ny = (y / size) * 6;
      const base = noise(nx, ny, 5);
      const p = noise(nx * 3.7 + 40, ny * 3.7 + 40, 2);
      const peb = p > 0.8 ? (p - 0.8) / 0.2 : 0; // small stones 0..1
      height[i] = Math.min(1, base * 0.85 + peb * 0.5);
      pebble[i] = peb;
    }
  }

  // Color — lightish base, the material multiplies a per-state tint over it
  const dark = [120, 86, 56];
  const midC = [165, 124, 84];
  const light = [205, 170, 126];
  const stone = [150, 146, 138];
  const color = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const h = height[i];
    let c =
      h < 0.5 ? mix3(dark, midC, h / 0.5) : mix3(midC, light, (h - 0.5) / 0.5);
    if (pebble[i] > 0.15) c = mix3(c, stone, Math.min(1, pebble[i]));
    color[i * 4] = c[0];
    color[i * 4 + 1] = c[1];
    color[i * 4 + 2] = c[2];
    color[i * 4 + 3] = 255;
  }

  // Normal map from the heightfield (central difference, wrapped for tiling)
  const idx = (x: number, y: number) =>
    (((y % size) + size) % size) * size + (((x % size) + size) % size);
  const strength = 2.6;
  const normal = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      let nx = (height[idx(x - 1, y)] - height[idx(x + 1, y)]) * strength;
      let ny = (height[idx(x, y - 1)] - height[idx(x, y + 1)]) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      normal[i * 4] = (nx * 0.5 + 0.5) * 255;
      normal[i * 4 + 1] = (ny * 0.5 + 0.5) * 255;
      normal[i * 4 + 2] = (nz * 0.5 + 0.5) * 255;
      normal[i * 4 + 3] = 255;
    }
  }

  const colorTex = new THREE.DataTexture(color, size, size, THREE.RGBAFormat);
  setColorSpace(colorTex, true);
  const normalTex = new THREE.DataTexture(normal, size, size, THREE.RGBAFormat);
  setColorSpace(normalTex, false);
  for (const t of [colorTex, normalTex]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
  }
  _soilTex = { color: colorTex, normal: normalTex };
  return _soilTex;
}

/** Subdivided + displaced top surface. Furrowed variant adds plow rows. */
let _flatGeo: THREE.BufferGeometry | null = null;
let _furrowGeo: THREE.BufferGeometry | null = null;

function buildSoilSurfaceGeo(furrowed: boolean): THREE.BufferGeometry {
  const seg = 22;
  const geo = new THREE.PlaneGeometry(TILE_W, TILE_W, seg, seg);
  geo.rotateX(-Math.PI / 2); // lie flat, normals up
  const noise = makeNoise2D(furrowed ? 412 : 77);
  const pos = geo.attributes.position;
  const half = TILE_W / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const u = x / TILE_W + 0.5;
    const v = z / TILE_W + 0.5;
    let h = (noise(u * 5, v * 5, 3) - 0.5) * 0.05; // fine grain
    if (furrowed) h += Math.sin(u * Math.PI * 2 * 4) * 0.03; // 4 plow rows
    // taper height to ~0 at edges so neighbouring tiles meet cleanly
    const fall =
      1 - Math.pow(Math.max(Math.abs(x) / half, Math.abs(z) / half), 6);
    pos.setY(i, h * fall);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

const getSurfaceGeo = (furrowed: boolean) =>
  furrowed
    ? (_furrowGeo ??= buildSoilSurfaceGeo(true))
    : (_flatGeo ??= buildSoilSurfaceGeo(false));

/** Per-state look. surf/box = tint multiplied over the texture; low rough = wet. */
const SOIL_LOOK: Record<
  TileState | "watered",
  { surf: number; box: number; rough: number; normal: number }
> = {
  empty: { surf: 0xb39a73, box: 0x927856, rough: 1.0, normal: 0.55 },
  tilled: { surf: 0x86603c, box: 0x6a4c2e, rough: 0.96, normal: 1.0 },
  planted: { surf: 0x7d5836, box: 0x624628, rough: 0.96, normal: 1.0 },
  growing: { surf: 0x6f4d2f, box: 0x583f24, rough: 0.93, normal: 1.0 },
  watered: { surf: 0x4a3422, box: 0x3a2a1d, rough: 0.42, normal: 0.9 }, // moist
  ready: { surf: 0x86603c, box: 0x6a4c2e, rough: 0.96, normal: 1.0 },
};

const HOVER_EMISSIVE = 0x2f6b1e;

/** Fresh material pair per tile (textures shared) → per-tile hover glow. */
function createSoilMaterials() {
  const { color, normal } = getSoilTextures();
  const surfMat = new THREE.MeshStandardMaterial({
    map: color,
    normalMap: normal,
    roughness: 1,
    metalness: 0,
    normalScale: new THREE.Vector2(1, 1),
  });
  const boxMat = new THREE.MeshStandardMaterial({
    map: color,
    normalMap: normal,
    roughness: 1,
    metalness: 0,
    normalScale: new THREE.Vector2(0.5, 0.5),
  });
  return { surfMat, boxMat };
}

/** Mutates the tile's own materials/geometry — zero allocation after init. */
function applyTileMat(mesh: THREE.Mesh, tile: Tile, hovered = false) {
  const surf = mesh.userData.surface as THREE.Mesh | undefined;
  const surfMat = mesh.userData.surfMat as
    | THREE.MeshStandardMaterial
    | undefined;
  const boxMat = mesh.userData.boxMat as THREE.MeshStandardMaterial | undefined;
  if (!surf || !surfMat || !boxMat) return;

  const key = tileStateKey(tile);
  const look = SOIL_LOOK[key];

  surfMat.color.setHex(look.surf);
  surfMat.roughness = look.rough;
  surfMat.normalScale.set(look.normal, look.normal);
  boxMat.color.setHex(look.box);
  boxMat.roughness = Math.min(1, look.rough + 0.05);

  const wantGeo = getSurfaceGeo(key !== "empty"); // worked soil gets furrows
  if (surf.geometry !== wantGeo) surf.geometry = wantGeo;

  surfMat.emissive.setHex(hovered ? HOVER_EMISSIVE : 0x000000);
  surfMat.emissiveIntensity = hovered ? 0.45 : 0;
}

// ─── Procedural plant meshes (realistic, per-crop) ───────────────────────────
// Cada cultura tem um modelo próprio e reconhecível (3 estágios).
// Geometrias e materiais ficam em nível de módulo → ~zero custo por tile.
// Os materiais respondem às mesmas luzes (Hemisphere + Directional) do solo PBR.

// ── Material caches ───────────────────────────────────────────────────────────

const MAT_LAMBERT = new Map<number, THREE.MeshLambertMaterial>();
/** Material fosco (folhas, caules, terra). */
function lam(color: number): THREE.MeshLambertMaterial {
  let m = MAT_LAMBERT.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color });
    MAT_LAMBERT.set(color, m);
  }
  return m;
}

const MAT_GLOSSY = new Map<number, THREE.MeshPhongMaterial>();
/** Material levemente brilhante para frutas — dá um specular suave e "molhado". */
function glossy(color: number, shininess = 55): THREE.MeshPhongMaterial {
  const key = color * 1000 + shininess;
  let m = MAT_GLOSSY.get(key);
  if (!m) {
    m = new THREE.MeshPhongMaterial({ color, shininess, specular: 0x2a2a2a });
    MAT_GLOSSY.set(key, m);
  }
  return m;
}

// Cristal lendário — auto-iluminado
const CRYSTAL_MAT = new THREE.MeshPhongMaterial({
  color: 0x67e8f9,
  emissive: 0x0891b2,
  shininess: 100,
  transparent: true,
  opacity: 0.9,
});

// Paleta de verdes reaproveitada
const FOLIAGE = {
  sprout: 0x86efac,
  stem: 0x2e7d32,
  stemLight: 0x43a047,
  leaf: 0x43a047,
  leafLight: 0x66bb6a,
  leafDark: 0x1b5e20,
};

// ── Geometrias compartilhadas ─────────────────────────────────────────────────

const GEO = {
  // genéricas / estágios
  sproutLeaf: new THREE.ConeGeometry(0.05, 0.2, 5),
  youngStem: new THREE.CylinderGeometry(0.028, 0.042, 0.34, 6),
  youngLeaf: new THREE.ConeGeometry(0.07, 0.2, 5),
  leafBlade: new THREE.ConeGeometry(0.08, 0.22, 5),
  bush: new THREE.SphereGeometry(0.22, 10, 9),
  frondStem: new THREE.CylinderGeometry(0.01, 0.014, 0.26, 4),

  // trigo
  wheatStalk: new THREE.CylinderGeometry(0.012, 0.02, 0.5, 5),
  wheatHead: new THREE.SphereGeometry(0.05, 6, 8),
  wheatAwn: new THREE.ConeGeometry(0.006, 0.12, 4),

  // alface (folhas em concha)
  leafCup: new THREE.SphereGeometry(
    0.2,
    10,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.55,
  ),

  // cenoura
  carrotRoot: new THREE.ConeGeometry(0.12, 0.22, 10),
  frondLeaf: new THREE.ConeGeometry(0.03, 0.12, 4),

  // batata
  tuber: new THREE.SphereGeometry(0.12, 8, 7),

  // milho
  cornStalk: new THREE.CylinderGeometry(0.035, 0.05, 0.64, 6),
  cob: new THREE.CylinderGeometry(0.058, 0.045, 0.26, 8),
  cobTip: new THREE.ConeGeometry(0.045, 0.1, 8),
  husk: new THREE.ConeGeometry(0.07, 0.3, 5),
  tassel: new THREE.ConeGeometry(0.01, 0.12, 4),
  cornLeaf: new THREE.ConeGeometry(0.06, 0.5, 5),

  // tomate / fruta redonda genérica
  roundFruit: new THREE.SphereGeometry(0.1, 12, 10),
  calyx: new THREE.ConeGeometry(0.05, 0.04, 5),

  // morango (cone, ponta pra baixo)
  berryCone: new THREE.ConeGeometry(0.075, 0.16, 8),
  flowerPetal: new THREE.SphereGeometry(0.03, 6, 6),
  flowerCore: new THREE.SphereGeometry(0.018, 6, 6),

  // girassol
  sunStem: new THREE.CylinderGeometry(0.03, 0.045, 0.66, 6),
  sunDisc: new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16),
  sunPetal: new THREE.ConeGeometry(0.045, 0.16, 4),
  sunSeed: new THREE.SphereGeometry(0.1, 12, 8),

  // abóbora (lobos)
  pumpkinLobe: new THREE.SphereGeometry(0.13, 10, 8),
  pumpkinStem: new THREE.CylinderGeometry(0.025, 0.035, 0.12, 6),

  // melancia
  melonBody: new THREE.SphereGeometry(0.24, 14, 12),
  melonStripe: new THREE.TorusGeometry(0.242, 0.012, 6, 22),
  vine: new THREE.TorusGeometry(0.05, 0.008, 5, 10, Math.PI * 1.4),

  // uva
  grapeBall: new THREE.SphereGeometry(0.05, 8, 7),
  grapeLeaf: new THREE.SphereGeometry(0.12, 8, 6),

  // dragonfruit
  dragonBody: new THREE.SphereGeometry(0.16, 12, 12),
  dragonFin: new THREE.ConeGeometry(0.05, 0.2, 4),

  // cristal
  crystalShard: new THREE.ConeGeometry(0.06, 0.4, 6),
  crystalCore: new THREE.OctahedronGeometry(0.1),
};

/** Carambola: estrela de 5 pontas extrudada (a seção transversal é o "look"). */
function makeStarGeo(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const spikes = 5;
  const outer = 0.13;
  const inner = 0.05;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 1,
    steps: 1,
  });
  geo.center();
  return geo;
}
const STAR_GEO = makeStarGeo();

// ── Helper de mesh ─────────────────────────────────────────────────────────────

function pm(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ── Estágio 1 — broto (igual para todos) ───────────────────────────────────────

function buildSprout(): THREE.Group {
  const g = new THREE.Group();
  const mat = lam(FOLIAGE.sprout);
  const l1 = pm(GEO.sproutLeaf, mat);
  l1.position.set(0.035, 0.1, 0);
  l1.rotation.z = -0.35;
  const l2 = pm(GEO.sproutLeaf, mat);
  l2.position.set(-0.035, 0.08, 0);
  l2.rotation.z = 0.35;
  g.add(l1, l2);
  return g;
}

// ── Estágio 2 — planta jovem (caule + folhas, com botão da cor da fruta) ───────

function buildYoung(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const stem = pm(GEO.youngStem, lam(FOLIAGE.stem));
  stem.position.y = 0.17;
  g.add(stem);
  for (let i = 0; i < 3; i++) {
    const leaf = pm(GEO.youngLeaf, lam(FOLIAGE.leaf));
    const pivot = new THREE.Group();
    leaf.position.set(0.1, 0, 0);
    leaf.rotation.z = -1.0;
    pivot.add(leaf);
    pivot.position.y = 0.13 + i * 0.08;
    pivot.rotation.y = i * ((Math.PI * 2) / 3);
    g.add(pivot);
  }
  // botãozinho prenunciando a cor da colheita
  const bud = pm(GEO.grapeBall, lam(crop.color3d));
  bud.scale.setScalar(0.7);
  bud.position.y = 0.36;
  g.add(bud);
  return g;
}

// ── Estágio 3 — builders por cultura ───────────────────────────────────────────

function matWheat(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const stalkMat = lam(0xbfa05a);
  const golden = crop.id === "golden_wheat";
  const headMat = golden ? glossy(0xffe066, 90) : lam(crop.color3d);
  const positions: [number, number][] = [
    [0, 0],
    [0.1, 0.05],
    [-0.1, 0.04],
    [0.06, -0.1],
    [-0.07, -0.09],
    [0.12, -0.04],
  ];
  positions.forEach(([x, z], i) => {
    const lean = (i % 2 ? 1 : -1) * 0.08;
    const stalk = pm(GEO.wheatStalk, stalkMat);
    stalk.position.set(x, 0.25, z);
    stalk.rotation.z = lean;
    g.add(stalk);

    const head = pm(GEO.wheatHead, headMat);
    head.scale.set(0.7, 1.9, 0.7);
    head.position.set(x + lean * 0.4, 0.56, z);
    head.rotation.z = lean;
    g.add(head);

    for (let a = -1; a <= 1; a += 2) {
      const awn = pm(GEO.wheatAwn, stalkMat);
      awn.position.set(x + lean * 0.4 + a * 0.02, 0.66, z);
      awn.rotation.z = lean + a * 0.2;
      g.add(awn);
    }
  });
  return g;
}

function matLettuce(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const ring = (
    count: number,
    mat: THREE.Material,
    radius: number,
    scale: number,
    tilt: number,
    y: number,
    phase = 0,
  ) => {
    for (let i = 0; i < count; i++) {
      const cup = pm(GEO.leafCup, mat);
      cup.scale.set(scale, scale * 0.7, scale);
      const a = (i / count) * Math.PI * 2 + phase;
      cup.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      cup.rotation.z = Math.cos(a) * tilt;
      cup.rotation.x = -Math.sin(a) * tilt;
      g.add(cup);
    }
  };
  ring(5, lam(FOLIAGE.leafDark), 0.12, 1.05, 0.6, 0.08);
  ring(5, lam(crop.color3d), 0.07, 0.8, 0.35, 0.12, 0.4);
  const core = pm(GEO.leafCup, lam(0xbef264));
  core.scale.set(0.55, 0.6, 0.55);
  core.position.y = 0.14;
  g.add(core);
  return g;
}

function matCarrot(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  // "ombro" laranja saindo da terra (ponta enterrada)
  const root = pm(GEO.carrotRoot, glossy(crop.color3d, 30));
  root.scale.set(1, 0.7, 1);
  root.position.y = 0.05;
  g.add(root);
  // folhagem em leque (penacho)
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    const stem = pm(GEO.frondStem, lam(FOLIAGE.leafDark));
    stem.position.y = 0.18;
    pivot.add(stem);
    for (let j = 0; j < 3; j++) {
      const lf = pm(GEO.frondLeaf, lam(FOLIAGE.leafLight));
      lf.position.set(0.03, 0.12 + j * 0.07, 0);
      lf.rotation.z = -0.8;
      pivot.add(lf);
    }
    pivot.rotation.y = i * (Math.PI / 3);
    pivot.rotation.x = 0.18;
    g.add(pivot);
  }
  return g;
}

function matPotato(_crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const leafMat = lam(FOLIAGE.leaf);
  for (let i = 0; i < 4; i++) {
    const lf = pm(GEO.leafBlade, leafMat);
    const a = i * (Math.PI / 2) + 0.4;
    lf.position.set(Math.cos(a) * 0.06, 0.18, Math.sin(a) * 0.06);
    lf.rotation.z = -0.6;
    lf.rotation.y = a;
    g.add(lf);
  }
  const top = pm(GEO.bush, leafMat);
  top.scale.set(0.7, 0.55, 0.7);
  top.position.y = 0.2;
  g.add(top);
  // tubérculos marrons visíveis na terra
  const tuberMat = glossy(0xb98a55, 18);
  const tpos: [number, number, number][] = [
    [0.13, 0.04, 0.05],
    [-0.1, 0.03, 0.1],
    [0.02, 0.03, -0.13],
  ];
  tpos.forEach(([x, y, z], i) => {
    const t = pm(GEO.tuber, tuberMat);
    t.scale.set(1, 0.8, 1.25);
    t.position.set(x, y, z);
    t.rotation.y = i;
    g.add(t);
  });
  return g;
}

function matCorn(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const stalk = pm(GEO.cornStalk, lam(0x4d7c0f));
  stalk.position.y = 0.32;
  g.add(stalk);
  for (let i = 0; i < 4; i++) {
    const lf = pm(GEO.cornLeaf, lam(FOLIAGE.leaf));
    lf.scale.set(0.5, 1, 0.3);
    lf.position.set(0, 0.3 + i * 0.08, 0);
    lf.rotation.z = i % 2 ? 1.2 : -1.2;
    lf.rotation.y = i * 1.3;
    g.add(lf);
  }
  const cobMat = glossy(crop.color3d, 40);
  const cob = pm(GEO.cob, cobMat);
  cob.position.set(0.09, 0.34, 0.02);
  cob.rotation.z = -0.18;
  g.add(cob);
  const tip = pm(GEO.cobTip, cobMat);
  tip.position.set(0.12, 0.47, 0.02);
  tip.rotation.z = -0.18;
  g.add(tip);
  const husk = pm(GEO.husk, lam(FOLIAGE.leafLight));
  husk.scale.set(0.7, 1, 0.7);
  husk.position.set(0.07, 0.3, 0.02);
  husk.rotation.z = -0.1;
  g.add(husk);
  for (let i = 0; i < 3; i++) {
    const t = pm(GEO.tassel, lam(0xd9c27a));
    t.position.set((i - 1) * 0.02, 0.66, 0);
    t.rotation.z = (i - 1) * 0.25;
    g.add(t);
  }
  return g;
}

function matTomato(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const bush = pm(GEO.bush, lam(FOLIAGE.leafDark));
  bush.scale.set(1, 0.7, 1);
  bush.position.y = 0.16;
  g.add(bush);
  for (let i = 0; i < 3; i++) {
    const lf = pm(GEO.leafBlade, lam(FOLIAGE.leaf));
    const a = i * 2.1;
    lf.position.set(Math.cos(a) * 0.18, 0.22, Math.sin(a) * 0.18);
    lf.rotation.z = -0.9;
    lf.rotation.y = a;
    g.add(lf);
  }
  const fruitMat = glossy(crop.color3d, 75);
  const fpos: [number, number, number][] = [
    [0.15, 0.18, 0.08],
    [-0.13, 0.12, 0.12],
    [0.0, 0.26, -0.14],
    [0.08, 0.1, -0.05],
  ];
  fpos.forEach(([x, y, z]) => {
    const f = pm(GEO.roundFruit, fruitMat);
    f.scale.set(1, 0.85, 1);
    f.position.set(x, y, z);
    g.add(f);
    const cx = pm(GEO.calyx, lam(FOLIAGE.stem));
    cx.position.set(x, y + 0.09, z);
    g.add(cx);
  });
  return g;
}

function matStrawberry(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const lf = pm(GEO.bush, lam(FOLIAGE.leaf));
    lf.scale.set(0.45, 0.18, 0.45);
    const a = i * ((Math.PI * 2) / 5);
    lf.position.set(Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.14);
    g.add(lf);
  }
  const berryMat = glossy(crop.color3d, 65);
  const bpos: [number, number, number][] = [
    [0.1, 0.1, 0.06],
    [-0.09, 0.09, -0.05],
    [0.02, 0.12, -0.12],
  ];
  bpos.forEach(([x, y, z]) => {
    const b = pm(GEO.berryCone, berryMat);
    b.rotation.x = Math.PI; // ponta pra baixo
    b.position.set(x, y, z);
    g.add(b);
    const crown = pm(GEO.calyx, lam(FOLIAGE.leafDark));
    crown.scale.set(1.4, 1, 1.4);
    crown.position.set(x, y + 0.09, z);
    g.add(crown);
  });
  // florzinha branca
  const fc = pm(GEO.flowerCore, lam(0xfde047));
  fc.position.set(-0.02, 0.13, 0.1);
  g.add(fc);
  for (let i = 0; i < 5; i++) {
    const p = pm(GEO.flowerPetal, lam(0xffffff));
    const a = i * ((Math.PI * 2) / 5);
    p.scale.set(1, 0.5, 1);
    p.position.set(
      -0.02 + Math.cos(a) * 0.035,
      0.13,
      0.1 + Math.sin(a) * 0.035,
    );
    g.add(p);
  }
  return g;
}

function matSunflower(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const stem = pm(GEO.sunStem, lam(FOLIAGE.stem));
  stem.position.y = 0.33;
  g.add(stem);
  for (let i = 0; i < 2; i++) {
    const lf = pm(GEO.leafBlade, lam(FOLIAGE.leaf));
    lf.scale.set(1, 1.1, 0.5);
    lf.position.set(i ? 0.1 : -0.1, 0.3, 0);
    lf.rotation.z = i ? -1.1 : 1.1;
    g.add(lf);
  }
  // cabeça da flor encarando pra cima (câmera fica no alto)
  const head = new THREE.Group();
  const petalCount = 12;
  for (let i = 0; i < petalCount; i++) {
    const a = (i / petalCount) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.rotation.y = a;
    const petal = pm(GEO.sunPetal, lam(crop.color3d));
    petal.rotation.z = -Math.PI / 2; // deita a pétala apontando pra fora
    petal.scale.set(1, 1, 0.5);
    petal.position.set(0.17, 0, 0);
    pivot.add(petal);
    head.add(pivot);
  }
  const disc = pm(GEO.sunDisc, lam(0x5b3a1a));
  disc.position.y = 0.02;
  head.add(disc);
  const seeds = pm(GEO.sunSeed, lam(0x3b2410));
  seeds.scale.set(1, 0.3, 1);
  seeds.position.y = 0.05;
  head.add(seeds);
  head.position.set(0, 0.66, 0.02);
  head.rotation.x = -0.12; // leve inclinação na direção da câmera
  g.add(head);
  return g;
}

function matStarfruit(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const lf = pm(GEO.leafBlade, lam(FOLIAGE.leaf));
    const a = i * (Math.PI / 2);
    lf.scale.set(0.7, 0.8, 0.4);
    lf.position.set(Math.cos(a) * 0.1, 0.06, Math.sin(a) * 0.1);
    lf.rotation.z = -0.8;
    lf.rotation.y = a;
    g.add(lf);
  }
  const fruitMat = glossy(crop.color3d, 75);
  const star = pm(STAR_GEO, fruitMat);
  star.scale.set(1, 1, 0.95);
  star.position.set(0.04, 0.28, 0);
  star.rotation.x = Math.PI / 2; // eixo longo na vertical → estrela vista de cima
  star.rotation.z = 0.25;
  star.rotation.y = 0.3;
  g.add(star);
  const star2 = pm(STAR_GEO, fruitMat);
  star2.scale.setScalar(0.55);
  star2.position.set(-0.12, 0.14, 0.08);
  star2.rotation.x = Math.PI / 2;
  star2.rotation.z = -0.4;
  g.add(star2);
  return g;
}

function matPumpkin(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const body = glossy(crop.color3d, 35);
  // lobos formam as "costelas" da abóbora
  const center = pm(GEO.pumpkinLobe, body);
  center.scale.set(1.5, 1.0, 1.5);
  center.position.y = 0.13;
  g.add(center);
  const lobes = 6;
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const lobe = pm(GEO.pumpkinLobe, body);
    lobe.scale.set(0.55, 1.05, 1.0);
    lobe.position.set(Math.cos(a) * 0.13, 0.13, Math.sin(a) * 0.13);
    lobe.rotation.y = -a;
    g.add(lobe);
  }
  const stem = pm(GEO.pumpkinStem, lam(0x4d7c0f));
  stem.position.y = 0.27;
  stem.rotation.z = 0.2;
  g.add(stem);
  return g;
}

function matWatermelon(_crop: Crop): THREE.Group {
  const g = new THREE.Group();
  // casca verde-clara (cor fixa: o color3d do catálogo é escuro demais p/ casca)
  const body = pm(GEO.melonBody, glossy(0x4d9e4f, 28));
  body.scale.set(1.05, 0.92, 1.05);
  body.position.y = 0.2;
  g.add(body);
  // listras escuras (anéis verticais; metade interna some dentro do corpo)
  const stripeMat = lam(0x14532d);
  for (let i = 0; i < 6; i++) {
    const stripe = pm(GEO.melonStripe, stripeMat);
    stripe.scale.set(1.05, 0.92, 1.05);
    stripe.position.y = 0.2;
    stripe.rotation.y = (i / 6) * Math.PI;
    g.add(stripe);
  }
  const vine = pm(GEO.vine, lam(FOLIAGE.stem));
  vine.position.set(0.05, 0.42, 0);
  vine.rotation.x = 0.6;
  g.add(vine);
  return g;
}

function matGrape(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const grapeMat = glossy(crop.color3d, 75);
  // cacho afunilado: linhas largas em cima, ponta embaixo
  const rows = [
    { y: 0.34, n: 4, r: 0.1 },
    { y: 0.27, n: 4, r: 0.12 },
    { y: 0.2, n: 3, r: 0.09 },
    { y: 0.13, n: 2, r: 0.06 },
    { y: 0.07, n: 1, r: 0 },
  ];
  rows.forEach((row, ri) => {
    for (let i = 0; i < row.n; i++) {
      const a = (i / row.n) * Math.PI * 2 + ri * 0.6;
      const b = pm(GEO.grapeBall, grapeMat);
      b.position.set(Math.cos(a) * row.r, row.y, Math.sin(a) * row.r);
      g.add(b);
    }
  });
  const stem = pm(GEO.frondStem, lam(0x6b4423));
  stem.scale.set(1, 0.5, 1);
  stem.position.y = 0.4;
  g.add(stem);
  const leaf = pm(GEO.grapeLeaf, lam(FOLIAGE.leaf));
  leaf.scale.set(1.2, 0.3, 1);
  leaf.position.set(0.08, 0.43, 0);
  g.add(leaf);
  return g;
}

function matDragonfruit(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const body = pm(GEO.dragonBody, glossy(crop.color3d, 60));
  body.scale.set(0.85, 1.15, 0.85);
  body.position.y = 0.22;
  g.add(body);
  // escamas/abas verdes ao redor (o "look" da pitaya)
  const finMat = lam(0x4ade80);
  const finCount = 7;
  for (let i = 0; i < finCount; i++) {
    const a = (i / finCount) * Math.PI * 2;
    const yy = 0.16 + (i % 3) * 0.07;
    const fin = pm(GEO.dragonFin, finMat);
    fin.scale.set(0.8, 1, 0.5);
    fin.position.set(Math.cos(a) * 0.16, yy, Math.sin(a) * 0.16);
    fin.rotation.z = -1.1;
    fin.rotation.y = -a;
    fin.rotation.x = 0.3;
    g.add(fin);
  }
  // coroa no topo
  for (let i = 0; i < 4; i++) {
    const a = i * (Math.PI / 2);
    const fin = pm(GEO.dragonFin, finMat);
    fin.scale.set(0.6, 0.9, 0.4);
    fin.position.set(Math.cos(a) * 0.05, 0.4, Math.sin(a) * 0.05);
    fin.rotation.z = Math.cos(a) * 0.5;
    fin.rotation.x = -Math.sin(a) * 0.5;
    g.add(fin);
  }
  return g;
}

function matCrystal(_crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const core = pm(GEO.crystalCore, CRYSTAL_MAT);
  core.position.y = 0.16;
  core.rotation.y = 0.4;
  g.add(core);
  const shards = 6;
  for (let i = 0; i < shards; i++) {
    const a = (i / shards) * Math.PI * 2;
    const shard = pm(GEO.crystalShard, CRYSTAL_MAT);
    shard.scale.setScalar(0.6 + (i % 2) * 0.4);
    shard.position.set(Math.cos(a) * 0.12, 0.14, Math.sin(a) * 0.12);
    shard.rotation.z = Math.cos(a) * 0.5;
    shard.rotation.x = -Math.sin(a) * 0.5;
    g.add(shard);
  }
  const tall = pm(GEO.crystalShard, CRYSTAL_MAT);
  tall.scale.setScalar(1.2);
  tall.position.y = 0.32;
  g.add(tall);
  return g;
}

// ── Registro: PlantVisual → builder ────────────────────────────────────────────

const VISUAL_BUILDERS: Record<PlantVisual, (crop: Crop) => THREE.Group> = {
  wheat: matWheat,
  lettuce: matLettuce,
  carrot: matCarrot,
  potato: matPotato,
  corn: matCorn,
  tomato: matTomato,
  strawberry: matStrawberry,
  sunflower: matSunflower,
  starfruit: matStarfruit,
  pumpkin: matPumpkin,
  watermelon: matWatermelon,
  grape: matGrape,
  dragonfruit: matDragonfruit,
  crystal: matCrystal,
};

function buildMature(crop: Crop): THREE.Group {
  return (VISUAL_BUILDERS[crop.visual] ?? matTomato)(crop);
}

/** Cache key: we only rebuild the mesh when the stage changes */
function plantKey(t: Tile): string | null {
  if (t.state === "planted") return "planted";
  if (t.state === "growing") return "growing";
  if (t.state === "ready" && t.cropId) return `ready:${t.cropId}`;
  return null;
}

function buildPlant(t: Tile): THREE.Group | null {
  if (t.state === "planted") return buildSprout();
  if (t.state === "growing" && t.cropId) return buildYoung(CROPS[t.cropId]);
  if (t.state === "growing") return buildSprout();
  if (t.state === "ready" && t.cropId) return buildMature(CROPS[t.cropId]);
  return null;
}

// ─── Grass field builder ──────────────────────────────────────────────────────

function buildGrassField(scene: THREE.Scene) {
  const groundSize = FIELD_HALF * 2 + GRASS_BORDER * 2;
  const groundGeo = new THREE.BoxGeometry(groundSize, 0.14, groundSize);
  const groundMat = new THREE.MeshStandardMaterial({
    color: GRASS_GROUND,
    roughness: 1,
    metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.set(0, -TILE_H / 2 - 0.07, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  const tuftGeo = new THREE.ConeGeometry(0.07, 0.22, 5);
  const tuftMats = GRASS_TUFTS.map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }),
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
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.9,
  });
  const headGeo = new THREE.SphereGeometry(0.05, 8, 8);

  for (let i = 0; i < 18; i++) {
    const [x, z] = randomBorderPos();
    const flower = new THREE.Group();
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.08;
    const head = new THREE.Mesh(
      headGeo,
      new THREE.MeshStandardMaterial({
        color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
        roughness: 0.7,
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

const GoldCounter: React.FC<{ gold: number; onPress?: () => void }> = ({
  gold,
  onPress,
}) => {
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
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={s.goldChip}>
        <Text style={s.goldIcon}>💰</Text>
        <Text style={s.goldTxt}>{display.toLocaleString()}</Text>
        {onPress && (
          <View style={s.goldPlus}>
            <Text style={s.goldPlusTxt}>+</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
  level: number;
  selectedCrop: CropId;
  dailyStock: Partial<Record<CropId, number>>;
  onSelectCrop: (id: CropId) => void;
  onOpenMarket: () => void;
  onClose: () => void;
}> = ({
  visible,
  gold,
  level,
  selectedCrop,
  dailyStock,
  onSelectCrop,
  onOpenMarket,
  onClose,
}) => {
  const slide = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [visible]);

  // Group by rarity to render sections
  const sections = useMemo(() => {
    const map = new Map<Rarity, Crop[]>();
    CROP_LIST.forEach((c) => {
      const arr = map.get(c.rarity) ?? [];
      arr.push(c);
      map.set(c.rarity, arr);
    });
    return [...map.entries()];
  }, []);

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
          <Pressable style={{ flexShrink: 1 }}>
            <View style={s.shopHandle} />
            <View style={s.shopHeader}>
              <View>
                <Text style={s.shopTitle}>🌿 Seed Shop</Text>
                <Text style={s.shopGold}>💰 {gold.toLocaleString()} coins</Text>
              </View>
              <TouchableOpacity
                style={s.getCoinsBtn}
                onPress={onOpenMarket}
                activeOpacity={0.85}
              >
                <Text style={s.getCoinsTxt}>+ Coins</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexGrow: 0 }}
              showsVerticalScrollIndicator={false}
            >
              {sections.map(([rarity, crops]) => {
                const meta = RARITY_META[rarity];
                return (
                  <View key={rarity}>
                    <View style={s.raritySection}>
                      <View
                        style={[s.rarityDot, { backgroundColor: meta.color }]}
                      />
                      <Text style={[s.rarityTitle, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                      {rarity !== "common" && rarity !== "uncommon" && (
                        <Text style={s.rarityHint}>· daily rotation</Text>
                      )}
                    </View>

                    {crops.map((crop) => {
                      const limited = isLimited(crop);
                      const stock = limited
                        ? (dailyStock[crop.id] ?? 0)
                        : Infinity;
                      const inShopToday =
                        !limited || dailyStock[crop.id] !== undefined;
                      const locked = level < crop.minLevel;
                      const soldOut = limited && inShopToday && stock <= 0;
                      const canAfford = gold >= crop.seedCost;
                      const selected = selectedCrop === crop.id;
                      const buyable =
                        !locked && inShopToday && !soldOut && canAfford;

                      // Mystery slot: rare item not rolled today
                      if (limited && !inShopToday) {
                        return (
                          <View key={crop.id} style={[s.cropRow, s.mysteryRow]}>
                            <Text style={s.cropEm}>❔</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={s.mysteryName}>
                                Mystery {meta.label}
                              </Text>
                              <Text style={s.cropDet}>
                                Might appear tomorrow… check back daily! 🎲
                              </Text>
                            </View>
                          </View>
                        );
                      }

                      return (
                        <TouchableOpacity
                          key={crop.id}
                          style={[
                            s.cropRow,
                            selected && s.cropRowSel,
                            !buyable && s.cropRowDim,
                            limited && {
                              borderColor: selected
                                ? meta.color
                                : `${crop.color}55`,
                            },
                          ]}
                          onPress={() => {
                            if (!canAfford) {
                              // No coins → push to the market 💸
                              onOpenMarket();
                              return;
                            }
                            onSelectCrop(crop.id);
                            onClose();
                          }}
                          disabled={locked || soldOut}
                          activeOpacity={0.75}
                        >
                          <Text style={s.cropEm}>{crop.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <View style={s.cropNameRow}>
                              <Text style={s.cropName}>{crop.name}</Text>
                              {limited && !soldOut && (
                                <View
                                  style={[
                                    s.stockBadge,
                                    { backgroundColor: meta.color },
                                  ]}
                                >
                                  <Text style={s.stockBadgeTxt}>
                                    {stock} today
                                  </Text>
                                </View>
                              )}
                              {soldOut && (
                                <View style={[s.stockBadge, s.soldOutBadge]}>
                                  <Text style={s.stockBadgeTxt}>SOLD OUT</Text>
                                </View>
                              )}
                            </View>
                            <Text style={s.cropDet}>
                              {locked
                                ? `🔒 Unlocks at level ${crop.minLevel}`
                                : `⏱ ${fmtTime(crop.growTime)} · 🌾 Sell: ${crop.price.toLocaleString()} · 🌱 Seed: ${crop.seedCost.toLocaleString()}`}
                            </Text>
                          </View>
                          <View
                            style={[s.xpBadge, { backgroundColor: crop.color }]}
                          >
                            <Text style={s.xpBadgeTxt}>+{crop.xp}XP</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeBtnTxt}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// ─── Coin Market Modal ────────────────────────────────────────────────────────
// Localized prices come from the store (pack.displayPrice). The real
// purchase is triggered by onBuy(sku) → useCoinStore → native store sheet.

const MarketModal: React.FC<{
  visible: boolean;
  gold: number;
  packs: StorePack[];
  connected: boolean;
  purchasingSku: string | null;
  storeError: string | null;
  onBuy: (sku: string) => void;
  onClose: () => void;
}> = ({
  visible,
  gold,
  packs,
  connected,
  purchasingSku,
  storeError,
  onBuy,
  onClose,
}) => {
  const slide = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [visible]);

  const anySimulated = packs.some((p) => p.simulated && p.available);
  const loading = !connected && !anySimulated;

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
            <Text style={s.shopTitle}>🏦 Coin Market</Text>
            <Text style={s.shopGold}>
              Current balance: 💰 {gold.toLocaleString()}
            </Text>
            <Text style={s.marketSub}>
              Out of coins for that rare seed? Grab a pack 👇
            </Text>

            {loading && (
              <Text style={s.storeStatus}>Connecting to the store… ⏳</Text>
            )}

            {!!storeError && <Text style={s.storeError}>⚠️ {storeError}</Text>}

            {packs.map((pack) => {
              const total = pack.coins + pack.bonus;
              const busy = purchasingSku === pack.sku;
              const disabled = !pack.available || !!purchasingSku;
              return (
                <TouchableOpacity
                  key={pack.sku}
                  style={[
                    s.packRow,
                    pack.tag && s.packRowHot,
                    !pack.available && s.packRowDim,
                  ]}
                  onPress={() => onBuy(pack.sku)}
                  activeOpacity={0.8}
                  disabled={disabled}
                >
                  {pack.tag && (
                    <View style={s.packTag}>
                      <Text style={s.packTagTxt}>{pack.tag}</Text>
                    </View>
                  )}
                  <Text style={s.packEm}>{pack.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.packCoins}>
                      {total.toLocaleString()} coins
                    </Text>
                    {pack.bonus > 0 && (
                      <Text style={s.packBonus}>
                        {pack.coins.toLocaleString()} +{" "}
                        {pack.bonus.toLocaleString()} bonus 🎁
                      </Text>
                    )}
                  </View>
                  <View style={[s.packPrice, busy && s.packPriceBusy]}>
                    <Text style={s.packPriceTxt}>
                      {busy ? "..." : pack.displayPrice}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {anySimulated && (
              <Text style={s.marketDisclaimer}>
                Dev mode: store unavailable (Expo Go?) — simulated purchase, no
                real money is charged.
              </Text>
            )}

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
          <Text style={s.dayStat}>💰 Total coins: {gold.toLocaleString()}</Text>
          <Text style={s.dayStat}>🧺 Total harvested: {totalHarvested}</Text>
          <Text style={s.dayHint}>
            🎲 The shop rolls new rare seeds tomorrow!
          </Text>
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

  const [hydrated, setHydrated] = useState(false);
  const [shopVisible, setShopVisible] = useState(false);
  const [marketVisible, setMarketVisible] = useState(false);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [floatLabels, setFloatLabels] = useState<FloatingLabel[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // ── IAP: coin store (expo-iap) ──────────────────────────────────────────────
  // onCoinsGranted only fires after a completed purchase + dedupe (and, in
  // production, after receipt validation inside useCoinStore).

  const coinStore = useCoinStore({
    onCoinsGranted: (coins) => {
      dispatch({ type: "BUY_COINS", amount: coins });
      Vibration.vibrate([0, 30, 40, 30]);
      setMarketVisible(false);
    },
  });

  // ── Persistence: load on mount ──────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const save = await loadSave();
      if (cancelled) return;
      if (save) {
        dispatch({ type: "HYDRATE", payload: save });
        // Immediate TICK: plants that grew offline become "ready" right away
        setTimeout(() => dispatch({ type: "TICK" }), 0);
      } else {
        dispatch({ type: "HYDRATE", payload: {} }); // rolls the first stock
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Persistence: debounced save on every change ─────────────────────────────

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(toPersistable(state)),
      ).catch((e) => console.warn("[FarmGame] Failed to save:", e));
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state, hydrated]);

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

  const prevLevel = useRef(state.level);
  const lvlAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (hydrated && state.level > prevLevel.current) {
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
  }, [state.level, hydrated]);
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
          setMarketVisible(true); // 💸 out of coins → show the market
          return;
        }
        if (isLimited(crop) && (st.dailyStock[crop.id] ?? 0) <= 0) {
          spawnLabel(tileId, "❌ Out of stock today!", "#EF4444");
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

  useEffect(() => {
    const r = refs.current;
    if (!r.scene) return;
    state.tiles.forEach((tile, id) => {
      const mesh = r.tileObjs[id];
      if (!mesh) return;
      applyTileMat(mesh, tile, hoveredId.current === id);

      const want = plantKey(tile);
      const cur = r.plantObjs[id];
      if (cur && cur.userData.key === want) return; // stage unchanged

      if (cur) {
        r.scene!.remove(cur);
        r.plantObjs[id] = null;
      }
      if (!want) return;

      const g = buildPlant(tile)!;
      g.userData.key = want;
      g.userData.spawnAt = performance.now(); // animates the entry "pop"
      const pos = tileWorldPos(id);
      g.position.set(pos.x, TILE_H / 2, pos.z);
      g.rotation.y = (id % 7) * 0.9; // deterministic variation across tiles
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
    r.renderer!.shadowMap.type = THREE.PCFSoftShadowMap;
    // Correct color management → PBR soil reads right (no washed-out look)
    {
      const R: any = r.renderer;
      if ("outputColorSpace" in R)
        R.outputColorSpace = (THREE as any).SRGBColorSpace;
      else R.outputEncoding = (THREE as any).sRGBEncoding;
    }

    r.scene = new THREE.Scene();
    r.scene.background = null;

    // Hemisphere (sky/ground bounce) + warm sun — flatters the soil normals
    r.scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x6a4a2e, 0.85));
    const dir = new THREE.DirectionalLight(0xfff2d6, 1.5);
    dir.position.set(6, 11, 4);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 40;
    dir.shadow.camera.left = -8;
    dir.shadow.camera.right = 8;
    dir.shadow.camera.top = 8;
    dir.shadow.camera.bottom = -8;
    dir.shadow.bias = -0.0008;
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

    // Tile = soil block (depth + sides) + a displaced surface plane (the dirt)
    const boxGeo = new THREE.BoxGeometry(TILE_W, TILE_H, TILE_W);
    for (let id = 0; id < ROWS * COLS; id++) {
      const { surfMat, boxMat } = createSoilMaterials();
      const mesh = new THREE.Mesh(boxGeo, boxMat);
      mesh.receiveShadow = true;
      mesh.castShadow = true;

      const surf = new THREE.Mesh(getSurfaceGeo(false), surfMat);
      surf.position.y = TILE_H / 2 + 0.004; // sits on the block's top
      surf.receiveShadow = true;
      mesh.add(surf);

      mesh.userData.surface = surf;
      mesh.userData.surfMat = surfMat;
      mesh.userData.boxMat = boxMat;

      const pos = tileWorldPos(id);
      mesh.position.copy(pos);
      (mesh as any).tileId = id;
      applyTileMat(mesh, {
        id,
        state: "empty",
        watered: false,
        waterCount: 0,
      } as Tile);
      r.scene.add(mesh);
      r.tileObjs[id] = mesh;
    }

    // Sync existing state (restored save or hot reload)
    stateRef.current.tiles.forEach((tile, id) => {
      applyTileMat(r.tileObjs[id], tile);
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
    });

    // Render loop — plant pop-in + swaying of ready crops
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

        // entry animation (pop)
        const age = now - (g.userData.spawnAt ?? now);
        let sc = 1;
        if (age < 350) sc = 0.4 + 0.6 * Math.min(1, age / 350);

        if (t.state === "ready") {
          sc *= 1 + 0.06 * Math.sin(r.readyAnim + i);
          g.rotation.z = 0.05 * Math.sin(r.readyAnim * 1.3 + i);
        } else {
          g.rotation.z = 0.02 * Math.sin(r.readyAnim * 0.7 + i); // light breeze
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
    // Non-recursive: only the tile blocks are tested (surface children ignored)
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
  const cropRarity = RARITY_META[crop.rarity];

  if (!fontsLoaded || !hydrated) return null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      {/* Translucent status bar — the header green shows through behind it */}
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Header (paddingTop = inset → green covers the status bar) ── */}
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
            <GoldCounter
              gold={state.gold}
              onPress={() => setMarketVisible(true)}
            />
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

      {/* ── 3D Canvas — extends to the bottom of the screen; HUD floats on top ── */}
      <View style={s.canvasWrap} onLayout={onCanvasLayout}>
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={onContextCreate}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />

        {/* Contextual hint — floating glass chip */}
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

        {/* ── Floating liquid-glass footer ── */}
        <View
          style={[s.floatFooter, { bottom: insets.bottom + 14 }]}
          pointerEvents="box-none"
        >
          {/* FAB row + selected seed chip */}
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
                  <View style={s.cropChipTop}>
                    <Text style={s.cropChipName}>{crop.name}</Text>
                    <View
                      style={[
                        s.cropChipRarity,
                        { backgroundColor: cropRarity.color },
                      ]}
                    >
                      <Text style={s.cropChipRarityTxt}>
                        {cropRarity.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.cropChipCost}>
                    🌱 {crop.seedCost.toLocaleString()} coins
                  </Text>
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

          {/* Glass tool dock */}
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
        level={state.level}
        selectedCrop={state.selectedCrop}
        dailyStock={state.dailyStock}
        onSelectCrop={(c) => dispatch({ type: "SELECT_CROP", crop: c })}
        onOpenMarket={() => {
          setShopVisible(false);
          setMarketVisible(true);
        }}
        onClose={() => setShopVisible(false)}
      />
      <MarketModal
        visible={marketVisible}
        gold={state.gold}
        packs={coinStore.packs}
        connected={coinStore.connected}
        purchasingSku={coinStore.purchasingSku}
        storeError={coinStore.storeError}
        onBuy={coinStore.buy}
        onClose={() => {
          coinStore.clearError();
          setMarketVisible(false);
        }}
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
  ink: "#14532D", // dark text over glass
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#87CEEB" },

  // Header (covers the status bar)
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
  goldPlus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: P.goldLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 1,
  },
  goldPlusTxt: {
    fontFamily: FF,
    fontSize: 11,
    color: P.greenDeep,
    lineHeight: 13,
  },
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

  // Hint chip (glass, top of the scene)
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

  // ── Floating footer ──
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
  cropChipTop: { flexDirection: "row", alignItems: "center", gap: 5 },
  cropChipName: { fontSize: 12, fontFamily: FF, color: P.ink },
  cropChipRarity: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  cropChipRarityTxt: { fontSize: 7, fontFamily: FF, color: P.white },
  cropChipCost: { fontSize: 9, fontFamily: FF, color: P.brown2 },

  // Tool dock (glass)
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
  shopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  shopTitle: { fontSize: 19, fontFamily: FF, color: P.green1, marginBottom: 3 },
  shopGold: { fontSize: 13, fontFamily: FF, color: P.brown2 },
  getCoinsBtn: {
    backgroundColor: P.gold,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
  },
  getCoinsTxt: { fontFamily: FF, fontSize: 12, color: P.white },

  raritySection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  rarityDot: { width: 8, height: 8, borderRadius: 4 },
  rarityTitle: { fontFamily: FF, fontSize: 12, letterSpacing: 0.5 },
  rarityHint: { fontFamily: FF, fontSize: 10, color: "#9CA3AF" },

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
  cropRowDim: { opacity: 0.45 },
  mysteryRow: {
    backgroundColor: "#F8FAFC",
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
  },
  mysteryName: { fontSize: 14, fontFamily: FF, color: "#64748B" },
  cropEm: { fontSize: 27 },
  cropNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cropName: { fontSize: 14, fontFamily: FF, color: "#1F2937" },
  cropDet: { fontSize: 11, fontFamily: FF, color: "#6B7280", marginTop: 2 },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
  },
  soldOutBadge: { backgroundColor: "#9CA3AF" },
  stockBadgeTxt: { fontSize: 8, fontFamily: FF, color: P.white },
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

  // Coin market
  marketSub: {
    fontSize: 12,
    fontFamily: FF,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 12,
  },
  packRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 14,
    backgroundColor: P.gray1,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  packRowHot: {
    borderColor: P.goldLight,
    backgroundColor: "#FFFBEB",
  },
  packRowDim: { opacity: 0.4 },
  storeStatus: {
    fontSize: 11,
    fontFamily: FF,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  storeError: {
    fontSize: 11,
    fontFamily: FF,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 8,
  },
  packTag: {
    position: "absolute",
    top: -8,
    right: 12,
    backgroundColor: P.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 2,
  },
  packTagTxt: {
    fontFamily: FF,
    fontSize: 8,
    color: P.white,
    letterSpacing: 0.5,
  },
  packEm: { fontSize: 28 },
  packCoins: { fontSize: 15, fontFamily: FF, color: "#1F2937" },
  packBonus: { fontSize: 10, fontFamily: FF, color: P.green2, marginTop: 2 },
  packPrice: {
    backgroundColor: P.green2,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 11,
    minWidth: 84,
    alignItems: "center",
  },
  packPriceTxt: { fontFamily: FF, fontSize: 12, color: P.white },
  packPriceBusy: { backgroundColor: "#86EFAC" },
  marketDisclaimer: {
    fontSize: 9,
    fontFamily: FF,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 6,
  },

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
  dayHint: {
    fontSize: 11,
    fontFamily: FF,
    color: "#9CA3AF",
    textAlign: "center",
  },
  dayBtn: {
    marginTop: 8,
    backgroundColor: P.green2,
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 13,
  },
  dayBtnTxt: { color: P.white, fontFamily: FF, fontSize: 15 },
});
