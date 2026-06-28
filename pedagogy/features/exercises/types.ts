// features/exercises/types.ts
// ─────────────────────────────────────────────────────────────────────────────
// Contrato dos exercícios derivados de cada história.
// Tipos PUROS (sem zod) — importados tanto pelo app quanto pelo script de geração.
// O app importa SÓ tipos (apagados no build) + os JSON estáticos, então nada de
// runtime de validação entra no bundle. A validação com zod vive só no /scripts.
// ─────────────────────────────────────────────────────────────────────────────

export type ExerciseSkill =
  | "comprehension" // entendeu o que aconteceu?
  | "sequence" // ordem dos acontecimentos
  | "vocabulary" // significado de uma palavra do texto
  | "inference" // dedução simples ("como ele se sentiu?")
  | "phonics"; // som/letra — via completar-lacuna com alvo fônico

export type Difficulty = "easy" | "medium" | "hard";

interface BaseExercise {
  /** id estável e único, ex: "ROCKETADVENTURE__sa-1__fill__1" */
  id: string;
  /** id da história já normalizado (igual ao resolveStoryId do app), ex: "ROCKETADVENTURE" */
  storyId: string;
  /** id do capítulo coagido a string, ex: "sa-1" ou "1" */
  chapterId: string;
  skill: ExerciseSkill;
  difficulty: Difficulty;
  /** enunciado mostrado na tela (e lido em voz alta via TTS) */
  prompt: string;
  /**
   * A correção pôde ser verificada por máquina contra o texto da história?
   * - true  → fill-blank/sequence/"qual frase é da história": gabarito garantido.
   * - false → compreensão/inferência/significado: a MÁQUINA não garante; exige
   *           curadoria humana antes de publicar (campo `reviewed`).
   */
  machineChecked: boolean;
  /** um humano revisou e aprovou? Default false até você curar. */
  reviewed: boolean;
}

/** Múltipla escolha de compreensão ou inferência. */
export interface ComprehensionExercise extends BaseExercise {
  type: "comprehension";
  skill: "comprehension" | "inference";
  options: string[];
  answerIndex: number;
}

/** Verdadeiro ou falso. */
export interface TrueFalseExercise extends BaseExercise {
  type: "true-false";
  skill: "comprehension" | "inference";
  statement: string;
  answer: boolean;
}

/** Ordenar os acontecimentos. `items` vêm embaralhados; `correctOrder` são os
 *  índices de `items` na ordem cronológica correta. */
export interface SequenceExercise extends BaseExercise {
  type: "sequence";
  skill: "sequence";
  items: string[];
  correctOrder: number[];
}

/** Significado de uma palavra que aparece no capítulo. */
export interface VocabularyExercise extends BaseExercise {
  type: "vocabulary";
  skill: "vocabulary";
  /** palavra que existe no texto do capítulo */
  word: string;
  options: string[];
  answerIndex: number;
}

/** Completar a lacuna com uma palavra tirada do próprio texto.
 *  `sourceSentence` aparece ~igual no capítulo; `blankWord` é a palavra removida. */
export interface FillBlankExercise extends BaseExercise {
  type: "fill-blank";
  skill: "phonics" | "comprehension";
  sourceSentence: string;
  blankWord: string;
  options: string[];
  answer: string;
}

export type Exercise =
  | ComprehensionExercise
  | TrueFalseExercise
  | SequenceExercise
  | VocabularyExercise
  | FillBlankExercise;

/** Conjunto de exercícios de UM capítulo (uma entrada por capítulo no JSON). */
export interface ChapterExerciseSet {
  storyId: string;
  chapterId: string;
  /** ISO de quando foi gerado */
  generatedAt: string;
  /** modelo que gerou (ex: "meta-llama/llama-3.3-70b-instruct:free" ou "mock") */
  model: string;
  exercises: Exercise[];
}

/** Helper compartilhado: normaliza o id da história igual ao app faz na
 *  ReadStoryScreen (`resolveStoryId`). Mantém app, script e dados em sincronia. */
export function resolveStoryId(raw: string): string {
  return raw.toLocaleUpperCase().replace(/[\s_\-]/g, "");
}
