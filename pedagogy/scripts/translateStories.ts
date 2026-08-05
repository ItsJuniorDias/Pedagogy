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
//   # apaga a saída gerada (inclusive stubs de mock) e zera os blocos GENERATED,
//   # preservando as traduções feitas à mão (storyMocks.<lang>.ts):
//   npx tsx scripts/translateStories.ts --clean
//
// IMPORTANTE: sem OPENROUTER_API_KEY no ambiente, o script FALHA (não usa mock
// silenciosamente). O mock só roda com --provider mock explícito.
//
// Flags:
//   --lang <code>     idioma alvo (repetível). Sem nenhum → todos (pt es fr de hi ar).
//   --all             traduz TODAS as histórias de STORY_SOURCES.
//   --clean           remove overlays gerados + zera blocos GENERATED (mantém seeds).
//   --provider m|o    mock (dry-run) | openrouter. Default: openrouter (exige a key).
//   --models <lista>  cadeia de fallback: um preset (free|cheap|quality) OU lista
//                     separada por vírgula (ex.: "deepseek/deepseek-v4-flash,google/gemini-2.5-flash-lite").
//                     Se um modelo tomar 429/erro, cai pro próximo da cadeia na hora.
//   --model <slug>    um único modelo (atalho p/ cadeia de 1). Default: preset "free".
//   --force           regenera mesmo se o overlay já existir.
//   --limit <n>       processa no máx. n (história × idioma) nesta rodada.
//   --retries <n>     passes completos sobre a cadeia em 429/5xx (default: 5).
//   --delay <ms>      pausa por chamada (default: 0 com concorrência; 1200 sem).
//   --concurrency <n> (ou -j) traduções em paralelo. Auto: paga→6, :free→2, mock→8.
//                     No pago, -j 8/10 acelera bastante; no :free, mantenha baixo.
//
// Presets de modelos (--models <nome>):
//   free     llama-3.3-70b:free → deepseek-v3-0324:free → openrouter/free   (padrão, $0)
//   cheap    deepseek-v4-flash → gemini-2.5-flash-lite   (~centavos; exige crédito)
//   quality  gpt-4o-mini → gemini-2.5-flash              (mais nuance p/ o funil)
//
// Rate-limit (429): o modelo :free é limitado upstream. O script honra o header
// Retry-After e faz backoff exponencial automaticamente; histórias que ainda assim
// falharem não abortam a rodada — rode --all de novo depois (no-clobber preenche as
// que faltam). Para limites maiores, use uma key própria/paga da OpenRouter.
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
  de: "German",
  hi: "Hindi",
  ar: "Modern Standard Arabic",
};
const ALL_LANGS = Object.keys(LANG_NAMES);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N_DIR = path.resolve(__dirname, "../mocks/i18n");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ─── Modelos ──────────────────────────────────────────────────────────────────
// Cadeias de fallback nomeadas. Selecione com --models <nome> (ex.: --models cheap)
// ou passe uma lista literal: --models "a/b,c/d". Sem flag → preset "free".
//
// ⚠️ Sobre o tier FREE da OpenRouter: o limite (~20 req/min) é COMPARTILHADO entre
//    TODOS os modelos :free da sua conta. Trocar de modelo free NÃO multiplica o
//    limite — ajuda só contra throttle de um provider específico upstream. Para
//    limite maior + prioridade, adicione uns trocados de crédito e use um preset pago.
//    (Este job inteiro — ~300 traduções curtas — custa centavos num modelo flash.)
const MODEL_PRESETS: Record<string, string[]> = {
  // grátis (padrão). Sujeito ao teto compartilhado de req/min; use --delay maior.
  free: [
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "openrouter/free",
  ],
  // baratíssimo e confiável (exige crédito na conta; remove o teto do free).
  // preços ~mid-2026/M tokens: v4-flash ~$0.09/$0.18 · flash-lite ~$0.10 (afinado p/ tradução).
  cheap: ["deepseek/deepseek-v4-flash", "google/gemini-2.5-flash-lite"],
  // qualidade/nuance p/ o funil (onboarding/paywall). Ainda barato.
  quality: ["openai/gpt-4o-mini", "google/gemini-2.5-flash"],
};
const DEFAULT_CHAIN = MODEL_PRESETS.free;

