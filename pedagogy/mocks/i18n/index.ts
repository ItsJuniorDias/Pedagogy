// mocks/i18n/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Resolver de CONTEÚDO localizado das histórias.
//
// O inglês (mocks/*.ts) continua sendo a FONTE CANÔNICA e o fallback universal.
// Cada idioma tem um "overlay": um mapa (mesma chave do STORY_CHAPTERS do leitor)
// com os capítulos traduzidos. Este módulo escolhe o overlay pelo idioma ativo do
// i18next e o mescla sobre o inglês de forma SEGURA.
//
// Por que ler o idioma direto do i18next (e não de lib/i18n)?
//   Para manter este resolver 100% livre de react-native — assim os scripts Node
//   (pipeline de tradução, geração de exercícios) podem importar os dados sem
//   quebrar. `i18next` é JS puro.
//
// Integridade estrutural (regra crítica): campos que controlam LÓGICA nunca vêm
// da tradução — `id` (chave de progresso), `locked` (gating) e `emoji` (visual)
// são SEMPRE puxados do inglês. A tradução só fornece `title`, `subtitle`,
// `pages` e o texto interno dos widgets. Se a contagem de capítulos ou de páginas
// não bater com o inglês, caímos no inglês (evita dessincronia de dots/navegação).
// ─────────────────────────────────────────────────────────────────────────────

import i18n from "i18next";

import type { LocalizedChapter, LocalizedStoryMap } from "./types";

import { STORY_CHAPTERS_AR } from "./ar";
import { STORY_CHAPTERS_ES } from "./es";
import { STORY_CHAPTERS_FR } from "./fr";
import { STORY_CHAPTERS_HI } from "./hi";
import { STORY_CHAPTERS_PT } from "./pt";
import { STORY_CHAPTERS_DE } from "./de";

// Registro de overlays por idioma. O inglês NÃO tem overlay — ele é a base.
const OVERLAYS: Record<string, LocalizedStoryMap> = {
  pt: STORY_CHAPTERS_PT,
  es: STORY_CHAPTERS_ES,
  fr: STORY_CHAPTERS_FR,
  de: STORY_CHAPTERS_DE,
  hi: STORY_CHAPTERS_HI,
  ar: STORY_CHAPTERS_AR,
};

/** Código do idioma ativo, normalizado (ex.: "pt-BR" → "pt"). */
function currentLang(): string {
  return (i18n.language || "en").split("-")[0];
}

/**
 * Mescla um capítulo inglês com sua tradução preservando os campos estruturais.
 * Só o texto visível é sobrescrito; id/emoji/locked vêm sempre do inglês.
 */
function mergeChapter(
  en: LocalizedChapter,
  tr: LocalizedChapter,
): LocalizedChapter {
  const pagesOk =
    Array.isArray(tr.pages) && tr.pages.length === en.pages.length;
  return {
    ...tr, // title, subtitle, pages e widgets traduzidos
    id: en.id, // ── estrutural: chave de progresso (nunca traduz)
    emoji: en.emoji, // ── visual canônico
    locked: en.locked, // ── gating (nunca traduz)
    pages: pagesOk ? tr.pages : en.pages, // fallback se o pipeline gerou tamanho diferente
  };
}

/**
 * Retorna os capítulos da história `storyId` no idioma ativo.
 *
 * @param storyId  chave JÁ normalizada (a mesma usada no STORY_CHAPTERS do leitor)
 * @param english  os capítulos em inglês (fonte canônica + fallback garantido)
 *
 * Estratégia:
 *   • idioma == "en"  → devolve o inglês (referência intacta).
 *   • overlay ausente para a história OU nº de capítulos diferente → inglês.
 *   • caso ok → inglês mesclado com a tradução, campo a campo (seguro).
 */
export function localizeChapters(
  storyId: string,
  english: LocalizedChapter[],
): LocalizedChapter[] {
  const lang = currentLang();
  if (lang === "en" || !english?.length) return english;

  const translated = OVERLAYS[lang]?.[storyId];
  if (!translated || translated.length !== english.length) return english;

  return english.map((en, i) => mergeChapter(en, translated[i]));
}

/** Diagnóstico: quantas histórias já têm overlay em cada idioma (útil em dev). */
export function localizationCoverage(): Record<string, number> {
  return Object.fromEntries(
    Object.entries(OVERLAYS).map(([lang, map]) => [lang, Object.keys(map).length]),
  );
}

export type { LocalizedChapter, LocalizedStoryMap };
