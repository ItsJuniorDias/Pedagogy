// lib/i18n/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Configuração central de internacionalização (i18n) do app.
//
// Stack: i18next + react-i18next (JS puro) + expo-localization (detecção do
// idioma do aparelho). A persistência da escolha do usuário usa AsyncStorage.
//
// Fluxo:
//   1. i18next inicializa SÍNCRONO no idioma padrão (evita tela em branco).
//   2. No boot do app, bootstrapLanguage() lê a preferência salva (ou detecta
//      o idioma do device) e aplica — react-i18next re-renderiza o app inteiro.
//   3. changeAppLanguage() troca o idioma em tempo real e salva a escolha.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { type TFunction } from "i18next";
import { I18nManager } from "react-native";
import { initReactI18next } from "react-i18next";

import {
  DEFAULT_LANGUAGE,
  getLanguage,
  getLanguageOrDefault,
  isSupported,
  LANGUAGES,
  SUPPORTED_CODES,
  type SupportedLanguage,
} from "./languages";

import ar from "./locales/ar.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import hi from "./locales/hi.json";
import pt from "./locales/pt.json";
import zh from "./locales/zh.json";

/** Chave usada no AsyncStorage para guardar o idioma escolhido pelo usuário. */
export const LANGUAGE_STORAGE_KEY = "@pedagogy/language";

const resources = {
  pt: { translation: pt },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  zh: { translation: zh },
  hi: { translation: hi },
  ar: { translation: ar },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Detecção do idioma do aparelho
// ─────────────────────────────────────────────────────────────────────────────
// expo-localization é um módulo NATIVO. O require é feito de forma preguiçosa e
// protegido por try/catch para que o app NUNCA quebre caso o módulo ainda não
// tenha sido "linkado" (ex.: rodando o bundle JS antes de um novo build nativo).
// Nesse caso, caímos no idioma padrão até o próximo rebuild.
function detectDeviceLanguage(): SupportedLanguage {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Localization = require("expo-localization");
    const locales: { languageCode?: string | null }[] =
      Localization.getLocales?.() ?? [];
    for (const locale of locales) {
      const code = (locale.languageCode ?? "").toLowerCase();
      if (isSupported(code)) return code;
    }
  } catch {
    // expo-localization indisponível — usa o padrão.
  }
  return DEFAULT_LANGUAGE;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inicialização do i18next
// ─────────────────────────────────────────────────────────────────────────────
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE, // sobrescrito por bootstrapLanguage() no boot
    fallbackLng: "en", // se faltar uma chave, cai no inglês (UI-fonte)
    supportedLngs: SUPPORTED_CODES,
    defaultNS: "translation",
    // React já protege contra XSS, então não escapamos a interpolação.
    interpolation: { escapeValue: false },
    // Evita retornar null (melhor DX com TypeScript).
    returnNull: false,
    // Não emite avisos ruidosos em produção.
    react: { useSuspense: false },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Troca o idioma do app em tempo real e (por padrão) salva a escolha.
 * Mantém I18nManager.allowRTL em sincronia para idiomas RTL (árabe).
 *
 * OBS. sobre RTL: forçar o layout inteiro para RTL (I18nManager.forceRTL)
 * exige recarregar o app e pode quebrar telas desenhadas em LTR. Por isso NÃO
 * forçamos automaticamente — o texto árabe já é renderizado corretamente da
 * direita para a esquerda pelo próprio SO dentro de cada Text. Para ativar o
 * espelhamento completo do layout, veja o README de i18n.
 */
export async function changeAppLanguage(
  lang: SupportedLanguage,
  opts: { persist?: boolean } = {},
): Promise<void> {
  const { persist = true } = opts;

  await i18n.changeLanguage(lang);

  const isRTL = getLanguage(lang)?.dir === "rtl";
  I18nManager.allowRTL(isRTL);
  // Para espelhamento total do layout, descomente e recarregue o app:
  // if (I18nManager.isRTL !== isRTL) I18nManager.forceRTL(isRTL);

  if (persist) {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Falha ao salvar não deve interromper a troca de idioma.
    }
  }
}

/**
 * Aplica, no boot do app, a preferência salva pelo usuário. Se não houver,
 * usa o idioma do aparelho; se nada bater, usa o padrão. Chame uma única vez
 * no layout raiz e só renderize a UI depois que a Promise resolver (evita
 * "piscar" o idioma padrão antes do correto).
 */
export async function bootstrapLanguage(): Promise<SupportedLanguage> {
  let lang: SupportedLanguage;
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    lang = isSupported(stored) ? stored : detectDeviceLanguage();
  } catch {
    lang = DEFAULT_LANGUAGE;
  }
  // persist:false — só refletimos o estado atual, não gravamos de novo.
  await changeAppLanguage(lang, { persist: false });
  return lang;
}

/** Código do idioma ativo no momento (ex.: "pt"). */
export function getCurrentLanguage(): SupportedLanguage {
  const current = i18n.language?.split("-")[0] ?? DEFAULT_LANGUAGE;
  return isSupported(current) ? current : DEFAULT_LANGUAGE;
}

/** O idioma ativo é escrito da direita para a esquerda? */
export function isCurrentRTL(): boolean {
  return getLanguage(getCurrentLanguage())?.dir === "rtl";
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatação de tempo de leitura, localizada
// ─────────────────────────────────────────────────────────────────────────────
// Substitui formatReadTime() de lib/readingProgress em contextos com UI.
// Recebe a função `t` (do useTranslation) para respeitar o idioma atual.
// Tipada com o TFunction do próprio i18next → aceita direto o `t` do hook,
// sem erro de compatibilidade sob strict mode.
export function formatReadTimeI18n(seconds: number, t: TFunction): string {
  if (seconds <= 0) return t("profile.week.read.zero");
  if (seconds < 60) return t("profile.week.read.seconds", { count: seconds });

  const mins = Math.round(seconds / 60);
  if (mins < 60) return t("profile.week.read.minutes", { count: mins });

  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0
    ? t("profile.week.read.hours", { count: h })
    : t("profile.week.read.hoursMinutes", { count: h, minutes: m });
}

// Reexporta metadados úteis para telas que montam seletores de idioma.
export { LANGUAGES, SUPPORTED_CODES, getLanguage, getLanguageOrDefault, isSupported };
export type { SupportedLanguage };

export default i18n;
