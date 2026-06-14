/**
 * storage/ranking.ts — Ranking persistente + lógica de acúmulos do NEON PONG.
 *
 * Camada SEM React: tipos, funções puras de pontuação/acúmulo e a persistência
 * em AsyncStorage. O hook (hooks/useRanking.ts) e a UI (components/RankingModal)
 * apenas consomem isto.
 *
 * São DUAS trilhas de progressão, ambas no AsyncStorage:
 *
 *   1. PONTOS (lifetime)  → toda partida (solo OU ranked) rende pontos que somam
 *      na pontuação vitalícia e definem a PATENTE (TIERS: Rookie → Neon Master).
 *   2. MMR (ranked)       → só partidas multiplayer. É um rating estilo Elo que
 *      sobe/desce conforme a força do oponente e define a DIVISÃO competitiva
 *      (RANKED_TIERS: Wood → Champion).
 *
 * Funções puras (testáveis): scoreMatch (pontos), applyElo (rating), accumulate
 * (reduz a partida no perfil), tierForPoints / rankedDivisionForMMR (faixas).
 *
 * Instalar a dependência:
 *   npx expo install @react-native-async-storage/async-storage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { NEON } from "../theme";
import type { DiffId } from "../types";

// ─── Persistência ────────────────────────────────────────────────────────────

/** Bump o sufixo (_v2…) caso o formato do perfil mude de forma incompatível.
 *  Os campos de RANKED foram adicionados de forma RETROCOMPATÍVEL (hydrate
 *  preenche defaults), por isso a chave continua _v1: perfis antigos (só solo)
 *  são migrados sem perda — as partidas salvas viram `mode: "solo"`. */
export const STORAGE_KEY = "@neon_pong/ranking_v1";

/** Quantas partidas o ranking (leaderboard) mantém, ordenadas por pontos. */
export const MAX_RANKING = 10;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MatchResultKind = "win" | "loss";

/** Modo da partida: solo (vs CPU) ou ranked (multiplayer competitivo). */
export type MatchMode = "solo" | "ranked";

/** Identidade resumida do oponente humano (só no modo ranked). */
export interface OpponentInfo {
  nick: string;
  emoji: string;
  /** MMR do oponente no início da partida — usado para o Elo e exibição. */
  mmr: number;
}

/** Resultado cru que o motor do jogo emite ao fim da partida. */
export interface MatchResult {
  mode: MatchMode;
  result: MatchResultKind;
  playerScore: number;
  cpuScore: number; // no ranked = placar do oponente
  bestRally: number;
  /** Dificuldade — só no modo solo (no ranked não há CPU). */
  diff?: DiffId;
  /** Oponente — só no modo ranked. */
  opponent?: OpponentInfo;
}

/** Partida já registrada (com data e pontos de acúmulo calculados). */
export interface MatchRecord extends MatchResult {
  id: string;
  date: number; // epoch ms
  points: number; // pontos de acúmulo ganhos nessa partida
  /** Variação de MMR nesta partida — só no modo ranked (pode ser negativa). */
  mmrDelta?: number;
}

export interface DiffTally {
  wins: number;
  losses: number;
}

/** Perfil acumulado + leaderboard. É isto que vive no AsyncStorage. */
export interface RankingProfile {
  // ── Lifetime (alimentado por solo E ranked) ──────────────────────────────
  totalPoints: number; // pontuação vitalícia (soma dos pontos de cada partida)
  matchesPlayed: number;
  wins: number;
  losses: number;
  pointsScored: number; // somatório do placar do jogador (acúmulo)
  pointsConceded: number; // somatório do placar do oponente/CPU
  bestRallyAllTime: number;
  currentStreak: number; // sequência de vitórias atual (zera ao perder)
  bestStreak: number; // maior sequência de vitórias já feita
  byDiff: Record<DiffId, DiffTally>; // só partidas SOLO

  // ── Ranked (multiplayer) — trilha competitiva separada (Elo) ──────────────
  mmr: number; // rating atual
  bestMMR: number; // pico de rating
  rankedMatches: number;
  rankedWins: number;
  rankedLosses: number;
  rankedStreak: number; // sequência de vitórias atual no ranked
  bestRankedStreak: number;

  top: MatchRecord[]; // ranking: melhores partidas (desc. por points)
  updatedAt: number;
}

// ─── Configuração do Elo / ranked ───────────────────────────────────────────

/** Rating inicial de todo jogador no ranked. */
export const DEFAULT_MMR = 1000;
/** Fator-K do Elo: quanto cada partida pode mover o rating. */
export const MMR_K = 32;

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
    mmr: DEFAULT_MMR,
    bestMMR: DEFAULT_MMR,
    rankedMatches: 0,
    rankedWins: 0,
    rankedLosses: 0,
    rankedStreak: 0,
    bestRankedStreak: 0,
    top: [],
    updatedAt: 0,
  };
}

