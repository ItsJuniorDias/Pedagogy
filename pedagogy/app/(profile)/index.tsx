import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, { FlipInEasyX } from "react-native-reanimated";

import { useTranslation } from "react-i18next";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { fredoka, Shadow, Theme } from "@/constants/theme";
import { Breathe, enterPop, enterUp, PressBounce, Swing } from "../../shared/motion";

// ─── PROGRESSO REAL (substitui os mocks) ─────────────────────────────────────
import {
  computeBadges,
  computeLevel,
  getProgress,
  ReadingProgress,
} from "../../lib/readingProgress"; // ← ajuste o caminho conforme sua pasta

import WeeklyReadingCard from "../../components/WeeklyReadingCard";

// ─── i18n: seletor de idioma ─────────────────────────────────────────────────
import LanguageSheet from "../../components/LanguageSheet";
import { getCurrentLanguage, getLanguageOrDefault } from "../../lib/i18n";

// Ids de badge conhecidos (espelham computeBadges em lib/readingProgress e as
// chaves em profile.badges.* dos locales). O cast para este tipo permite montar
// a chave i18n dinamicamente mantendo a validação de chaves do TypeScript.
type BadgeId =
  | "explorer"
  | "artist"
  | "scientist"
  | "bookworm"
  | "dinofan"
  | "nightowl";

