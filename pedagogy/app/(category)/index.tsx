import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

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
  const { type = "all", label = "Explore" } = useLocalSearchParams<{
    type: string;
    label: string;
  }>();
  const router = useRouter();

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  const items = CATEGORY_CONTENT[type] ?? CATEGORY_CONTENT["all"];
  const colors = CATEGORY_COLORS[type] ?? CATEGORY_COLORS["all"];

  const handleCardPress = (item: CategoryItem) => {
    router.push({
      pathname: "/(details)",
      params: { storyId: item.storyId },
    });
  };

  return (
    <View style={[s.container, { backgroundColor: "#FFF9F0" }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F0" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={fredoka(22, "#2D2D2D")}>{label}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Category hero */}
        <View style={[s.hero, { backgroundColor: colors.bg }]}>
          <Text style={fredoka(28, colors.accent)}>{label} ✨</Text>
          <Text style={s.heroSub}>{items.length} activities for you</Text>
        </View>

        {/* Grid de cards */}
        <View style={s.grid}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[s.card, { borderColor: colors.accent + "40" }]}
              activeOpacity={0.85}
              onPress={() => handleCardPress(item)}
            >
              <View style={[s.cardImg, { backgroundColor: colors.bg }]}>
                <Text style={{ fontSize: 44 }}>{item.emoji}</Text>
              </View>
              <Text style={[s.cardTitle, fredoka(15, "#2D2D2D")]}>
                {item.title}
              </Text>
              <Text style={s.cardSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight ?? 44 },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  hero: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  heroSub: { fontSize: 14, color: "#888", fontWeight: "600", marginTop: 6 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImg: { height: 90, alignItems: "center", justifyContent: "center" },
  cardTitle: {
    marginHorizontal: 12,
    marginTop: 10,
    fontSize: 15,
    fontWeight: "800",
  },
  cardSub: {
    marginHorizontal: 12,
    marginBottom: 12,
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: "#AAA",
  },
});
