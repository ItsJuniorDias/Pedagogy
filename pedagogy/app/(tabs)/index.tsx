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

// ─── FONT HELPER ─────────────────────────────────────────────────────────────
// Usage: <Text style={[s.someStyle, fredoka(20)]}>Hello</Text>
const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

// ─── DATA ────────────────────────────────────────────────────────────────────

const NAV_ICONS = [
  { emoji: "🚀", label: "Space", bg: "#FFF0F5", color: "#FF5B8D" },
  { emoji: "🎨", label: "Art", bg: "#FFF7E0", color: "#F5A623" },
  { emoji: "🧸", label: "Toys", bg: "#E8F8F0", color: "#27AE60" },
  { emoji: "🦖", label: "Dinos", bg: "#EBF4FF", color: "#3B82F6" },
];

const CHIPS = ["Drawing", "Space", "Animals", "Magic", "Music"];

const INTERESTS = [
  { emoji: "🌿", label: "Explore", bg: "#FFF0F8", color: "#D63384" },
  { emoji: "🐶", label: "Pets", bg: "#FFF7E0", color: "#B45309" },
  { emoji: "🌍", label: "Space", bg: "#EBF4FF", color: "#1D4ED8" },
  { emoji: "🔬", label: "Science", bg: "#E8F8F0", color: "#15803D" },
];

const LEARNING_PATHS = [
  {
    id: 1,
    emoji: "🔤",
    title: "Letters",
    progress: 6,
    total: 6,
    cardBorder: "#FFD93D",
    imgBg: "#FFFBEB",
    barColor: "#FFD93D",
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
  },
];

const GAMES = [
  {
    id: "pixel-run",
    title: "Pixel Run",
    sub: "Endless runner in space!",
    tagLabel: "Hot 🔥",
    tagVariant: "amber",
    canvasBg: "#FFFBEB",
    emoji: "👾",
    blockColors: [
      { face: "#8B5CF6", top: "#A78BFA" },
      { face: "#3B82F6", top: "#60A5FA" },
      { face: "#2563EB", top: "#3B82F6" },
    ],
  },
  {
    id: "gravity",
    title: "Gravity Game",
    sub: "Classic gravity game!",
    tagLabel: "New ✨",
    tagVariant: "emerald",
    canvasBg: "#ECFDF5",
    emoji: "🧲",
  },
];

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const SectionHeader = ({
  title,
  badge,
  linkLabel = "See all",
  linkColor = "#6C5CE7",
}: {
  title: string;
  badge?: string;
  linkLabel?: string;
  linkColor?: string;
}) => (
  <View style={s.secHdr}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={[s.secTitle, fredoka(20, "#2D2D2D")]}>{title}</Text>
      {badge && (
        <View style={s.newBadge}>
          <Text style={s.newBadgeText}>{badge.toUpperCase()}</Text>
        </View>
      )}
    </View>
    <TouchableOpacity>
      <Text style={[s.secLink, { color: linkColor }]}>{linkLabel}</Text>
    </TouchableOpacity>
  </View>
);

