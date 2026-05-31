import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  KATUION,
  KEKKIHY,
  SPACEADVENTURE,
  STHM_STHAP,
  STRUCKBALL,
  TAIRBRTY,
} from "../../mocks/chapterMocks";

import {
  ASTRONAUT,
  COLORS_ART,
  DINOSAURS,
  LETTERS,
  OCEAN_LIFE,
  SCHOLL,
  SCIENCE_LAB,
  SPACE,
} from "../../mocks/learningMocks";

import { MAGIC_FOREST, ROCKET_ADVENTURE } from "../../mocks/storyMocks";

const { width } = Dimensions.get("window");

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

// ─── STORY REGISTRY ───────────────────────────────────────────────────────────
type StoryId =
  | "TAIRBRTY"
  | "STHMSTHAP"
  | "KATUION"
  | "STRUCKBALL"
  | "KEKKIHY"
  | "SPACEADVENTURE"
  | "LETTERS"
  | "SCHOOL"
  | "ASTRONAUT"
  | "SPACE"
  | "DINOSAURS"
  | "COLORS&ART"
  | "OCEANLIFE"
  | "SCIENCELAB"
  | "ROCKET_ADVENTURE"
  | "MAGIC_FOREST";

const STORY_MAP: Record<StoryId, { chapters: any[]; theme: StoryTheme }> = {
  TAIRBRTY: {
    chapters: TAIRBRTY,
    theme: {
      bg: "#FFF9F0",
      accent: "#FF8C42",
      accentSoft: "#FFF0F5",
      blob1: "#FFE8F0",
      blob2: "#E8F4FF",
      tabActive: "#FF8C42",
      tabShadow: "#FF8C42",
      cardBg: "#fff",
      navPrimary: "#FF8C42",
      navPrimaryShadow: "#FF8C42",
    },
  },
  STHMSTHAP: {
    chapters: STHM_STHAP,
    theme: {
      bg: "#0D1B2A",
      accent: "#00CEC9",
      accentSoft: "#0D2233",
      blob1: "#0A3040",
      blob2: "#0D1F35",
      tabActive: "#00CEC9",
      tabShadow: "#00CEC9",
      cardBg: "#12263A",
      navPrimary: "#00CEC9",
      navPrimaryShadow: "#00CEC9",
    },
  },
  KATUION: {
    chapters: KATUION,
    theme: {
      bg: "#FAF7F2",
      accent: "#7C5CBF",
      accentSoft: "#EDE7F6",
      blob1: "#EDE7F6",
      blob2: "#FCE4EC",
      tabActive: "#7C5CBF",
      tabShadow: "#7C5CBF",
      cardBg: "#fff",
      navPrimary: "#7C5CBF",
      navPrimaryShadow: "#7C5CBF",
    },
  },
  STRUCKBALL: {
    chapters: STRUCKBALL,
    theme: {
      bg: "#F0FFF4",
      accent: "#00B894",
      accentSoft: "#E0FFF4",
      blob1: "#C8FFD4",
      blob2: "#FFF9C4",
      tabActive: "#00B894",
      tabShadow: "#00B894",
      cardBg: "#fff",
      navPrimary: "#00B894",
      navPrimaryShadow: "#00B894",
    },
  },
  KEKKIHY: {
    chapters: KEKKIHY,
    theme: {
      bg: "#FFF9F0",
      accent: "#FF5B8D",
      accentSoft: "#FFF0F5",
      blob1: "#FFE8F0",
      blob2: "#E8F4FF",
      tabActive: "#FF5B8D",
      tabShadow: "#FF5B8D",
      cardBg: "#fff",
      navPrimary: "#FF5B8D",
      navPrimaryShadow: "#FF5B8D",
    },
  },
  SPACEADVENTURE: {
    chapters: SPACEADVENTURE,
    theme: {
      bg: "#E8F4FF",
      accent: "#1E90FF",
      accentSoft: "#D0ECFF",
      blob1: "#D0ECFF",
      blob2: "#FFF9C4",
      tabActive: "#1E90FF",
      tabShadow: "#1E90FF",
      cardBg: "#fff",
      navPrimary: "#1E90FF",
      navPrimaryShadow: "#1E90FF",
    },
  },
  LETTERS: {
    chapters: LETTERS,
    theme: {
      bg: "#FFF9F0",
      accent: "#FFD93D",
      accentSoft: "#FFF0F5",
      blob1: "#FFE8F0",
      blob2: "#E8F4FF",
      tabActive: "#FFD93D",
      tabShadow: "#FFD93D",
      cardBg: "#fff",
      navPrimary: "#FFD93D",
      navPrimaryShadow: "#FFD93D",
    },
  },
  SCHOOL: {
    chapters: SCHOLL,
    theme: {
      bg: "#FFF9F0",
      accent: "#52C878",
      accentSoft: "#FFF0F5",
      blob1: "#FFE8F0",
      blob2: "#E8F4FF",
      tabActive: "#52C878",
      tabShadow: "#52C878",
      cardBg: "#fff",
      navPrimary: "#52C878",
      navPrimaryShadow: "#52C878",
    },
  },
  ASTRONAUT: {
    chapters: ASTRONAUT,
    theme: {
      bg: "#FFF9F0",
      accent: "#FF7043",
      accentSoft: "#FFF0F5",
      blob1: "#FFE8F0",
      blob2: "#E8F4FF",
      tabActive: "#FF7043",
      tabShadow: "#FF7043",
      cardBg: "#fff",
      navPrimary: "#FF7043",
      navPrimaryShadow: "#FF7043",
    },
  },
  SPACE: {
    chapters: SPACE,
    theme: {
      bg: "#FFF9F0",
      accent: "#5C7CFF",
      accentSoft: "#FFF0F5",
      blob1: "#FFE8F0",
      blob2: "#E8F4FF",
      tabActive: "#5C7CFF",
      tabShadow: "#5C7CFF",
      cardBg: "#fff",
      navPrimary: "#5C7CFF",
      navPrimaryShadow: "#5C7CFF",
    },
  },
  DINOSAURS: {
    chapters: DINOSAURS,
    theme: {
      bg: "#FFF9F0",
      accent: "#27AE60",
      accentSoft: "#E0F8E0",
      blob1: "#C8FFD4",
      blob2: "#E8F4FF",
      tabActive: "#27AE60",
      tabShadow: "#27AE60",
      cardBg: "#fff",
      navPrimary: "#27AE60",
      navPrimaryShadow: "#27AE60",
    },
  },
  OCEANLIFE: {
    chapters: OCEAN_LIFE,
    theme: {
      bg: "#E0F7FA",
      accent: "#00ACC1",
      accentSoft: "#B2EBF2",
      blob1: "#B2EBF2",
      blob2: "#FFF9C4",
      tabActive: "#00ACC1",
      tabShadow: "#00ACC1",
      cardBg: "#fff",
      navPrimary: "#00ACC1",
      navPrimaryShadow: "#00ACC1",
    },
  },
  "COLORS&ART": {
    chapters: COLORS_ART,
    theme: {
      bg: "#FFF9F0",
      accent: "#FFD93D",
      accentSoft: "#FFF0F5",
      blob1: "#FFE8F0",
      blob2: "#E8F4FF",
      tabActive: "#FFD93D",
      tabShadow: "#FFD93D",
      cardBg: "#fff",
      navPrimary: "#FFD93D",
      navPrimaryShadow: "#FFD93D",
    },
  },
  SCIENCELAB: {
    chapters: SCIENCE_LAB,
    theme: {
      bg: "#E8F4FF",
      accent: "#1E90FF",
      accentSoft: "#D0ECFF",
      blob1: "#D0ECFF",
      blob2: "#FFF9C4",
      tabActive: "#1E90FF",
      tabShadow: "#1E90FF",
      cardBg: "#fff",
      navPrimary: "#1E90FF",
      navPrimaryShadow: "#1E90FF",
    },
  },
  ROCKET_ADVENTURE: {
    chapters: ROCKET_ADVENTURE,
    theme: {
      bg: "#E8F4FF",
      accent: "#1E90FF",
      accentSoft: "#D0ECFF",
      blob1: "#D0ECFF",
      blob2: "#FFF9C4",
      tabActive: "#1E90FF",
      tabShadow: "#1E90FF",
      cardBg: "#fff",
      navPrimary: "#1E90FF",
      navPrimaryShadow: "#1E90FF",
    },
  },
  MAGIC_FOREST: {
    chapters: MAGIC_FOREST,
    theme: {
      bg: "#FFF9F0",
      accent: "#27AE60",
      accentSoft: "#E0F8E0",
      blob1: "#C8FFD4",
      blob2: "#E8F4FF",
      tabActive: "#27AE60",
      tabShadow: "#27AE60",
      cardBg: "#fff",
      navPrimary: "#27AE60",
      navPrimaryShadow: "#27AE60",
    },
  },
};

