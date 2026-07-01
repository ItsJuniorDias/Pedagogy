// mocks/i18n/zh/index.ts — 中文 overlay（种子）。Seed 优先于生成内容。
import type { LocalizedStoryMap } from "../types";

import { MAGIC_FOREST, ROCKET_ADVENTURE } from "./storyMocks.zh";

// ─── GENERATED:BEGIN (由 translateStories.ts 重写) ───────────────────────────
import { LETTERS } from "./LETTERS.zh";
import { OCEANLIFE } from "./OCEANLIFE.zh";
import { SPACEADVENTURE } from "./SPACEADVENTURE.zh";
import { STHMSTHAP } from "./STHMSTHAP.zh";
import { TAIRBRTY } from "./TAIRBRTY.zh";

const __GENERATED: LocalizedStoryMap = {
  "LETTERS": LETTERS,
  "OCEANLIFE": OCEANLIFE,
  "SPACEADVENTURE": SPACEADVENTURE,
  "STHMSTHAP": STHMSTHAP,
  "TAIRBRTY": TAIRBRTY,
};
// ─── GENERATED:END ────────────────────────────────────────────────────────────

export const STORY_CHAPTERS_ZH: LocalizedStoryMap = {
  ...__GENERATED,
  ROCKETADVENTURE: ROCKET_ADVENTURE,
  MAGICFOREST: MAGIC_FOREST,
};
