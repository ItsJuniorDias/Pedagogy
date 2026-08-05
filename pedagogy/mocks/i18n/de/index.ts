// mocks/i18n/de/index.ts — Deutsch-Overlay.
//
// Aktuell nur die zwei hand-übersetzten Seed-Geschichten (ROCKET_ADVENTURE +
// MAGIC_FOREST) auf Deutsch. Für ALLE anderen Geschichten fällt der Resolver in
// mocks/i18n/index.ts automatisch auf das Englische zurück (das ist die
// kanonische Quelle) — solange hier kein Eintrag existiert, wird nichts falsch
// gerendert.
//
// Um die restlichen ~50 Geschichten (ASTRONAUT, TAIRBRTY, THEVOWELVILLAGE, …)
// auch auf Deutsch anzuzeigen, die Pipeline neu ausführen:
//
//   bunx tsx scripts/translateStories.ts --lang de
//
// Sie schreibt hier automatisch ASTRONAUT.de.ts, THEVOWELVILLAGE.de.ts, usw.
// und trägt sie unten in STORY_CHAPTERS_DE ein (der GENERATED-Block).
// Bis dahin sehen deutschsprachige NutzerInnen für diese Geschichten die
// englische Fassung — nicht die alte chinesische.

import type { LocalizedStoryMap } from "../types";

import { MAGIC_FOREST, ROCKET_ADVENTURE } from "./storyMocks.de";

// ─── GENERATED:BEGIN (überschrieben durch translateStories.ts) ───────────────
// (leer — die Pipeline füllt diesen Block beim nächsten Lauf mit den ~50
// generierten Geschichten. Bis dahin bleibt der englische Fallback aktiv.)
const __GENERATED: LocalizedStoryMap = {};
// ─── GENERATED:END ────────────────────────────────────────────────────────────

export const STORY_CHAPTERS_DE: LocalizedStoryMap = {
  ...__GENERATED,
  ROCKETADVENTURE: ROCKET_ADVENTURE,
  MAGICFOREST: MAGIC_FOREST,
};
