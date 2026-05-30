import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

const ALL_GAMES = [
  {
    id: "pixel-run",
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

const GAME_FILTERS = ["All", "Hot 🔥", "New ✨", "Top ⭐"];

export default function GamesAllScreen() {
  const [activeFilter, setActiveFilter] = useState(0);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  const filtered =
    activeFilter === 0
      ? ALL_GAMES
      : ALL_GAMES.filter((g) =>
          g.tagLabel.startsWith(GAME_FILTERS[activeFilter].split(" ")[0]),
        );

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F0" />

      <View style={[s.blob, s.blob1]} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={fredoka(20, "#2D2D2D")}>Games 🎮</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {filtered.map((game, i) => (
          <TouchableOpacity
            key={i}
            style={s.card}
            activeOpacity={0.85}
            onPress={() => router.push(game.route as any)}
          >
            <View style={[s.icon, { backgroundColor: game.iconBg }]}>
              <Text style={s.iconEmoji}>{game.emoji}</Text>
            </View>
            <View style={s.body}>
              <Text style={fredoka(16, "#2D2D2D")}>{game.title}</Text>
              <Text style={s.sub}>{game.sub}</Text>
            </View>
            <View style={[s.tag, { backgroundColor: game.tagBg }]}>
              <Text style={[s.tagText, { color: game.tagColor }]}>
                {game.tagLabel}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <Text style={s.empty}>No games here yet 🎯</Text>
        )}
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  blob: { position: "absolute", borderRadius: 999 },
  blob1: {
    width: 180,
    height: 180,
    backgroundColor: "#FFE8F0",
    top: -50,
    right: -40,
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

  filtersRow: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#EDEDED",
  },
  chipActive: { backgroundColor: "#6C5CE7", borderColor: "#6C5CE7" },
  chipText: { fontSize: 13, fontWeight: "800", color: "#999" },
  chipTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 34 },
  body: { flex: 1 },
  sub: { fontSize: 12, fontWeight: "700", color: "#AAA", marginTop: 2 },
  tag: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: "900" },
  empty: {
    textAlign: "center",
    fontSize: 14,
    color: "#BBB",
    fontWeight: "700",
    marginTop: 40,
  },
});
