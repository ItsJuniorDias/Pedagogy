import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

const STORY_TAGS = ["All", "Adventure", "Science", "Fantasy", "Animals"];

const STORIES = [
  {
    id: "rocket_adventure",
    emoji: "🚀",
    title: "Rocket Adventure",
    tag: "Adventure",
    pages: 8,
    bg: "#EBF4FF",
    accent: "#3B82F6",
    badge: "New",
  },
  {
    id: "magic_forest",
    emoji: "🌲",
    title: "Magic Forest",
    tag: "Fantasy",
    pages: 12,
    bg: "#E8F8F0",
    accent: "#27AE60",
    badge: null,
  },
  {
    id: "ocean_friends",
    emoji: "🐠",
    title: "Ocean Friends",
    tag: "Animals",
    pages: 6,
    bg: "#FFF0F5",
    accent: "#FF5B8D",
    badge: "Hot",
  },
  {
    id: "tiny_scientist",
    emoji: "🔬",
    title: "Tiny Scientist",
    tag: "Science",
    pages: 10,
    bg: "#FFF7E0",
    accent: "#F5A623",
    badge: null,
  },
  {
    id: "dragon_diary",
    emoji: "🐉",
    title: "Dragon Diary",
    tag: "Fantasy",
    pages: 14,
    bg: "#F3F0FF",
    accent: "#6C5CE7",
    badge: "New",
  },
  {
    id: "dino_world",
    emoji: "🦖",
    title: "Dino World",
    tag: "Adventure",
    pages: 9,
    bg: "#FFF7E0",
    accent: "#F5A623",
    badge: null,
  },
];

export default function StoriesScreen() {
  const [activeTag, setActiveTag] = useState(0);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  const filtered =
    activeTag === 0
      ? STORIES
      : STORIES.filter((s) => s.tag === STORY_TAGS[activeTag]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F0" />

      <View style={[s.blob, s.blob1]} />
      <View style={[s.blob, s.blob2]} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={fredoka(22, "#2D2D2D")}>Magic Stories ✨</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Hero banner */}
        <View style={s.hero}>
          <Text style={fredoka(26, "#fff")}>{"A world of\nadventures 🌍"}</Text>
          <Text style={s.heroSub}>Pick a story and start reading!</Text>
        </View>

        {/* Tags */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tagsRow}
        >
          {STORY_TAGS.map((tag, i) => (
            <TouchableOpacity
              key={i}
              style={[s.tag, activeTag === i && s.tagActive]}
              onPress={() => setActiveTag(i)}
              activeOpacity={0.8}
            >
              <Text style={[s.tagText, activeTag === i && s.tagTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stories grid */}
        <View style={s.grid}>
          {filtered.map((story) => (
            <TouchableOpacity
              key={story.id}
              style={[s.card, { backgroundColor: story.bg }]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/(details)",
                  params: { storyId: story.id },
                })
              }
            >
              {story.badge && (
                <View style={[s.badgeWrap, { backgroundColor: story.accent }]}>
                  <Text style={s.badgeText}>{story.badge}</Text>
                </View>
              )}
              <Text style={s.storyEmoji}>{story.emoji}</Text>
              <Text style={[s.storyTitle, fredoka(15, "#2D2D2D")]}>
                {story.title}
              </Text>
              <Text style={[s.storyMeta, { color: story.accent }]}>
                📖 {story.pages} pages
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F0",
    paddingTop: StatusBar.currentHeight ?? 44,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  blob: { position: "absolute", borderRadius: 999 },
  blob1: {
    width: 200,
    height: 200,
    backgroundColor: "#FFE8F0",
    top: -60,
    right: -50,
  },
  blob2: {
    width: 150,
    height: 150,
    backgroundColor: "#E8F4FF",
    top: 280,
    left: -60,
  },

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
    backgroundColor: "#6C5CE7",
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    overflow: "hidden",
  },
  heroSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
    marginTop: 6,
  },

  tagsRow: { paddingBottom: 20, gap: 10 },
  tag: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#EDEDED",
  },
  tagActive: { backgroundColor: "#FF5B8D", borderColor: "#FF5B8D" },
  tagText: { fontSize: 13, fontWeight: "800", color: "#999" },
  tagTextActive: { color: "#fff" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeWrap: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  storyEmoji: { fontSize: 52, marginBottom: 10 },
  storyTitle: { textAlign: "center", marginBottom: 6 },
  storyMeta: { fontSize: 12, fontWeight: "700" },
});
