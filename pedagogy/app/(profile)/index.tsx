import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
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

const STATS = [
  { emoji: "⭐", value: "124", label: "Stars" },
  { emoji: "📖", value: "18", label: "Stories" },
  { emoji: "🏆", value: "7", label: "Badges" },
  { emoji: "🔥", value: "12", label: "Day streak" },
];

const BADGES = [
  { emoji: "🚀", label: "Explorer", earned: true },
  { emoji: "🎨", label: "Artist", earned: true },
  { emoji: "🔬", label: "Scientist", earned: true },
  { emoji: "📚", label: "Bookworm", earned: true },
  { emoji: "🦖", label: "Dino Fan", earned: false },
  { emoji: "🌙", label: "Night Owl", earned: false },
];

const MENU_ITEMS = [
  { emoji: "🔔", label: "Notifications", route: "/(notifications)" },
  { emoji: "🌍", label: "Language", route: "/(language)" },
  { emoji: "🎵", label: "Sound & Music", route: "/(settings)" },
  { emoji: "🔒", label: "Parental Controls", route: "/(parental)" },
  { emoji: "❓", label: "Help & Support", route: "/(help)" },
];

export default function ProfileScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F0" />

      <View style={[s.blob, s.blob1]} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={fredoka(20, "#2D2D2D")}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Avatar card */}
        <View style={s.avatarCard}>
          <View style={s.avatar}>
            <Text style={{ fontSize: 48 }}>🐻</Text>
          </View>
          <Text style={fredoka(22, "#2D2D2D")}>Little Explorer</Text>
          <Text style={s.avatarSub}>Age 6 · Level 4 ⭐</Text>
          <TouchableOpacity style={s.editBtn} activeOpacity={0.8}>
            <Text style={fredoka(13, "#6C5CE7")}>✏️ Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          {STATS.map((stat, i) => (
            <View key={i} style={s.statCard}>
              <Text style={{ fontSize: 22 }}>{stat.emoji}</Text>
              <Text style={fredoka(18, "#2D2D2D")}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <Text
          style={[fredoka(18, "#2D2D2D"), { marginBottom: 12, marginTop: 4 }]}
        >
          My Badges 🏆
        </Text>
        <View style={s.badgesGrid}>
          {BADGES.map((badge, i) => (
            <View
              key={i}
              style={[s.badgeCard, !badge.earned && s.badgeCardLocked]}
            >
              <Text style={[{ fontSize: 32 }, !badge.earned && s.emojiLocked]}>
                {badge.emoji}
              </Text>
              <Text style={[s.badgeLabel, !badge.earned && s.badgeLabelLocked]}>
                {badge.label}
              </Text>
              {!badge.earned && <Text style={s.lockIcon}>🔒</Text>}
            </View>
          ))}
        </View>

        {/* Settings menu */}
        <Text
          style={[fredoka(18, "#2D2D2D"), { marginBottom: 12, marginTop: 20 }]}
        >
          Settings ⚙️
        </Text>
        <View style={s.menuList}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={s.menuItem}
              activeOpacity={0.75}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuArrow}>›</Text>
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

  avatarCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFD93D",
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF9500",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 12,
  },
  avatarSub: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 12,
  },
  editBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#6C5CE7",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 4,
    padding: 12,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#AAA",
    textAlign: "center",
  },

  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeCardLocked: { backgroundColor: "#F8F8F8", opacity: 0.7 },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#555",
    textAlign: "center",
  },
  badgeLabelLocked: { color: "#BBB" },
  emojiLocked: { opacity: 0.35 },
  lockIcon: { position: "absolute", top: 8, right: 8, fontSize: 12 },

  menuList: {
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: "#2D2D2D" },
  menuArrow: { fontSize: 22, color: "#CCC" },
});
