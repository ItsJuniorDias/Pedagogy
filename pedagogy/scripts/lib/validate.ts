// scripts/lib/validate.ts
// ─────────────────────────────────────────────────────────────────────────────
// Validação que roda SÓ no Node (script de geração). Duas camadas:
//   1) zod  → garante o FORMATO do que o GERADOR produz (sem os campos que a
//             pipeline injeta: id/storyId/chapterId/machineChecked/reviewed).
//   2) integridade → garante a CORREÇÃO contra o texto real do capítulo:
//      frase citada existe no capítulo, palavra existe, gabarito é consistente.
//      O que a máquina não verifica (significado, inferência) fica
//      machineChecked=false → pendente de curadoria humana.
//
// Requer: npm i -D zod   (fica só em devDependencies; o app não importa isto)
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import type { Exercise } from "../../features/exercises/types";

// ─── Schemas zod do que o GERADOR devolve (campos gerenciados ficam de fora) ──

const Difficulty = z.enum(["easy", "medium", "hard"]);
const common = { prompt: z.string().min(1), difficulty: Difficulty };
const optionList = z.array(z.string().min(1)).min(2).max(4);

const RawComprehension = z.object({
  ...common,
  type: z.literal("comprehension"),
  skill: z.enum(["comprehension", "inference"]),
  options: optionList,
  answerIndex: z.number().int().min(0),
});
const RawTrueFalse = z.object({
  ...common,
  type: z.literal("true-false"),
  skill: z.enum(["comprehension", "inference"]),
  statement: z.string().min(1),
  answer: z.boolean(),
});
const RawSequence = z.object({
  ...common,
  type: z.literal("sequence"),
  skill: z.literal("sequence"),
  items: z.array(z.string().min(1)).min(3).max(5),
  correctOrder: z.array(z.number().int().min(0)).min(3).max(5),
});
const RawVocabulary = z.object({
  ...common,
  type: z.literal("vocabulary"),
  skill: z.literal("vocabulary"),
  word: z.string().min(1),
  options: optionList,
  answerIndex: z.number().int().min(0),
});
const RawFillBlank = z.object({
  ...common,
  type: z.literal("fill-blank"),
  skill: z.enum(["phonics", "comprehension"]),
  sourceSentence: z.string().min(1),
  blankWord: z.string().min(1),
  options: optionList,
  answer: z.string().min(1),
});

export const RawExerciseSchema = z.discriminatedUnion("type", [
  RawComprehension,
  RawTrueFalse,
  RawSequence,
  RawVocabulary,
  RawFillBlank,
]);
type RawExercise = z.infer<typeof RawExerciseSchema>;

// ─── Normalização de texto p/ comparar com o capítulo ────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^a-z0-9' ]+/g, " ") // qualquer pontuação/hífen/travessão → espaço
    .replace(/\s+/g, " ")
    .trim();
}
function containsPhrase(haystack: string, needle: string): boolean {
  const h = normalize(haystack);
  const n = normalize(needle);
  return n.length > 0 && h.includes(n);
}
function containsWord(haystack: string, word: string): boolean {
  const w = normalize(word);
  if (!w) return false;
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^| )${esc}( |$)`).test(normalize(haystack));
}
function isPermutationOfIndices(order: number[], len: number): boolean {
  if (order.length !== len) return false;
  const seen = new Set(order);
  return seen.size === len && order.every((i) => i >= 0 && i < len);
}

// ─── Resultado ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: Exercise[];
  rejected: { raw: unknown; errors: string[] }[];
  warnings: string[];
}

/** Constrói o Exercise final (campos gerenciados) a partir do cru + contexto. */
function assemble(
  raw: RawExercise,
  ctx: { storyId: string; chapterId: string },
  machineChecked: boolean
): Exercise {
  return {
    ...raw,
    id: "", // preenchido pelo gerador
    storyId: ctx.storyId,
    chapterId: ctx.chapterId,
    machineChecked,
    reviewed: false,
  } as Exercise;
}

/**
 * Valida lista crua contra o texto do capítulo.
 * machineChecked é DERIVADO aqui (não confiamos no que o modelo afirma):
 * só fill-blank com frase/palavra conferidas ganha true.
 */
export function validateChapter(
  rawList: unknown[],
  chapterText: string,
  ctx: { storyId: string; chapterId: string }
): ValidationResult {
  const valid: Exercise[] = [];
  const rejected: { raw: unknown; errors: string[] }[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const rawItem of rawList) {
    const parsed = RawExerciseSchema.safeParse(rawItem);
    if (!parsed.success) {
      rejected.push({
        raw: rawItem,
        errors: parsed.error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`
        ),
      });
      continue;
    }
    const raw = parsed.data;
    const errors: string[] = [];

    // assinatura por CONTEÚDO (não pelo enunciado, que pode se repetir)
    const sig =
      raw.type === "fill-blank"
        ? `fill::${normalize(raw.sourceSentence)}::${normalize(raw.blankWord)}`
        : raw.type === "vocabulary"
        ? `vocab::${normalize(raw.word)}`
        : raw.type === "true-false"
        ? `tf::${normalize(raw.statement)}`
        : raw.type === "sequence"
        ? `seq::${raw.items.map(normalize).join("|")}`
        : `comp::${normalize(raw.prompt)}::${raw.options.map(normalize).join("|")}`;
    const dedupeKey = sig;
    if (seen.has(dedupeKey)) {
      warnings.push(`duplicado ignorado: "${raw.prompt}"`);
      continue;
    }

    let machineChecked = false;

    switch (raw.type) {
      case "fill-blank": {
        if (!containsPhrase(chapterText, raw.sourceSentence))
          errors.push("sourceSentence não aparece no capítulo");
        if (!containsWord(raw.sourceSentence, raw.blankWord))
          errors.push("blankWord não está na sourceSentence");
        if (raw.answer !== raw.blankWord)
          errors.push("answer diferente de blankWord");
        if (!raw.options.includes(raw.answer))
          errors.push("answer não está entre as options");
        if (new Set(raw.options).size !== raw.options.length)
          errors.push("options duplicadas");
        machineChecked = errors.length === 0;
        break;
      }
      case "vocabulary": {
        if (!containsWord(chapterText, raw.word))
          errors.push(`palavra "${raw.word}" não aparece no capítulo`);
        if (raw.answerIndex >= raw.options.length)
          errors.push("answerIndex fora do alcance");
        if (new Set(raw.options).size !== raw.options.length)
          errors.push("options duplicadas");
        warnings.push(`vocabulary "${raw.word}": revisar significado marcado`);
        break;
      }
      case "sequence": {
        if (!isPermutationOfIndices(raw.correctOrder, raw.items.length))
          errors.push("correctOrder não é permutação válida de items");
        warnings.push("sequence: confirmar ordem cronológica");
        break;
      }
      case "comprehension": {
        if (raw.answerIndex >= raw.options.length)
          errors.push("answerIndex fora do alcance");
        if (new Set(raw.options).size !== raw.options.length)
          errors.push("options duplicadas");
        warnings.push(`comprehension: revisar gabarito ("${raw.prompt}")`);
        break;
      }
      case "true-false": {
        warnings.push(`true-false: revisar gabarito ("${raw.statement}")`);
        break;
      }
    }

    if (errors.length > 0) {
      rejected.push({ raw: rawItem, errors });
      continue;
    }
    seen.add(dedupeKey);
    valid.push(assemble(raw, ctx, machineChecked));
  }

  return { valid, rejected, warnings };
}

export { normalize };
