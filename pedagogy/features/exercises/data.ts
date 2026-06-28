// features/exercises/data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Camada de dados que o APP consome. Importa só o JSON estático gerado pelo
// script + os tipos. Zero zod, zero chamada de rede em runtime.
// ─────────────────────────────────────────────────────────────────────────────

import type { ChapterExerciseSet, Exercise } from "./types";
import { resolveStoryId } from "./types";

// Conteúdo gerado por scripts/generateExercises.ts (um arquivo por história).
import ROCKETADVENTURE from "./content/ROCKETADVENTURE.json";
import MAGICFOREST from "./content/MAGICFOREST.json";
import OCEANFRIENDS from "./content/OCEANFRIENDS.json";

// Registry: id-da-história-normalizado → capítulos.
// Ao gerar uma história nova, adicione o import + a linha aqui.
const REGISTRY: Record<string, ChapterExerciseSet[]> = {
  ROCKETADVENTURE: ROCKETADVENTURE as unknown as ChapterExerciseSet[],
  MAGICFOREST: MAGICFOREST as unknown as ChapterExerciseSet[],
  OCEANFRIENDS: OCEANFRIENDS as unknown as ChapterExerciseSet[],
};

export interface GetOptions {
  /**
   * Em produção, mostre só exercícios confiáveis: gabarito garantido por máquina
   * (fill-blank) OU já revisado por um humano (`reviewed: true`).
   * Default false → mostra todos (bom pro demo; em prod, passe true).
   */
  onlyTrusted?: boolean;
  /** embaralha a ordem dos exercícios */
  shuffle?: boolean;
  /** limita a quantidade retornada (ex: 4 por sessão) */
  limit?: number;
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Exercícios de um capítulo. storyId/chapterId aceitam o formato cru do app. */
export function getChapterExercises(
  storyIdRaw: string,
  chapterIdRaw: string | number,
  opts: GetOptions = {}
): Exercise[] {
  const storyId = resolveStoryId(storyIdRaw);
  const chapterId = String(chapterIdRaw);

  const sets = REGISTRY[storyId];
  if (!sets) return [];
  const set = sets.find((s) => s.chapterId === chapterId);
  if (!set) return [];

  let list = set.exercises;
  if (opts.onlyTrusted)
    list = list.filter((e) => e.machineChecked || e.reviewed);
  if (opts.shuffle) list = shuffleArr(list);
  if (opts.limit != null) list = list.slice(0, opts.limit);
  return list;
}

/** Tem exercício pra este capítulo? (pra decidir se mostra a sessão no fim) */
export function hasChapterExercises(
  storyIdRaw: string,
  chapterIdRaw: string | number,
  opts: GetOptions = {}
): boolean {
  return getChapterExercises(storyIdRaw, chapterIdRaw, opts).length > 0;
}