export default function ProfileScreen() {
  const { t } = useTranslation();

  // Controla a abertura do bottom-sheet de idiomas.
  const [langSheetOpen, setLangSheetOpen] = useState(false);

  // Idioma atual. getCurrentLanguage() normaliza códigos com região (ex.:
  // "en-US" → "en") e getLanguageOrDefault garante um objeto sempre válido.
  // useTranslation() já re-renderiza esta tela quando o idioma muda, então a
  // bandeira/nome abaixo se atualizam sozinhos.
  const currentLang = getLanguageOrDefault(getCurrentLanguage());

  const [progress, setProgress] = useState<ReadingProgress | null>(null);

  // Recarrega sempre que a tela ganha foco (ex: voltou da leitura)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProgress().then((p) => {
        if (active) setProgress(p);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  // ── Stats derivados do progresso real ──
  const badges = progress ? computeBadges(progress) : [];
  const earnedBadges = badges.filter((b) => b.earned).length;
  const level = computeLevel(progress?.stars ?? 0);

  const stats = [
    {
      emoji: "⭐",
      value: String(progress?.stars ?? 0),
      label: t("profile.stats.stars"),
    },
    {
      emoji: "📖",
      value: String(progress?.storiesCompleted.length ?? 0),
      label: t("profile.stats.stories"),
    },
    { emoji: "🏆", value: String(earnedBadges), label: t("profile.stats.badges") },
    {
      emoji: "🔥",
      value: String(progress?.streak ?? 0),
      label: t("profile.stats.dayStreak"),
    },
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.bg} />

      <View style={[s.blob, s.blob1]} />

      {/* Header compartilhado — safe-area aware, botão voltar acessível */}
      <ScreenHeader title={t("profile.title")} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Avatar card — cerimônia de entrada: o ursinho dá um pop
            com overshoot e fica balançando feliz */}
        <Animated.View entering={enterUp(60)} style={s.avatarCard}>
          <Animated.View entering={enterPop(250)} style={s.avatar}>
            <Swing angle={6} duration={2000} delay={800}>
              <Text style={{ fontSize: 48 }}>🐻</Text>
            </Swing>
          </Animated.View>
          <Text style={fredoka(22, Theme.colors.ink)}>{t("profile.displayName")}</Text>
          <Text style={s.avatarSub}>{t("profile.level", { level })}</Text>
        </Animated.View>

        {/* Seletor de idioma — abre o bottom-sheet de tradução do app.
            Mostra a bandeira + nome nativo do idioma ativo. */}
        <Animated.View entering={enterUp(120)}>
          <PressBounce
            style={s.langRow}
            onPress={() => setLangSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t("profile.languageRow")}
          >
            <View style={s.langFlag}>
              <Text style={{ fontSize: 22 }}>{currentLang.flag}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={fredoka(15, Theme.colors.ink)}>
                {t("profile.languageRow")}
              </Text>
              <Text style={s.langValue}>{currentLang.nativeName}</Text>
            </View>
            <Text style={s.langChevron}>›</Text>
          </PressBounce>
        </Animated.View>

        {/* Stats row — cards viram como medalhas (flip 3D em cascata) */}
        <View style={s.statsRow}>
          {stats.map((stat, i) => (
            <Animated.View
              key={stat.emoji}
              entering={FlipInEasyX.delay(300 + i * 120)
                .springify()
                .damping(14)}
              style={s.statCard}
            >
              <Text style={{ fontSize: 22 }}>{stat.emoji}</Text>
              <Text style={fredoka(18, Theme.colors.ink)}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* This week — tempo de leitura por dia da semana atual */}
        <WeeklyReadingCard progress={progress} delay={420} />

        {/* Badges */}
        <Text
          style={[fredoka(18, Theme.colors.ink), { marginBottom: 12, marginTop: 4 }]}
        >
          {t("profile.badgesTitle")}
        </Text>
        {/* Badges conquistados dão pop e "respiram" de orgulho;
            os bloqueados ficam quietinhos */}
        <View style={s.badgesGrid}>
          {badges.map((badge, i) => (
            <Animated.View
              key={badge.id}
              entering={enterPop(400 + i * 80)}
              style={[s.badgeCard, !badge.earned && s.badgeCardLocked]}
            >
              {badge.earned ? (
                <Breathe scaleTo={1.12} duration={1800} delay={i * 300}>
                  <Text style={{ fontSize: 32 }}>{badge.emoji}</Text>
                </Breathe>
              ) : (
                <Text style={[{ fontSize: 32 }, s.emojiLocked]}>
                  {badge.emoji}
                </Text>
              )}
              <Text style={[s.badgeLabel, !badge.earned && s.badgeLabelLocked]}>
                {t(`profile.badges.${badge.id as BadgeId}`)}
              </Text>
              {!badge.earned && <Text style={s.lockIcon}>🔒</Text>}
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom-sheet de seleção de idioma (fica fora do ScrollView pra
          cobrir a tela inteira quando aberto). */}
      <LanguageSheet
        visible={langSheetOpen}
        onClose={() => setLangSheetOpen(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bg,
  },
  scroll: { paddingHorizontal: Theme.space.xl, paddingBottom: 100 },
  blob: { position: "absolute", borderRadius: Theme.radius.pill },
  blob1: {
    width: 200,
    height: 200,
    backgroundColor: Theme.colors.primaryTint,
    top: -60,
    right: -50,
  },

  avatarCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.xxl,
    padding: Theme.space.xxl,
    alignItems: "center",
    marginBottom: Theme.space.xl,
    ...Shadow.card,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Theme.colors.highlight,
    borderWidth: 4,
    borderColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.space.md,
    ...Shadow.glowHighlight,
  },
  avatarSub: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontWeight: "600",
    marginTop: 4,
  },

  // ─── Linha do seletor de idioma ───
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: 14,
    marginBottom: Theme.space.xl,
    gap: 12,
    ...Shadow.card,
  },
  langFlag: {
    width: 44,
    height: 44,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.primaryFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  langValue: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: "700",
    marginTop: 2,
  },
  langChevron: {
    fontSize: 26,
    color: Theme.colors.textFaint,
    fontWeight: "800",
    marginRight: 4,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    marginHorizontal: 4,
    padding: Theme.space.md,
    alignItems: "center",
    gap: 4,
    ...Shadow.card,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Theme.colors.textFaint,
    textAlign: "center",
  },

  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard: {
    width: "30%",
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: 14,
    alignItems: "center",
    gap: 6,
    ...Shadow.card,
  },
  badgeCardLocked: { backgroundColor: "#F8F8F8", opacity: 0.7 },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.colors.textMuted,
    textAlign: "center",
  },
  badgeLabelLocked: { color: Theme.colors.textFaint },
  emojiLocked: { opacity: 0.35 },
  lockIcon: { position: "absolute", top: 8, right: 8, fontSize: 12 },
});
