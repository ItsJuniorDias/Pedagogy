// scripts/translateStories.ts
// ─────────────────────────────────────────────────────────────────────────────
// Traduz o CONTEÚDO das histórias (capítulos/páginas/widgets) para os idiomas
// suportados, gerando overlays em mocks/i18n/<lang>/. Roda em Node (offline) —
// NUNCA no app. O app só consome os .ts gerados (via mocks/i18n → localizeChapters).
//
// Mesmo espírito do generateExercises.ts: provider OpenRouter (real) + mock (dry),
// idempotente e com no-clobber (não sobrescreve o que já existe sem --force).
//
//   # tudo que falta, em todos os idiomas (pula o que já existe: seed + gerado):
//   OPENROUTER_API_KEY=sk-or-... npx tsx scripts/translateStories.ts --all
//
//   # uma história específica em pt e es:
//   OPENROUTER_API_KEY=... npx tsx scripts/translateStories.ts THEVOWELVILLAGE --lang pt --lang es
//
//   # dry-run sem gastar API (gera stubs "[pt] …" só pra testar o encanamento):
//   npx tsx scripts/translateStories.ts --all --provider mock
//
// Flags:
//   --lang <code>     idioma alvo (repetível). Sem nenhum → todos (pt es fr zh hi ar).
//   --all             traduz TODAS as histórias de STORY_SOURCES.
//   --provider m|o    mock | openrouter (default: openrouter se houver key, senão mock).
//   --model <slug>    default: meta-llama/llama-3.3-70b-instruct:free
//   --force           regenera mesmo se o overlay já existir.
//   --limit <n>       processa no máx. n (história × idioma) nesta rodada.
//
// Requer (devDependencies):  npm i -D tsx
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Fontes em inglês (dados puros — mesmas usadas por generateExercises) ─────
import {
  KATUION,
  KEKKIHY,
  SPACEADVENTURE,
  STHM_STHAP,
  STRUCKBALL,
  TAIRBRTY,
} from "../mocks/chapterMocks";
import {
  THE_ANIMAL_WHISPERER,
  THE_ART_OF_BEING_WRONG,
  THE_CHRONONAUTS,
  THE_CITY_OF_CLOCKS,
  THE_CLOCKWORK_DETECTIVE,
  THE_CLOUD_READER,
  THE_COLOUR_THIEF,
  THE_CORAL_QUEEN,
  THE_DREAM_ARCHITECT,
  THE_FEELINGS_GARDEN,
  THE_FIELD_GUIDE_TO_IMPOSSIBLE_CREATURES,
  THE_FORGOTTEN_ALPHABET,
  THE_GIANT_WHO_WEPT_MOUNTAINS,
  THE_GLASS_COMPOSER,
  THE_GRANDMOTHERS_RECIPE_BOX,
  THE_INSECT_ORCHESTRA,
  THE_ISLAND_OF_MISTS,
  THE_LAST_BEEKEEPER,
  THE_LIGHTHOUSE_KEEPERS_SON,
  THE_MAPMAKERS_DAUGHTER,
  THE_NIGHT_GARDEN,
  THE_PAPER_GARDEN,
  THE_ROBOTS_JOURNAL,
  THE_SANDCASTLE_ARCHITECT,
  THE_SCIENCE_OF_SMALL_WONDERS,
  THE_SLOW_TRAIN_EXPRESS,
  THE_SPACE_FARMER,
  THE_SPELL_CHECKER,
  THE_TIME_LIBRARY,
  THE_UNDERWATER_EXPLORERS,
  THE_VOWEL_VILLAGE,
  THE_WIND_MAPPER,
  THE_WORD_COLLECTOR,
  THE_YOUNG_VOLCANOLOGIST,
} from "../mocks/historyMock";
import {
  ASTRONAUT,
  COLORS_ART,
  DINOSAURS,
  LETTERS,
  OCEAN_LIFE,
  SCHOLL,
  SCIENCE_LAB,
  SPACE,
} from "../mocks/learningMocks";
import {
  DINO_WORLD,
  DRAGON_DIARY,
  MAGIC_FOREST,
  OCEANFRIENDS,
  ROCKET_ADVENTURE,
  TINY_SCIENTIST,
} from "../mocks/storyMocks";

type Chapter = { id: string | number; pages: string[]; [k: string]: unknown };

