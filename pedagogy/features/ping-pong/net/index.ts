/**
 * net/index.ts — Barrel da camada de rede (saguão + protocolo).
 */

export { SERVER_URL, NET_TICK_MS } from "./config";
export { makeLocalNickname } from "./nicknames";
export { useLobbySocket } from "./useLobbySocket";
export type { ConnStatus, NetChannel, NetHandlers } from "./useLobbySocket";
export type {
  Identity,
  MatchInfo,
  NetState,
  NetEvent,
  ClientMessage,
  ServerMessage,
} from "./protocol";
