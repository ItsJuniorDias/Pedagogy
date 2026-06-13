/**
 * storage/ranking.ts — Ranking persistente + lógica de acúmulos do NEON PONG.
 *
 * Camada SEM React: tipos, funções puras de pontuação/acúmulo e a persistência
 * em AsyncStorage. O hook (hooks/useRanking.ts) e a UI (components/RankingModal)
 * apenas consomem isto.
 *
 *   • scoreMatch()    → quantos pontos de acúmulo uma partida vale (função pura)
 *   • accumulate()    → reduz uma partida sobre o perfil (função pura)
 *   • load/save/record/clear → I/O em AsyncStorage
 *
 * Instalar a dependência:
 *   npx expo install @react-native-async-storage/async-storage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { NEON } from "../theme";
import type { DiffId } from "../types";

// ─── Persistência ────────────────────────────────────────────────────────────

/** Bump o sufixo (_v2…) caso o formato do perfil mude de forma incompatível. */
export const STORAGE_KEY = "@neon_pong/ranking_v1";

/** Quantas partidas o ranking (leaderboard) mantém, ordenadas por pontos. */
export const MAX_RANKING = 10;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MatchResultKind = "win" | "loss";

/** Resultado cru que o motor do jogo emite ao fim da partida. */
export interface MatchResult {
  result: MatchResultKind;
  playerScore: number;
  cpuScore: number;
  diff: DiffId;
  bestRally: number;
}

/** Partida já registrada (com data e pontos de acúmulo calculados). */
export interface MatchRecord extends MatchResult {
  id: string;
  date: number; // epoch ms
  points: number; // pontos de acúmulo ganhos nessa partida
}

export interface DiffTally {
  wins: number;
  losses: number;
}

/** Perfil acumulado + leaderboard. É isto que vive no AsyncStorage. */
export interface RankingProfile {
  totalPoints: number; // pontuação vitalícia (soma dos pontos de cada partida)
  matchesPlayed: number;
  wins: number;
  losses: number;
  pointsScored: number; // somatório do placar do jogador (acúmulo)
  pointsConceded: number; // somatório do placar da CPU
  bestRallyAllTime: number;
  currentStreak: number; // sequência de vitórias atual (zera ao perder)
  bestStreak: number; // maior sequência de vitórias já feita
  byDiff: Record<DiffId, DiffTally>;
  top: MatchRecord[]; // ranking: melhores partidas (desc. por points)
  updatedAt: number;
}

// ─── Perfil vazio ──────────────────────────────────────────────────────────────

export function emptyProfile(): RankingProfile {
  return {
    totalPoints: 0,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    pointsScored: 0,
    pointsConceded: 0,
    bestRallyAllTime: 0,
    currentStreak: 0,
    bestStreak: 0,
    byDiff: {
      easy: { wins: 0, losses: 0 },
      normal: { wins: 0, losses: 0 },
      hard: { wins: 0, losses: 0 },
    },
    top: [],
    updatedAt: 0,
  };
}

// ─── Lógica de acúmulos (funções puras) ─────────────────────────────────────────

/** Multiplicador por dificuldade — ganhar no hard rende mais. */
const DIFF_MULT: Record<DiffId, number> = { easy: 1, normal: 1.5, hard: 2 };

const WIN_BASE = 100; // bônus por vencer
const LOSS_BASE = 20; // consolação por jogar
const MARGIN_PT = 5; // por ponto de saldo no placar (pode ser negativo)
const RALLY_PT = 3; // por rebatida no melhor rally da partida

/**
 * scoreMatch — quantos pontos de acúmulo uma partida vale.
 * Fórmula: (base + saldo*MARGIN + bestRally*RALLY) * multiplicador da dificuldade.
 * Nunca negativa (piso em 0).
 */
export function scoreMatch(m: MatchResult): number {
  const won = m.result === "win";
  const base = won ? WIN_BASE : LOSS_BASE;
  const margin = (m.playerScore - m.cpuScore) * MARGIN_PT;
  const rally = m.bestRally * RALLY_PT;
  const raw = (base + margin + rally) * DIFF_MULT[m.diff];
  return Math.max(0, Math.round(raw));
}

/** Cria um MatchRecord (com id + data + pontos) a partir do resultado cru. */
export function makeRecord(m: MatchResult, now = Date.now()): MatchRecord {
  return {
    ...m,
    id: `${now}_${Math.random().toString(36).slice(2, 8)}`,
    date: now,
    points: scoreMatch(m),
  };
}

/**
 * accumulate — reduz uma partida sobre o perfil e devolve um NOVO perfil
 * (imutável). Atualiza totais, sequência de vitórias, recorde de rally,
 * tabela por dificuldade e insere a partida no ranking (top N por pontos).
 */