// Espelha o STORY_CHAPTERS do leitor: chave normalizada → capítulos em inglês.
// A chave é EXATAMENTE a que o resolver procura (resolveStoryId do leitor).
const STORY_SOURCES: Record<string, Chapter[]> = {
  TAIRBRTY,
  STHMSTHAP: STHM_STHAP,
  KATUION,
  STRUCKBALL,
  KEKKIHY,
  SPACEADVENTURE,
  LETTERS,
  SCHOOL: SCHOLL,
  ASTRONAUT,
  SPACE,
  DINOSAURS,
  OCEANLIFE: OCEAN_LIFE,
  "COLORS&ART": COLORS_ART,
  SCIENCELAB: SCIENCE_LAB,
  ROCKETADVENTURE: ROCKET_ADVENTURE,
  MAGICFOREST: MAGIC_FOREST,
  OCEANFRIENDS,
  TINYSICENTIST: TINY_SCIENTIST,
  DRAGONDIARY: DRAGON_DIARY,
  DINOWORLD: DINO_WORLD,
  THEVOWELVILLAGE: THE_VOWEL_VILLAGE,
  THECLOCKWORKDETECTIVE: THE_CLOCKWORK_DETECTIVE,
  THEUNDERWATEREXPLORERS: THE_UNDERWATER_EXPLORERS,
  THEFEELINGSGARDEN: THE_FEELINGS_GARDEN,
  THEROBOTSJOURNAL: THE_ROBOTS_JOURNAL,
  THEMAPMAKERSDAUGHTER: THE_MAPMAKERS_DAUGHTER,
  THEWORDCOLLECTOR: THE_WORD_COLLECTOR,
  THELIGHTHOUSEKEEPERSSON: THE_LIGHTHOUSE_KEEPERS_SON,
  THEGRANDMOTHERSRECIPEBOX: THE_GRANDMOTHERS_RECIPE_BOX,
  THEFIELDGUIDE: THE_FIELD_GUIDE_TO_IMPOSSIBLE_CREATURES,
  THECLOUDREADER: THE_CLOUD_READER,
  THECOLOURTHIEF: THE_COLOUR_THIEF,
  THEGIANTWHOWEPT: THE_GIANT_WHO_WEPT_MOUNTAINS,
  THEINSECTORCHESTRA: THE_INSECT_ORCHESTRA,
  THENIGHTGARDEN: THE_NIGHT_GARDEN,
  THESCIENCEOFSMALLWONDERS: THE_SCIENCE_OF_SMALL_WONDERS,
  THESLOWTRAINEXPRESS: THE_SLOW_TRAIN_EXPRESS,
  THETIMELIBRARY: THE_TIME_LIBRARY,
  THEARTOFBEING: THE_ART_OF_BEING_WRONG,
  THESANDCASTLEARCHITECT: THE_SANDCASTLE_ARCHITECT,
  THESPELLCHECKER: THE_SPELL_CHECKER,
  THEVOLCANOLOGIST: THE_YOUNG_VOLCANOLOGIST,
  THEFORGOTTENALPHABET: THE_FORGOTTEN_ALPHABET,
  THEBEEKEEPER: THE_LAST_BEEKEEPER,
  THEISLANDOFMISTS: THE_ISLAND_OF_MISTS,
  THECITYOFCLOCKS: THE_CITY_OF_CLOCKS,
  THECORALQUEEN: THE_CORAL_QUEEN,
  THEGLASSCOMPOSER: THE_GLASS_COMPOSER,
  THEWINDMAPPER: THE_WIND_MAPPER,
  THEANIMALWHISPERER: THE_ANIMAL_WHISPERER,
  THEDREAMARCHITECT: THE_DREAM_ARCHITECT,
  THECHRONONAUTS: THE_CHRONONAUTS,
  THEPAPERGARDEN: THE_PAPER_GARDEN,
  THESPACEFARMER: THE_SPACE_FARMER,
};

// idioma → nome que o modelo entende (para o prompt)
const LANG_NAMES: Record<string, string> = {
  pt: "Brazilian Portuguese",
  es: "Spanish (neutral Latin American)",
  fr: "French",
  zh: "Simplified Chinese",
  hi: "Hindi",
  ar: "Modern Standard Arabic",
};
const ALL_LANGS = Object.keys(LANG_NAMES);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N_DIR = path.resolve(__dirname, "../mocks/i18n");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

// ─── util ─────────────────────────────────────────────────────────────────────

/** Identificador/arquivo seguro a partir da chave (ex.: "COLORS&ART" → "COLORS_ART"). */
function safeId(key: string): string {
  const id = key.replace(/[^A-Za-z0-9]/g, "_");
  return /^[0-9]/.test(id) ? "_" + id : id;
}

/** Extrai um array JSON mesmo se vier com ``` ou texto em volta. (igual ao generateExercises) */
function parseJsonArray(raw: string): unknown[] {
  let s = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  const parsed = JSON.parse(s);
  if (!Array.isArray(parsed)) throw new Error("resposta não é um array JSON");
  return parsed;
}

// ─── Providers ────────────────────────────────────────────────────────────────

interface Provider {
  name: string;
  translate(chapters: Chapter[], lang: string): Promise<Chapter[]>;
}

