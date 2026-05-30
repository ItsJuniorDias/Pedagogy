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

// Conteúdos por categoria — expanda conforme necessário
const CATEGORY_CONTENT: Record<
  string,
  { emoji: string; title: string; sub: string }[]
> = {
  space: [
    { emoji: "🪐", title: "Solar System", sub: "Explore the planets" },
    { emoji: "🌙", title: "Moon Phases", sub: "Track the moon" },
    { emoji: "☄️", title: "Comets & Meteors", sub: "Shooting stars!" },
    { emoji: "🔭", title: "Telescopes", sub: "How we see far" },
  ],
  art: [
    { emoji: "🎨", title: "Color Theory", sub: "Mix & match colors" },
    { emoji: "✏️", title: "Sketching", sub: "Basic shapes first" },
    { emoji: "🖼️", title: "Famous Paintings", sub: "Art history fun" },
    { emoji: "🖌️", title: "Watercolor", sub: "Wet on wet" },
  ],
  toys: [
    { emoji: "🧸", title: "Stuffed Animals", sub: "Soft & cuddly" },
    { emoji: "🪀", title: "Yo-yo tricks", sub: "String mastery" },
    { emoji: "🎲", title: "Board Games", sub: "Play with friends" },
    { emoji: "🏗️", title: "Building Blocks", sub: "Create anything" },
  ],
  dinos: [
    { emoji: "🦖", title: "T-Rex", sub: "King of the dinos" },
    { emoji: "🦕", title: "Brachiosaurus", sub: "Long neck giant" },
    { emoji: "🪨", title: "Fossils", sub: "Bones underground" },
    { emoji: "🌋", title: "Extinction", sub: "What happened?" },
  ],
  animals: [
    { emoji: "🐶", title: "Dogs", sub: "Best friends" },
    { emoji: "🐱", title: "Cats", sub: "Curious creatures" },
    { emoji: "🐘", title: "Elephants", sub: "Gentle giants" },
    { emoji: "🦜", title: "Parrots", sub: "Talking birds" },
  ],
  science: [
    { emoji: "🔬", title: "Microscopy", sub: "Tiny worlds" },
    { emoji: "⚗️", title: "Chemistry", sub: "Safe experiments" },
    { emoji: "🧲", title: "Magnetism", sub: "Push & pull" },
    { emoji: "💡", title: "Electricity", sub: "Power up" },
  ],
  drawing: [
    { emoji: "✏️", title: "Letters A-Z", sub: "Draw every letter" },
    { emoji: "📐", title: "Shapes", sub: "Circles & squares" },
    { emoji: "🌈", title: "Rainbow", sub: "7 colors to draw" },
    { emoji: "🌺", title: "Flowers", sub: "Nature drawing" },
  ],
  all: [
    { emoji: "⭐", title: "Top Picks", sub: "Most popular" },
    { emoji: "🆕", title: "New Stuff", sub: "Just added" },
    { emoji: "🔥", title: "Trending", sub: "Everyone's doing it" },
    { emoji: "🎁", title: "Surprises", sub: "Open to reveal" },
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
              onPress={() =>
                router.push({
                  pathname: "/(details)",
                  params: {
                    storyId: item.title.toLowerCase().replace(/\s/g, ""),
                  },
                })
              }
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
