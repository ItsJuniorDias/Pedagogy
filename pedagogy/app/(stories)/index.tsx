import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { fredoka, HIT_SLOP, MIN_TOUCH, Shadow, Theme } from "@/constants/theme";
import {
  enterPop,
  enterUp,
  FloatY,
  PressBounce,
  Twinkle,
  Swing,
} from "../../shared/motion";

import { STORIES_GRID } from "../../mocks/historyMock";

// Coleta todas as tags únicas do grid e adiciona "All" no início
const ALL_TAGS = [
  "All",
  ...Array.from(new Set(STORIES_GRID.map((s) => s.tag))),
];

export default function StoriesScreen() {
  const { t } = useTranslation();
  const [activeTag, setActiveTag] = useState(0);
  const router = useRouter();

  const filtered =
    activeTag === 0
      ? STORIES_GRID
      : STORIES_GRID.filter((s) => s.tag === ALL_TAGS[activeTag]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.bg} />

      <View style={[s.blob, s.blob1]} />
      <View style={[s.blob, s.blob2]} />

      {/* Header compartilhado — safe-area aware, botão voltar acessível */}
      <ScreenHeader title={t("stories.header")} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Hero banner — globo flutuando + estrelinhas piscando */}
        <Animated.View entering={enterUp(60)} style={s.hero}>
          <Twinkle style={s.heroStar1} duration={1200}>
            <Text style={{ fontSize: 18 }}>✨</Text>
          </Twinkle>
          <Twinkle style={s.heroStar2} duration={1600} delay={500}>
            <Text style={{ fontSize: 14 }}>⭐</Text>
          </Twinkle>
          <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <Text style={fredoka(26, Theme.colors.onAccent)}>{t("stories.heroTitle")}</Text>
            <FloatY distance={5} duration={2200}>
              <Text style={{ fontSize: 26 }}>🌍</Text>
            </FloatY>
          </View>
          <Text style={s.heroSub}>{t("stories.heroSub")}</Text>
          <Text style={s.heroCount}>
            {t("stories.heroCount", { count: STORIES_GRID.length })}
          </Text>
        </Animated.View>

        {/* Tags */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tagsRow}
        >
          {ALL_TAGS.map((tag, i) => (
            <PressBounce
              key={tag}
              entering={enterPop(120 + i * 60)}
              scaleTo={0.88}
              hitSlop={HIT_SLOP}
              style={[s.tag, activeTag === i && s.tagActive]}
              onPress={() => setActiveTag(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTag === i }}
            >
              <Text style={[s.tagText, activeTag === i && s.tagTextActive]}>
                {i === 0
                  ? t("stories.tagsAll")
                  : t(`storyTags.${tag}` as any, { defaultValue: tag })}
              </Text>
            </PressBounce>
          ))}
        </ScrollView>

        {/* Stories grid — cards estouram como bolhas, em cascata.
            A key inclui o filtro ativo: trocar de tag re-dispara o pop 🫧 */}
        <View style={s.grid}>
          {filtered.map((story, i) => (
            <PressBounce
              key={`${activeTag}-${story.id}`}
              entering={enterPop(i * 70)}
              style={[s.card, { backgroundColor: story.bg }]}
              accessibilityRole="button"
              accessibilityLabel={t(`storyTitles.${story.id}` as any, {
                defaultValue: story.title,
              })}
              onPress={() =>
                router.push({
                  pathname: "/(details)",
                  params: { storyId: story.id },
                })
              }
            >
              {story.badge && (
                <View style={[s.badgeWrap, { backgroundColor: story.accent }]}>
                  <Text style={s.badgeText}>
                    {t(`storyBadges.${story.badge}` as any, {
                      defaultValue: story.badge,
                    })}
                  </Text>
                </View>
              )}
              <Swing delay={i * 250} angle={5} duration={2600}>
                <Text style={s.storyEmoji}>{story.emoji}</Text>
              </Swing>
              <Text style={[s.storyTitle, fredoka(15, Theme.colors.ink)]}>
                {t(`storyTitles.${story.id}` as any, {
                  defaultValue: story.title,
                })}
              </Text>
              <Text style={[s.storyMeta, { color: story.accent }]}>
                📖{" "}
                {"chapters" in story
                  ? t("stories.chapters", { count: story.chapters })
                  : ""}
              </Text>
              {"ageRange" in story && (
                <Text style={[s.storyAge, { color: story.accent + "99" }]}>
                  {t("stories.ages", { range: story.ageRange })}
                </Text>
              )}
            </PressBounce>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bg,
  },
  scroll: { paddingHorizontal: Theme.space.xl, paddingBottom: 100 },

  blob: { position: "absolute", borderRadius: Theme.radius.pill },
  blob1: {
    width: 200,
    height: 200,
    backgroundColor: Theme.colors.primaryTint,
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

  hero: {
    backgroundColor: Theme.colors.accent,
    borderRadius: Theme.radius.xxl,
    padding: Theme.space.xxl,
    marginBottom: Theme.space.xl,
    overflow: "hidden",
  },
  heroSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
    marginTop: 6,
  },
  heroCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "600",
    marginTop: 4,
  },
  heroStar1: { position: "absolute", top: 14, right: 18 },
  heroStar2: { position: "absolute", bottom: 16, right: 44 },

  tagsRow: { paddingBottom: Theme.space.xl, gap: 10 },
  tag: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 18,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tagActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  tagText: { fontSize: 13, fontWeight: "800", color: Theme.colors.textMuted },
  tagTextActive: { color: Theme.colors.onAccent },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    borderRadius: Theme.radius.xl,
    padding: Theme.space.lg,
    marginBottom: Theme.space.md,
    alignItems: "center",
    ...Shadow.card,
  },
  badgeWrap: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: Theme.colors.onAccent,
    fontSize: 10,
    fontWeight: "900",
  },
  storyEmoji: { fontSize: 52, marginBottom: 10 },
  storyTitle: { textAlign: "center", marginBottom: 6 },
  storyMeta: { fontSize: 12, fontWeight: "700" },
  storyAge: { fontSize: 10, fontWeight: "600", marginTop: 3 },
});
