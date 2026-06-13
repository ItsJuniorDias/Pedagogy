/**
 * storage/index.ts — Barrel da camada de persistência (ranking + acúmulos).
 */

export {
  STORAGE_KEY,
  MAX_RANKING,
  TIERS,
  emptyProfile,
  scoreMatch,
  makeRecord,
  accumulate,
  tierForPoints,
  winRate,
  loadRanking,
  saveRanking,
  recordMatchResult,
  clearRanking,
} from "./ranking";

export type {
  MatchResultKind,
  MatchResult,
  MatchRecord,
  DiffTally,
  RankingProfile,
  Tier,
  TierProgress,
} from "./ranking";
