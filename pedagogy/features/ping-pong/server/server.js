/**
 * server.js — Saguão (lobby) + matchmaking + relay do NEON PONG 🏓
 *
 * Fluxo:
 *   1. Jogador conecta  → recebe identidade fofa  ({ id, nick, emoji })  via "welcome".
 *   2. Jogador entra no saguão ("join_lobby") → fica esperando.
 *   3. Assim que há 2 jogadores esperando → o servidor casa a dupla, escolhe
 *      o HOST (o que esperava há mais tempo) e manda "match_found" para os dois.
 *   4. Durante a partida o servidor só faz RELAY: tudo que um manda
 *      ("input" / "state" / "event" / "rematch") é repassado ao oponente.
 *   5. Se alguém cai/sai, o oponente recebe "opponent_left" e volta ao saguão.
 *
 * O servidor NÃO simula física — quem simula é o host (host-autoritativo).
 * Isso mantém o servidor leve e simples (um relay + uma fila de espera).
 *
 *   npm install
 *   npm start          # PORT=8080 por padrão
 */

import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

import { makeNickname } from "./nicknames.js";

const PORT = Number(process.env.PORT) || 8080;

/** @typedef {{ id:string, nick:string, emoji:string, ws:import("ws").WebSocket,
 *             alive:boolean, lobby:boolean, matchId:string|null }} Player */

/** @type {Map<string, Player>} */
const players = new Map();
/** id -> matchId (jogadores em partida). */
/** @type {Map<string, { host:string, guest:string }>} */
const matches = new Map();

const send = (p, msg) => {
  try {
    if (p?.ws.readyState === p.ws.OPEN) p.ws.send(JSON.stringify(msg));
  } catch {
    /* socket morto — será limpo no close */
  }
};

const takenNicks = () => new Set([...players.values()].map((p) => p.nick));

const identity = (p) => ({ id: p.id, nick: p.nick, emoji: p.emoji });

// ── Saguão ────────────────────────────────────────────────────────────────

function lobbyPlayers() {
  return [...players.values()].filter((p) => p.lobby && !p.matchId);
}

function broadcastLobby() {
  const waiting = lobbyPlayers();
  const snapshot = {
    type: "lobby",
    players: waiting.map(identity),
    count: waiting.length,
  };
  for (const p of waiting) send(p, snapshot);
}

/** Tenta casar os dois jogadores mais antigos da fila. */
function tryMatch() {
  const waiting = lobbyPlayers();
  while (waiting.length >= 2) {
    const host = waiting.shift();
    const guest = waiting.shift();
    const matchId = randomUUID();

    host.lobby = guest.lobby = false;
    host.matchId = guest.matchId = matchId;
    matches.set(matchId, { host: host.id, guest: guest.id });

    send(host, {
      type: "match_found",
      matchId,
      isHost: true,
      opponent: identity(guest),
    });
    send(guest, {
      type: "match_found",
      matchId,
      isHost: false,
      opponent: identity(host),
    });
    console.log(
      `🎮 match ${matchId.slice(0, 8)}  ${host.nick} (host) × ${guest.nick}`,
    );
  }
  broadcastLobby();
}

function opponentOf(p) {
  if (!p.matchId) return null;
  const m = matches.get(p.matchId);
  if (!m) return null;
  const otherId = m.host === p.id ? m.guest : m.host;
  return players.get(otherId) || null;
}

/** Encerra a partida do jogador e devolve o oponente (vivo) ao saguão. */
function endMatch(p, notifyOpponent = true) {
  if (!p.matchId) return;
  const matchId = p.matchId;
  const opp = opponentOf(p);
  matches.delete(matchId);
  p.matchId = null;
  if (opp) {
    opp.matchId = null;
    if (notifyOpponent && opp.ws.readyState === opp.ws.OPEN) {
      send(opp, { type: "opponent_left" });
      // mantém o oponente no saguão para reentrar na fila
      opp.lobby = true;
    }
  }
}

// ── Servidor ────────────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: PORT });

console.log(`🏓 NEON PONG lobby ouvindo em ws://0.0.0.0:${PORT}`);

wss.on("connection", (ws) => {
  const { nick, emoji } = makeNickname(takenNicks());
  const player = {
    id: randomUUID(),
    nick,
    emoji,
    ws,
    alive: true,
    lobby: false,
    matchId: null,
  };
  players.set(player.id, player);

  send(player, { type: "welcome", you: identity(player) });
  console.log(
    `✨ ${player.emoji} ${player.nick} conectou  (online: ${players.size})`,
  );

  ws.on("pong", () => {
    player.alive = true;
  });

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    switch (msg.type) {
      case "join_lobby":
        if (!player.matchId) {
          player.lobby = true;
          send(player, { type: "lobby_joined" });
          tryMatch();
        }
        break;

      case "leave_lobby":
        player.lobby = false;
        broadcastLobby();
        break;

      // Relay puro: repassa ao oponente o que vier do par.
      case "input":
      case "state":
      case "event":
      case "rematch": {
        const opp = opponentOf(player);
        if (opp) send(opp, msg);
        break;
      }

      case "ping":
        send(player, { type: "pong", t: msg.t });
        break;
    }
  });

  ws.on("close", () => {
    endMatch(player, true);
    players.delete(player.id);
    broadcastLobby();
    console.log(
      `👋 ${player.emoji} ${player.nick} saiu  (online: ${players.size})`,
    );
  });

  ws.on("error", () => {
    /* erros de socket viram close logo em seguida */
  });
});

// Heartbeat: derruba conexões mortas a cada 30s.
const heartbeat = setInterval(() => {
  for (const p of players.values()) {
    if (!p.alive) {
      p.ws.terminate();
      continue;
    }
    p.alive = false;
    try {
      p.ws.ping();
    } catch {
      /* ignore */
    }
  }
}, 30_000);

wss.on("close", () => clearInterval(heartbeat));
