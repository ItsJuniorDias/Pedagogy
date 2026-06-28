// scripts/generateExercises.ts
// ─────────────────────────────────────────────────────────────────────────────
// Gera exercícios estáticos por capítulo a partir das histórias do app.
// Roda em Node (offline) — NUNCA no app. O app só consome o JSON gerado.
//
//   npx tsx scripts/generateExercises.ts ROCKETADVENTURE MAGICFOREST
//   npx tsx scripts/generateExercises.ts ROCKETADVENTURE --provider openrouter
//   npx tsx scripts/generateExercises.ts --all --provider mock
//
// Flags:
//   --provider mock|openrouter   (default: openrouter se houver key, senão mock)
//   --model <slug>               (default: meta-llama/llama-3.3-70b-instruct:free)
//   --all                        (gera todas as histórias do STORY_SOURCES)
//
// Requer (devDependencies):  npm i -D tsx zod
// A key vem do ambiente:     OPENROUTER_API_KEY=...   (ou VITE_OPENROUTER_API_KEY)
//   ex:  OPENROUTER_API_KEY=sk-or-... npx tsx scripts/generateExercises.ts ROCKETADVENTURE
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateChapter } from "./lib/validate";
import { resolveStoryId } from "../features/exercises/types";
import type {
  ChapterExerciseSet,
  Exercise,
} from "../features/exercises/types";

// ─── Fontes de histórias (dados puros, sem imports de react-native) ──────────
// Adicione aqui qualquer história nova; a chave é o id JÁ normalizado.
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
  STORIES_GRID,
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

type ChapterLike = {
  id: string | number;
  title: string;
  locked?: boolean;
  pages: string[];
};

const STORY_SOURCES: Record<string, ChapterLike[]> = {
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

// ─── Config de quantos exercícios por capítulo ───────────────────────────────
const PER_CHAPTER = {
  "fill-blank": 2,
  vocabulary: 1,
  comprehension: 2,
  sequence: 1,
  "true-false": 1,
} as const;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../features/exercises/content");

// ─────────────────────────────────────────────────────────────────────────────
// Provider: interface + OpenRouter (real) + Mock (offline)
// ─────────────────────────────────────────────────────────────────────────────

interface Provider {
  name: string;
  /** recebe o capítulo + contexto, devolve um array cru de exercícios (unknown[]) */
  generate(input: GenInput): Promise<unknown[]>;
}

interface GenInput {
  storyId: string;
  chapterId: string;
  chapterTitle: string;
  ageRange: string;
  chapterText: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You design reading-comprehension and phonics activities for a children's English reading app.
Output ONLY a JSON array of exercise objects. No markdown, no prose, no code fences.
Every exercise MUST be answerable purely from the chapter text given. Keep wording simple and warm for the target age.
Distractors must be clearly wrong but believable. Never invent facts not in the text.

Exercise object shapes (include exactly these fields, plus "difficulty": "easy"|"medium"|"hard"):
- fill-blank: { "type":"fill-blank","skill":"phonics"|"comprehension","prompt":string,"sourceSentence":string,"blankWord":string,"options":string[2..4],"answer":string }
    sourceSentence MUST be copied VERBATIM from the chapter and MUST contain blankWord. options MUST include answer (==blankWord).
- vocabulary: { "type":"vocabulary","skill":"vocabulary","prompt":string,"word":string,"options":string[2..4],"answerIndex":number }
    word MUST be a word that appears in the chapter. options are short kid-friendly meanings.
- comprehension: { "type":"comprehension","skill":"comprehension"|"inference","prompt":string,"options":string[2..4],"answerIndex":number }
- sequence: { "type":"sequence","skill":"sequence","prompt":string,"items":string[3..5],"correctOrder":number[] }
    items are short paraphrases of events in SCRAMBLED order; correctOrder lists the item indices in correct chronological order.
- true-false: { "type":"true-false","skill":"comprehension"|"inference","prompt":string,"statement":string,"answer":boolean }

Do NOT include id/storyId/chapterId/machineChecked/reviewed — the pipeline fills those.`;

class OpenRouterProvider implements Provider {
  name: string;
  constructor(private apiKey: string, private model: string) {
    this.name = `openrouter:${model}`;
  }

  async generate(input: GenInput): Promise<unknown[]> {
    const counts = Object.entries(PER_CHAPTER)
      .map(([k, v]) => `${v}× ${k}`)
      .join(", ");
    const userPrompt = `Story: ${input.storyId} — chapter "${input.chapterTitle}" (ages ${input.ageRange}).
Generate exactly: ${counts}.

CHAPTER TEXT:
"""
${input.chapterText}
"""

Return ONLY the JSON array.`;

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
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
    }
    const data: any = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    return parseJsonArray(content);
  }
}

/** Extrai um array JSON mesmo se vier com ``` ou texto em volta. */
function parseJsonArray(raw: string): unknown[] {
  let s = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  const parsed = JSON.parse(s);
  if (!Array.isArray(parsed)) throw new Error("resposta não é um array JSON");
  return parsed;
}

// ─── Mock: constrói exercícios VÁLIDOS a partir do texto real do capítulo ─────

const STOPWORDS = new Set(
  "the and a an of to in on at for with his her its their they them was were is are be been as he she it you i we but so then than that this these those into out up down over under had have has did do does not no yes from by".split(
    " "
  )
);

const VOCAB_DICT: Record<string, string[]> = {
  gripped: ["held very tightly", "let go of", "looked at", "forgot about"],
  roared: ["made a loud sound", "went very quiet", "fell asleep", "smelled nice"],
  shuddered: ["shook hard", "smiled wide", "stood still", "floated up"],
  shrank: ["got smaller", "got bigger", "turned red", "ran away"],
  whispered: ["spoke very softly", "shouted loudly", "wrote a note", "sang a song"],
  ancient: ["very old", "brand new", "very small", "very loud"],
  enormous: ["very big", "very tiny", "very fast", "very soft"],
  glowed: ["shined softly", "went dark", "broke apart", "melted"],
  crater: ["a big hole", "a tall tree", "a small boat", "a warm coat"],
  compass: [
    "a tool that shows direction",
    "a kind of food",
    "a type of cloud",
    "a musical drum",
  ],
  mossy: ["covered in soft green plants", "made of metal", "full of water", "very hot"],
  porthole: ["a small round window", "a wooden door", "a deep cave", "a long road"],
};

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[—\-\s]+/, "").trim())
    .filter((s) => s.length >= 28 && s.length <= 150);
}

