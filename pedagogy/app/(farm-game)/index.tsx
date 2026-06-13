/**
 * FarmGame3D.tsx — Isometric 2.5D Farm Game (Three.js + Expo)
 *
 * v5 — Real IAP (expo-iap, iOS/App Store only):
 *  • COIN MARKET now uses the real store: products and localized
 *    prices come from the App Store via useCoinStore (./useCoinStore.ts).
 *    In dev without a store (Expo Go) it automatically falls back to a
 *    simulated mode.
 *  • Requires a DEV BUILD (expo-iap does not run in Expo Go):
 *      npx expo install expo-iap
 *      eas build --profile development --platform ios
 *
 * v4 — Persistence + free-to-play economy:
 *  • ASYNC STORAGE: progress is saved automatically (600ms debounce) and
 *    restored on launch. plantedAt is persisted → plants keep growing
 *    "offline" (on reopen, they may be ready to harvest).
 *  • EXPANDED CATALOG: 15 seeds across 5 rarities (common, uncommon,
 *    rare, epic, legendary). Expensive items have much longer growTime
 *    (up to 40 min) and pay out far more.
 *  • ROTATING RARITY: rare/epic/legendary are NOT always in the shop.
 *    Each new day the game rolls which ones appear (35% / 15% / 5%) and
 *    with limited stock (3 / 2 / 1 seeds). Unrolled slots show up as
 *    "???" — scarcity + FOMO.
 *  • COIN MARKET: modal with coin packs. Tighter economy (starting gold
 *    50) to nudge players toward the store.
 *
 * v3 — Liquid glass + status bar. v2 — procedural 3D plants + HUD.
 *
 * Install dependencies:
 *   npx expo install expo-gl expo-three three
 *   npx expo install expo-blur react-native-safe-area-context
 *   npx expo install @expo-google-fonts/fredoka-one expo-font
 *   npx expo install @react-native-async-storage/async-storage
 *   npx expo install expo-iap
 *
 * Usage:
 *   import FarmGame3D from './FarmGame3D';
 *   <FarmGame3D />
 */

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

/** 3D visual archetypes — new crops reuse parameterized builders */
type PlantVisual =
  | "wheat"
  | "corn"
  | "carrot"
  | "bush"
  | "sunflower"
  | "melon"
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
    visual: "bush",
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
    visual: "melon",
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
    visual: "bush",
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
    visual: "bush",
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
    visual: "melon",
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
    visual: "melon",
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
    visual: "bush",
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
    visual: "bush",
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
    visual: "sunflower",
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
    return "watered"; // dark/moist soil
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
// Real 3D plants (3 stages). Materials cached per color; geometries
// shared at module level — ~zero cost per tile.

const MAT_CACHE = new Map<number, THREE.MeshLambertMaterial>();
function lam(color: number): THREE.MeshLambertMaterial {
  let m = MAT_CACHE.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color });
    MAT_CACHE.set(color, m);
  }
  return m;
}

const PLANT_MAT = {
  sprout: lam(0x86efac),
  stem: lam(0x16a34a),
  leaf: lam(0x22c55e),
  leafDark: lam(0x15803d),
  wheatTip: lam(0xfbbf24),
  cornHusk: lam(0x65a30d),
  sunCenter: lam(0x78350f),
};

// Special material for the legendary crystal — self-glowing
const CRYSTAL_MAT = new THREE.MeshPhongMaterial({
  color: 0x22d3ee,
  emissive: 0x0e7490,
  shininess: 90,
  transparent: true,
  opacity: 0.92,
});

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
  melon: new THREE.SphereGeometry(0.22, 12, 12),
  crystalShard: new THREE.ConeGeometry(0.07, 0.42, 6),
};

function pm(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

/** Stage 1 — freshly planted sprout (same for all crops) */
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

/** Stage 2 — young plant (stem + leaves) */
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

/** Stage 3 — mature plant. Archetypes parameterized by the crop's color. */
function buildMature(crop: Crop): THREE.Group {
  const g = new THREE.Group();
  const main = lam(crop.color3d);

  switch (crop.visual) {
    case "wheat": {
      const offsets: [number, number][] = [
        [0, 0],
        [0.12, 0.06],
        [-0.12, 0.04],
        [0.05, -0.11],
        [-0.07, -0.1],
      ];
      const tipMat =
        crop.id === "golden_wheat" ? lam(0xfff3b0) : PLANT_MAT.wheatTip;
      offsets.forEach(([x, z], i) => {
        const stalk = pm(PLANT_GEO.stalk, main);
        stalk.position.set(x, 0.25, z);
        stalk.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.07;
        const tip = pm(PLANT_GEO.stalkTip, tipMat);
        tip.position.set(x, 0.55, z);
        tip.rotation.z = stalk.rotation.z;
        g.add(stalk, tip);
      });
      break;
    }
    case "corn": {
      const stem = pm(PLANT_GEO.tallStem, PLANT_MAT.cornHusk);
      stem.position.y = 0.31;
      g.add(stem);
      const ear = pm(PLANT_GEO.ear, main);
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
      break;
    }
    case "carrot": {
      const top = pm(PLANT_GEO.carrotTop, main);
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
      break;
    }
    case "bush": {
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
        const f = pm(PLANT_GEO.fruit, main);
        f.position.set(x, y, z);
        g.add(f);
      });
      break;
    }
    case "melon": {
      // big fruit "on the ground" (pumpkin, watermelon, potato...)
      const body = pm(PLANT_GEO.melon, main);
      body.scale.set(1, 0.8, 1);
      body.position.y = 0.16;
      g.add(body);
      const leaf = pm(PLANT_GEO.leaf, PLANT_MAT.leaf);
      leaf.position.set(0.06, 0.34, 0);
      leaf.rotation.z = -0.7;
      g.add(leaf);
      break;
    }
    case "crystal": {
      // cluster of glowing crystals (legendary)
      const offs: [number, number, number, number][] = [
        [0, 0.2, 0, 1.15],
        [0.11, 0.14, 0.06, 0.8],
        [-0.1, 0.13, 0.08, 0.7],
        [0.04, 0.12, -0.12, 0.6],
      ];
      offs.forEach(([x, y, z, sc]) => {
        const shard = pm(PLANT_GEO.crystalShard, CRYSTAL_MAT);
        shard.position.set(x, y, z);
        shard.scale.setScalar(sc);
        shard.rotation.set((Math.abs(x) + Math.abs(z)) * 1.2, 0, x * 1.5);
        g.add(shard);
      });
      break;
    }
    case "sunflower":
    default: {
      const stem = pm(PLANT_GEO.sunStem, PLANT_MAT.stem);
      stem.position.y = 0.34;
      g.add(stem);
      const head = pm(PLANT_GEO.sunHead, main);
      head.position.set(0, 0.7, 0.04);
      head.rotation.x = -0.95; // tilts the disc to "look" at the camera
      const coreMat =
        crop.id === "star_fruit" ? lam(0xffffff) : PLANT_MAT.sunCenter;
      const core = pm(PLANT_GEO.sunCore, coreMat);
      core.scale.set(1, 0.5, 1);
      core.position.y = 0.04; // along the disc's axis
      head.add(core);
      g.add(head);
      const leaf = pm(PLANT_GEO.leaf, PLANT_MAT.leaf);
      leaf.position.set(0.1, 0.3, 0);
      leaf.rotation.z = -1.1;
      g.add(leaf);
      break;
    }
  }

  return g;
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
  if (t.state === "growing") return buildYoung();
  if (t.state === "ready" && t.cropId) return buildMature(CROPS[t.cropId]);
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

    // Sync existing state (restored save or hot reload)
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
