// features/farm-game/audio/sfx.ts
// Mesma API do módulo web (`sfx.till()`, `sfx.harvest()`, …), mas agora cada
// chamada toca o arquivo pré-renderizado correspondente via expo-audio.

import { engine } from "./engine";

export const sfx = {
  // UI / genéricos
  tap() {
    engine.playSfx("tap");
  },
  blocked() {
    engine.playSfx("blocked");
  },
  error() {
    engine.playSfx("error");
  },

  // Fazenda
  till() {
    engine.playSfx("till");
  },
  plant() {
    engine.playSfx("plant");
  },
  water() {
    engine.playSfx("water");
  },
  harvest() {
    engine.playSfx("harvest");
  },
  coin() {
    engine.playSfx("coin");
  },
  build() {
    engine.playSfx("build");
  },
  nextDay() {
    engine.playSfx("nextDay");
  },
  levelUp() {
    engine.playSfx("levelUp");
  },
};

export type Sfx = typeof sfx;
