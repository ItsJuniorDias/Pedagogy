import Filters from "@/components/Filters";
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

const ALL_PATHS = [
  {
    id: 1,
    emoji: "🔤",
    title: "Letters",
    progress: 6,
    total: 6,
    cardBorder: "#FFD93D",
    imgBg: "#FFFBEB",
    barColor: "#FFD93D",
    category: "drawing",
  },
  {
    id: 2,
    emoji: "🏫",
    title: "School",
    progress: 6,
    total: 6,
    cardBorder: "#A0E7A0",
    imgBg: "#F0FFF0",
    barColor: "#52C878",
    category: "all",
  },
  {
    id: 3,
    emoji: "👨‍🚀",
    title: "Astronaut",
    progress: 4,
    total: 6,
    cardBorder: "#FFA07A",
    imgBg: "#FFF5F0",
    barColor: "#FF7043",
    category: "space",
  },
  {
    id: 4,
    emoji: "🪐",
    title: "Space",
    progress: 2,
    total: 6,
    cardBorder: "#B0C4FF",
    imgBg: "#F0F4FF",
    barColor: "#5C7CFF",
    category: "space",
  },
  {
    id: 5,
    emoji: "🦕",
    title: "Dinosaurs",
    progress: 0,
    total: 8,
    cardBorder: "#A0E7A0",
    imgBg: "#F0FFF0",
    barColor: "#27AE60",
    category: "dinos",
  },
  {
    id: 6,
    emoji: "🌊",
    title: "Ocean Life",
    progress: 1,
    total: 6,
    cardBorder: "#B0C4FF",
    imgBg: "#EBF4FF",
    barColor: "#3B82F6",
    category: "animals",
  },
  {
    id: 7,
    emoji: "🎨",
    title: "Colors & Art",
    progress: 3,
    total: 8,
    cardBorder: "#FFA07A",
    imgBg: "#FFF5F0",
    barColor: "#F5A623",
    category: "art",
  },
  {
    id: 8,
    emoji: "🔬",
    title: "Science Lab",
    progress: 0,
    total: 10,
    cardBorder: "#A0E7A0",
    imgBg: "#E8F8F0",
    barColor: "#15803D",
    category: "science",
  },
];

const FILTERS = ["All", "In Progress", "Not Started", "Completed"];

export default function LearningAllScreen() {
  const [activeFilter, setActiveFilter] = useState(0);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  const filtered = ALL_PATHS.filter((p) => {
    if (activeFilter === 0) return true;
    if (activeFilter === 1) return p.progress > 0 && p.progress < p.total;
    if (activeFilter === 2) return p.progress === 0;
    if (activeFilter === 3) return p.progress === p.total;
    return true;
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F0" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={fredoka(20, "#2D2D2D")}>Learning Path 🌱</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter chips */}
      <Filters filters={FILTERS} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <View style={s.grid}>
          {filtered.map((item) => {
            const pct = (item.progress / item.total) * 100;
            const done = item.progress === item.total;
            return (
              <TouchableOpacity
                key={item.id}
                style={[s.card, { borderColor: item.cardBorder }]}
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
                <View style={[s.imgBox, { backgroundColor: item.imgBg }]}>
                  <Text style={s.emoji}>{item.emoji}</Text>
                </View>
                <View style={s.body}>
                  <Text style={fredoka(15, "#2D2D2D")}>{item.title}</Text>
                  <View style={s.progressWrap}>
                    <View
                      style={[
                        s.progressFill,
                        {
                          width: `${pct}%` as any,
                          backgroundColor: item.barColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={s.progressLabel}>
                    {item.progress}/{item.total} {done ? "🎉" : "⭐"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filtered.length === 0 && (
          <Text style={s.empty}>Nothing here yet 🌱</Text>
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

  filtersRow: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 4, // ← breathing room sem espaço excessivo
    gap: 10,
    marginBottom: 16, // ← reduzido
    alignItems: "center",
  },

  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#EDEDED",
    alignSelf: "center",
  },
  chipActive: {
    backgroundColor: "#FF5B8D",
    borderColor: "#FF5B8D",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#999",
    textAlign: "center",
  },
  chipTextActive: { color: "#fff" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 2.5,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  imgBox: { height: 90, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 44 },
  body: { paddingHorizontal: 12, paddingVertical: 10 },
  progressWrap: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 10 },
  progressLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#AAA",
    marginTop: 3,
  },
  empty: {
    textAlign: "center",
    fontSize: 14,
    color: "#BBB",
    fontWeight: "700",
    marginTop: 40,
  },
});
