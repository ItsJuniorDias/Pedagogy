/**
 * ─── PAYWALL · HÁPTICA ───────────────────────────────────────────────────────
 * Toque físico ao escolher plano e ao tocar no CTA. Barato de implementar e
 * mensurável: confirma a seleção sem precisar olhar, o que reduz o "cliquei ou
 * não cliquei?" no momento mais caro da tela.
 *
 * `expo-haptics` já é dependência do projeto. Tudo é best-effort: em web, em
 * simulador ou em aparelho sem motor, a chamada falha em silêncio e nunca
 * derruba a UI.
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const enabled = Platform.OS === "ios" || Platform.OS === "android";

/** Seleção de plano — feedback leve. */
export function tapSelection(): void {
  if (!enabled) return;
  try {
    void Haptics.selectionAsync().catch(() => {});
  } catch {
    /* silencioso por design */
  }
}

/** Toque no CTA — impacto médio. */
export function tapImpact(): void {
  if (!enabled) return;
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  } catch {
    /* silencioso por design */
  }
}

/** Compra concluída — notificação de sucesso. */
export function tapSuccess(): void {
  if (!enabled) return;
  try {
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});
  } catch {
    /* silencioso por design */
  }
}
