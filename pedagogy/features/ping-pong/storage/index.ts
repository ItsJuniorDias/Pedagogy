/**
 * storage/index.ts — Barrel da camada de persistência (ranking + acúmulos).
 */

export {
  STORAGE_KEY,
  MAX_RANKING,
  DEFAULT_MMR,
  MMR_K,
  TIERS,
  RANKED_TIERS,
  emptyProfile,
  scoreMatch,
  expectedScore,
  applyElo,
  makeRecord,
  accumulate,
  tierForPoints,
  rankedDivisionForMMR,
  winRate,
  rankedWinRate,
  loadRanking,
  saveRanking,
  recordMatchResult,
  clearRanking,
} from "./ranking";

export type {
  MatchResultKind,
  MatchMode,
  OpponentInfo,
  MatchResult,
  MatchRecord,
  DiffTally,
  RankingProfile,
  Tier,
  TierProgress,
} from "./ranking";
