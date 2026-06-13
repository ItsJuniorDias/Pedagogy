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

// Assistência de rebatida: margem EXTRA de meia-largura na colisão (un. de mundo).
// Quanto maior, mais fácil acertar a bola — vale p/ o jogador E p/ a CPU.
export const CATCH_ASSIST = 0.5;

// ─── Efeito / Corte (sidespin) ───────────────────────────────────────────────
// Quando você bate deslizando a raquete, a velocidade lateral dela vira efeito:
// a bola CURVA no ar de forma contínua (modelo Magnus simplificado — o vetor
// velocidade é rotacionado um pouco a cada quadro). Isso tira a CPU de posição.
export const SPIN = {
  gain: 0.045, // quanto a velocidade lateral da raquete (un/s) vira efeito
  max: 1.3, // teto do efeito em rad/s (limita a curvatura)
  kick: 0.06, // empurrão lateral imediato no impacto (un/s por un/s da raquete)
  tau: 0.5, // constante de decaimento do efeito (s) — curva forte e some suave
  labelAt: 0.7, // |efeito| a partir do qual aparece o aviso "EFEITO!"
};

// ─── Dificuldades ───────────────────────────────────────────────────────────

export const DIFFS: Record<DiffId, Diff> = {
  easy: {
    id: "easy",
    label: "EASY",
    emoji: "🐢",
    color: NEON.mint,
    aiSpeed: 2.8,
    ballSpeed: 3.4,
  },
  normal: {
    id: "normal",
    label: "NORMAL",
    emoji: "⚡",
    color: NEON.amber,
    aiSpeed: 3.8,
    ballSpeed: 4.2,
  },
  hard: {
    id: "hard",
    label: "HARD",
    emoji: "🔥",
    color: NEON.rose,
    aiSpeed: 5.0,
    ballSpeed: 5.2,
  },
};

export const DIFF_LIST: Diff[] = [DIFFS.easy, DIFFS.normal, DIFFS.hard];