interface StoryTheme {
  bg: string;
  accent: string;
  accentSoft: string;
  blob1: string;
  blob2: string;
  tabActive: string;
  tabShadow: string;
  cardBg: string;
  navPrimary: string;
  navPrimaryShadow: string;
}

// ─── PAGE DOTS ────────────────────────────────────────────────────────────────
const PageDots = ({
  total,
  current,
  accent,
}: {
  total: number;
  current: number;
  accent: string;
}) => (
  <View style={s.dotsRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          s.dot,
          i === current
            ? [s.dotActive, { backgroundColor: accent }]
            : s.dotInactive,
        ]}
      />
    ))}
  </View>
);

// ─── CHAPTER TAB ──────────────────────────────────────────────────────────────
const ChapterTab = ({
  chapter,
  active,
  theme,
  onPress,
}: {
  chapter: any;
  active: boolean;
  theme: StoryTheme;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      s.chapterTab,
      active && {
        backgroundColor: theme.tabActive,
        borderColor: theme.tabActive,
        shadowColor: theme.tabShadow,
        elevation: 5,
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      !active && { backgroundColor: theme.cardBg, borderColor: theme.cardBg },
    ]}
  >
    <Text style={{ fontSize: 18 }}>{chapter.emoji}</Text>
    <View>
      <Text style={[fredoka(12, active ? "#fff" : "#AAA")]}>
        {chapter.title}
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: active ? "rgba(255,255,255,0.7)" : "#CCC",
          fontWeight: "600",
          marginTop: 1,
        }}
        numberOfLines={1}
      >
        {chapter.subtitle}
      </Text>
    </View>
    {chapter.locked && (
      <View style={s.lockBadge}>
        <Text style={{ fontSize: 10 }}>🔒</Text>
      </View>
    )}
  </TouchableOpacity>
);

