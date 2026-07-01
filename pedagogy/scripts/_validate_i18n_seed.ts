import * as EN from "../mocks/storyMocks";
import { STORY_CHAPTERS_AR } from "../mocks/i18n/ar";
import { STORY_CHAPTERS_ES } from "../mocks/i18n/es";
import { STORY_CHAPTERS_FR } from "../mocks/i18n/fr";
import { STORY_CHAPTERS_HI } from "../mocks/i18n/hi";
import { STORY_CHAPTERS_PT } from "../mocks/i18n/pt";
import { STORY_CHAPTERS_ZH } from "../mocks/i18n/zh";

const EN_BY_KEY: Record<string, any[]> = {
  ROCKETADVENTURE: EN.ROCKET_ADVENTURE, MAGICFOREST: EN.MAGIC_FOREST,
  OCEANFRIENDS: EN.OCEANFRIENDS, TINYSICENTIST: EN.TINY_SCIENTIST,
  DRAGONDIARY: EN.DRAGON_DIARY, DINOWORLD: EN.DINO_WORLD,
};
const OVERLAYS: Record<string, Record<string, any[]>> = {
  pt: STORY_CHAPTERS_PT, es: STORY_CHAPTERS_ES, fr: STORY_CHAPTERS_FR,
  zh: STORY_CHAPTERS_ZH, hi: STORY_CHAPTERS_HI, ar: STORY_CHAPTERS_AR,
};
let errors = 0;
const fail = (m: string) => { errors++; console.error("  x " + m); };
for (const [lang, map] of Object.entries(OVERLAYS)) {
  console.log(`\n[${lang}] ${Object.keys(map).length} historia(s)`);
  for (const [key, chapters] of Object.entries(map)) {
    const en = EN_BY_KEY[key];
    if (!en) { fail(`${key}: chave sem correspondencia`); continue; }
    if (chapters.length !== en.length) { fail(`${key}: ${chapters.length} vs ${en.length} cap`); continue; }
    chapters.forEach((ch: any, i: number) => {
      const e = en[i];
      if (ch.id !== e.id) fail(`${key}[${i}]: id`);
      if (ch.emoji !== e.emoji) fail(`${key}[${i}]: emoji`);
      if (!!ch.locked !== !!e.locked) fail(`${key}[${i}]: locked`);
      if (!Array.isArray(ch.pages) || ch.pages.length !== e.pages.length) fail(`${key}[${i}]: ${ch.pages?.length} vs ${e.pages.length} pgs`);
      if (!ch.title?.trim()) fail(`${key}[${i}]: titulo vazio`);
      if (!ch.subtitle?.trim()) fail(`${key}[${i}]: subtitulo vazio`);
      (ch.pages ?? []).forEach((p: string, j: number) => { if (!p?.trim()) fail(`${key}[${i}].pages[${j}] vazia`); });
    });
    console.log(`  ok ${key} (${chapters.length} cap)`);
  }
}
console.log(errors === 0 ? "\nOK integridade estrutural — todos os overlays batem com o ingles." : `\nFALHA: ${errors} problema(s).`);
process.exit(errors === 0 ? 0 : 1);