/** Resolve a cadeia de modelos a partir das flags (--models preset|lista | --model x | padrão). */
function resolveChain(models: string[], model: string): string[] {
  if (models.length === 1 && MODEL_PRESETS[models[0]]) return MODEL_PRESETS[models[0]];
  if (models.length) return models;
  if (model) return [model];
  return DEFAULT_CHAIN;
}

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
  // devolve os capítulos traduzidos + qual modelo os produziu (seguro sob concorrência)
  translate(
    chapters: Chapter[],
    lang: string,
  ): Promise<{ chapters: Chapter[]; model: string }>;
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

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Nome curto do modelo p/ log: "meta-llama/llama-3.3-70b-instruct:free" → "llama-3.3-70b-instruct". */
const shortModel = (m: string) => m.split("/").pop()!.replace(/:free$/, "");

/**
 * Quanto esperar antes de repetir uma requisição que tomou 429/5xx.
 * Prioridade: header Retry-After → retry_after_seconds no corpo → backoff exponencial.
 */
function retryDelayMs(
  retryAfterHeader: string | null,
  body: string,
  attempt: number,
): number {
  const buffer = 500; // folga pra não repetir cedo demais
  // 1) header Retry-After (em segundos)
  if (retryAfterHeader) {
    const s = Number(retryAfterHeader);
    if (Number.isFinite(s) && s >= 0) return Math.max(500, s * 1000) + buffer;
  }
  // 2) corpo: "retry_after_seconds" ou "retry_after_seconds_raw"
  const m = body.match(/retry_after_seconds(?:_raw)?"?\s*:\s*"?([\d.]+)/);
  if (m) {
    const s = parseFloat(m[1]);
    if (Number.isFinite(s) && s >= 0) return Math.max(500, s * 1000) + buffer;
  }
  // 3) backoff exponencial com teto de 30s + jitter (2s, 4s, 8s, 16s, 30s…)
  const base = Math.min(30_000, 2000 * 2 ** attempt);
  return base + Math.floor(Math.random() * 500);
}

class OpenRouterProvider implements Provider {
  name: string;
  constructor(
    private apiKey: string,
    private models: string[], // cadeia de fallback
    private maxPasses = 5, // passes completos sobre a cadeia (--retries)
  ) {
    this.name =
      models.length === 1
        ? `openrouter:${models[0]}`
        : `openrouter[cadeia: ${models.map(shortModel).join(" → ")}]`;
  }

  /** Uma tentativa contra UM modelo. Devolve resultado ou detalhes do erro HTTP. */
  private async callOnce(model: string, userPrompt: string) {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });
    if (res.ok) {
      const data: any = await res.json();
      const content: string = data?.choices?.[0]?.message?.content ?? "";
      return { ok: true as const, data: parseJsonArray(content) as Chapter[] };
    }
    const body = await res.text().catch(() => "");
    return {
      ok: false as const,
      status: res.status,
      retryAfter: res.headers.get("retry-after"),
      body,
    };
  }

  async translate(
    chapters: Chapter[],
    lang: string,
  ): Promise<{ chapters: Chapter[]; model: string }> {
    const userPrompt = `Target language: ${LANG_NAMES[lang]}.

CHAPTERS (JSON):
${JSON.stringify(chapters, null, 2)}

Return ONLY the translated JSON array.`;

    let lastStatus = 0;
    for (let pass = 0; pass < this.maxPasses; pass++) {
      let waitHeader: string | null = null;
      let waitBody = "";
      let sawTransient = false; // 429/5xx em algum modelo → vale esperar e repetir

      for (const model of this.models) {
        const r = await this.callOnce(model, userPrompt);
        if (r.ok) return { chapters: r.data, model };
        lastStatus = r.status;
        // auth → fatal: nem adianta trocar de modelo
        if (r.status === 401 || r.status === 403) {
          const e: any = new Error(
            `OpenRouter HTTP ${r.status}: ${r.body.slice(0, 200)}`,
          );
          e.fatal = true;
          throw e;
        }
        if (r.status === 429) {
          sawTransient = true;
          waitHeader = r.retryAfter ?? waitHeader; // guarda o maior Retry-After
          waitBody = r.body || waitBody;
        } else if (r.status >= 500 && r.status < 600) {
          sawTransient = true;
        }
        // 429 / 5xx / 4xx (modelo indisponível) → cai pro PRÓXIMO modelo da cadeia
      }

      // esgotou a cadeia neste pass
      if (!sawTransient) break; // só erros não-recuperáveis (ex.: 404) → não repete
      if (pass < this.maxPasses - 1) {
        const waitMs = retryDelayMs(waitHeader, waitBody, pass);
        // linha completa (não parcial) p/ não embaralhar sob concorrência
        console.log(
          `  ⏳ [${lang}] rate-limit — aguardando ${(waitMs / 1000).toFixed(0)}s (pass ${pass + 2}/${this.maxPasses})`,
        );
        await sleep(waitMs);
      }
    }
    throw new Error(`todos os modelos falharam (último HTTP ${lastStatus})`);
  }
}