const SYSTEM_PROMPT = `You are a professional children's-book localizer. You translate story chapters for a kids' reading app.

You will receive a JSON array of chapter objects. Return a JSON array of the SAME length, in the SAME order, with the SAME keys in every object. Output ONLY the JSON array — no markdown, no code fences, no commentary.

Translate INTO the target language:
- "title", "subtitle" and every string inside the "pages" array (keep the pages array the SAME length — one translated page per source page).
- Any human-readable text inside optional widget objects (e.g. riddle.question/answer, wordEntry.definition/example, recipe.name/ingredients/instructions, creatureCard fields, verse.lines, feelingCard.prompt/affirmation, dictionaryEntry.definition, matchReport.verdict, etc.).

Keep UNCHANGED (copy verbatim):
- "id", "emoji", "locked", and any date-like field (e.g. "diaryDate").
- "letterFriend.letter" (a single alphabet letter). You MAY adapt letterFriend.character/word/sound naturally, but keep the letter itself.
- Proper names of characters and places (Leo, Cosmo, Mia, Pip, Nova, etc.), unless a well-established localized form exists.

Register: warm, simple, age-appropriate. Preserve line breaks (\\n) inside pages exactly. Never add or drop chapters or pages.`;

class OpenRouterProvider implements Provider {
  name: string;
  constructor(
    private apiKey: string,
    private model: string,
  ) {
    this.name = `openrouter:${model}`;
  }

  async translate(chapters: Chapter[], lang: string): Promise<Chapter[]> {
    const userPrompt = `Target language: ${LANG_NAMES[lang]}.

CHAPTERS (JSON):
${JSON.stringify(chapters, null, 2)}

Return ONLY the translated JSON array.`;

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err: any = new Error(
        `OpenRouter HTTP ${res.status}: ${body.slice(0, 400)}`,
      );
      if (res.status === 401 || res.status === 403) err.fatal = true; // key ruim → aborta
      throw err;
    }
    const data: any = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const arr = parseJsonArray(content) as Chapter[];
    return arr;
  }
}

/** Mock: não chama API — só prefixa os textos (útil para testar o encanamento). */
class MockProvider implements Provider {
  name = "mock";
  async translate(chapters: Chapter[], lang: string): Promise<Chapter[]> {
    const tag = `[${lang}] `;
    const tr = (s: string) => tag + s;
    return chapters.map((ch) => ({
      ...ch,
      title: typeof ch.title === "string" ? tr(ch.title) : ch.title,
      subtitle: typeof ch.subtitle === "string" ? tr(ch.subtitle) : ch.subtitle,
      pages: ch.pages.map(tr),
    }));
  }
}

// ─── Validação estrutural do que voltou (barreira anti-lixo) ─────────────────
function assertSameShape(en: Chapter[], tr: Chapter[], key: string, lang: string) {
  if (!Array.isArray(tr) || tr.length !== en.length)
    throw new Error(`[${lang}] ${key}: nº de capítulos divergente`);
  en.forEach((e, i) => {
    const t = tr[i];
    if (!t || !Array.isArray(t.pages) || t.pages.length !== e.pages.length)
      throw new Error(`[${lang}] ${key}: capítulo ${i} com páginas divergentes`);
    if (!String(t.title ?? "").trim() || !String(t.subtitle ?? "").trim())
      throw new Error(`[${lang}] ${key}: capítulo ${i} sem título/subtítulo`);
  });
}

// ─── Escrita do arquivo do overlay + reescrita do bloco GENERATED ────────────

function writeStoryFile(lang: string, key: string, model: string, data: Chapter[]) {
  const id = safeId(key);
  const file = path.join(I18N_DIR, lang, `${id}.${lang}.ts`);
  const body = `// AUTO-GERADO por scripts/translateStories.ts — NÃO editar à mão.
// história: ${key} · idioma: ${lang} · modelo: ${model} · ${new Date().toISOString().slice(0, 10)}
import type { LocalizedChapter } from "../types";

export const ${id}: LocalizedChapter[] = ${JSON.stringify(data, null, 2)};
`;
  fs.writeFileSync(file, body, "utf8");
  return file;
}

