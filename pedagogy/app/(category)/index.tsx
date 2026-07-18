import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { fredoka, Shadow, Theme } from "@/constants/theme";
import { DealIn, enterPop, PressBounce, Swing, Twinkle } from "../../shared/motion";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type CategoryItem = {
  emoji: string;
  title: string;
  sub: string;
  storyId: string; // ID exato que bate com o STORY_MAP da ReadStoryScreen
};

// ─── CONTEÚDO POR CATEGORIA ───────────────────────────────────────────────────
const CATEGORY_CONTENT: Record<string, CategoryItem[]> = {
  space: [
    {
      emoji: "🚀",
      title: "Space Adventure",
      sub: "Blast off!",
      storyId: "SPACEADVENTURE",
    },
    {
      emoji: "👨‍🚀",
      title: "Astronaut",
      sub: "Life in orbit",
      storyId: "ASTRONAUT",
    },
    { emoji: "🌌", title: "Space", sub: "Stars & galaxies", storyId: "SPACE" },
    {
      emoji: "🚀",
      title: "Rocket Adventure",
      sub: "To infinity!",
      storyId: "ROCKET_ADVENTURE",
    },
  ],
  art: [
    {
      emoji: "🎨",
      title: "Colors & Art",
      sub: "Mix & match colors",
      storyId: "COLORS&ART",
    },
  ],
  dinos: [
    {
      emoji: "🦖",
      title: "Dinosaurs",
      sub: "Prehistoric world",
      storyId: "DINOSAURS",
    },
    {
      emoji: "🌿",
      title: "Dino World",
      sub: "Explore the era",
      storyId: "DINO_WORLD",
    },
  ],
  animals: [
    {
      emoji: "🐉",
      title: "Dragon Diary",
      sub: "A dragon's tale",
      storyId: "DRAGON_DIARY",
    },
    {
      emoji: "🌊",
      title: "Ocean Friends",
      sub: "Deep sea pals",
      storyId: "OCEAN_FRIENDS",
    },
    {
      emoji: "🐠",
      title: "Ocean Life",
      sub: "Dive deep!",
      storyId: "OCEANLIFE",
    },
  ],
  science: [
    {
      emoji: "🔬",
      title: "Tiny Scientist",
      sub: "Experiments!",
      storyId: "TINY_SCIENTIST",
    },
    {
      emoji: "🧪",
      title: "Science Lab",
      sub: "Safe experiments",
      storyId: "SCIENCE_LAB",
    },
  ],
  drawing: [
    { emoji: "✏️", title: "Letters", sub: "A to Z fun", storyId: "LETTERS" },
    { emoji: "🏫", title: "School", sub: "Learn together", storyId: "SCHOOL" },
  ],
  stories: [
    {
      emoji: "🧚",
      title: "Magic Forest",
      sub: "Enchanted tales",
      storyId: "MAGIC_FOREST",
    },
    {
      emoji: "⚽",
      title: "Struckball",
      sub: "Match day!",
      storyId: "STRUCKBALL",
    },
    {
      emoji: "🌙",
      title: "Sthm Sthap",
      sub: "Night mysteries",
      storyId: "STHMSTHAP",
    },
    { emoji: "🔮", title: "Katuion", sub: "Word wizardry", storyId: "KATUION" },
    {
      emoji: "🐰",
      title: "Tairbrty",
      sub: "A bunny's journey",
      storyId: "TAIRBRTY",
    },
    {
      emoji: "🐾",
      title: "Kekkihy",
      sub: "Cute adventure",
      storyId: "KEKKIHY",
    },
  ],
  all: [
    {
      emoji: "🚀",
      title: "Space Adventure",
      sub: "Blast off!",
      storyId: "SPACEADVENTURE",
    },
    {
      emoji: "🦖",
      title: "Dinosaurs",
      sub: "Prehistoric world",
      storyId: "DINOSAURS",
    },
    {
      emoji: "🧚",
      title: "Magic Forest",
      sub: "Enchanted tales",
      storyId: "MAGIC_FOREST",
    },
    {
      emoji: "🔬",
      title: "Tiny Scientist",
      sub: "Experiments!",
      storyId: "TINY_SCIENTIST",
    },
    {
      emoji: "🌊",
      title: "Ocean Friends",
      sub: "Deep sea pals",
      storyId: "OCEAN_FRIENDS",
    },
    {
      emoji: "🎨",
      title: "Colors & Art",
      sub: "Mix & match",
      storyId: "COLORS&ART",
    },
  ],
};

