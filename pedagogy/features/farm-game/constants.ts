// features/farm-game/constants.ts
import { Dimensions } from "react-native";

export const { width: SCREEN_W } = Dimensions.get("window");

// ─── Grid ─────────────────────────────────────────────────────────────────────

export const COLS = 5;
export const ROWS = 5;

// ─── Persistence ──────────────────────────────────────────────────────────────

export const STORAGE_KEY = "@happyfarm/save/v4";
export const SAVE_DEBOUNCE_MS = 600;

// ─── Tile / field geometry (unidades do mundo 3D) ─────────────────────────────

export const TILE_W = 1.1;
export const TILE_H = 0.2;
export const TILE_GAP = 0.07;
export const STRIDE = TILE_W + TILE_GAP;
export const FIELD_HALF = (COLS * STRIDE) / 2;
export const GRASS_BORDER = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtTime(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}
