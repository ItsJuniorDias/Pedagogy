// lib/readingProgress.ts
// ─────────────────────────────────────────────────────────────────────────────
// Fonte única de verdade do progresso de leitura.
// - Conta capítulos lidos por história
// - Marca histórias completas
// - Calcula estrelas, streak e badges (achievements)
// Persistido em AsyncStorage — mesma abordagem já usada no app
// (@subscription_status), então não precisa de lib nova.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@reading_progress_v1";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ReadingProgress = {
  /** Capítulos lidos por história: { [storyId]: [chapterId, ...] } */
  chaptersRead: Record<string, (string | number)[]>;
  /** IDs (já normalizados via resolveStoryId) das histórias 100% lidas */
  storiesCompleted: string[];
  /** Total acumulado de capítulos únicos lidos */
  totalChaptersRead: number;
  /** Estrelas ganhas (5 por capítulo + 20 de bônus por história completa) */
  stars: number;
  /** Última data de leitura (YYYY-MM-DD) — usada para o streak */
  lastReadDate: string | null;
  /** Dias seguidos lendo */
  streak: number;
  /** Sessões de leitura depois das 20h — usado pelo badge Night Owl */
  nightReads: number;
  /**
   * Tempo de leitura acumulado por dia, em SEGUNDOS: { "YYYY-MM-DD": 87 }.
   * Alimentado por addReadingTime() (o leitor cronometra o foco na tela).
   * É a fonte do gráfico "This week" no Profile.
   */
  dailyReadingSec: Record<string, number>;
};

export type Badge = {
  id: string;
  emoji: string;
  label: string;
  earned: boolean;
  /** Dica de como desbloquear (pode mostrar num tooltip/modal) */
  hint: string;
};

// ─── DEFAULTS / CONSTANTES ────────────────────────────────────────────────────

const EMPTY: ReadingProgress = {
  chaptersRead: {},
  storiesCompleted: [],
  totalChaptersRead: 0,
  stars: 0,
  lastReadDate: null,
  streak: 0,
  nightReads: 0,
  dailyReadingSec: {},
};

export const STARS_PER_CHAPTER = 5;
export const STARS_PER_STORY_BONUS = 20;
export const STARS_PER_LEVEL = 100;
/** Teto por flush (30 min) — evita que uma sessão "esquecida aberta" infle o dia. */
export const MAX_READING_FLUSH_SEC = 30 * 60;

// ─── HELPERS DE DATA ──────────────────────────────────────────────────────────

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // data LOCAL, não UTC
};

const todayStr = () => toDateStr(new Date());

const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
};

// ─── CORE: GET / SAVE ─────────────────────────────────────────────────────────

export async function getProgress(): Promise<ReadingProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

async function saveProgress(p: ReadingProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // storage cheio/indisponível: falha silenciosa, progresso fica em memória
  }
}

/** Útil para debug ou botão "resetar progresso" nos parental controls */
export async function resetProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ─── REGRA PRINCIPAL ──────────────────────────────────────────────────────────
/**
 * Chame quando a criança chegar na ÚLTIMA página de um capítulo.
 * É idempotente: reler o mesmo capítulo não duplica estrelas nem contagem,
 * mas ainda atualiza streak e nightReads (incentiva voltar todo dia).
 *
 * @param storyId   id normalizado da história (o mesmo de resolveStoryId)
 * @param chapterId id do capítulo (chapter.id do mock)
 * @param totalChaptersInStory chapters.length — para detectar história completa
 */
export async function markChapterCompleted(
  storyId: string,
  chapterId: string | number,
  totalChaptersInStory: number,
): Promise<ReadingProgress> {
  const p = await getProgress();

  // ── Streak: 1ª leitura do dia ──
  const today = todayStr();
  if (p.lastReadDate !== today) {
    p.streak = p.lastReadDate === yesterdayStr() ? p.streak + 1 : 1;
    p.lastReadDate = today;
  }

  // ── Night Owl: leitura depois das 20h ──
  if (new Date().getHours() >= 20) {
    p.nightReads += 1;
  }

  // ── Capítulo (idempotente) ──
  const read = p.chaptersRead[storyId] ?? [];
  const alreadyRead = read.some((c) => String(c) === String(chapterId));

  if (!alreadyRead) {
    p.chaptersRead[storyId] = [...read, chapterId];
    p.totalChaptersRead += 1;
    p.stars += STARS_PER_CHAPTER;

    // ── História completa? ──
    const allDone = p.chaptersRead[storyId].length >= totalChaptersInStory;
    if (allDone && !p.storiesCompleted.includes(storyId)) {
      p.storiesCompleted.push(storyId);
      p.stars += STARS_PER_STORY_BONUS;
    }
  }

  await saveProgress(p);
  return p;
}

// ─── TEMPO DE LEITURA (gráfico "This week") ───────────────────────────────────
/**
 * Soma `seconds` ao tempo de leitura de HOJE.
 * Chamado pelo leitor (via useReadingTimer) sempre que a criança sai da tela
 * ou o app vai pro background. É acumulativo e seguro: clampa em
 * MAX_READING_FLUSH_SEC pra um flush nunca inflar o dia de forma absurda.
 *
 * NÃO mexe em estrelas/streak — isso continua sendo responsabilidade do
 * markChapterCompleted. Aqui só registramos minutos no calendário.
 */
