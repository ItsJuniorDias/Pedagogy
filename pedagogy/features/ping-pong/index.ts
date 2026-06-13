/**
 * features/ping-pong/index.ts — API pública do módulo.
 *
 *   import PingPongGame from "@/features/ping-pong";
 *   <PingPongGame />
 */

export { default } from "./PingPongGame";
export { default as PingPongGame } from "./PingPongGame";

export { usePongGame } from "./hooks/usePongGame";
export { useRanking } from "./hooks/useRanking";
export { NEON, C3D } from "./theme";
export { DIFFS, DIFF_LIST, WIN_SCORE } from "./constants";
export type { Phase, DiffId, Diff } from "./types";

// Ranking persistente + acúmulos
export {
  TIERS,
  STORAGE_KEY,
  tierForPoints,
  winRate,
  scoreMatch,
  loadRanking,
  recordMatchResult,
  clearRanking,
} from "./storage";
export type {
  MatchResult,
  MatchRecord,
  RankingProfile,
  Tier,
  TierProgress,
} from "./storage";
