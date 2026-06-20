// lib/analytics.ts
// ─────────────────────────────────────────────────────────────────────────────
// CAMADA ÚNICA DE TRACKING (Facebook / Meta App Events).
//
// Encapsula o `react-native-fbsdk-next` (SDK oficial da Meta para React Native)
// e expõe funções de alto nível e tipadas para os eventos do app:
//   • instalação / abertura do app  → AUTOMÁTICO pelo SDK (ver app.json)
//   • visualização de conteúdo (view)
//   • capítulo / história concluídos
//   • abertura de jogos
//   • paywall visto, assinatura iniciada e compra concluída
//   • onboarding concluído, busca, conquistas...
//
// POR QUE UM WRAPPER?
//   1. SEGURANÇA MULTIPLATAFORMA: o módulo nativo do Facebook NÃO existe na
//      web nem no Expo Go. Aqui detectamos isso uma única vez e, quando o
//      nativo não está disponível, TODA chamada vira um no-op silencioso
//      (com log no modo dev). Assim o app nunca quebra ao rodar no navegador
//      ou no Expo Go — os eventos reais só são enviados num development/
//      production build (EAS Build / `expo run:ios` / `expo run:android`).
//   2. FONTE ÚNICA DE VERDADE: os nomes de eventos e parâmetros ficam num só
//      lugar, então o resto do app só chama `trackContentView(...)` etc.
//   3. PRIVACIDADE iOS (ATT): centraliza o pedido de App Tracking Transparency.
//
// CREDENCIAIS: o App ID e o Client Token do Facebook ficam em `app.json`
// (plugin "react-native-fbsdk-next"), NÃO aqui. Com `isAutoInitEnabled: true`
// o SDK se inicializa sozinho a partir da config nativa.
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from "react-native";

// ─── CARREGAMENTO PREGUIÇOSO E SEGURO DO SDK ──────────────────────────────────
// Em vez de `import { AppEventsLogger } from "react-native-fbsdk-next"` no topo
// (que pode falhar ao empacotar para web), exigimos o módulo dentro de um
// try/catch e só em plataformas nativas. Se algo der errado, `nativeReady`
// fica false e o app segue normalmente.

type FBSDKModule = typeof import("react-native-fbsdk-next");

let FBSDK: FBSDKModule | null = null;
let nativeReady = false;

const isNativePlatform = Platform.OS === "ios" || Platform.OS === "android";

if (isNativePlatform) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NativeModules } = require("react-native");
    // O native module só existe num build com o SDK linkado (não no Expo Go).
    const hasNativeBinding = !!NativeModules?.FBSettings;
    if (hasNativeBinding) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      FBSDK = require("react-native-fbsdk-next");
      nativeReady = !!FBSDK?.AppEventsLogger && !!FBSDK?.Settings;
    }
  } catch {
    FBSDK = null;
    nativeReady = false;
  }
}

const __DEV_LOG__ = typeof __DEV__ !== "undefined" && __DEV__;

