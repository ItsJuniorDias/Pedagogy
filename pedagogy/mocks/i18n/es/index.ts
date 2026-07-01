// mocks/i18n/es/index.ts — overlay español. Chaves == STORY_CHAPTERS do leitor.
// Seed manual vence o gerado (spread order).
import type { LocalizedStoryMap } from "../types";

import {
  DINO_WORLD,
  DRAGON_DIARY,
  MAGIC_FOREST,
  OCEANFRIENDS,
  ROCKET_ADVENTURE,
  TINY_SCIENTIST,
} from "./storyMocks.es";

// ─── GENERATED:BEGIN (reescrito por translateStories.ts) ─────────────────────
const __GENERATED: LocalizedStoryMap = {};
// ─── GENERATED:END ────────────────────────────────────────────────────────────

export const STORY_CHAPTERS_ES: LocalizedStoryMap = {
  ...__GENERATED,
  ROCKETADVENTURE: ROCKET_ADVENTURE,
  MAGICFOREST: MAGIC_FOREST,
  OCEANFRIENDS: OCEANFRIENDS,
  TINYSICENTIST: TINY_SCIENTIST,
  DRAGONDIARY: DRAGON_DIARY,
  DINOWORLD: DINO_WORLD,
};
