import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, { FlipInEasyX } from "react-native-reanimated";

import {
  Breathe,
  enterPop,
  enterUp,
  PressBounce,
  Swing,
} from "../../shared/motion";

// ─── PROGRESSO REAL (substitui os mocks) ─────────────────────────────────────
import {
  computeBadges,
  computeLevel,
  getProgress,
  ReadingProgress,
} from "../../lib/readingProgress"; // ← ajuste o caminho conforme sua pasta

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

export default function ProfileScreen() {
  const router = useRouter();

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

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  // ── Stats derivados do progresso real ──
  const badges = progress ? computeBadges(progress) : [];
  const earnedBadges = badges.filter((b) => b.earned).length;
  const level = computeLevel(progress?.stars ?? 0);

  const stats = [
    { emoji: "⭐", value: String(progress?.stars ?? 0), label: "Stars" },
    {
      emoji: "📖",
      value: String(progress?.storiesCompleted.length ?? 0),
      label: "Stories",
    },
    { emoji: "🏆", value: String(earnedBadges), label: "Badges" },
    { emoji: "🔥", value: String(progress?.streak ?? 0), label: "Day streak" },
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F0" />

      <View style={[s.blob, s.blob1]} />

      {/* Header */}
      <Animated.View entering={enterUp(0)} style={s.header}>
        <PressBounce style={s.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </PressBounce>
        <Text style={fredoka(20, "#2D2D2D")}>My Profile</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

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
          <Text style={fredoka(22, "#2D2D2D")}>Little Explorer</Text>
          <Text style={s.avatarSub}>Level {level} ⭐</Text>
        </Animated.View>

        {/* Stats row — cards viram como medalhas (flip 3D em cascata) */}
        <View style={s.statsRow}>
          {stats.map((stat, i) => (
            <Animated.View
              key={stat.label}
              entering={FlipInEasyX.delay(300 + i * 120)
                .springify()
                .damping(14)}
              style={s.statCard}
            >
              <Text style={{ fontSize: 22 }}>{stat.emoji}</Text>
              <Text style={fredoka(18, "#2D2D2D")}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Badges */}
        <Text
          style={[fredoka(18, "#2D2D2D"), { marginBottom: 12, marginTop: 4 }]}
        >
          My Badges 🏆
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
                {badge.label}
              </Text>
              {!badge.earned && <Text style={s.lockIcon}>🔒</Text>}
            </Animated.View>
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
});