// ─── Lógica de acúmulos (funções puras) ─────────────────────────────────────────

/** Multiplicador por dificuldade — ganhar no hard rende mais. */
const DIFF_MULT: Record<DiffId, number> = { easy: 1, normal: 1.5, hard: 2 };

/** Multiplicador dos pontos no RANKED (jogar contra gente vale como o hard). */
const RANKED_MULT = 2;

const WIN_BASE = 100; // bônus por vencer
const LOSS_BASE = 20; // consolação por jogar
const MARGIN_PT = 5; // por ponto de saldo no placar (pode ser negativo)
const RALLY_PT = 3; // por rebatida no melhor rally da partida

/**
 * scoreMatch — quantos pontos de acúmulo uma partida vale (lifetime).
 * Fórmula: (base + saldo*MARGIN + bestRally*RALLY) * multiplicador.
 * O multiplicador vem da dificuldade (solo) ou é fixo (ranked). Nunca negativa.
 */
export function scoreMatch(m: MatchResult): number {
  const won = m.result === "win";
  const base = won ? WIN_BASE : LOSS_BASE;
  const margin = (m.playerScore - m.cpuScore) * MARGIN_PT;
  const rally = m.bestRally * RALLY_PT;
  const mult = m.mode === "ranked" ? RANKED_MULT : DIFF_MULT[m.diff ?? "normal"];
  return Math.max(0, Math.round((base + margin + rally) * mult));
}

// ─── Elo (rating do ranked) ──────────────────────────────────────────────────

/** Probabilidade esperada de `self` vencer `opp` (0..1) pela curva logística do Elo. */
export function expectedScore(self: number, opp: number): number {
  return 1 / (1 + Math.pow(10, (opp - self) / 400));
}

/**
 * applyElo — aplica uma partida ranked ao rating.
 * Devolve a variação (delta, pode ser negativa) e o novo rating (piso em 0).
 * Vencer um oponente mais FORTE rende mais; perder pra um mais FRACO custa mais.
 */
export function applyElo(
  self: number,
  opp: number,
  won: boolean,
): { delta: number; next: number } {
  const exp = expectedScore(self, opp);
  const delta = Math.round(MMR_K * ((won ? 1 : 0) - exp));
  const next = Math.max(0, self + delta);
  return { delta, next };
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
 * (imutável). Atualiza os totais vitalícios (solo + ranked), e então:
 *   • SOLO   → tabela por dificuldade.
 *   • RANKED → MMR (recebe `newMMR` já calculado), pico, W/L e sequência ranked.
 * Sempre insere a partida no ranking (top N por pontos).
 */
export function accumulate(
  profile: RankingProfile,
  record: MatchRecord,
  newMMR: number = profile.mmr,
): RankingProfile {
  const won = record.result === "win";
  const ranked = record.mode === "ranked";
  const currentStreak = won ? profile.currentStreak + 1 : 0;
  const rankedStreak = ranked
    ? won
      ? profile.rankedStreak + 1
      : 0
    : profile.rankedStreak;

  const byDiff: Record<DiffId, DiffTally> = {
    easy: { ...profile.byDiff.easy },
    normal: { ...profile.byDiff.normal },
    hard: { ...profile.byDiff.hard },
  };
  if (!ranked && record.diff) {
    byDiff[record.diff] = {
      wins: byDiff[record.diff].wins + (won ? 1 : 0),
      losses: byDiff[record.diff].losses + (won ? 0 : 1),
    };
  }

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
    mmr: ranked ? newMMR : profile.mmr,
    bestMMR: ranked ? Math.max(profile.bestMMR, newMMR) : profile.bestMMR,
    rankedMatches: profile.rankedMatches + (ranked ? 1 : 0),
    rankedWins: profile.rankedWins + (ranked && won ? 1 : 0),
    rankedLosses: profile.rankedLosses + (ranked && !won ? 1 : 0),
    rankedStreak,
    bestRankedStreak: Math.max(profile.bestRankedStreak, rankedStreak),
    top,
    updatedAt: record.date,
  };
}

// ─── Faixas (patente por pontos e divisão por MMR) ───────────────────────────────

export interface Tier {
  id: string;
  label: string;
  emoji: string;
  color: string;
  min: number; // limiar (pontos vitalícios OU MMR, conforme a lista)
}

/** Patente vitalícia (derivada dos PONTOS — vale para solo + ranked). */
export const TIERS: Tier[] = [
  { id: "rookie", label: "ROOKIE", emoji: "🐣", color: NEON.dim, min: 0 },
  { id: "bronze", label: "BRONZE", emoji: "🥉", color: NEON.amber, min: 300 },
  { id: "silver", label: "SILVER", emoji: "🥈", color: NEON.text, min: 800 },
  { id: "gold", label: "GOLD", emoji: "🥇", color: NEON.yellow, min: 1800 },
  { id: "platinum", label: "PLATINUM", emoji: "💎", color: NEON.mint, min: 3500 },
  { id: "diamond", label: "DIAMOND", emoji: "🔷", color: NEON.cyan, min: 6000 },
  { id: "master", label: "NEON MASTER", emoji: "👑", color: NEON.magenta, min: 10000 },
];