export function accumulate(
  profile: RankingProfile,
  record: MatchRecord,
): RankingProfile {
  const won = record.result === "win";
  const currentStreak = won ? profile.currentStreak + 1 : 0;

  const byDiff: Record<DiffId, DiffTally> = {
    easy: { ...profile.byDiff.easy },
    normal: { ...profile.byDiff.normal },
    hard: { ...profile.byDiff.hard },
  };
  byDiff[record.diff] = {
    wins: byDiff[record.diff].wins + (won ? 1 : 0),
    losses: byDiff[record.diff].losses + (won ? 0 : 1),
  };

  const top = [...profile.top, record]
    .sort((a, b) => b.points - a.points || b.date - a.date)
    .slice(0, MAX_RANKING);

  return {
    totalPoints: profile.totalPoints + record.points,
    matchesPlayed: profile.matchesPlayed + 1,
    wins: profile.wins + (won ? 1 : 0),
    losses: profile.losses + (won ? 0 : 1),
    pointsScored: profile.pointsScored + record.playerScore,
    pointsConceded: profile.pointsConceded + record.cpuScore,
    bestRallyAllTime: Math.max(profile.bestRallyAllTime, record.bestRally),
    currentStreak,
    bestStreak: Math.max(profile.bestStreak, currentStreak),
    byDiff,
    top,
    updatedAt: record.date,
  };
}

// ─── Tiers (a "patente" derivada da pontuação vitalícia) ─────────────────────────

export interface Tier {
  id: string;
  label: string;
  emoji: string;
  color: string;
  min: number; // pontos vitalícios necessários
}

export const TIERS: Tier[] = [
  { id: "rookie", label: "ROOKIE", emoji: "🐣", color: NEON.dim, min: 0 },
  { id: "bronze", label: "BRONZE", emoji: "🥉", color: NEON.amber, min: 300 },
  { id: "silver", label: "SILVER", emoji: "🥈", color: NEON.text, min: 800 },
  { id: "gold", label: "GOLD", emoji: "🥇", color: NEON.yellow, min: 1800 },
  { id: "platinum", label: "PLATINUM", emoji: "💎", color: NEON.mint, min: 3500 },
  { id: "diamond", label: "DIAMOND", emoji: "🔷", color: NEON.cyan, min: 6000 },
  { id: "master", label: "NEON MASTER", emoji: "👑", color: NEON.magenta, min: 10000 },
];

export interface TierProgress {
  current: Tier;
  next: Tier | null;
  /** 0..1 do caminho entre o tier atual e o próximo (1 quando no topo). */
  progress: number;
  /** pontos faltando para o próximo tier (0 quando no topo). */
  toNext: number;
}

/** Descobre o tier atual e o progresso até o próximo, a partir dos pontos. */
export function tierForPoints(totalPoints: number): TierProgress {
  let current = TIERS[0];
  let next: Tier | null = null;

  for (let i = 0; i < TIERS.length; i++) {
    if (totalPoints >= TIERS[i].min) {
      current = TIERS[i];
      next = TIERS[i + 1] ?? null;
    } else {
      break;
    }
  }

  if (!next) return { current, next: null, progress: 1, toNext: 0 };

  const span = next.min - current.min;
  const into = totalPoints - current.min;
  return {
    current,
    next,
    progress: span > 0 ? Math.min(1, into / span) : 1,
    toNext: Math.max(0, next.min - totalPoints),
  };
}

// ─── Derivados úteis ─────────────────────────────────────────────────────────────

/** Taxa de vitória 0..1 (0 se nunca jogou). */
export function winRate(p: RankingProfile): number {
  return p.matchesPlayed > 0 ? p.wins / p.matchesPlayed : 0;
}

// ─── I/O AsyncStorage ────────────────────────────────────────────────────────────

/** Garante que um objeto lido do storage tenha todos os campos atuais. */
function hydrate(raw: Partial<RankingProfile> | null | undefined): RankingProfile {
  const base = emptyProfile();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    byDiff: {
      easy: { ...base.byDiff.easy, ...raw.byDiff?.easy },
      normal: { ...base.byDiff.normal, ...raw.byDiff?.normal },
      hard: { ...base.byDiff.hard, ...raw.byDiff?.hard },
    },
    top: Array.isArray(raw.top) ? raw.top.slice(0, MAX_RANKING) : [],
  };
}

/** Carrega o perfil (ou um perfil vazio se nada salvo / erro). */
export async function loadRanking(): Promise<RankingProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    return hydrate(JSON.parse(raw) as Partial<RankingProfile>);
  } catch (e) {
    console.warn("[ping-pong] falha ao ler ranking:", e);
    return emptyProfile();
  }
}

/** Persiste o perfil completo. */
export async function saveRanking(profile: RankingProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn("[ping-pong] falha ao salvar ranking:", e);
  }
}

/**
 * recordMatchResult — registra uma partida: lê o perfil, acumula o resultado,
 * salva e devolve o perfil atualizado + o registro criado.
 * É a "marcação de ponto depois da partida".
 */
export async function recordMatchResult(
  m: MatchResult,
): Promise<{ profile: RankingProfile; record: MatchRecord }> {
  const prev = await loadRanking();
  const record = makeRecord(m);
  const profile = accumulate(prev, record);
  await saveRanking(profile);
  return { profile, record };
}

/** Zera o ranking (apaga do AsyncStorage) e devolve um perfil vazio. */
export async function clearRanking(): Promise<RankingProfile> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("[ping-pong] falha ao limpar ranking:", e);
  }
  return emptyProfile();
}
