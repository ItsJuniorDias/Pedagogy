// lib/analytics.ts
// ─────────────────────────────────────────────────────────────────────────────
// CAMADA ÚNICA DE TRACKING (stub local — SEM SDKs de terceiros).
//
// ⚠️ CATEGORIA KIDS DA APP STORE (App Review Guideline 1.3 / 5.1.4):
// Apps da categoria infantil NÃO podem incluir SDKs de analytics ou publicidade
// de terceiros, nem transmitir informação pessoal ou de dispositivo (incluindo o
// IDFA) para terceiros — basta o app ter a *capacidade* de fazê-lo para ser
// rejeitado. Por isso foram REMOVIDOS deste projeto:
//   • react-native-fbsdk-next  (SDK de App Events da Meta/Facebook)
//   • expo-tracking-transparency (prompt de ATT / IDFA — também barrado em Kids)
//
// Este arquivo mantém EXATAMENTE a mesma API pública de antes (mesmos nomes de
// função e assinaturas), mas agora cada função é um NO-OP local: nada sai do
// app. Assim nenhuma tela precisou ser alterada — todas continuam chamando
// `trackContentView(...)`, `trackSubscriptionStarted(...)`, etc.; essas chamadas
// apenas não fazem nada externamente (e, em modo dev, imprimem no console para
// você continuar acompanhando os eventos durante o desenvolvimento).
//
// Quiser métricas de produto de forma COMPATÍVEL com Kids no futuro? Troque o
// corpo destas funções por uma solução de PRIMEIRA PARTE (seu próprio backend)
// ou uma analytics self-hosted que comprovadamente não colete IDFA nem
// informação de dispositivo — sem reintroduzir SDKs de terceiros.
// ─────────────────────────────────────────────────────────────────────────────

const __DEV_LOG__ = typeof __DEV__ !== "undefined" && __DEV__;