/** Loga no console (apenas em dev) quando o tracking está em modo no-op. */
function devNoop(event: string, params?: Record<string, unknown>): void {
  if (__DEV_LOG__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics:noop] ${event}`, params ?? "");
  }
}

/** Indica se os eventos estão de fato sendo enviados à Meta neste ambiente. */
export function isAnalyticsActive(): boolean {
  return nativeReady;
}

// ─── REGISTRO CENTRAL DE NOMES DE EVENTOS ─────────────────────────────────────
// Eventos PADRÃO da Meta (strings canônicas e estáveis — usadas como fallback
// caso as constantes nativas não estejam disponíveis) + eventos CUSTOMIZADOS
// específicos do Pedagogy. Centralizar evita typos espalhados pelo código.

export const AnalyticsEvent = {
  // Padrão Meta
  VIEWED_CONTENT: "fb_mobile_content_view",
  SEARCHED: "fb_mobile_search",
  COMPLETED_TUTORIAL: "fb_mobile_tutorial_completion",
  ACHIEVED_LEVEL: "fb_mobile_level_achieved",
  UNLOCKED_ACHIEVEMENT: "fb_mobile_achievement_unlocked",
  INITIATED_CHECKOUT: "fb_mobile_initiated_checkout",
  SUBSCRIBE: "Subscribe",
  START_TRIAL: "StartTrial",
  // Customizados do Pedagogy
  CONTENT_OPEN: "content_open",
  CHAPTER_COMPLETED: "chapter_completed",
  STORY_COMPLETED: "story_completed",
  GAME_OPEN: "game_open",
  PAYWALL_VIEW: "paywall_view",
  CONTENT_DOWNLOAD: "content_download",
  READING_SESSION: "reading_session",
} as const;

// Chaves de parâmetro padrão da Meta (também usadas como fallback).
const FBParam = {
  CONTENT_TYPE: "fb_content_type",
  CONTENT_ID: "fb_content_id",
  CONTENT: "fb_content",
  SEARCH_STRING: "fb_search_string",
  NUM_ITEMS: "fb_num_items",
  CURRENCY: "fb_currency",
  SUCCESS: "fb_success",
} as const;

type ParamValue = string | number;
type Params = Record<string, ParamValue>;

/** Remove chaves com valor null/undefined e converte boolean → 0/1. */
function cleanParams(input?: Record<string, ParamValue | boolean | null | undefined>): Params {
  const out: Params = {};
  if (!input) return out;
  for (const [k, v] of Object.entries(input)) {
    if (v === null || v === undefined) continue;
    out[k] = typeof v === "boolean" ? (v ? 1 : 0) : v;
  }
  return out;
}

// ─── NÚCLEO: logEvent / logPurchase ───────────────────────────────────────────

/**
 * Loga um evento genérico. Use as funções específicas abaixo sempre que possível
 * — esta é a base de baixo nível (e a "escotilha de escape" para eventos novos).
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, ParamValue | boolean | null | undefined>,
  valueToSum?: number,
): void {
  const clean = cleanParams(params);
  if (!nativeReady || !FBSDK) {
    devNoop(eventName, { ...clean, ...(valueToSum != null ? { _value: valueToSum } : {}) });
    return;
  }
  try {
    const { AppEventsLogger } = FBSDK;
    if (typeof valueToSum === "number" && Object.keys(clean).length > 0) {
      AppEventsLogger.logEvent(eventName, valueToSum, clean);
    } else if (typeof valueToSum === "number") {
      AppEventsLogger.logEvent(eventName, valueToSum);
    } else if (Object.keys(clean).length > 0) {
      AppEventsLogger.logEvent(eventName, clean);
    } else {
      AppEventsLogger.logEvent(eventName);
    }
  } catch (err) {
    if (__DEV_LOG__) {
      // eslint-disable-next-line no-console
      console.warn("[analytics] falha ao logar evento:", eventName, err);
    }
  }
}

/**
 * Loga uma compra (evento "Purchased" da Meta, ideal para otimização de
 * campanhas de conversão/valor). Para assinaturas, chame também
 * `trackSubscriptionStarted`.
 *
 * @param amount       valor numérico (ex.: 9.99)
 * @param currencyCode ISO 4217 (ex.: "USD", "BRL")
 */
export function trackPurchase(
  amount: number,
  currencyCode: string,
  params?: Record<string, ParamValue | boolean | null | undefined>,
): void {
  const clean = cleanParams(params);
  if (!nativeReady || !FBSDK) {
    devNoop("Purchased", { amount, currencyCode, ...clean });
    return;
  }
  try {
    FBSDK.AppEventsLogger.logPurchase(amount, currencyCode, clean);
  } catch (err) {
    if (__DEV_LOG__) {
      // eslint-disable-next-line no-console
      console.warn("[analytics] falha ao logar compra:", err);
    }
  }
}

// ─── INICIALIZAÇÃO + APP TRACKING TRANSPARENCY (iOS) ──────────────────────────

let initialized = false;

/**
 * Chame UMA vez no início do app (em app/_layout.tsx).
 *
 * - iOS 14.5+: pede a permissão de App Tracking Transparency (ATT) e, conforme
 *   a resposta, habilita/desabilita o uso do IDFA para atribuição. Sem isso o
 *   Facebook não consegue atribuir instalações/conversões a anúncios no iOS.
 * - Garante a inicialização do SDK (idempotente — seguro mesmo com autoinit on).
 *
 * É 100% seguro chamar na web / Expo Go: simplesmente não faz nada.
 */
export async function initAnalytics(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!nativeReady || !FBSDK) {
    devNoop("initAnalytics (sem SDK nativo neste ambiente)");
    return;
  }

  const { Settings } = FBSDK;

  try {
    // 1) iOS: App Tracking Transparency. Exigimos o módulo de forma preguiçosa
    //    para não quebrar caso ele não esteja instalado.
    if (Platform.OS === "ios") {
      let trackingGranted = false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ATT = require("expo-tracking-transparency");
        const { status } = await ATT.requestTrackingPermissionsAsync();
        trackingGranted = status === "granted";
      } catch {
        // expo-tracking-transparency ausente: segue sem IDFA.
        trackingGranted = false;
      }
      try {
        await Settings.setAdvertiserTrackingEnabled(trackingGranted);
      } catch {
        /* iOS < 14 ou indisponível: ignora */
      }
    }

    // 2) Inicializa o SDK explicitamente (defensivo: cobre o caso de
    //    isAutoInitEnabled estar desligado em app.json).
    Settings.setAutoLogAppEventsEnabled(true);
    Settings.setAdvertiserIDCollectionEnabled(true);
    Settings.initializeSDK();
  } catch (err) {
    if (__DEV_LOG__) {
      // eslint-disable-next-line no-console
      console.warn("[analytics] initAnalytics falhou:", err);
    }
  }
}

// ─── IDENTIFICAÇÃO DO USUÁRIO (opcional) ──────────────────────────────────────

/** Associa eventos a um id de usuário (ex.: o appUserID do RevenueCat). */
export function setAnalyticsUserId(userId: string | null): void {
  if (!nativeReady || !FBSDK) {
    devNoop("setUserID", { userId: userId ?? "(null)" });
    return;
  }
  try {
    FBSDK.AppEventsLogger.setUserID(userId);
  } catch {
    /* silencioso */
  }
}

/** Força o envio imediato dos eventos em buffer (normalmente não é preciso). */
export function flushAnalytics(): void {
  if (!nativeReady || !FBSDK) return;
  try {
    FBSDK.AppEventsLogger.flush();
  } catch {
    /* silencioso */
  }
}

// ─── EVENTOS DE ALTO NÍVEL (a API que o app deve usar) ────────────────────────

/**
 * VISUALIZAÇÃO de conteúdo — a "view" pedida. Dispare quando o leitor abre uma
 * história/capítulo. Mapeia para o evento padrão ViewedContent da Meta.
 */
export function trackContentView(args: {
  contentId: string;
  contentName?: string;
  contentType?: string; // "story" | "chapter" | "lesson"...
  category?: string;
}): void {
  trackEvent(AnalyticsEvent.VIEWED_CONTENT, {
    [FBParam.CONTENT_ID]: args.contentId,
    [FBParam.CONTENT_TYPE]: args.contentType ?? "story",
    [FBParam.CONTENT]: args.contentName ?? args.contentId,
    content_name: args.contentName ?? args.contentId,
    ...(args.category ? { category: args.category } : {}),
  });
}

/** Conteúdo aberto/iniciado (evento custom complementar ao ViewedContent). */
export function trackContentOpen(args: {
  contentId: string;
  contentName?: string;
  contentType?: string;
  source?: string; // "home" | "library" | "stories" | "category"...
}): void {
  trackEvent(AnalyticsEvent.CONTENT_OPEN, {
    content_id: args.contentId,
    content_name: args.contentName ?? args.contentId,
    content_type: args.contentType ?? "story",
    ...(args.source ? { source: args.source } : {}),
  });
}

/** Capítulo concluído (criança chegou na última página). */
export function trackChapterCompleted(args: {
  storyId: string;
  chapterId: string | number;
  chapterIndex?: number;
  totalChapters?: number;
}): void {
  trackEvent(AnalyticsEvent.CHAPTER_COMPLETED, {
    story_id: args.storyId,
    chapter_id: String(args.chapterId),
    ...(args.chapterIndex != null ? { chapter_index: args.chapterIndex } : {}),
    ...(args.totalChapters != null ? { total_chapters: args.totalChapters } : {}),
  });
}

/**
 * História 100% concluída. Loga tanto o evento custom quanto o padrão da Meta
 * (AchievedLevel), útil para campanhas de engajamento/retenção.
 */
export function trackStoryCompleted(args: {
  storyId: string;
  storyName?: string;
  totalChapters?: number;
}): void {
  trackEvent(AnalyticsEvent.STORY_COMPLETED, {
    story_id: args.storyId,
    story_name: args.storyName ?? args.storyId,
    ...(args.totalChapters != null ? { total_chapters: args.totalChapters } : {}),
  });
  trackEvent(AnalyticsEvent.ACHIEVED_LEVEL, {
    [FBParam.CONTENT_ID]: args.storyId,
    level: args.storyName ?? args.storyId,
  });
}

/** Abertura de um mini-game (Farm, Ping Pong, Pixel Run, Gravity...). */
export function trackGameOpen(args: { gameId: string; gameName?: string }): void {
  trackEvent(AnalyticsEvent.GAME_OPEN, {
    game_id: args.gameId,
    game_name: args.gameName ?? args.gameId,
  });
}

/** Paywall exibido para o usuário. */
export function trackPaywallView(args?: { source?: string }): void {
  trackEvent(AnalyticsEvent.PAYWALL_VIEW, {
    ...(args?.source ? { source: args.source } : {}),
  });
}

/** Usuário tocou em "assinar" e o fluxo de compra começou (checkout). */
export function trackCheckoutInitiated(args?: {
  productId?: string;
  price?: number;
  currency?: string;
}): void {
  trackEvent(AnalyticsEvent.INITIATED_CHECKOUT, {
    ...(args?.productId ? { [FBParam.CONTENT_ID]: args.productId } : {}),
    ...(args?.currency ? { [FBParam.CURRENCY]: args.currency } : {}),
    ...(args?.price != null ? { value: args.price } : {}),
  });
}

/**
 * Assinatura iniciada com sucesso. Loga o evento Subscribe (ou StartTrial) da
 * Meta com valor/moeda, e — quando houver preço — também registra a compra.
 */
export function trackSubscriptionStarted(args: {
  productId: string;
  price?: number;
  currency?: string;
  isTrial?: boolean;
  period?: string; // "monthly" | "annual"...
}): void {
  const eventName = args.isTrial ? AnalyticsEvent.START_TRIAL : AnalyticsEvent.SUBSCRIBE;
  trackEvent(
    eventName,
    {
      [FBParam.CONTENT_ID]: args.productId,
      ...(args.currency ? { [FBParam.CURRENCY]: args.currency } : {}),
      ...(args.period ? { period: args.period } : {}),
    },
    args.price ?? 0,
  );

  if (args.price != null && args.currency) {
    trackPurchase(args.price, args.currency, {
      [FBParam.CONTENT_ID]: args.productId,
      product_id: args.productId,
      ...(args.period ? { period: args.period } : {}),
      is_subscription: true,
    });
  }
}

/** Onboarding concluído (último slide → entrar no app). */
export function trackOnboardingCompleted(): void {
  trackEvent(AnalyticsEvent.COMPLETED_TUTORIAL, { [FBParam.SUCCESS]: true });
}

/** Busca dentro do app. */
export function trackSearch(args: { query: string; resultCount?: number }): void {
  trackEvent(AnalyticsEvent.SEARCHED, {
    [FBParam.SEARCH_STRING]: args.query,
    ...(args.resultCount != null ? { [FBParam.NUM_ITEMS]: args.resultCount } : {}),
  });
}

/** Conquista/badge desbloqueada. */
export function trackAchievementUnlocked(args: { achievementId: string }): void {
  trackEvent(AnalyticsEvent.UNLOCKED_ACHIEVEMENT, {
    [FBParam.CONTENT_ID]: args.achievementId,
    achievement: args.achievementId,
  });
}

/**
 * "DOWNLOAD" de conteúdo. O Pedagogy hoje não baixa arquivos — as INSTALAÇÕES
 * do app já são contadas automaticamente pela Meta (ver app.json). Esta função
 * fica pronta para o dia em que você adicionar "salvar/baixar para offline":
 * basta chamá-la no handler de download.
 */
export function trackContentDownload(args: {
  contentId: string;
  contentName?: string;
  contentType?: string;
}): void {
  trackEvent(AnalyticsEvent.CONTENT_DOWNLOAD, {
    content_id: args.contentId,
    content_name: args.contentName ?? args.contentId,
    content_type: args.contentType ?? "story",
  });
}
