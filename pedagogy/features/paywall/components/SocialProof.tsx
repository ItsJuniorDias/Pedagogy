/**
 * ─── PAYWALL · PROVA SOCIAL ──────────────────────────────────────────────────
 * Faixa de nota da App Store, logo abaixo do herói — o ponto em que o pai ainda
 * está decidindo se vale a pena continuar lendo.
 *
 * Renderiza `null` enquanto `APP_STORE_RATING` for `null` (ver
 * `features/paywall/socialProof.ts`). Nada de número inventado: melhor não ter
 * prova social do que ter prova social falsa.
 */

import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";

import { Theme } from "@/constants/theme";

import { enterUp } from "../../../shared/motion";
import { APP_STORE_RATING, ratingStars } from "../socialProof";

export function SocialProof() {
  const { t } = useTranslation();
  if (!APP_STORE_RATING) return null;

  const { rating, count } = APP_STORE_RATING;
  const label = t("paywall.rating", {
    rating: rating.toFixed(1),
    count,
  });

  return (
    <Animated.View
      entering={enterUp(200)}
      style={s.wrap}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text style={s.stars}>{ratingStars(rating)}</Text>
      <Text style={s.text}>{label}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.space.sm,
    marginBottom: Theme.space.xl,
    paddingHorizontal: Theme.space.xl,
  },
  stars: {
    fontSize: 14,
    color: Theme.colors.highlight,
    letterSpacing: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.colors.textMuted,
  },
});
