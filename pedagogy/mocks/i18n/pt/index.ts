// mocks/i18n/pt/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Overlay pt-BR. As chaves DEVEM bater 1:1 com o STORY_CHAPTERS do leitor
// (app/(details)/index.tsx) — é assim que o resolver acha a tradução.
//
// O seed manual (storyMocks.pt) tem PRECEDÊNCIA sobre o que o pipeline gera:
// no export, `...__GENERATED` vem primeiro e as entradas manuais o sobrescrevem.
// ─────────────────────────────────────────────────────────────────────────────

import type { LocalizedStoryMap } from "../types";

import {
  DINO_WORLD,
  DRAGON_DIARY,
  MAGIC_FOREST,
  OCEANFRIENDS,
  ROCKET_ADVENTURE,
  TINY_SCIENTIST,
} from "./storyMocks.pt";

// ─── GENERATED:BEGIN (não editar à mão — reescrito por translateStories.ts) ───
const __GENERATED: LocalizedStoryMap = {};
// ─── GENERATED:END ────────────────────────────────────────────────────────────

export const STORY_CHAPTERS_PT: LocalizedStoryMap = {
  ...__GENERATED,
  // seed manual (chaves conforme resolveStoryId do leitor) — vence o gerado:
  ROCKETADVENTURE: ROCKET_ADVENTURE,
  MAGICFOREST: MAGIC_FOREST,
  OCEANFRIENDS: OCEANFRIENDS,
  TINYSICENTIST: TINY_SCIENTIST, // (grafia da chave conforme o STORY_CHAPTERS de origem)
  DRAGONDIARY: DRAGON_DIARY,
  DINOWORLD: DINO_WORLD,
};
