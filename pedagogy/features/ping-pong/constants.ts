/**
 * constants.ts — Tuning de gameplay, dimensões da mesa/raquete e dificuldades.
 *
 * Eixo X = largura, Z = comprimento (unidades de mundo Three.js).
 */

import { Dimensions } from "react-native";
import { NEON } from "./theme";
import type { Diff, DiffId } from "./types";

export const { width: SCREEN_W } = Dimensions.get("window");

export const WIN_SCORE = 7;

// Mesa
export const TABLE = { w: 5, l: 8, halfW: 2.5, halfL: 4, topY: 0.09 };
// Raquete: a colisão usa o diâmetro da lâmina (halfW = raio da lâmina)
export const RACKET = { r: 0.55, thick: 0.07 };
export const PADDLE = { w: RACKET.r * 2, halfW: RACKET.r, d: 0.3, z: 3.55 };
export const BALL_R = 0.13;
export const BALL_Y = TABLE.topY + BALL_R + 0.02;

// ─── Dificuldades ───────────────────────────────────────────────────────────

export const DIFFS: Record<DiffId, Diff> = {
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

export const DIFF_LIST: Diff[] = [DIFFS.easy, DIFFS.normal, DIFFS.hard];