/** Loga no console apenas em dev, para acompanhar os eventos durante o dev. */
function devLog(event: string, params?: Record<string, unknown>): void {
  if (__DEV_LOG__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics:noop] ${event}`, params ?? "");
  }
}

/**
 * Nenhum analytics de terceiros está ativo (exigência da categoria Kids).
 * Mantida por compatibilidade — sempre retorna false.
 */
export function isAnalyticsActive(): boolean {
  return false;
}

// ─── REGISTRO CENTRAL DE NOMES DE EVENTOS (apenas rótulos LOCAIS) ─────────────
// Mantido para compatibilidade de import. São apenas strings locais usadas no
// log de dev — sem qualquer vínculo com a Meta/Facebook.
export const AnalyticsEvent = {
  VIEWED_CONTENT: "content_view",
  SEARCHED: "search",
  COMPLETED_TUTORIAL: "tutorial_completed",
  ACHIEVED_LEVEL: "level_achieved",
  UNLOCKED_ACHIEVEMENT: "achievement_unlocked",
  INITIATED_CHECKOUT: "checkout_initiated",
  SUBSCRIBE: "subscribe",
  START_TRIAL: "start_trial",
  CONTENT_OPEN: "content_open",
  CHAPTER_COMPLETED: "chapter_completed",
  STORY_COMPLETED: "story_completed",
  GAME_OPEN: "game_open",
  PAYWALL_VIEW: "paywall_view",
  CONTENT_DOWNLOAD: "content_download",
  READING_SESSION: "reading_session",
} as const;

type ParamValue = string | number;

// ─── NÚCLEO ───────────────────────────────────────────────────────────────────

/** Base de baixo nível. No-op: apenas loga em dev. */
export function trackEvent(
  eventName: string,
  params?: Record<string, ParamValue | boolean | null | undefined>,
  valueToSum?: number,
): void {
  devLog(eventName, {
    ...(params ?? {}),
    ...(valueToSum != null ? { _value: valueToSum } : {}),
  });
}

/** Compra. No-op: apenas loga em dev. */
export function trackPurchase(
  amount: number,
  currencyCode: string,
  params?: Record<string, ParamValue | boolean | null | undefined>,
): void {
  devLog("purchase", { amount, currencyCode, ...(params ?? {}) });
}

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────

/**
 * Mantida por compatibilidade (chamada em app/_layout.tsx). NÃO inicializa
 * nenhum SDK e NÃO pede App Tracking Transparency. 100% segura em qualquer
 * plataforma — não faz nada além de, opcionalmente, logar em dev.
 */
export async function initAnalytics(): Promise<void> {
  devLog("initAnalytics (no-op — sem SDK de terceiros; compatível com Kids)");
}

/** Compat: não há serviço externo ao qual associar um usuário. */
export function setAnalyticsUserId(userId: string | null): void {
  devLog("setUserId", { userId: userId ?? "(null)" });
}

/** Compat: não há buffer externo para esvaziar. */
export function flushAnalytics(): void {
  /* no-op */
}

// ─── EVENTOS DE ALTO NÍVEL (mesma API de antes; agora no-ops locais) ──────────

export function trackContentView(args: {
  contentId: string;
  contentName?: string;
  contentType?: string;
  category?: string;
}): void {
  trackEvent(AnalyticsEvent.VIEWED_CONTENT, {
    content_id: args.contentId,
    content_type: args.contentType ?? "story",
    content_name: args.contentName ?? args.contentId,
    ...(args.category ? { category: args.category } : {}),
  });
}

export function trackContentOpen(args: {
  contentId: string;
  contentName?: string;
  contentType?: string;
  source?: string;
}): void {
  trackEvent(AnalyticsEvent.CONTENT_OPEN, {
    content_id: args.contentId,
    content_name: args.contentName ?? args.contentId,
    content_type: args.contentType ?? "story",
    ...(args.source ? { source: args.source } : {}),
  });
}

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
    content_id: args.storyId,
    level: args.storyName ?? args.storyId,
  });
}

export function trackGameOpen(args: { gameId: string; gameName?: string }): void {
  trackEvent(AnalyticsEvent.GAME_OPEN, {
    game_id: args.gameId,
    game_name: args.gameName ?? args.gameId,
  });
}

export function trackPaywallView(args?: { source?: string }): void {
  trackEvent(AnalyticsEvent.PAYWALL_VIEW, {
    ...(args?.source ? { source: args.source } : {}),
  });
}

export function trackCheckoutInitiated(args?: {
  productId?: string;
  price?: number;
  currency?: string;
}): void {
  trackEvent(AnalyticsEvent.INITIATED_CHECKOUT, {
    ...(args?.productId ? { content_id: args.productId } : {}),
    ...(args?.currency ? { currency: args.currency } : {}),
    ...(args?.price != null ? { value: args.price } : {}),
  });
}

export function trackSubscriptionStarted(args: {
  productId: string;
  price?: number;
  currency?: string;
  isTrial?: boolean;
  period?: string;
}): void {
  const eventName = args.isTrial ? AnalyticsEvent.START_TRIAL : AnalyticsEvent.SUBSCRIBE;
  trackEvent(
    eventName,
    {
      content_id: args.productId,
      ...(args.currency ? { currency: args.currency } : {}),
      ...(args.period ? { period: args.period } : {}),
    },
    args.price ?? 0,
  );

  if (args.price != null && args.currency) {
    trackPurchase(args.price, args.currency, {
      content_id: args.productId,
      product_id: args.productId,
      ...(args.period ? { period: args.period } : {}),
      is_subscription: true,
    });
  }
}

export function trackOnboardingCompleted(): void {
  trackEvent(AnalyticsEvent.COMPLETED_TUTORIAL, { success: true });
}

export function trackSearch(args: { query: string; resultCount?: number }): void {
  trackEvent(AnalyticsEvent.SEARCHED, {
    search_string: args.query,
    ...(args.resultCount != null ? { num_items: args.resultCount } : {}),
  });
}

export function trackAchievementUnlocked(args: { achievementId: string }): void {
  trackEvent(AnalyticsEvent.UNLOCKED_ACHIEVEMENT, {
    content_id: args.achievementId,
    achievement: args.achievementId,
  });
}

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