function contentWords(sentence: string): string[] {
  const lower = sentence.toLowerCase();
  const words = lower.match(/[a-z]+/g) ?? [];
  return words.filter((w) => {
    if (w.length < 4 || STOPWORDS.has(w)) return false;
    // a palavra precisa existir ISOLADA na frase (não colada a apóstrofo:
    // "grandmother" em "grandmother's" não conta — quebraria a lacuna)
    const re = new RegExp(`(^|[^a-z'])${w}([^a-z']|$)`);
    return re.test(lower);
  });
}

function shuffle<T>(arr: T[], seed = 7): T[] {
  // shuffle determinístico (mesma entrada → mesma saída) p/ builds reproduzíveis
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class MockProvider implements Provider {
  name = "mock";

  async generate(input: GenInput): Promise<unknown[]> {
    const out: unknown[] = [];
    const sentences = splitSentences(input.chapterText);
    if (sentences.length === 0) return out;

    const allWords = Array.from(
      new Set(sentences.flatMap((s) => contentWords(s)))
    );

    // 1) fill-blank ×2
    const usableForBlank = sentences.filter((s) => contentWords(s).length > 0);
    for (let i = 0; i < Math.min(2, usableForBlank.length); i++) {
      const sentence = usableForBlank[i];
      const words = contentWords(sentence).sort((a, b) => b.length - a.length);
      const answer = words[0];
      const distractors = shuffle(
        allWords.filter(
          (w) => w !== answer && Math.abs(w.length - answer.length) <= 2
        ),
        i + 1
      ).slice(0, 3);
      const pool = ["happy", "little", "bright", "quiet"];
      while (distractors.length < 3) {
        const cand = pool.shift();
        if (cand && cand !== answer && !distractors.includes(cand))
          distractors.push(cand);
      }
      out.push({
        type: "fill-blank",
        skill: "phonics",
        prompt: "Pick the word that fits the gap.",
        sourceSentence: sentence,
        blankWord: answer,
        options: shuffle([answer, ...distractors], i + 5),
        answer,
        difficulty: "easy",
      });
    }

    // 2) vocabulary ×1 — só se uma palavra do mini-dicionário aparecer no texto
    const vocabWord = Object.keys(VOCAB_DICT).find((w) =>
      allWords.includes(w)
    );
    if (vocabWord) {
      const opts = VOCAB_DICT[vocabWord];
      out.push({
        type: "vocabulary",
        skill: "vocabulary",
        prompt: `In the story, what does "${vocabWord}" mean?`,
        word: vocabWord,
        options: shuffle(opts, 3),
        answerIndex: shuffle(opts, 3).indexOf(opts[0]),
        difficulty: "medium",
      });
    }

    // 3) comprehension ×1 — "qual frase é desta história?" (gabarito real)
    const realSentence = sentences[Math.min(2, sentences.length - 1)];
    const foreign = [
      "The dragon counted his gold coins twice before bed.",
      "Maya planted three carrots in the school garden.",
      "The robot learned to paint with its left hand.",
    ];
    const compOptions = shuffle([realSentence, ...foreign].slice(0, 4), 9);
    out.push({
      type: "comprehension",
      skill: "comprehension",
      prompt: "Which sentence is from this chapter?",
      options: compOptions,
      answerIndex: compOptions.indexOf(realSentence),
      difficulty: "medium",
    });

    // 4) sequence ×1 — primeiras frases das 3 primeiras páginas, embaralhadas
    const pageOpeners = input.chapterText
      .split(/\n\s*\n/) // páginas eram juntadas por \n\n no texto montado
      .map((p) => splitSentences(p)[0])
      .filter((s): s is string => !!s)
      .slice(0, 3);
    if (pageOpeners.length === 3) {
      const order = [0, 1, 2];
      const scrambled = shuffle(
        pageOpeners.map((text, idx) => ({ text, idx })),
        4
      );
      out.push({
        type: "sequence",
        skill: "sequence",
        prompt: "Put the events in the order they happened.",
        items: scrambled.map((x) => x.text),
        correctOrder: order.map((o) =>
          scrambled.findIndex((x) => x.idx === o)
        ),
        difficulty: "medium",
      });
    }

    // 5) true-false ×1 — frase real do capítulo (verdadeira)
    out.push({
      type: "true-false",
      skill: "comprehension",
      prompt: "True or false?",
      statement: sentences[0],
      answer: true,
      difficulty: "easy",
    });

    return out;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline
// ─────────────────────────────────────────────────────────────────────────────

function chapterTextOf(ch: ChapterLike): string {
  return ch.pages.join("\n\n");
}

async function generateStory(
  storyKey: string,
  provider: Provider,
  ageRange: string
): Promise<ChapterExerciseSet[]> {
  const chapters = STORY_SOURCES[storyKey];
  if (!chapters) throw new Error(`história desconhecida: ${storyKey}`);
  const storyId = resolveStoryId(storyKey);
  const sets: ChapterExerciseSet[] = [];

  for (const ch of chapters) {
    if (ch.locked) {
      console.log(`  · ${storyId}/${ch.id}: capítulo locked, pulando`);
      continue;
    }
    const chapterId = String(ch.id);
    const chapterText = chapterTextOf(ch);

    let raw: unknown[] = [];
    try {
      raw = await provider.generate({
        storyId,
        chapterId,
        chapterTitle: ch.title,
        ageRange,
        chapterText,
      });
    } catch (err) {
      console.error(`  ✗ ${storyId}/${chapterId}: provider falhou — ${String(err)}`);
      continue;
    }

    const { valid, rejected, warnings } = validateChapter(raw, chapterText, {
      storyId,
      chapterId,
    });

    // injeta ids estáveis
    const counters: Record<string, number> = {};
    const exercises: Exercise[] = valid.map((ex) => {
      counters[ex.type] = (counters[ex.type] ?? 0) + 1;
      return { ...ex, id: `${storyId}__${chapterId}__${ex.type}__${counters[ex.type]}` };
    });

    const verified = exercises.filter((e) => e.machineChecked).length;
    console.log(
      `  ✓ ${storyId}/${chapterId}: ${exercises.length} ok ` +
        `(${verified} verificados p/ máquina, ${exercises.length - verified} p/ revisão), ` +
        `${rejected.length} descartados`
    );
    if (rejected.length)
      rejected.forEach((r) =>
        console.log(`      ↳ descartado: ${r.errors.join("; ")}`)
      );
    if (warnings.length && process.env.VERBOSE)
      warnings.forEach((w) => console.log(`      ⚠ ${w}`));

    sets.push({
      storyId,
      chapterId,
      generatedAt: new Date().toISOString(),
      model: provider.name,
      exercises,
    });
  }
  return sets;
}

// ─── ageRange (do STORIES_GRID quando disponível; senão 5–8) ─────────────────
const AGE_BY_ID: Record<string, string> = STORIES_GRID.reduce(
  (acc: Record<string, string>, g: { id: string; ageRange: string }) => {
    acc[resolveStoryId(g.id)] = g.ageRange;
    return acc;
  },
  {}
);

/** nome de arquivo seguro (sem & e afins); o id real fica DENTRO do JSON */
function safeName(id: string): string {
  return id.replace(/[^A-Za-z0-9]/g, "");
}

/**
 * (Re)escreve content/registry.ts varrendo TODOS os JSON existentes na pasta.
 * O id real é lido de dentro de cada arquivo (set.storyId), então rodar uma
 * história só não derruba as outras do registry.
 */
function writeRegistry(dir: string) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const entries: { ident: string; file: string; id: string }[] = [];
  for (const f of files) {
    const sets = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const id = Array.isArray(sets) && sets[0]?.storyId;
    if (!id) continue; // arquivo vazio (história sem capítulo desbloqueado)
    entries.push({ ident: f.replace(/\.json$/, ""), file: f, id });
  }
  const out =
    "// GERADO por scripts/generateExercises.ts — não edite à mão.\n" +
    'import type { ChapterExerciseSet } from "../types";\n\n' +
    entries.map((e) => `import ${e.ident} from "./${e.file}";`).join("\n") +
    "\n\nexport const REGISTRY: Record<string, ChapterExerciseSet[]> = {\n" +
    entries
      .map(
        (e) =>
          `  ${JSON.stringify(e.id)}: ${e.ident} as unknown as ChapterExerciseSet[],`
      )
      .join("\n") +
    "\n};\n";
  fs.writeFileSync(path.join(dir, "registry.ts"), out);
  console.log(`  → content/registry.ts (${entries.length} histórias no registry)`);
}

async function main() {
  const args = process.argv.slice(2);
  const flagIdx = args.findIndex((a) => a.startsWith("--"));
  const stories = (flagIdx === -1 ? args : args.slice(0, flagIdx)).map((s) =>
    resolveStoryId(s)
  );
  const getFlag = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const all = args.includes("--all");
  const apiKey =
    process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
  const model =
    getFlag("model") || "meta-llama/llama-3.3-70b-instruct:free";
  const providerName =
    getFlag("provider") || (apiKey ? "openrouter" : "mock");

  const provider: Provider =
    providerName === "openrouter"
      ? (() => {
          if (!apiKey)
            throw new Error(
              "provider=openrouter mas faltou OPENROUTER_API_KEY no ambiente"
            );
          return new OpenRouterProvider(apiKey, model);
        })()
      : new MockProvider();

  const targets = all ? Object.keys(STORY_SOURCES) : stories;
  if (targets.length === 0) {
    console.error(
      "uso: npx tsx scripts/generateExercises.ts <STORY_ID...> [--all] [--provider mock|openrouter] [--model <slug>]"
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Provider: ${provider.name}\n`);

  for (const storyKey of targets) {
    console.log(`▶ ${storyKey}`);
    const sets = await generateStory(
      storyKey,
      provider,
      AGE_BY_ID[storyKey] ?? "5–8"
    );
    const file = path.join(OUT_DIR, `${safeName(storyKey)}.json`);
    fs.writeFileSync(file, JSON.stringify(sets, null, 2) + "\n");
    const total = sets.reduce((n, s) => n + s.exercises.length, 0);
    console.log(`  → ${path.relative(process.cwd(), file)} (${total} exercícios)\n`);
  }

  // regenera o índice que o app importa (content/registry.ts)
  writeRegistry(OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