/** Mock: não chama API — só prefixa os textos (útil para testar o encanamento). */
class MockProvider implements Provider {
  name = "mock";
  async translate(
    chapters: Chapter[],
    lang: string,
  ): Promise<{ chapters: Chapter[]; model: string }> {
    const tag = `[${lang}] `;
    const tr = (s: string) => tag + s;
    return {
      model: "mock",
      chapters: chapters.map((ch) => ({
        ...ch,
        title: typeof ch.title === "string" ? tr(ch.title) : ch.title,
        subtitle: typeof ch.subtitle === "string" ? tr(ch.subtitle) : ch.subtitle,
        pages: ch.pages.map(tr),
      })),
    };
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

/**
 * Remove TODOS os overlays gerados (`<safeId>.<lang>.ts`) mantendo os seeds
 * feitos à mão (`storyMocks.<lang>.ts`) e zera o bloco GENERATED de cada index.
 * Útil pra apagar saída antiga/mock antes de regerar de verdade.
 */
function cleanGenerated(langs: string[]) {
  let removed = 0;
  for (const lang of langs) {
    const dir = path.join(I18N_DIR, lang);
    if (!fs.existsSync(dir)) continue;
    const suffix = `.${lang}.ts`;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith(suffix) && f !== `storyMocks${suffix}`) {
        fs.unlinkSync(path.join(dir, f));
        removed++;
      }
    }
    rebuildGeneratedBlock(lang); // sem arquivos gerados → escreve bloco vazio {}
  }
  console.log(
    `🧹 Limpeza: ${removed} arquivo(s) gerado(s) removido(s); blocos GENERATED zerados.`,
  );
  console.log("   Seeds à mão (storyMocks.<lang>.ts) foram preservados.");
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  const ids: string[] = [];
  const langs: string[] = [];
  let all = false,
    force = false,
    clean = false;
  let provider = "";
  let model = "";
  let models: string[] = [];
  let limit = Infinity;
  let retries = 5;
  let delay = -1; // -1 = automático (resolvido no main conforme o provider)
  let concurrency = 0; // 0 = automático (resolvido no main conforme a cadeia)
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") all = true;
    else if (a === "--force") force = true;
    else if (a === "--clean") clean = true;
    else if (a === "--lang") langs.push(argv[++i]);
    else if (a === "--provider") provider = argv[++i];
    else if (a === "--model") model = argv[++i];
    else if (a === "--models")
      models = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--limit") limit = parseInt(argv[++i], 10);
    else if (a === "--retries") retries = parseInt(argv[++i], 10);
    else if (a === "--delay") delay = parseInt(argv[++i], 10);
    else if (a === "--concurrency" || a === "-j")
      concurrency = parseInt(argv[++i], 10);
    else if (!a.startsWith("--")) ids.push(a.toUpperCase());
  }
  return {
    ids, langs, all, force, clean, provider, model, models,
    limit, retries, delay, concurrency,
  };
}

/**
 * Executa `worker` sobre `items` com no máx. `concurrency` tarefas simultâneas.
 * (Pool simples: N runners puxam da mesma fila até acabar.)
 */
