/**
 * features/ping-pong/index.ts — API pública do módulo.
 *
 *   import PongHub from "@/features/ping-pong";   // menu + multiplayer + solo
 *   <PongHub />
 *
 * Ou, se quiser só o solo contra a CPU:
 *   import { PingPongGame } from "@/features/ping-pong";
 */

export { default } from "./PongHub";
export { default as PongHub } from "./PongHub";
export { default as PingPongGame } from "./PingPongGame";
export { MultiplayerPongGame } from "./MultiplayerPongGame";

export { usePongGame } from "./hooks/usePongGame";
export { useNetPong } from "./hooks/useNetPong";
export { useRanking } from "./hooks/useRanking";
export { NEON, C3D } from "./theme";
export { DIFFS, DIFF_LIST, WIN_SCORE } from "./constants";
export type { Phase, DiffId, Diff } from "./types";

// Rede / saguão multiplayer
export { useLobbySocket, SERVER_URL, makeLocalNickname } from "./net";
export type {
  Identity,
  MatchInfo,
  NetChannel,
  NetState,
  NetEvent,
  ConnStatus,
} from "./net";

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
