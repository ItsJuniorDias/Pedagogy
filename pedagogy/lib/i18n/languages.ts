// lib/i18n/languages.ts
// ─────────────────────────────────────────────────────────────────────────────
// Registro central de idiomas suportados pelo app.
//
// Set atual: inglês, hindi, espanhol, francês, árabe, alemão + português.
// O alemão substituiu o mandarim: mesmo com menos falantes totais, é o idioma
// com maior ARPU dentre os que faziam sentido pro perfil "kids books" (tier-1
// europeu, forte adoção paga, público-alvo pais DACH). O mandarim exigiria
// canal separado (App Store CN tem regras próprias) e não estava dando retorno.
//
// Cada idioma é exibido no seletor no próprio idioma (nativeName), que é a
// convenção correta: o usuário reconhece a própria língua na escrita dela.
// ─────────────────────────────────────────────────────────────────────────────

export type LanguageDir = "ltr" | "rtl";

export interface Language {
  /** ISO 639-1 — usado como chave do i18next e no AsyncStorage */
  code: string;
  /** Nome em inglês (referência interna) */
  name: string;
  /** Nome no próprio idioma (o que aparece no seletor) */
  nativeName: string;
  /** Bandeira representativa (emoji) */
  flag: string;
  /** Direção do texto — "rtl" para árabe */
  dir: LanguageDir;
}

export const LANGUAGES: Language[] = [
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", dir: "ltr" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
];

/** Códigos suportados, derivados de LANGUAGES (fonte única de verdade). */
export const SUPPORTED_CODES = LANGUAGES.map((l) => l.code) as SupportedLanguage[];

/** União literal dos códigos, para type-safety no resto do app. */
export type SupportedLanguage = "pt" | "en" | "es" | "fr" | "de" | "hi" | "ar";

/**
 * Idioma padrão quando não há preferência salva e a detecção do device falha.
 * A UI-fonte do app está em inglês, então "en" é o default coerente (e também
 * o fallbackLng). Usuários com o aparelho em pt-BR são detectados automaticamente
 * via expo-localization. Para forçar português como padrão, troque para "pt".
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

/** Type guard: o código informado é um idioma suportado? */
export function isSupported(code: string | null | undefined): code is SupportedLanguage {
  return !!code && SUPPORTED_CODES.includes(code as SupportedLanguage);
}

/** Metadados de um idioma pelo código (undefined se não suportado). */
export function getLanguage(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

/**
 * Como getLanguage, mas SEMPRE retorna um Language: se o código não for
 * suportado, cai no idioma padrão. Útil para montar UI (bandeira/nome do
 * idioma atual) sem precisar checar `undefined` a cada uso.
 */
export function getLanguageOrDefault(code: string): Language {
  return (
    LANGUAGES.find((l) => l.code === code) ??
    LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE) ??
    LANGUAGES[0]
  );
}
