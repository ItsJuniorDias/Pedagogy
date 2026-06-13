/**
 * features/ping-pong/index.ts — API pública do módulo.
 *
 *   import PingPongGame from "@/features/ping-pong";
 *   <PingPongGame />
 */

export { default } from "./PingPongGame";
export { default as PingPongGame } from "./PingPongGame";

export { usePongGame } from "./hooks/usePongGame";
export { NEON, C3D } from "./theme";
export { DIFFS, DIFF_LIST, WIN_SCORE } from "./constants";
export type { Phase, DiffId, Diff } from "./types";
