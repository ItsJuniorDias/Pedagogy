/**
 * protocol.ts — Contrato de mensagens entre cliente e servidor (saguão + jogo).
 *
 * O mesmo formato é falado pelo `server/server.js`. Mantenha os dois em sincronia.
 *
 * Convenção de quadros (frames):
 *  • O HOST simula no "host frame": ele é a raquete de baixo (z = +PADDLE.z).
 *  • O GUEST vê o mundo ESPELHADO (X e Z negados) para também se sentir embaixo.
 *  • Logo, todo `NetState` viaja SEMPRE no host frame; o guest espelha ao render.
 */

import type { Phase } from "../types";

export interface Identity {
  id: string;
  nick: string;
  emoji: string;
}

/** Estado autoritativo enviado pelo host ~30x/s (sempre no host frame). */
export interface NetState {
  bx: number; // posição X da bola
  bz: number; // posição Z da bola
  hp: number; // X da raquete do host (perto da câmera do host)
  gp: number; // X da raquete do guest (longe, no host frame)
  hs: number; // placar do host
  gs: number; // placar do guest
  ph: Phase; // fase do jogo
  sm: number; // multiplicador de velocidade (speedMul)
  rl: number; // rally atual
}

/** Eventos pontuais (haptics / labels). `side` é sempre relativo ao host frame. */
export type NetEvent =
  | { kind: "point"; side: "host" | "guest" }
  | { kind: "effect"; side: "host" | "guest" }
  | { kind: "hit"; side: "host" | "guest" }
  | { kind: "over"; winner: "host" | "guest" }
  // Aperto de mão do RANKED: cada peer anuncia seu MMR atual no início da
  // partida (e responde ao do oponente). O servidor é só relay de "event",
  // então isto NÃO exige nenhuma mudança no servidor. Quem recebe usa o MMR
  // do oponente para calcular o Elo localmente ao fim da partida.
  | { kind: "hello"; mmr: number };

// ── Cliente → Servidor ───────────────────────────────────────────────────────

export type ClientMessage =
  | { type: "join_lobby" }
  | { type: "leave_lobby" }
  | { type: "input"; targetX: number } // guest → host (no guest frame)
  | { type: "state"; s: NetState } // host → guest
  | { type: "event"; event: NetEvent }
  | { type: "rematch" }
  | { type: "ping"; t: number };

// ── Servidor → Cliente ───────────────────────────────────────────────────────

export type ServerMessage =
  | { type: "welcome"; you: Identity }
  | { type: "lobby_joined" }
  | { type: "lobby"; players: Identity[]; count: number }
  | { type: "match_found"; matchId: string; isHost: boolean; opponent: Identity }
  | { type: "input"; targetX: number } // repassado do oponente (guest)
  | { type: "state"; s: NetState } // repassado do oponente (host)
  | { type: "event"; event: NetEvent } // repassado do oponente
  | { type: "rematch" } // repassado do oponente
  | { type: "opponent_left" }
  | { type: "pong"; t: number };

export interface MatchInfo {
  matchId: string;
  isHost: boolean;
  opponent: Identity;
}