export async function addReadingTime(
  seconds: number,
): Promise<ReadingProgress> {
  const sec = Math.min(Math.round(seconds || 0), MAX_READING_FLUSH_SEC);
  if (sec <= 0) return getProgress();

  const p = await getProgress();
  // Cópia rasa do mapa — evita mutar o objeto EMPTY compartilhado quando o
  // storage ainda está vazio (mesma pegadinha de chaptersRead).
  const daily = { ...(p.dailyReadingSec ?? {}) };
  const today = todayStr();
  daily[today] = (daily[today] ?? 0) + sec;
  p.dailyReadingSec = daily;

  await saveProgress(p);
  return p;
}

export type WeekDay = {
  /** "YYYY-MM-DD" daquele dia */
  dateStr: string;
  /** Rótulo curto: M T W T F S S (semana começa na segunda) */
  label: string;
  /** Segundos lidos nesse dia */
  seconds: number;
  /** É o dia de hoje? (destaca no gráfico) */
  isToday: boolean;
  /** Dia ainda não chegou nesta semana? (não anima barra) */
  isFuture: boolean;
};

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"]; // Mon → Sun

/** Segunda-feira 00:00 da semana que contém `d` (local). */
function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const dow = x.getDay(); // 0=Dom … 6=Sáb
  const sinceMon = (dow + 6) % 7; // Seg=0, Dom=6
  x.setDate(x.getDate() - sinceMon);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Retorna os 7 dias da semana ATUAL (segunda → domingo) com o tempo lido.
 * É o que o WeeklyReadingCard renderiza.
 */
export function getWeeklyReading(p: ReadingProgress): WeekDay[] {
  const today = new Date();
  const todayKey = toDateStr(today);
  const monday = startOfWeekMonday(today);

  return WEEK_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toDateStr(d);
    return {
      dateStr,
      label,
      seconds: p.dailyReadingSec?.[dateStr] ?? 0,
      isToday: dateStr === todayKey,
      isFuture: d.getTime() > today.getTime() && dateStr !== todayKey,
    };
  });
}

/** Total de segundos lidos na semana atual. */
export function weeklyTotalSeconds(p: ReadingProgress): number {
  return getWeeklyReading(p).reduce((sum, d) => sum + d.seconds, 0);
}

/** Segundos lidos HOJE. */
export function todayReadingSeconds(p: ReadingProgress): number {
  return p.dailyReadingSec?.[todayStr()] ?? 0;
}

/** "45 sec read" · "1 min read" · "1h 12m read" — pro cabeçalho do card. */
export function formatReadTime(seconds: number): string {
  if (seconds <= 0) return "0 min read";
  if (seconds < 60) return `${seconds} sec read`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min read`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h read` : `${h}h ${m}m read`;
}

// ─── BADGES (ACHIEVEMENTS) ────────────────────────────────────────────────────
// Os IDs abaixo são os mesmos do STORY_CHAPTERS (já normalizados).

const ART_STORIES = ["COLORS&ART", "THECOLOURTHIEF", "THEPAPERGARDEN"];
const SCIENCE_STORIES = [
  "SCIENCELAB",
  "TINYSICENTIST",
  "THESCIENCEOFSMALLWONDERS",
  "THEVOLCANOLOGIST",
];
const DINO_STORIES = ["DINOSAURS", "DINOWORLD"];

export function computeBadges(p: ReadingProgress): Badge[] {
  const completedAny = (ids: string[]) =>
    ids.some((id) => p.storiesCompleted.includes(id));

  return [
    {
      id: "explorer",
      emoji: "🚀",
      label: "Explorer",
      earned: p.totalChaptersRead >= 1,
      hint: "Leia seu primeiro capítulo",
    },
    {
      id: "artist",
      emoji: "🎨",
      label: "Artist",
      earned: completedAny(ART_STORIES),
      hint: "Complete uma história de arte e cores",
    },
    {
      id: "scientist",
      emoji: "🔬",
      label: "Scientist",
      earned: completedAny(SCIENCE_STORIES),
      hint: "Complete uma história de ciência",
    },
    {
      id: "bookworm",
      emoji: "📚",
      label: "Bookworm",
      earned: p.storiesCompleted.length >= 5,
      hint: "Complete 5 histórias",
    },
    {
      id: "dinofan",
      emoji: "🦖",
      label: "Dino Fan",
      earned: completedAny(DINO_STORIES),
      hint: "Complete uma história de dinossauros",
    },
    {
      id: "nightowl",
      emoji: "🌙",
      label: "Night Owl",
      earned: p.nightReads >= 3,
      hint: "Leia 3 vezes depois das 20h",
    },
  ];
}

// ─── DERIVADOS PARA A UI ──────────────────────────────────────────────────────

export function computeLevel(stars: number): number {
  return Math.floor(stars / STARS_PER_LEVEL) + 1;
}

/** % de capítulos lidos de uma história — útil pra barra de progresso no card */
export function storyProgressPct(
  p: ReadingProgress,
  storyId: string,
  totalChapters: number,
): number {
  if (totalChapters <= 0) return 0;
  const read = p.chaptersRead[storyId]?.length ?? 0;
  return Math.min(1, read / totalChapters);
}
