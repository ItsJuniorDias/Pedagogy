// ping-pong/audio/music.ts
// Controla a trilha em loop. A "composição" mora no arquivo pré-renderizado
// (farm-theme.wav, gerado por tools/render-audio.mjs); aqui só ligamos/desligamos.

import { engine } from "./engine";
import type { TrackId } from "./sources";

export type { TrackId };

export const music = {
  start(track: TrackId): void {
    engine.startMusic(track);
  },
  stop(): void {
    engine.stopMusic();
  },
};
