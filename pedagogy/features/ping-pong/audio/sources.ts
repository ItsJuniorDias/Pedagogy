// ping-pong/audio/sources.ts
// Mapa estático dos arquivos de áudio pré-renderizados do NEON PONG.
// Imports ESTÁTICOS para o Metro empacotar os assets.

import paddleCpu from "../assets/audio/paddle-cpu.wav";
import paddleCpuHard from "../assets/audio/paddle-cpu-hard.wav";
import paddlePlayer from "../assets/audio/paddle-player.wav";
import paddlePlayerHard from "../assets/audio/paddle-player-hard.wav";
import pongTheme from "../assets/audio/pong-theme.wav";
import scoreCpu from "../assets/audio/score-cpu.wav";
import scorePlayer from "../assets/audio/score-player.wav";
import serve from "../assets/audio/serve.wav";
import spin from "../assets/audio/spin.wav";
import lose from "../assets/audio/lose.wav";
import wall from "../assets/audio/wall.wav";
import win from "../assets/audio/win.wav";

export const SFX_SOURCES = {
  serve,
  wall,
  spin,
  scorePlayer,
  scoreCpu,
  win,
  lose,
  paddlePlayer,
  paddlePlayerHard,
  paddleCpu,
  paddleCpuHard,
} as const;

/** Trilhas em loop. */
export const MUSIC_SOURCES = {
  pong: pongTheme,
} as const;

export type SfxName = keyof typeof SFX_SOURCES;
export type TrackId = keyof typeof MUSIC_SOURCES;
