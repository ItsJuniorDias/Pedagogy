// features/exercises/data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Camada de dados que o APP consome. Importa só o JSON estático gerado pelo
// script + os tipos. Zero zod, zero chamada de rede em runtime.
// ─────────────────────────────────────────────────────────────────────────────

import type { Exercise } from "./types";
import { resolveStoryId } from "./types";

// Índice gerado automaticamente pelo script (content/registry.ts).
// Cada história vira 1 JSON em content/ e o registry é reescrito a cada run —
// você nunca edita isto à mão.
import { REGISTRY } from "./content/registry";

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
  opts: GetOptions = {},
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
  opts: GetOptions = {},
): boolean {
  return getChapterExercises(storyIdRaw, chapterIdRaw, opts).length > 0;
}

/**
 * Exercícios da HISTÓRIA INTEIRA (todos os capítulos juntos) — pro quiz de
 * fechamento que aparece após o último capítulo. Capítulos locked não têm
 * conteúdo gerado, então naturalmente só entram os que a criança leu.
 */
export function getStoryExercises(
  storyIdRaw: string,
  opts: GetOptions = {},
): Exercise[] {
  const storyId = resolveStoryId(storyIdRaw);
  const sets = REGISTRY[storyId];
  if (!sets) return [];

  let list = sets.flatMap((s) => s.exercises);
  if (opts.onlyTrusted)
    list = list.filter((e) => e.machineChecked || e.reviewed);
  if (opts.shuffle) list = shuffleArr(list);
  if (opts.limit != null) list = list.slice(0, opts.limit);
  return list;
}

/** Tem exercício em qualquer capítulo desta história? */
export function hasStoryExercises(
  storyIdRaw: string,
  opts: GetOptions = {},
): boolean {
  return getStoryExercises(storyIdRaw, opts).length > 0;
}
