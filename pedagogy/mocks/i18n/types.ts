// mocks/i18n/types.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tipo estrutural de um capítulo localizado.
//
// É propositalmente frouxo (index signature no final) para bater EXATAMENTE com
// o `ChapterMock` do leitor (app/(details)/index.tsx), que também tem
// `[key: string]: unknown`. Assim, qualquer objeto de capítulo traduzido — com
// os campos-núcleo abaixo + os widgets opcionais (riddle, letterFriend, recipe,
// creatureCard, etc.) — é atribuível ao tipo do leitor sem cast.
//
// REGRA DE OURO da tradução de conteúdo:
//   • `id`, `emoji` e `locked` são ESTRUTURAIS → nunca mudam entre idiomas
//     (id = chave de progresso; locked = gating; emoji = visual).
//   • `title`, `subtitle`, `pages` e o texto DENTRO dos widgets → traduzidos.
//   • O array `pages` mantém o MESMO tamanho (1 página traduzida por página
//     original), senão os "dots" e a navegação do leitor saem de sincronia.
// ─────────────────────────────────────────────────────────────────────────────

export type LocalizedChapter = {
  id: number | string;
  title: string;
  subtitle: string;
  emoji: string;
  locked?: boolean;
  pages: string[];
  // widgets opcionais (texto interno é traduzível; forma idêntica à do leitor)
  [key: string]: unknown;
};

/** Mapa (chave normalizada da história) → capítulos, idêntico ao STORY_CHAPTERS. */
export type LocalizedStoryMap = Record<string, LocalizedChapter[]>;
