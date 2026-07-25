/**
 * ─── PAYWALL · BLOCOS DE VALOR ───────────────────────────────────────────────
 *
 * `FeatureList` — o que a assinatura entrega.
 *   Antes cada linha tinha DOIS glifos: um ✅ verde dentro de um círculo e mais
 *   o emoji temático (📚, 🔊, 🧩…). O ✅ é redundante — a lista inteira já é de
 *   itens incluídos — e o par de ícones empurrava o bloco para ~330pt de altura,
 *   afastando os planos da primeira dobra. Agora é um glifo por linha, dentro de
 *   um círculo tonal, e a lista ocupa cerca de 40% menos altura.
 *
 * `TrustRow` — selos factuais de confiança (sem depoimento inventado).
 */

import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";

import { fredoka, Shadow, Theme } from "@/constants/theme";

import { enterRight, enterUp } from "../../../shared/motion";

const { width } = Dimensions.get("window");

const FEATURES = [
  { emoji: "📚", key: "paywall.features.stories" },
  { emoji: "🔊", key: "paywall.features.narration" },
  { emoji: "🧩", key: "paywall.features.activities" },
  { emoji: "📊", key: "paywall.features.progress" },
  { emoji: "🎮", key: "paywall.features.games" },
  { emoji: "🚫", key: "paywall.features.noAds" },
] as const;

// ⚠️ Selos FACTUAIS. Não use depoimentos inventados — conteúdo enganoso é
// rejeição certa (App Review Guideline 2.3). Avaliações reais entram pelo
// componente SocialProof, alimentado por dados verificáveis da App Store.
const TRUST = [
  {
    icon: "🔒",
    titleKey: "paywall.trust.safeTitle",
    textKey: "paywall.trust.safeText",
  },
  {
    icon: "🚫",
    titleKey: "paywall.trust.noAdsTitle",
    textKey: "paywall.trust.noAdsText",
  },
  {
    icon: "↩️",
    titleKey: "paywall.trust.cancelTitle",
    textKey: "paywall.trust.cancelText",
  },
] as const;

export function FeatureList() {
  const { t } = useTranslation();

  return (
    <Animated.View entering={enterUp(260)} style={s.card}>
      {FEATURES.map((f, i) => (
        <Animated.View
          key={f.key}
          entering={enterRight(320 + i * 70)}
          style={s.row}
        >
          <View style={s.iconCircle}>
            <Text style={{ fontSize: 15 }}>{f.emoji}</Text>
          </View>
          <Text style={s.rowText}>{t(f.key)}</Text>
        </Animated.View>
      ))}
    </Animated.View>
  );
}

export function TrustRow() {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.trustRow}
    >
      {TRUST.map((item, i) => (
        <Animated.View
          key={item.titleKey}
          entering={enterRight(160 + i * 120)}
          style={s.trustCard}
        >
          <View style={s.trustAvatar}>
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
          </View>
          <Text style={fredoka(15, Theme.colors.ink)}>{t(item.titleKey)}</Text>
          <Text style={s.trustText}>{t(item.textKey)}</Text>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.space.xl,
    borderRadius: Theme.radius.xl,
    padding: Theme.space.xl,
    gap: Theme.space.md,
    marginBottom: Theme.space.xxl,
    ...Shadow.card,
  },
  row: { flexDirection: "row", alignItems: "center", gap: Theme.space.md },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Theme.colors.primaryFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.ink,
    lineHeight: 19,
  },
  trustRow: { gap: Theme.space.md, paddingHorizontal: Theme.space.xl, paddingBottom: Theme.space.sm },
  trustCard: {
    width: width * 0.64,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.xl,
    padding: Theme.space.lg,
    gap: Theme.space.xs + 2,
    ...Shadow.card,
  },
  trustAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  trustText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontWeight: "600",
    lineHeight: 18,
  },
});