/** Reescreve o bloco entre GENERATED:BEGIN/END do index a partir dos arquivos no disco. */
function rebuildGeneratedBlock(lang: string) {
  const dir = path.join(I18N_DIR, lang);
  const idx = path.join(dir, "index.ts");
  const src = fs.readFileSync(idx, "utf8");

  // reverse: safeId → chave real (para montar o mapa)
  const byId = new Map<string, string>();
  for (const key of Object.keys(STORY_SOURCES)) byId.set(safeId(key), key);

  const suffix = `.${lang}.ts`;
  const generated = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(suffix) && f !== `storyMocks${suffix}`)
    .map((f) => f.slice(0, -suffix.length)) // safeId
    .filter((id) => byId.has(id))
    .sort();

  const imports = generated
    .map((id) => `import { ${id} } from "./${id}.${lang}";`)
    .join("\n");
  const entries = generated
    .map((id) => `  ${JSON.stringify(byId.get(id)!)}: ${id},`)
    .join("\n");

  const block =
    generated.length === 0
      ? `const __GENERATED: LocalizedStoryMap = {};`
      : `${imports}\n\nconst __GENERATED: LocalizedStoryMap = {\n${entries}\n};`;

  const re = /(GENERATED:BEGIN[^\n]*\n)[\s\S]*?(\n[^\n]*GENERATED:END)/;
  if (!re.test(src)) {
    throw new Error(`index.ts de ${lang} sem marcadores GENERATED:BEGIN/END`);
  }
  fs.writeFileSync(idx, src.replace(re, `$1${block}$2`), "utf8");
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  const ids: string[] = [];
  const langs: string[] = [];
  let all = false,
    force = false;
  let provider = "";
  let model = DEFAULT_MODEL;
  let limit = Infinity;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") all = true;
    else if (a === "--force") force = true;
    else if (a === "--lang") langs.push(argv[++i]);
    else if (a === "--provider") provider = argv[++i];
    else if (a === "--model") model = argv[++i];
    else if (a === "--limit") limit = parseInt(argv[++i], 10);
    else if (!a.startsWith("--")) ids.push(a.toUpperCase());
  }
  return { ids, langs, all, force, provider, model, limit };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const targetLangs = opts.langs.length ? opts.langs : ALL_LANGS;
  for (const l of targetLangs)
    if (!LANG_NAMES[l]) throw new Error(`idioma não suportado: ${l}`);

  let storyKeys: string[];
  if (opts.all) storyKeys = Object.keys(STORY_SOURCES);
  else if (opts.ids.length) {
    storyKeys = opts.ids.filter((k) => {
      if (!STORY_SOURCES[k]) console.warn(`⚠️  história desconhecida: ${k} (ignorada)`);
      return !!STORY_SOURCES[k];
    });
  } else {
    console.log(
      "Uso: npx tsx scripts/translateStories.ts [IDS…|--all] [--lang xx …] [--provider mock|openrouter] [--force]\n" +
        "Ex.:  npx tsx scripts/translateStories.ts --all --provider mock",
    );
    process.exit(0);
    return;
  }

  const key = process.env.OPENROUTER_API_KEY ?? process.env.VITE_OPENROUTER_API_KEY;
  const useMock = opts.provider === "mock" || (!opts.provider && !key);
  if (!useMock && !key) {
    console.error("❌ Sem OPENROUTER_API_KEY. Use --provider mock para dry-run.");
    process.exit(1);
  }
  const provider: Provider = useMock
    ? new MockProvider()
    : new OpenRouterProvider(key!, opts.model);

  console.log(`\n🌍 Tradução de histórias · provider: ${provider.name}`);
  console.log(`   idiomas: ${targetLangs.join(", ")} · histórias: ${storyKeys.length}\n`);

  let done = 0,
    skipped = 0,
    failed = 0,
    processed = 0;

  for (const lang of targetLangs) {
    // chaves que já existem NESTE idioma (seed manual + geradas antes)
    const existing = new Set<string>(
      Object.keys(
        (await import(`../mocks/i18n/${lang}/index.ts`))[
          `STORY_CHAPTERS_${lang.toUpperCase()}`
        ] as Record<string, unknown>,
      ),
    );

    let touched = false;
    for (const storyKey of storyKeys) {
      if (processed >= opts.limit) break;
      if (existing.has(storyKey) && !opts.force) {
        skipped++;
        continue;
      }
      processed++;
      const en = STORY_SOURCES[storyKey];
      try {
        process.stdout.write(`  • [${lang}] ${storyKey} … `);
        const tr = await provider.translate(en, lang);
        assertSameShape(en, tr, storyKey, lang);
        // reimpõe campos estruturais (segurança extra além do resolver)
        const safe = tr.map((t, i) => ({
          ...t,
          id: en[i].id,
          emoji: (en[i] as any).emoji,
          locked: (en[i] as any).locked,
        }));
        writeStoryFile(lang, storyKey, useMock ? "mock" : opts.model, safe);
        touched = true;
        done++;
        console.log("ok");
      } catch (e: any) {
        failed++;
        console.log("FALHOU: " + e.message);
        if (e.fatal) {
          console.error("\n⛔ Erro fatal (auth). Abortando.");
          process.exit(1);
        }
      }
    }
    if (touched) rebuildGeneratedBlock(lang);
  }

  console.log(
    `\n✅ Concluído. gerados: ${done} · pulados (já existiam): ${skipped} · falhas: ${failed}`,
  );
  if (!useMock)
    console.log(
      "   Rode o typecheck do app (tsc --noEmit) e teste trocando o idioma no perfil.",
    );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
