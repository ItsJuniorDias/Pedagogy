// features/farm-game/state/reducer.ts
import { COLS, ROWS } from "../constants";
import { CROP_LIST, CROPS, isLimited } from "../data/crops";
import { xpToLevel } from "../data/leveling";
import type { CropId, GameState, Tile, TileState, ToolId } from "../types";

// ─── Estado inicial ─────────────────────────────────────────────────────────

export const initialTiles = (): Tile[] =>
  Array.from({ length: ROWS * COLS }, (_, i) => ({
    id: i,
    state: "empty",
    watered: false,
    waterCount: 0,
  }));

/** Sorteia o estoque diário de itens rare/epic/legendary. */
export function rollDailyStock(): Partial<Record<CropId, number>> {
  const stock: Partial<Record<CropId, number>> = {};
  for (const crop of CROP_LIST) {
    if (!isLimited(crop)) continue;
    if (Math.random() < crop.appearChance) {
      stock[crop.id] = crop.stockPerDay;
    }
  }
  return stock;
}

export const INITIAL_STATE: GameState = {
  tiles: initialTiles(),
  gold: 50, // ↓ de 100 — economia mais apertada
  xp: 0,
  level: 1,
  selectedTool: "till",
  selectedCrop: "wheat",
  day: 1,
  totalHarvested: 0,
  dailyStock: {},
  coinsPurchased: 0,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export type Action =
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

// ─── Reducer ──────────────────────────────────────────────────────────────────

export function reducer(state: GameState, action: Action): GameState {
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
