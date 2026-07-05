// lib/tts.ts
// ─────────────────────────────────────────────────────────────────────────────
// Resolver de TTS (narração) — locale + voz + rate por idioma.
//
// Problema que resolve: o leitor exibe o conteúdo no idioma ATIVO (pt/es/fr/…),
// mas o Speech.speak estava fixo em "en-US" — a narração premium lia o texto
// traduzido com voz/pronúncia de inglês. Aqui mapeamos o código do i18next
// (ISO 639-1: "pt", "es", …) para o locale BCP-47 correto, escolhemos a MELHOR
// voz instalada para aquela língua (preferindo qualidade Enhanced) e ajustamos
// a velocidade por idioma.
//
// Robustez: getAvailableVoicesAsync() é assíncrono e pode falhar/demorar em
// alguns aparelhos. A seleção de voz é BEST-EFFORT e cacheada: se não houver
// voz específica (ou a enumeração falhar), passamos só `language` — o próprio
// SO então escolhe uma voz da língua certa. Nunca lança, nunca bloqueia o ▶️.
//
// Mantido livre de react-native e de i18next (recebe o código como parâmetro),
// então é trivial de testar e reutilizar em qualquer tela que use narração.
// ─────────────────────────────────────────────────────────────────────────────

import * as Speech from "expo-speech";

/** Idiomas suportados pelo app (mesmos códigos do i18next / languages.ts). */
export type TTSLang = "pt" | "en" | "es" | "fr" | "zh" | "hi" | "ar";

const SUPPORTED: readonly TTSLang[] = ["pt", "en", "es", "fr", "zh", "hi", "ar"];

/** ISO 639-1 → locale BCP-47 preferido para a síntese de voz. */
const LOCALE_BY_LANG: Record<TTSLang, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  zh: "zh-CN",
  hi: "hi-IN",
  ar: "ar-SA",
};

// Velocidade por idioma. Leitura infantil pede fala pausada (o highlight
// palavra-a-palavra acompanha melhor). Línguas tonais / de silabário mais denso
// ficam um pouco mais lentas para inteligibilidade. Ajuste fino é só aqui.
const RATE_BY_LANG: Record<TTSLang, number> = {
  pt: 0.9,
  en: 0.9,
  es: 0.9,
  fr: 0.88,
  zh: 0.82,
  hi: 0.85,
  ar: 0.85,
};

const DEFAULT_LOCALE = "en-US";
const DEFAULT_RATE = 0.9;
const PITCH = 1.0;

/** Normaliza "pt-BR" / "PT" / "pt_br" → "pt"; cai em "en" se não suportado. */
function baseLang(code: string | null | undefined): TTSLang {
  const b = (code ?? "en").toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED as readonly string[]).includes(b) ? (b as TTSLang) : "en";
}

/** Locale BCP-47 para um código de idioma do i18next. */
export function localeFor(code: string | null | undefined): string {
  return LOCALE_BY_LANG[baseLang(code)] ?? DEFAULT_LOCALE;
}

/** Velocidade de fala para um código de idioma. */
export function rateFor(code: string | null | undefined): number {
  return RATE_BY_LANG[baseLang(code)] ?? DEFAULT_RATE;
}

// ─── Seleção de voz (best-effort + cache) ────────────────────────────────────

let voicesPromise: Promise<Speech.Voice[]> | null = null;

/** Carrega (uma vez) e cacheia a lista de vozes do aparelho. Nunca lança. */
function loadVoices(): Promise<Speech.Voice[]> {
  const p =
    voicesPromise ??
    Speech.getAvailableVoicesAsync().catch(() => [] as Speech.Voice[]);
  voicesPromise = p;
  return p;
}

/**
 * Aquece o cache de vozes sem bloquear. Chame cedo (ex.: no mount do leitor)
 * para que a 1ª narração já saia com a voz certa, sem latência de enumeração.
 */
export function preloadVoices(): void {
  void loadVoices();
}

/**
 * Pontua uma voz para um locale-alvo:
 *   match exato de locale (pt-BR == pt-BR) > mesma língua (pt-PT p/ pt-BR);
 *   qualidade Enhanced (Siri/Google premium) soma ponto (soa bem melhor).
 * Retorna -1 se for de outra língua (descartada).
 */
function scoreVoice(v: Speech.Voice, locale: string): number {
  const target = locale.toLowerCase();
  const vlang = (v.language ?? "").toLowerCase();
  let score: number;
  if (vlang === target) score = 3;
  else if (vlang.split(/[-_]/)[0] === target.split("-")[0]) score = 1;
  else return -1;
  if (v.quality === Speech.VoiceQuality.Enhanced) score += 1;
  return score;
}

/**
 * Melhor identifier de voz para o idioma, ou `undefined` (aí o SO escolhe pelo
 * `language`). Best-effort: se a enumeração falhou/veio vazia, retorna undefined.
 */
export async function bestVoiceFor(
  code: string | null | undefined,
): Promise<string | undefined> {
  const locale = localeFor(code);
  const voices = await loadVoices();
  let best: Speech.Voice | undefined;
  let bestScore = 0; // exige > 0: no mínimo a mesma língua
  for (const v of voices) {
    const s = scoreVoice(v, locale);
    if (s > bestScore) {
      bestScore = s;
      best = v;
    }
  }
  return best?.identifier;
}

/** Config pronta para espalhar em Speech.speak (language + voice + rate + pitch). */
export interface SpeechConfig {
  language: string;
  voice?: string;
  rate: number;
  pitch: number;
}

/**
 * Resolve tudo para narrar no idioma ativo. A voz é best-effort; o `language`
 * garante a pronúncia correta mesmo sem match de identifier.
 *
 * @example
 *   const cfg = await resolveSpeech(i18n.language);
 *   Speech.speak(text, { ...cfg, onDone, onBoundary });
 */
export async function resolveSpeech(
  code: string | null | undefined,
): Promise<SpeechConfig> {
  return {
    language: localeFor(code),
    voice: await bestVoiceFor(code),
    rate: rateFor(code),
    pitch: PITCH,
  };
}
