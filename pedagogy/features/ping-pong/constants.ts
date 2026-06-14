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

// Assistência de rebatida do JOGADOR: margem EXTRA de meia-largura na colisão
// (un. de mundo). Quanto maior, mais fácil VOCÊ acertar a bola.
// A CPU NÃO usa isto — ela tem o próprio alcance, menor, em DIFFS[x].aiCatch,
// que ainda encolhe quando ela cansa. Resultado: seu ponto-doce é sempre maior.
export const CATCH_ASSIST = 0.62;

// ─── Efeito / Corte (sidespin) ───────────────────────────────────────────────
// Quando você bate deslizando a raquete, a velocidade lateral dela vira efeito:
// a bola CURVA no ar de forma contínua (modelo Magnus simplificado — o vetor
// velocidade é rotacionado um pouco a cada quadro). Isso tira a CPU de posição.
export const SPIN = {
  gain: 0.08, // (era 0.045) o corte NASCE com bem menos deslize da raquete
  max: 2.0, // (era 1.3) curva bem mais acentuada — tira a CPU do lugar
  kick: 0.12, // (era 0.06) empurrão lateral imediato no impacto, mais forte
  tau: 0.55, // (era 0.5) o efeito dura um tico mais antes de sumir
  labelAt: 0.4, // (era 0.7) "EFEITO!" aparece com cortes mais leves (feedback)
};

// ─── Dificuldades ───────────────────────────────────────────────────────────

export const DIFFS: Record<DiffId, Diff> = {
  easy: {
    id: "easy",
    label: "EASY",
    emoji: "🐢",
    color: NEON.mint,
    aiSpeed: 2.2, // (era 2.8) raquete da CPU mais lenta — você passa fácil
    ballSpeed: 3.2, // (era 3.4) bola um tico mais calma p/ você montar a jogada
    aiError: 0.6, // erro de leitura grande: ela sai do lugar com frequência
    aiCatch: 0.18, // alcance pequeno: a beirada da mesa já é ponto
  },
  normal: {
    id: "normal",
    label: "NORMAL",
    emoji: "⚡",
    color: NEON.amber,
    aiSpeed: 3.2, // (era 3.8)
    ballSpeed: 4.2,
    aiError: 0.34, // erra de vez em quando — dá p/ furar com colocação/corte
    aiCatch: 0.28,
  },
  hard: {
    id: "hard",
    label: "HARD",
    emoji: "🔥",
    color: NEON.rose,
    aiSpeed: 4.3, // (era 5.0) ainda dura, mas não é mais um paredão
    ballSpeed: 5.2,
    aiError: 0.18, // quase não erra sozinha — aqui o CORTE é a sua arma
    aiCatch: 0.4,
  },
};

export const DIFF_LIST: Diff[] = [DIFFS.easy, DIFFS.normal, DIFFS.hard];

// ─── Cansaço da CPU ──────────────────────────────────────────────────────────
// O cansaço acumula com o TEMPO REAL de bola em jogo (saque/pausa não contam) e
// é ZERADO A CADA PONTO — ou seja, vale DENTRO de um mesmo rally, não ao longo da
// partida. Para a CPU cansar de fato num ponto, o rally precisa durar mais que
// `graceSec` de bola rolando; com valores altos, ela praticamente não cansa.
export const FATIGUE = {
  graceSec: 75, // (era 16) tempo de bola em jogo antes de COMEÇAR a cansar
  rampSec: 150, // (era 42) tempo (após o grace) até o cansaço máximo
  slowFrac: 0.34, // fração MÁX. de velocidade que a CPU perde cansada (34%)
  errorAdd: 0.5, // erro de mira EXTRA no cansaço máximo (un. de mundo)
  catchShrink: 0.2, // o quanto a defesa da CPU encolhe cansada (un. de mundo)
  tiredAt: 0.5, // fração de cansaço que dispara o aviso "CPU CANSANDO"
};

// Cegueira da CPU ao efeito: ela "lê" a reta e ignora a curva, então um corte
// forte a tira do lugar. Maior = corte mais decisivo contra ela.
export const AI = {
  spinBlind: 0.35, // o quanto o efeito ativo desloca a mira da CPU (un. de mundo)
  errBase: 0.65, // piso do multiplicador de erro de leitura
  errBySpeed: 0.5, // erro extra proporcional ao multiplicador de velocidade da bola
};

// Recompensa do rally/corte: cada rebatida acelera a bola; um CORTE (deslize
// rápido da raquete) acelera MAIS, deixando difícil p/ quem for pegar.
export const RALLY = {
  baseBoost: 1.06, // (antes era fixo em 1.05) aceleração por rebatida normal
  cutBoost: 0.02, // aceleração extra por un/s de deslize da raquete (corte)
  cutBoostMax: 0.14, // teto do bônus de aceleração do corte
  maxMul: 2.3, // (antes era 2.0) teto do multiplicador de velocidade no rally
};
