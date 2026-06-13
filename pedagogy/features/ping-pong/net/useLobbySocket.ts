/**
 * useLobbySocket.ts — Conexão com o saguão + relay das mensagens de jogo.
 *
 * Cuida do WebSocket: identidade fofa (vinda do servidor), estado do saguão,
 * pareamento ("match_found") e o relay bruto das mensagens da partida. O motor
 * de jogo (useNetPong) consome isto via `net` e registra seus handlers com
 * `net.setHandlers(...)`.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { NET_TICK_MS, SERVER_URL } from "./config";
import { makeLocalNickname } from "./nicknames";
import type {
  ClientMessage,
  Identity,
  MatchInfo,
  NetEvent,
  NetState,
  ServerMessage,
} from "./protocol";

export type ConnStatus = "connecting" | "online" | "offline";

/** Handlers que o motor de jogo registra para receber o relay do oponente. */
export interface NetHandlers {
  onState?: (s: NetState) => void; // recebido pelo guest
  onInput?: (targetX: number) => void; // recebido pelo host
  onEvent?: (e: NetEvent) => void;
  onRematch?: () => void;
  onOpponentLeft?: () => void;
}

/** Objeto entregue ao motor de jogo. */
export interface NetChannel {
  isHost: boolean;
  sendState: (s: NetState) => void;
  sendInput: (targetX: number) => void;
  sendEvent: (e: NetEvent) => void;
  sendRematch: () => void;
  setHandlers: (h: NetHandlers) => void;
}

export function useLobbySocket() {
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [you, setYou] = useState<Identity>(() => makeLocalNickname());
  const [lobby, setLobby] = useState<{ players: Identity[]; count: number }>({
    players: [],
    count: 0,
  });
  const [inLobby, setInLobby] = useState(false);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<NetHandlers>({});
  const lastSend = useRef(0);
  const matchRef = useRef<MatchInfo | null>(null);
  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  // ── (Re)conexão ────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    setStatus("connecting");
    setOpponentLeft(false);
    let ws: WebSocket;
    try {
      ws = new WebSocket(SERVER_URL);
    } catch {
      setStatus("offline");
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => setStatus("online");

    ws.onmessage = (ev) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case "welcome":
          setYou(msg.you);
          break;
        case "lobby":
          setLobby({ players: msg.players, count: msg.count });
          break;
        case "lobby_joined":
          setInLobby(true);
          break;
        case "match_found":
          setInLobby(false);
          setOpponentLeft(false);
          setMatch({
            matchId: msg.matchId,
            isHost: msg.isHost,
            opponent: msg.opponent,
          });
          break;
        case "state":
          handlersRef.current.onState?.(msg.s);
          break;
        case "input":
          handlersRef.current.onInput?.(msg.targetX);
          break;
        case "event":
          handlersRef.current.onEvent?.(msg.event);
          break;
        case "rematch":
          handlersRef.current.onRematch?.();
          break;
        case "opponent_left":
          setOpponentLeft(true);
          handlersRef.current.onOpponentLeft?.();
          break;
      }
    };

    ws.onclose = () => {
      setStatus("offline");
      setInLobby(false);
    };
    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
    };
  }, [connect]);

  // ── Ações do saguão ──────────────────────────────────────────────────────

  const joinLobby = useCallback(() => {
    setOpponentLeft(false);
    send({ type: "join_lobby" });
  }, [send]);

  const leaveLobby = useCallback(() => {
    setInLobby(false);
    send({ type: "leave_lobby" });
  }, [send]);

  /** Sai da partida atual e volta a esperar no saguão. */
  const backToLobby = useCallback(() => {
    setMatch(null);
    setOpponentLeft(false);
    handlersRef.current = {};
    send({ type: "join_lobby" });
  }, [send]);

  /** Sai da partida E do saguão (volta ao menu). */
  const leaveMatch = useCallback(() => {
    setMatch(null);
    setOpponentLeft(false);
    handlersRef.current = {};
    send({ type: "leave_lobby" });
  }, [send]);

  const retry = useCallback(() => connect(), [connect]);

  // ── Canal de jogo entregue ao motor ───────────────────────────────────────

  const channel: NetChannel = {
    isHost: match?.isHost ?? false,
    sendState: (s) => {
      // throttle ~30Hz para não inundar o socket
      const now = Date.now();
      if (now - lastSend.current < NET_TICK_MS) return;
      lastSend.current = now;
      send({ type: "state", s });
    },
    sendInput: (targetX) => send({ type: "input", targetX }),
    sendEvent: (event) => send({ type: "event", event }),
    sendRematch: () => send({ type: "rematch" }),
    setHandlers: (h) => {
      handlersRef.current = h;
    },
  };

  return {
    status,
    you,
    lobby,
    inLobby,
    match,
    opponentLeft,
    joinLobby,
    leaveLobby,
    backToLobby,
    leaveMatch,
    retry,
    net: channel,
  };
}