const LearningCard = ({
  emoji,
  title,
  progress,
  total,
  cardBorder,
  imgBg,
  barColor,
}: (typeof LEARNING_PATHS)[0]) => {
  const pct = (progress / total) * 100;
  const done = progress === total;

  const router = useRouter();

  return (
    <TouchableOpacity
      style={[s.learnCard, { borderColor: cardBorder }]}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/(details)",
          params: { storyId: title.toLowerCase().replace(/\s/g, "") },
        })
      }
    >
      <View style={[s.learnImgBox, { backgroundColor: imgBg }]}>
        <Text style={s.learnEmoji}>{emoji}</Text>
      </View>
      <View style={s.learnBody}>
        <Text style={[s.learnTitle, fredoka(16, "#2D2D2D")]}>{title}</Text>
        <View style={s.progressWrap}>
          <View
            style={[
              s.progressFill,
              { width: `${pct}%` as any, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text style={s.progressLabel}>
          {progress} / {total} done {done ? "🎉" : "⭐"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const PopularCard = ({
  emoji,
  title,
  sub,
  tagLabel,
  tagBg,
  tagColor,
  iconBg,
}: (typeof GAMES)[0]) => {
  const route = useRouter();

  return (
    <TouchableOpacity
      style={s.popCard}
      activeOpacity={0.85}
      onPress={() =>
        route.push({
          pathname: title === "Pixel Run" ? "/(pixel-run)" : "/(gravity)",
        })
      }
    >
      <View style={[s.popIcon, { backgroundColor: iconBg }]}>
        <Text style={s.popIconEmoji}>{emoji}</Text>
      </View>
      <View style={s.popBody}>
        <Text style={[s.popTitle, fredoka(16, "#2D2D2D")]}>{title}</Text>
        <Text style={s.popSub}>{sub}</Text>
      </View>
      <View style={[s.popTag, { backgroundColor: tagBg }]}>
        <Text style={[s.popTagText, { color: tagColor }]}>{tagLabel}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [activeChip, setActiveChip] = useState(0);
  const [activeNav, setActiveNav] = useState(0);

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F0" />

      {/* Background blobs */}
      <View style={[s.blob, s.blob1]} />
      <View style={[s.blob, s.blob2]} />
      <View style={[s.blob, s.blob3]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={fredoka(26, "#2D2D2D")}>
              Hi, <Text style={fredoka(26, "#FF5B8D")}>Champu!</Text> 👋
            </Text>
            <Text style={s.greetSub}>Let's learn something cool today ✨</Text>
          </View>
          <View style={s.avatar}>
            <Text style={{ fontSize: 30 }}>🐻</Text>
          </View>
        </View>

        {/* ── NAV ICON ROW ── */}
        <View style={s.navRow}>
          {NAV_ICONS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[s.navBtn, { backgroundColor: item.bg }]}
              activeOpacity={0.8}
            >
              <Text style={s.navEmoji}>{item.emoji}</Text>
              <Text style={[fredoka(11, item.color)]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── BANNER ── */}
        <View style={s.banner}>
          <View style={s.bannerContent}>
            <Text
              style={[
                fredoka(24, "#fff"),
                { lineHeight: 30, marginBottom: 14 },
              ]}
            >
              {"Magic World\nof Stories"}
            </Text>
            <TouchableOpacity style={s.bannerCta} activeOpacity={0.85}>
              <Text style={[fredoka(15, "#5A3E00")]}>🔍 Explore Now!</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.bannerPlanet}>🪐</Text>
          <Text style={s.bannerStars}>⭐🌟✨</Text>
        </View>

        {/* ── CATEGORY CHIPS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
        >
          {CHIPS.map((chip, i) => (
            <TouchableOpacity
              key={i}
              style={[s.chip, activeChip === i && s.chipActive]}
              onPress={() => setActiveChip(i)}
              activeOpacity={0.8}
            >
              <Text style={[s.chipText, activeChip === i && s.chipTextActive]}>
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── YOUR FAVORITES ── */}
        <SectionHeader title="Your Favorites 🌟" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.interestsRow}
        >
          {INTERESTS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[s.intCard, { backgroundColor: item.bg }]}
              activeOpacity={0.8}
            >
              <Text style={s.intEmoji}>{item.emoji}</Text>
              <Text style={[fredoka(13, item.color)]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── LEARNING PATH ── */}
        <SectionHeader
          title="Learning Path"
          badge="New"
          linkLabel="View all"
          linkColor="#FF5B8D"
        />
        <View style={s.learnGrid}>
          {LEARNING_PATHS.map((item) => (
            <LearningCard key={item.id} {...item} />
          ))}
        </View>

        {/* ── GAMES ── */}
        <SectionHeader title="Games 🎮" />
        {GAMES.map((item, i) => (
          <PopularCard key={i} {...item} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

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
    top: 220,
    left: -60,
  },
  blob3: {
    width: 120,
    height: 120,
    backgroundColor: "#F0FFE8",
    bottom: 320,
    right: -30,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  greetSub: { fontSize: 14, color: "#888", fontWeight: "600", marginTop: 4 },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFD93D",
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF9500",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  navBtn: {
    width: (width - 56) / 4,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navEmoji: { fontSize: 24 },

  banner: {
    height: 165,
    borderRadius: 28,
    backgroundColor: "#6C5CE7",
    marginBottom: 24,
    overflow: "hidden",
    justifyContent: "center",
  },
  bannerContent: { padding: 22, zIndex: 1 },
  bannerCta: {
    alignSelf: "flex-start",
    backgroundColor: "#FFD93D",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 50,
    shadowColor: "#FFD93D",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerPlanet: {
    position: "absolute",
    bottom: -12,
    right: 18,
    fontSize: 80,
    opacity: 0.35,
    transform: [{ rotate: "-10deg" }],
  },
  bannerStars: {
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 28,
    opacity: 0.25,
  },

  chipsRow: { paddingBottom: 24, gap: 10 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#EDEDED",
  },
  chipActive: { backgroundColor: "#FF5B8D", borderColor: "#FF5B8D" },
  chipText: { fontSize: 14, fontWeight: "800", color: "#999" },
  chipTextActive: { color: "#fff" },

  secHdr: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 4,
  },
  secTitle: { fontSize: 20, fontWeight: "900", color: "#2D2D2D" },
  secLink: { fontSize: 13, fontWeight: "800" },
  newBadge: {
    backgroundColor: "#FF5B8D",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  newBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  interestsRow: { paddingBottom: 28, gap: 12 },
  intCard: {
    width: 110,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  intEmoji: { fontSize: 36, marginBottom: 8 },

  learnGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  learnCard: {
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
  learnImgBox: { height: 100, alignItems: "center", justifyContent: "center" },
  learnEmoji: { fontSize: 52 },
  learnBody: { paddingHorizontal: 14, paddingVertical: 12 },
  learnTitle: { fontSize: 16, fontWeight: "900", color: "#2D2D2D" },
  progressWrap: {
    height: 7,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: { height: 7, borderRadius: 10 },
  progressLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#AAA",
    marginTop: 4,
  },

  popCard: {
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
  popIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  popIconEmoji: { fontSize: 34 },
  popBody: { flex: 1 },
  popTitle: { fontSize: 16, fontWeight: "900", color: "#2D2D2D" },
  popSub: { fontSize: 12, fontWeight: "700", color: "#AAA", marginTop: 2 },
  popTag: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12 },
  popTagText: { fontSize: 11, fontWeight: "900" },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1.5,
    borderTopColor: "#F0F0F0",
    flexDirection: "row",
    paddingTop: 10,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  bnBtn: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  bnEmoji: { fontSize: 22 },
  bnInactive: { opacity: 0.35 },
  bnLabelActive: { color: "#FF5B8D" },
  bnLabelInactive: { color: "#BBB" },
  bnCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  bnHomeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF5B8D",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    shadowColor: "#FF5B8D",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
});