/** Divisão competitiva do RANKED (derivada do MMR). Início em 1000 = SILVER. */
export const RANKED_TIERS: Tier[] = [
  { id: "wood", label: "WOOD", emoji: "🪵", color: NEON.dim, min: 0 },
  { id: "bronze", label: "BRONZE", emoji: "🥉", color: NEON.amber, min: 800 },
  { id: "silver", label: "SILVER", emoji: "🥈", color: NEON.text, min: 950 },
  { id: "gold", label: "GOLD", emoji: "🥇", color: NEON.yellow, min: 1100 },
  { id: "platinum", label: "PLATINUM", emoji: "💎", color: NEON.mint, min: 1250 },
  { id: "diamond", label: "DIAMOND", emoji: "🔷", color: NEON.cyan, min: 1400 },
  { id: "champion", label: "CHAMPION", emoji: "🌟", color: NEON.magenta, min: 1600 },
];

export interface TierProgress {
  current: Tier;
  next: Tier | null;
  /** 0..1 do caminho entre a faixa atual e a próxima (1 quando no topo). */
  progress: number;
  /** quanto falta para a próxima faixa (0 quando no topo). */
  toNext: number;
}

/** Descobre a faixa atual e o progresso até a próxima, dado um valor e a lista. */
function progressIn(tiers: Tier[], value: number): TierProgress {
  let current = tiers[0];
  let next: Tier | null = null;

  for (let i = 0; i < tiers.length; i++) {
    if (value >= tiers[i].min) {
      current = tiers[i];
      next = tiers[i + 1] ?? null;
    } else {
      break;
    }
  }

  if (!next) return { current, next: null, progress: 1, toNext: 0 };

  const span = next.min - current.min;
  const into = value - current.min;
  return {
    current,
    next,
    progress: span > 0 ? Math.min(1, into / span) : 1,
    toNext: Math.max(0, next.min - value),
  };
}

/** Patente atual + progresso até a próxima, a partir dos PONTOS vitalícios. */
export function tierForPoints(totalPoints: number): TierProgress {
  return progressIn(TIERS, totalPoints);
}

/** Divisão ranked atual + progresso até a próxima, a partir do MMR. */
export function rankedDivisionForMMR(mmr: number): TierProgress {
  return progressIn(RANKED_TIERS, mmr);
}

// ─── Derivados úteis ─────────────────────────────────────────────────────────────

/** Taxa de vitória geral 0..1 (0 se nunca jogou). */
export function winRate(p: RankingProfile): number {
  return p.matchesPlayed > 0 ? p.wins / p.matchesPlayed : 0;
}

/** Taxa de vitória só no ranked 0..1 (0 se nunca jogou ranked). */
export function rankedWinRate(p: RankingProfile): number {
  return p.rankedMatches > 0 ? p.rankedWins / p.rankedMatches : 0;
}

// ─── I/O AsyncStorage ────────────────────────────────────────────────────────────

/** Garante que um objeto lido do storage tenha todos os campos atuais.
 *  Migração retrocompatível: perfis antigos (sem os campos de ranked) recebem
 *  defaults, e partidas salvas sem `mode` viram `mode: "solo"`. */
function hydrate(raw: Partial<RankingProfile> | null | undefined): RankingProfile {
  const base = emptyProfile();
  if (!raw || typeof raw !== "object") return base;
  const top: MatchRecord[] = Array.isArray(raw.top)
    ? raw.top
        .slice(0, MAX_RANKING)
        .map((r) => ({ mode: "solo" as MatchMode, ...r }))
    : [];
  return {
    ...base,
    ...raw,
    byDiff: {
      easy: { ...base.byDiff.easy, ...raw.byDiff?.easy },
      normal: { ...base.byDiff.normal, ...raw.byDiff?.normal },
      hard: { ...base.byDiff.hard, ...raw.byDiff?.hard },
    },
    top,
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
 * recordMatchResult — registra uma partida: lê o perfil, calcula (no ranked) a
 * variação de Elo contra o oponente, acumula o resultado, salva e devolve o
 * perfil atualizado + o registro criado. É a "marcação de ponto pós-partida".
 */
export async function recordMatchResult(
  m: MatchResult,
): Promise<{ profile: RankingProfile; record: MatchRecord }> {
  const prev = await loadRanking();
  let record = makeRecord(m);
  let newMMR = prev.mmr;

  if (m.mode === "ranked") {
    const oppMMR = m.opponent?.mmr ?? DEFAULT_MMR;
    const { delta, next } = applyElo(prev.mmr, oppMMR, m.result === "win");
    record = { ...record, mmrDelta: delta };
    newMMR = next;
  }

  const profile = accumulate(prev, record, newMMR);
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
