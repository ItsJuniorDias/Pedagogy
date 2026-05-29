import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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

const { width, height } = Dimensions.get("window");

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

// ─── STORY DATA ───────────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: 1,
    title: "Chapter 1",
    subtitle: "The Enchanted Forest",
    emoji: "🌲",
    locked: false,
    pages: [
      `It was a golden morning when Pipo, the most curious little bear in the forest, woke up to the smell of wild honey coming through the window of his tree stump home.\n\nHe stretched his furry arms, yawned loudly — startling the birds outside — and smiled at the day dawning outside.`,
      `— Today is going to be a special day — he whispered to himself, not yet knowing how true that was.\n\nAs he left his home, Pipo encountered his friend Lila, the striped-tailed fox, who was standing in the middle of the path with the most serious expression he had ever seen on her face.`,
      `— Pipo! I'm so glad I found you — she said, ears perked up. — The Flower Fairy has disappeared, and without her, the forest's flowers will sleep forever. We need to find her before sunset!\n\nPipo felt his heart race. He had never done anything so important before. But then, he took a deep breath and lifted his chin.\n\n— Then let's go together — he said. — Courage is easier when we have a friend by our side.`,
    ],
  },
  {
    id: 2,
    title: "Chapter 2",
    subtitle: "The River of Singing Stones",
    emoji: "🏞️",
    locked: true,
    pages: [
      `The path to the River of Singing Stones was full of surprises. Pipo and Lila walked along the trail of colorful mushrooms, crossed the vine bridge, and finally heard the soft tinkling of the magical stones in the water.\n\nBut something was wrong. The river was silent.`,
      `— The stones have stopped singing — whispered Lila, her ears drooping. — This means the magic is fading faster than we thought.\n\nPipo approached the riverbank and looked at the gray stones at the bottom of the crystal-clear river. Suddenly, one of them flickered — a faint light, like a star about to go out.`,
    ],
  },
  {
    id: 3,
    title: "Chapter 3",
    subtitle: "Courage Comes from the Heart",
    emoji: "💛",
    locked: true,
    pages: [
      `At the top of Misty Mountain, where the clouds touched the ground and the wind sang ancient stories, Pipo finally found the Flower Fairy asleep inside a crystal bubble.\n\nHis heart raced. It was time.`,
      `— You can do this — said Lila in a low voice, holding her friend's paw.\n\nAnd Pipo understood, at that moment, what courage truly meant: it was not the absence of fear, but the decision to act despite it.\n\nHe touched the crystal bubble with both paws and whispered:\n\n— Wake up. The forest needs you.`,
    ],
  },
];

// ─── PROGRESS DOTS ────────────────────────────────────────────────────────────
const PageDots = ({ total, current }: { total: number; current: number }) => (
  <View style={s.dotsRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[s.dot, i === current ? s.dotActive : s.dotInactive]}
      />
    ))}
  </View>
);

// ─── CHAPTER TAB ─────────────────────────────────────────────────────────────
const ChapterTab = ({
  chapter,
  active,
  onPress,
}: {
  chapter: (typeof CHAPTERS)[0];
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[s.chapterTab, active && s.chapterTabActive]}
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

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function ReadStoryScreen() {
  const router = useRouter();
  const [activeChapter, setActiveChapter] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  const chapter = CHAPTERS[activeChapter];
  const pages = chapter.pages;

  const switchChapter = (idx: number) => {
    if (CHAPTERS[idx].locked) {
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
      // Last page of chapter — suggest next
      const nextIdx = activeChapter + 1;
      if (nextIdx < CHAPTERS.length) switchChapter(nextIdx);
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

  const isLastPage = currentPage === pages.length - 1;
  const nextChapter = CHAPTERS[activeChapter + 1];

  return (
    <View style={s.root}>
      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={fredoka(16, "#2D2D2D")}>
            {chapter.emoji} {chapter.title}
          </Text>
          <Text style={s.headerSub}>{chapter.subtitle}</Text>
        </View>
        <View style={s.pageCounter}>
          <Text style={fredoka(12, "#FF5B8D")}>
            {currentPage + 1}/{pages.length}
          </Text>
        </View>
      </View>

      {/* ── CHAPTER TABS ── */}
      <View style={s.chapterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CHAPTERS.map((ch, i) => (
            <ChapterTab
              key={ch.id}
              chapter={ch}
              active={activeChapter === i}
              onPress={() => switchChapter(i)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── PAGES (horizontal FlatList) ── */}
      <Animated.View style={[s.pagesArea, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatRef}
          data={pages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={s.pageView}>
              {/* Decorative blob */}
              <View style={s.pageBlob1} />
              <View style={s.pageBlob2} />

              <View style={s.pageCard}>
                <Text style={s.pageText}>{item}</Text>
              </View>
            </View>
          )}
        />
      </Animated.View>

      {/* ── DOTS ── */}
      <PageDots total={pages.length} current={currentPage} />

      {/* ── NAV BUTTONS ── */}
      <View style={s.navRow}>
        <TouchableOpacity
          onPress={goPrev}
          style={[s.navBtn, currentPage === 0 && s.navBtnDisabled]}
          disabled={currentPage === 0}
          activeOpacity={0.8}
        >
          <Text style={fredoka(15, currentPage === 0 ? "#CCC" : "#2D2D2D")}>
            ← Anterior
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNext}
          style={s.navBtnPrimary}
          activeOpacity={0.85}
        >
          <Text style={fredoka(15, "#fff")}>
            {isLastPage && nextChapter
              ? nextChapter.locked
                ? "🔒 Próximo Cap."
                : `${nextChapter.emoji} Próximo Cap.`
              : "Próxima →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF9F0", paddingTop: 52 },

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
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerSub: { fontSize: 11, color: "#AAA", fontWeight: "600", marginTop: 2 },
  pageCounter: {
    backgroundColor: "#FFF0F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  // chapter tabs
  chapterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chapterTab: {
    height: 60,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chapterTabActive: {
    backgroundColor: "#FF5B8D",
    borderColor: "#FF5B8D",
    elevation: 5,
    shadowColor: "#FF5B8D",
    shadowOpacity: 0.3,
    shadowRadius: 8,
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

  // pages
  pagesArea: { flex: 1 },
  pageView: {
    width,
    paddingHorizontal: 20,
    position: "relative",
  },
  pageBlob1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FFE8F0",
    top: -20,
    right: -40,
    zIndex: 0,
  },
  pageBlob2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F4FF",
    bottom: 20,
    left: -30,
    zIndex: 0,
  },
  pageCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    zIndex: 1,
  },
  pageText: {
    fontSize: 18,
    color: "#3D3D3D",
    lineHeight: 30,
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  // dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginVertical: 14,
  },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: "#FF5B8D" },
  dotInactive: { width: 8, backgroundColor: "#E0E0E0" },

  // nav
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
    backgroundColor: "#fff",
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
    backgroundColor: "#FF5B8D",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#FF5B8D",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
});
