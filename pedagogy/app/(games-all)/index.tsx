import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { fredoka, Shadow, Theme } from "@/constants/theme";
import { Breathe, enterRight, PressBounce, Wiggle } from "../../shared/motion";

// Chaves i18n de exibição (título/sub e selo). Não substituem `title`/`tagLabel`,
// que seguem estáveis (analytics e lógica de filtro por índice).
type GameKey = "farmGame" | "pingPong" | "pixelRun" | "gravity";
type TagKey = "new" | "top" | "hot";

const ALL_GAMES = [
  {
    id: "farm-game",
    i18nKey: "farmGame" as GameKey,
    tagKey: "new" as TagKey,
    title: "Farm Game",
    sub: "Manage your farm and harvest crops!",
    tagLabel: "New ✨",
    tagVariant: "emerald",
    tagBg: "#D1FAE5",
    tagColor: "#065F46",
    iconBg: "#FFF7E0",
    canvasBg: "#FFFBEB",
    emoji: "🚜",
    route: "/(farm-game)",
    category: "farming",
  },
  {
    id: "ping-pong",
    i18nKey: "pingPong" as GameKey,
    tagKey: "top" as TagKey,
    title: "Ping Pong",
    sub: "Classic ping pong game!",
    tagLabel: "Top ⭐",
    tagVariant: "yellow",
    tagBg: "#FEF3C7",
    tagColor: "#92400E",
    iconBg: "#FFF7E0",
    canvasBg: "#FFFBEB",
    emoji: "🏓",
    route: "/(ping-pong)",
    category: "sports",
  },
  {
    id: "pixel-run",
    i18nKey: "pixelRun" as GameKey,
    tagKey: "hot" as TagKey,
    emoji: "👾",
    title: "Pixel Run",
    sub: "Endless runner in space!",
    tagLabel: "Hot 🔥",
    tagBg: "#FEF3C7",
    tagColor: "#92400E",
    iconBg: "#FFF7E0",
    route: "/(pixel-run)",
    category: "space",
  },
  {
    id: "gravity",
    i18nKey: "gravity" as GameKey,
    tagKey: "new" as TagKey,
    emoji: "🧲",
    title: "Gravity Game",
    sub: "Classic gravity game!",
    tagLabel: "New ✨",
    tagBg: "#D1FAE5",
    tagColor: "#065F46",
    iconBg: "#ECFDF5",
    route: "/(gravity)",
    category: "science",
  },
];

export default function GamesAllScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // Com 4 jogos, filtro não agrega — e o código de filtro anterior era morto:
  // os chips nunca eram renderizados, então o estado ficava travado em "All".
  const filtered = ALL_GAMES;

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.bg} />

      <View style={[s.blob, s.blob1]} />

      {/* Header compartilhado — safe-area aware, botão voltar acessível */}
      <ScreenHeader
        title={t("games.header")}
        emoji={
          <Wiggle angle={12} pause={1800}>
            <Text style={{ fontSize: 20 }}>🎮</Text>
          </Wiggle>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Cards chegam em "esteira" pela direita, um atrás do outro.
            O emoji de cada jogo sacode como um joystick 🕹️ e o selo respira */}
        {filtered.map((game, i) => (
          <PressBounce
            key={game.id}
            entering={enterRight(i * 110)}
            style={s.card}
            accessibilityRole="button"
            accessibilityLabel={t(`games.${game.i18nKey}.title`)}
            onPress={() => router.push(game.route as any)}
          >
            <View style={[s.icon, { backgroundColor: game.iconBg }]}>
              <Wiggle delay={600 + i * 700} angle={10} pause={2600}>
                <Text style={s.iconEmoji}>{game.emoji}</Text>
              </Wiggle>
            </View>
            <View style={s.body}>
              <Text style={fredoka(16, Theme.colors.ink)}>
                {t(`games.${game.i18nKey}.title`)}
              </Text>
              <Text style={s.sub}>{t(`games.${game.i18nKey}.sub`)}</Text>
            </View>
            <Breathe delay={i * 350} scaleTo={1.1} duration={1600}>
              <View style={[s.tag, { backgroundColor: game.tagBg }]}>
                <Text style={[s.tagText, { color: game.tagColor }]}>
                  {t(`games.tags.${game.tagKey}`)}
                </Text>
              </View>
            </Breathe>
          </PressBounce>
        ))}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bg,
  },
  scroll: {
    paddingHorizontal: Theme.space.xl,
    paddingBottom: 100,
  },
  blob: { position: "absolute", borderRadius: Theme.radius.pill },
  blob1: {
    width: 180,
    height: 180,
    backgroundColor: Theme.colors.primaryTint,
    top: -50,
    right: -40,
  },

  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.xl,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: Theme.space.md,
    ...Shadow.card,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: Theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 34 },
  body: { flex: 1 },
  sub: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.colors.textFaint,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Theme.radius.sm,
  },
  tagText: { fontSize: 11, fontWeight: "900" },
});
