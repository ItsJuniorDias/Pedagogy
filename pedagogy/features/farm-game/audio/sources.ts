// features/farm-game/audio/sources.ts
// Mapa estático dos arquivos de áudio pré-renderizados (baked). Os imports
// precisam ser ESTÁTICOS para o Metro empacotar os assets.

import blocked from "../assets/audio/blocked.wav";
import build from "../assets/audio/build.wav";
import coin from "../assets/audio/coin.wav";
import errorSfx from "../assets/audio/error.wav";
import farmTheme from "../assets/audio/farm-theme.wav";
import harvest from "../assets/audio/harvest.wav";
import levelUp from "../assets/audio/level-up.wav";
import nextDay from "../assets/audio/next-day.wav";
import plant from "../assets/audio/plant.wav";
import tap from "../assets/audio/tap.wav";
import till from "../assets/audio/till.wav";
import water from "../assets/audio/water.wav";

/** Efeitos curtos (um arquivo por ação). */
export const SFX_SOURCES = {
  tap,
  blocked,
  error: errorSfx,
  till,
  plant,
  water,
  harvest,
  coin,
  build,
  nextDay,
  levelUp,
} as const;

/** Trilhas em loop. (Adicione `pong: require(...)` ao trazer o Pong.) */
export const MUSIC_SOURCES = {
  farm: farmTheme,
} as const;

export type SfxName = keyof typeof SFX_SOURCES;
export type TrackId = keyof typeof MUSIC_SOURCES;