const CATEGORY_COLORS: Record<string, { bg: string; accent: string }> = {
  space: { bg: "#EBF4FF", accent: "#3B82F6" },
  art: { bg: "#FFF7E0", accent: "#F5A623" },
  toys: { bg: "#E8F8F0", accent: "#27AE60" },
  dinos: { bg: "#EBF4FF", accent: "#3B82F6" },
  animals: { bg: "#FFF7E0", accent: "#B45309" },
  science: { bg: "#E8F8F0", accent: "#15803D" },
  drawing: { bg: "#FFF0F5", accent: "#FF5B8D" },
  stories: { bg: "#F3F0FF", accent: "#7C5CBF" },
  all: { bg: "#F3F0FF", accent: "#6C5CE7" },
};

export default function CategoryScreen() {
  const { type = "all", label } = useLocalSearchParams<{
    type: string;
    label: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  // Título vindo da navegação (já traduzido pela tela de origem). Sem param → padrão.
  const heading = label ?? t("category.defaultLabel");

  const items = CATEGORY_CONTENT[type] ?? CATEGORY_CONTENT["all"];
  const colors = CATEGORY_COLORS[type] ?? CATEGORY_COLORS["all"];

  const handleCardPress = (item: CategoryItem) => {
    router.push({
      pathname: "/(details)",
      params: { storyId: item.storyId },
    });
  };

  return (
    <View style={s.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Theme.colors.bg}
      />

      {/* Header compartilhado — safe-area aware, botão voltar acessível */}
      <ScreenHeader title={heading} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Category hero — pop com overshoot + ✨ piscando */}
        <Animated.View
          entering={enterPop(80)}
          style={[s.hero, { backgroundColor: colors.bg }]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={fredoka(28, colors.accent)}>{heading}</Text>
            <Twinkle duration={1100}>
              <Text style={{ fontSize: 24 }}>✨</Text>
            </Twinkle>
          </View>
          <Text style={s.heroSub}>
            {t("category.activities", { count: items.length })}
          </Text>
        </Animated.View>

        {/* Grid de cards — "cartas dadas na mesa": cada uma cai girando
            de um lado (zigue-zague) e assenta com mola */}
        <View style={s.grid}>
          {items.map((item, i) => (
            <DealIn key={item.storyId} index={i} style={s.cardWrap}>
              <PressBounce
                style={[s.card, { borderColor: colors.accent + "40" }]}
                onPress={() => handleCardPress(item)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View style={[s.cardImg, { backgroundColor: colors.bg }]}>
                  <Swing delay={i * 300} angle={6} duration={2400}>
                    <Text style={{ fontSize: 44 }}>{item.emoji}</Text>
                  </Swing>
                </View>
                <Text style={[s.cardTitle, fredoka(15, Theme.colors.ink)]}>
                  {item.title}
                </Text>
                <Text style={s.cardSub}>{item.sub}</Text>
              </PressBounce>
            </DealIn>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.bg },
  scroll: { paddingHorizontal: Theme.space.xl, paddingBottom: 100 },
  hero: {
    borderRadius: Theme.radius.xl,
    padding: Theme.space.xxl,
    marginBottom: Theme.space.xxl,
    alignItems: "flex-start",
  },
  heroSub: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontWeight: "600",
    marginTop: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrap: { width: "48%" },
  card: {
    width: "100%",
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 2,
    marginBottom: Theme.space.md,
    overflow: "hidden",
    ...Shadow.card,
  },
  cardImg: { height: 90, alignItems: "center", justifyContent: "center" },
  cardTitle: {
    marginHorizontal: Theme.space.md,
    marginTop: 10,
  },
  cardSub: {
    marginHorizontal: Theme.space.md,
    marginBottom: Theme.space.md,
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: Theme.colors.textFaint,
  },
});