// ─── PECULIARITY WIDGETS ──────────────────────────────────────────────────────

/** STHM_STHAP — Riddle card at end of chapter */
const RiddleWidget = ({
  riddle,
  accent,
}: {
  riddle: { question: string; answer: string };
  accent: string;
}) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={[sw.riddleCard, { borderColor: accent }]}>
      <Text style={[sw.riddleLabel, { color: accent }]}>🧩 Riddle</Text>
      <Text style={sw.riddleQuestion}>{riddle.question}</Text>
      {revealed ? (
        <View style={[sw.riddleAnswerBox, { backgroundColor: accent }]}>
          <Text style={sw.riddleAnswerText}>{riddle.answer}</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setRevealed(true)}
          activeOpacity={0.85}
          style={[sw.riddleRevealBtn, { borderColor: accent }]}
        >
          <Text style={[sw.riddleRevealText, { color: accent }]}>
            Reveal answer
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/** KATUION — Dictionary entry header */
const DictionaryWidget = ({
  entry,
  accent,
}: {
  entry: { word: string; pronunciation: string; definition: string };
  accent: string;
}) => (
  <View style={[sw.dictCard, { borderLeftColor: accent }]}>
    <Text style={[sw.dictWord, { color: accent }]}>{entry.word}</Text>
    <Text style={sw.dictPronunciation}>{entry.pronunciation}</Text>
    <Text style={sw.dictDefinition}>{entry.definition}</Text>
  </View>
);

/** STRUCKBALL — Match report scoreboard */
const MatchReportWidget = ({
  report,
  accent,
}: {
  report: { teams: string[]; score: string; verdict: string };
  accent: string;
}) => (
  <View style={[sw.matchCard, { borderColor: accent }]}>
    <Text style={[sw.matchLabel, { color: accent }]}>📋 Match Report</Text>

    <View style={sw.matchScoreRow}>
      <Text style={sw.matchTeam} numberOfLines={1}>
        {report.teams[0]}
      </Text>
      <View style={[sw.matchScoreBadge, { backgroundColor: accent }]}>
        <Text style={sw.matchScoreText}>{report.score}</Text>
      </View>
      <Text style={sw.matchTeam} numberOfLines={1}>
        {report.teams[1]}
      </Text>
    </View>
    <Text style={sw.matchVerdict}>{report.verdict}</Text>
  </View>
);

// ─── PAGE VIEW ────────────────────────────────────────────────────────────────
const PageView = ({
  page,
  chapter,
  isLastPage,
  storyId,
  theme,
}: {
  page: string;
  chapter: any;
  isLastPage: boolean;
  storyId: StoryId;
  theme: StoryTheme;
}) => {
  // Strip the dictionary entry header from KATUION page text (it's shown in the widget)
  const cleanedPage =
    storyId === "KATUION" && chapter.dictionaryEntry
      ? page.replace(/^.+?─{5,}\n\n/s, "")
      : page;

  return (
    <View style={[s.pageView, { width }]}>
      <View style={[s.pageBlob1, { backgroundColor: theme.blob1 }]} />
      <View style={[s.pageBlob2, { backgroundColor: theme.blob2 }]} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* KATUION: dictionary entry at top of each chapter's first page */}
        {storyId === "KATUION" && chapter.dictionaryEntry && (
          <DictionaryWidget
            entry={chapter.dictionaryEntry}
            accent={theme.accent}
          />
        )}

        <View style={[s.pageCard, { backgroundColor: theme.cardBg }]}>
          <Text
            style={[
              s.pageText,
              storyId === "STHMSTHAP" && { color: "#CBD5E0" },
              {
                fontFamily: "FredokaOne_400Regular",
                fontSize: 16,
                lineHeight: 26,
              },
            ]}
          >
            {cleanedPage}
          </Text>
        </View>

        {/* STHMSTHAP: riddle on last page of each chapter */}
        {storyId === "STHMSTHAP" && isLastPage && chapter.riddle && (
          <RiddleWidget riddle={chapter.riddle} accent={theme.accent} />
        )}

        {/* STRUCKBALL: match report on last page of each chapter */}
        {storyId === "STRUCKBALL" && isLastPage && chapter.matchReport && (
          <MatchReportWidget
            report={chapter.matchReport}
            accent={theme.accent}
          />
        )}
      </ScrollView>
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ReadStoryScreen() {
  const router = useRouter();
  const { storyId } = useLocalSearchParams<{ storyId: string }>();

  console.log(
    "Received storyId param:",
    storyId?.toLocaleUpperCase().replace(/\s/g, ""),
  ); // Debug log to check the received param

  const id = (storyId?.toLocaleUpperCase().replace(/\s/g, "") ??
    "TAIRBRTY") as StoryId;

  const { chapters, theme } = STORY_MAP[id] ?? STORY_MAP.TAIRBRTY;

  const [activeChapter, setActiveChapter] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  const chapter = chapters[activeChapter];
  const pages = chapter.pages;
  const isLastPage = currentPage === pages.length - 1;
  const nextChapter = chapters[activeChapter + 1];

  const switchChapter = async (idx: number) => {
    const status = await AsyncStorage.getItem("@subscription_status");

    if (chapters[idx].locked && status !== "active") {
      router.push("/(paywall)");
      return;
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setActiveChapter(idx);
      setCurrentPage(0);
      flatRef.current?.scrollToIndex({ index: 0, animated: false });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentPage(idx);
  };

  const goNext = () => {
    if (currentPage < pages.length - 1) {
      flatRef.current?.scrollToIndex({
        index: currentPage + 1,
        animated: true,
      });
    } else {
      const nextIdx = activeChapter + 1;
      if (nextIdx < chapters.length) switchChapter(nextIdx);
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      flatRef.current?.scrollToIndex({
        index: currentPage - 1,
        animated: true,
      });
    }
  };

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backBtn, { backgroundColor: theme.cardBg }]}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={fredoka(16, theme.accent)}>
            {chapter.emoji} {chapter.title}
          </Text>
          <Text
            style={[s.headerSub, id === "STHMSTHAP" && { color: "#638596" }]}
          >
            {chapter.subtitle}
          </Text>
        </View>
        <View style={[s.pageCounter, { backgroundColor: theme.accentSoft }]}>
          <Text style={fredoka(12, theme.accent)}>
            {currentPage + 1}/{pages.length}
          </Text>
        </View>
      </View>

      {/* ── CHAPTER TABS ── */}
      <View style={s.chapterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {chapters.map((ch: any, i: number) => (
            <ChapterTab
              key={ch.id}
              chapter={ch}
              active={activeChapter === i}
              theme={theme}
              onPress={() => switchChapter(i)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── PAGES ── */}
      <Animated.View style={[s.pagesArea, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatRef}
          data={pages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <PageView
              page={item}
              chapter={chapter}
              isLastPage={index === pages.length - 1}
              storyId={id}
              theme={theme}
            />
          )}
        />
      </Animated.View>

      {/* ── DOTS ── */}
      <PageDots
        total={pages.length}
        current={currentPage}
        accent={theme.accent}
      />

      {/* ── NAV BUTTONS ── */}
      <View style={s.navRow}>
        <TouchableOpacity
          onPress={goPrev}
          style={[
            s.navBtn,
            { backgroundColor: theme.cardBg },
            currentPage === 0 && s.navBtnDisabled,
          ]}
          disabled={currentPage === 0}
          activeOpacity={0.8}
        >
          <Text style={fredoka(15, currentPage === 0 ? "#CCC" : theme.accent)}>
            ← Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNext}
          style={[
            s.navBtnPrimary,
            {
              backgroundColor: theme.navPrimary,
              shadowColor: theme.navPrimaryShadow,
            },
          ]}
          activeOpacity={0.85}
        >
          <Text style={fredoka(15, "#fff")}>
            {isLastPage && nextChapter
              ? nextChapter.locked
                ? "🔒 Next Cap."
                : `${nextChapter.emoji} Next Cap.`
              : "Next →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── MAIN STYLES ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, paddingTop: 52 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerSub: { fontSize: 11, color: "#AAA", fontWeight: "600", marginTop: 2 },
  pageCounter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chapterRow: { paddingHorizontal: 20, marginBottom: 24 },
  chapterTab: {
    height: 60,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  lockBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  pagesArea: { flex: 1 },
  pageView: {
    paddingHorizontal: 20,
    position: "relative",
    flex: 1,
  },
  pageBlob1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -20,
    right: -40,
    zIndex: 0,
  },
  pageBlob2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: 20,
    left: -30,
    zIndex: 0,
  },
  pageCard: {
    borderRadius: 28,
    padding: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    zIndex: 1,
    marginBottom: 12,
  },
  pageText: {
    fontSize: 18,
    color: "#3D3D3D",
    lineHeight: 30,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginVertical: 14,
  },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  dotInactive: { width: 8, backgroundColor: "#E0E0E0" },
  navRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  navBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnPrimary: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
});

// ─── WIDGET STYLES ────────────────────────────────────────────────────────────
const sw = StyleSheet.create({
  // Riddle — STHM_STHAP
  riddleCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    backgroundColor: "#0D1B2A",
    gap: 12,
  },
  riddleLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  riddleQuestion: {
    fontSize: 16,
    color: "#CBD5E0",
    lineHeight: 24,
    fontWeight: "500",
    fontStyle: "italic",
  },
  riddleRevealBtn: {
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  riddleRevealText: { fontSize: 14, fontWeight: "700" },
  riddleAnswerBox: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  riddleAnswerText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Dictionary — KATUION
  dictCard: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 4,
  },
  dictWord: {
    fontSize: 22,
    fontFamily: "FredokaOne_400Regular",
  },
  dictPronunciation: {
    fontSize: 13,
    color: "#AAA",
    fontWeight: "600",
    fontStyle: "italic",
  },
  dictDefinition: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    fontWeight: "500",
  },

  // Match Report — STRUCKBALL
  matchCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    backgroundColor: "#FFFDE7",
    gap: 12,
  },
  matchLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  matchScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  matchTeam: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#2D2D2D",
    textAlign: "center",
  },
  matchScoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  matchScoreText: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "FredokaOne_400Regular",
    letterSpacing: 1,
  },
  matchVerdict: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 18,
    textAlign: "center",
  },
});
