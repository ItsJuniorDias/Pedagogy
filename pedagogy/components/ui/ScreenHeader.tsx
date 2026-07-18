// components/ui/ScreenHeader.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Header padrão das telas empilhadas (categoria, stories, perfil, trilhas,
// jogos…). Antes cada tela reimplementava o mesmo bloco com paddings, sombras
// e tamanhos levemente diferentes — e todas usavam
// `paddingTop: StatusBar.currentHeight ?? 44`, que no iOS SEMPRE cai no 44
// (currentHeight é Android-only): errado em aparelhos com Dynamic Island (59)
// e sobrando no SE. Aqui o inset vem do safe-area de verdade.
//
// Também corrige acessibilidade: botão de voltar com 44×44 (alvo mínimo HIG),
// hitSlop, accessibilityRole/Label, e um emoji decorativo opcional que os
// leitores de tela ignoram.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import {
  fredoka,
  HIT_SLOP,
  MIN_TOUCH,
  Shadow,
  Theme,
} from "@/constants/theme";
import { enterUp, PressBounce } from "@/shared/motion";

type Props = {
  title: string;
  /** Emoji decorativo ao lado do título (opcional). */
  emoji?: React.ReactNode;
  /** Slot à direita — por padrão um spacer que mantém o título centralizado. */
  right?: React.ReactNode;
  /** Sobrescreve o comportamento do voltar (padrão: router.back()). */
  onBack?: () => void;
  /** Delay da animação de entrada. */
  delay?: number;
};

export default function ScreenHeader({
  title,
  emoji,
  right,
  onBack,
  delay = 0,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Animated.View
      entering={enterUp(delay)}
      style={[s.header, { paddingTop: insets.top + Theme.space.sm }]}
    >
      <PressBounce
        style={s.backBtn}
        onPress={onBack ?? (() => router.back())}
        scaleTo={0.9}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
      >
        <Text style={s.backArrow}>←</Text>
      </PressBounce>

      <View style={s.titleRow} accessibilityRole="header">
        <Text style={fredoka(20, Theme.colors.ink)} numberOfLines={1}>
          {title}
        </Text>
        {emoji ? (
          <View importantForAccessibility="no-hide-descendants">{emoji}</View>
        ) : null}
      </View>

      {right ?? <View style={{ width: MIN_TOUCH }} />}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Theme.space.xl,
    paddingBottom: Theme.space.md,
    gap: Theme.space.sm,
  },
  backBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.card,
  },
  backArrow: { fontSize: 20, color: Theme.colors.ink },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