async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const n = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(
    Array.from({ length: n }, async () => {
      for (;;) {
        const i = next++;
        if (i >= items.length) return;
        await worker(items[i]);
      }
    }),
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const targetLangs = opts.langs.length ? opts.langs : ALL_LANGS;
  for (const l of targetLangs)
    if (!LANG_NAMES[l]) throw new Error(`idioma não suportado: ${l}`);

  if (opts.clean) {
    cleanGenerated(targetLangs);
    return;
  }

  let storyKeys: string[];
  if (opts.all) storyKeys = Object.keys(STORY_SOURCES);
  else if (opts.ids.length) {
    storyKeys = opts.ids.filter((k) => {
      if (!STORY_SOURCES[k]) console.warn(`⚠️  história desconhecida: ${k} (ignorada)`);
      return !!STORY_SOURCES[k];
    });
  } else {
    console.log(
      "Uso: npx tsx scripts/translateStories.ts [IDS…|--all] [--lang xx …] [--clean] [--provider mock|openrouter] [--force]\n" +
        "Traduzir tudo:  OPENROUTER_API_KEY=sk-or-... npx tsx scripts/translateStories.ts --all\n" +
        "Limpar saída:   npx tsx scripts/translateStories.ts --clean\n" +
        "Testar (mock):  npx tsx scripts/translateStories.ts --all --provider mock",
    );
    process.exit(0);
    return;
  }

  const key = process.env.OPENROUTER_API_KEY ?? process.env.VITE_OPENROUTER_API_KEY;
  // Mock SÓ quando pedido de forma explícita. Sem chave e sem --provider mock,
  // falha alto — nunca "finge" que traduziu.
  const useMock = opts.provider === "mock";
  if (!useMock && !key) {
    console.error(
      "❌ Sem OPENROUTER_API_KEY no ambiente — nada foi traduzido.\n" +
        "   Rode com a sua chave da OpenRouter:\n" +
        "     OPENROUTER_API_KEY=sk-or-... npx tsx scripts/translateStories.ts --all\n" +
        "   (Só pra testar a fiação, sem traduzir de verdade, adicione: --provider mock)",
    );
    process.exit(1);
  }
  const chain = resolveChain(opts.models, opts.model);
  const provider: Provider = useMock
    ? new MockProvider()
    : new OpenRouterProvider(key!, chain, opts.retries);

  // Concorrência: quantas traduções em paralelo. Auto conforme a cadeia:
  //   mock → 8 · cadeia paga → 6 · cadeia :free → 2 (o teto do free é compartilhado).
  const isFreeChain = chain.every((m) => m.endsWith(":free"));
  const concurrency =
    opts.concurrency > 0 ? opts.concurrency : useMock ? 8 : isFreeChain ? 2 : 6;
  // Atraso entre chamadas: com concorrência > 1, a própria concorrência dita o ritmo
  // (default 0). Sem concorrência, mantém 1200ms no free p/ evitar 429.
  const interDelayMs =
    opts.delay >= 0 ? opts.delay : concurrency > 1 ? 0 : useMock ? 0 : 1200;

  if (useMock) {
    console.log(
      "⚠️  MODO MOCK (dry-run): só prefixa [lang], NÃO traduz de verdade.\n" +
        "    Remova --provider mock e defina OPENROUTER_API_KEY para traduzir.",
    );
  }
  console.log(`\n🌍 Tradução de histórias · provider: ${provider.name}`);
  if (!useMock)
    console.log(
      `   concorrência: ${concurrency} · retries: ${opts.retries} · atraso: ${interDelayMs}ms`,
    );

  // Fila achatada (idioma × história) do que falta traduzir.
  type Task = { lang: string; key: string };
  const tasks: Task[] = [];
  let skipped = 0;
  for (const lang of targetLangs) {
    // chaves que já existem NESTE idioma (seed manual + geradas antes)
    const existing = new Set<string>(
      Object.keys(
        (await import(`../mocks/i18n/${lang}/index.ts`))[
          `STORY_CHAPTERS_${lang.toUpperCase()}`
        ] as Record<string, unknown>,
      ),
    );
    for (const key of storyKeys) {
      if (existing.has(key) && !opts.force) {
        skipped++;
        continue;
      }
      tasks.push({ lang, key });
    }
  }
  const queue = Number.isFinite(opts.limit) ? tasks.slice(0, opts.limit) : tasks;
  const total = queue.length;
  console.log(
    `   idiomas: ${targetLangs.join(", ")} · a traduzir: ${total} · já existiam: ${skipped}\n`,
  );

  let done = 0,
    failed = 0,
    completed = 0;
  const touchedLangs = new Set<string>();
  let aborted = false;

  await runPool(queue, concurrency, async (task) => {
    if (aborted) return;
    const en = STORY_SOURCES[task.key];
    if (interDelayMs > 0) await sleep(interDelayMs); // pacing opcional por worker
    try {
      const { chapters: tr, model } = await provider.translate(en, task.lang);
      assertSameShape(en, tr, task.key, task.lang);
      // reimpõe campos estruturais (segurança extra além do resolver)
      const safe = tr.map((t, i) => ({
        ...t,
        id: en[i].id,
        emoji: (en[i] as any).emoji,
        locked: (en[i] as any).locked,
      }));
      writeStoryFile(task.lang, task.key, model, safe);
      touchedLangs.add(task.lang);
      done++;
      completed++;
      console.log(
        `  ✓ [${task.lang}] ${task.key} · ${shortModel(model)} (${completed}/${total})`,
      );
    } catch (e: any) {
      failed++;
      completed++;
      console.log(
        `  ✗ [${task.lang}] ${task.key}: ${e.message} (${completed}/${total})`,
      );
      if (e.fatal) {
        console.error("\n⛔ Erro fatal (auth). Abortando.");
        aborted = true;
      }
    }
  });

  // Reescreve o bloco GENERATED de cada idioma tocado (1x, após o pool drenar).
  for (const lang of touchedLangs) rebuildGeneratedBlock(lang);
  if (aborted) process.exit(1);

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
