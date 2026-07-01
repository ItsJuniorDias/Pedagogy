import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useFonts } from "expo-font";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

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
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Breathe, enterPop, enterRise, enterUp } from "../../shared/motion";

// ─── INTEGRAÇÃO PROGRESSO ─────────────────────────────────────────────────────
// Ajuste o caminho conforme onde você salvou o readingProgress.ts
import { useReadingTimer } from "../../hooks/useReadingTimer";
import {
  trackChapterCompleted,
  trackContentView,
  trackStoryCompleted,
} from "../../lib/analytics";
import { getProgress, markChapterCompleted } from "../../lib/readingProgress";

// ─── INTEGRAÇÃO EXERCÍCIOS ────────────────────────────────────────────────────
import ExerciseSession from "../../features/exercises/components/ExerciseSession";
import {
  getStoryExercises,
  hasStoryExercises,
} from "../../features/exercises/data";

// ─── IMPORTS: Mocks Originais ─────────────────────────────────────────────────
import {
  KATUION,
  KEKKIHY,
  SPACEADVENTURE,
  STHM_STHAP,
  STRUCKBALL,
  TAIRBRTY,
} from "../../mocks/chapterMocks";

import {
  THE_ANIMAL_WHISPERER,
  THE_ART_OF_BEING_WRONG,
  THE_CHRONONAUTS,
  THE_CITY_OF_CLOCKS,
  THE_CLOCKWORK_DETECTIVE,
  THE_CLOUD_READER,
  THE_COLOUR_THIEF,
  THE_CORAL_QUEEN,
  THE_DREAM_ARCHITECT,
  THE_FEELINGS_GARDEN,
  THE_FIELD_GUIDE_TO_IMPOSSIBLE_CREATURES,
  THE_FORGOTTEN_ALPHABET,
  THE_GIANT_WHO_WEPT_MOUNTAINS,
  THE_GLASS_COMPOSER,
  THE_GRANDMOTHERS_RECIPE_BOX,
  THE_INSECT_ORCHESTRA,
  THE_ISLAND_OF_MISTS,
  THE_LAST_BEEKEEPER,
  THE_LIGHTHOUSE_KEEPERS_SON,
  THE_MAPMAKERS_DAUGHTER,
  THE_NIGHT_GARDEN,
  THE_PAPER_GARDEN,
  THE_ROBOTS_JOURNAL,
  THE_SANDCASTLE_ARCHITECT,
  THE_SCIENCE_OF_SMALL_WONDERS,
  THE_SLOW_TRAIN_EXPRESS,
  THE_SPACE_FARMER,
  THE_SPELL_CHECKER,
  THE_TIME_LIBRARY,
  THE_UNDERWATER_EXPLORERS,
  THE_VOWEL_VILLAGE,
  THE_WIND_MAPPER,
  THE_WORD_COLLECTOR,
  THE_YOUNG_VOLCANOLOGIST,
} from "../../mocks/historyMock";

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
import {
  DINO_WORLD,
  DRAGON_DIARY,
  MAGIC_FOREST,
  OCEANFRIENDS,
  ROCKET_ADVENTURE,
  TINY_SCIENTIST,
} from "../../mocks/storyMocks";

// ─── CONTEÚDO LOCALIZADO ──────────────────────────────────────────────────────
// Overlay de tradução das histórias por idioma (inglês = canônico + fallback).
import { localizeChapters } from "../../mocks/i18n";

const { width } = Dimensions.get("window");

// ─── MÚSICA DE FUNDO ──────────────────────────────────────────────────────────
const BG_MUSIC_URL =
  "https://www.bensound.com/bensound-music/bensound-tenderness.mp3";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ChapterMock = {
  id: number | string;
  title: string;
  subtitle: string;
  emoji: string;
  locked?: boolean;
  pages: string[];
  dictionaryEntry?: { word: string; pronunciation: string; definition: string };
  wordEntry?: {
    word: string;
    phonetic: string;
    partOfSpeech: string;
    definition: string;
    example: string;
  };
  riddle?: { question: string; answer: string };
  matchReport?: { teams: string[]; score: string; verdict: string };
  mission?: {
    code: string;
    title: string;
    objectives: { id: string; label: string; done: boolean }[];
  };
  feelingCard?: {
    emoji: string;
    emotion: string;
    prompt: string;
    affirmation: string;
  };
  letterFriend?: {
    letter: string;
    character: string;
    word: string;
    sound: string;
  };
  diaryDate?: string;
  rune?: { symbol: string; name: string; meaning: string };
  verse?: { lines: string[]; author: string };
  recipe?: { name: string; ingredients: string[]; instructions: string };
  creatureCard?: {
    name: string;
    classification: string;
    size: string;
    habitat: string;
    diet: string;
    notes: string;
  };
  [key: string]: unknown;
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

// ─── TOKEN PARA HIGHLIGHT ─────────────────────────────────────────────────────
// Representa cada fragmento do texto: palavra ou espaço/pontuação
type TextToken = {
  text: string;
  charStart: number; // posição no texto original (cleanedText)
  isWord: boolean;
};

/**
 * Divide o texto em tokens preservando a posição de cada caractere.
 * Tokens alternados: palavra | separador
 */
function tokenizeText(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  // Separa em palavras e não-palavras mantendo delimitadores
  const parts = text.split(/(\s+)/);
  let cursor = 0;
  for (const part of parts) {
    if (part.length === 0) continue;
    tokens.push({
      text: part,
      charStart: cursor,
      isWord: /\S/.test(part),
    });
    cursor += part.length;
  }
  return tokens;
}

// ─── THEME ENGINE ─────────────────────────────────────────────────────────────

const PALETTES: Pick<
  StoryTheme,
  "bg" | "accent" | "accentSoft" | "blob1" | "blob2"
>[] = [
  {
    bg: "#FFF9F0",
    accent: "#FF8C42",
    accentSoft: "#FFF0E8",
    blob1: "#FFE8D0",
    blob2: "#E8F4FF",
  },
  {
    bg: "#0D1B2A",
    accent: "#00CEC9",
    accentSoft: "#0D2233",
    blob1: "#0A3040",
    blob2: "#0D1F35",
  },
  {
    bg: "#FAF7F2",
    accent: "#7C5CBF",
    accentSoft: "#EDE7F6",
    blob1: "#EDE7F6",
    blob2: "#FCE4EC",
  },
  {
    bg: "#F0FFF4",
    accent: "#00B894",
    accentSoft: "#E0FFF4",
    blob1: "#C8FFD4",
    blob2: "#FFF9C4",
  },
  {
    bg: "#FFF9F0",
    accent: "#FF5B8D",
    accentSoft: "#FFF0F5",
    blob1: "#FFE8F0",
    blob2: "#E8F4FF",
  },
  {
    bg: "#E8F4FF",
    accent: "#1E90FF",
    accentSoft: "#D0ECFF",
    blob1: "#D0ECFF",
    blob2: "#FFF9C4",
  },
  {
    bg: "#FFF9F0",
    accent: "#FFD93D",
    accentSoft: "#FFF8D0",
    blob1: "#FFE8F0",
    blob2: "#E8F4FF",
  },
  {
    bg: "#F0FFF4",
    accent: "#27AE60",
    accentSoft: "#E0F8E0",
    blob1: "#C8FFD4",
    blob2: "#E8F4FF",
  },
  {
    bg: "#E0F7FA",
    accent: "#00ACC1",
    accentSoft: "#B2EBF2",
    blob1: "#B2EBF2",
    blob2: "#FFF9C4",
  },
  {
    bg: "#FFF7ED",
    accent: "#F97316",
    accentSoft: "#FFEDD5",
    blob1: "#FED7AA",
    blob2: "#FEF9C3",
  },
  {
    bg: "#F3F0FF",
    accent: "#8B5CF6",
    accentSoft: "#EDE9FE",
    blob1: "#EDE9FE",
    blob2: "#FCE4EC",
  },
  {
    bg: "#EBF4FF",
    accent: "#3B82F6",
    accentSoft: "#DBEAFE",
    blob1: "#DBEAFE",
    blob2: "#EDE9FE",
  },
  {
    bg: "#EBF8FF",
    accent: "#0EA5E9",
    accentSoft: "#E0F2FE",
    blob1: "#BAE6FD",
    blob2: "#ECFEFF",
  },
  {
    bg: "#ECFDF5",
    accent: "#059669",
    accentSoft: "#D1FAE5",
    blob1: "#A7F3D0",
    blob2: "#FEF9C3",
  },
  {
    bg: "#FFFBEB",
    accent: "#D97706",
    accentSoft: "#FEF3C7",
    blob1: "#FDE68A",
    blob2: "#ECFDF5",
  },
  {
    bg: "#FDF4FF",
    accent: "#A855F7",
    accentSoft: "#F3E8FF",
    blob1: "#E9D5FF",
    blob2: "#FDF4FF",
  },
];

function hashToPaletteIndex(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % PALETTES.length;
}

function deriveTheme(id: string, _chapters: ChapterMock[]): StoryTheme {
  const paletteIdx = hashToPaletteIndex(id);
  const palette = PALETTES[paletteIdx];
  const isDark =
    palette.bg.length === 7 && parseInt(palette.bg.slice(1), 16) < 0x303030;
  const cardBg = isDark ? "#12263A" : "#fff";
  return {
    bg: palette.bg,
    accent: palette.accent,
    accentSoft: palette.accentSoft,
    blob1: palette.blob1,
    blob2: palette.blob2,
    tabActive: palette.accent,
    tabShadow: palette.accent,
    cardBg,
    navPrimary: palette.accent,
    navPrimaryShadow: palette.accent,
  };
}

// ─── STORY REGISTRY ───────────────────────────────────────────────────────────

const STORY_CHAPTERS: Record<string, ChapterMock[]> = {
  TAIRBRTY,
  STHMSTHAP: STHM_STHAP,
  KATUION,
  STRUCKBALL,
  KEKKIHY,
  SPACEADVENTURE,
  LETTERS,
  SCHOOL: SCHOLL,
  ASTRONAUT,
  SPACE,
  DINOSAURS,
  OCEANLIFE: OCEAN_LIFE,
  "COLORS&ART": COLORS_ART,
  SCIENCELAB: SCIENCE_LAB,
  ROCKETADVENTURE: ROCKET_ADVENTURE,
  MAGICFOREST: MAGIC_FOREST,
  OCEANFRIENDS,
  TINYSICENTIST: TINY_SCIENTIST,
  DRAGONDIARY: DRAGON_DIARY,
  DINOWORLD: DINO_WORLD,
  THEVOWELVILLAGE: THE_VOWEL_VILLAGE,
  THECLOCKWORKDETECTIVE: THE_CLOCKWORK_DETECTIVE,
  THEUNDERWATEREXPLORERS: THE_UNDERWATER_EXPLORERS,
  THEFEELINGSGARDEN: THE_FEELINGS_GARDEN,
  THEROBOTSJOURNAL: THE_ROBOTS_JOURNAL,
  THEMAPMAKERSDAUGHTER: THE_MAPMAKERS_DAUGHTER,
  THEWORDCOLLECTOR: THE_WORD_COLLECTOR,
  THELIGHTHOUSEKEEPERSSON: THE_LIGHTHOUSE_KEEPERS_SON,
  THEGRANDMOTHERSRECIPEBOX: THE_GRANDMOTHERS_RECIPE_BOX,
  THEFIELDGUIDE: THE_FIELD_GUIDE_TO_IMPOSSIBLE_CREATURES,
  THECLOUDREADER: THE_CLOUD_READER,
  THECOLOURTHIEF: THE_COLOUR_THIEF,
  THEGIANTWHOWEPT: THE_GIANT_WHO_WEPT_MOUNTAINS,
  THEINSECTORCHESTRA: THE_INSECT_ORCHESTRA,
  THENIGHTGARDEN: THE_NIGHT_GARDEN,
  THESCIENCEOFSMALLWONDERS: THE_SCIENCE_OF_SMALL_WONDERS,
  THESLOWTRAINEXPRESS: THE_SLOW_TRAIN_EXPRESS,
  THETIMELIBRARY: THE_TIME_LIBRARY,
  THEARTOFBEING: THE_ART_OF_BEING_WRONG,
  THESANDCASTLEARCHITECT: THE_SANDCASTLE_ARCHITECT,
  THESPELLCHECKER: THE_SPELL_CHECKER,
  THEVOLCANOLOGIST: THE_YOUNG_VOLCANOLOGIST,
  THEFORGOTTENALPHABET: THE_FORGOTTEN_ALPHABET,
  THEBEEKEEPER: THE_LAST_BEEKEEPER,
  THEISLANDOFMISTS: THE_ISLAND_OF_MISTS,
  THECITYOFCLOCKS: THE_CITY_OF_CLOCKS,
  THECORALQUEEN: THE_CORAL_QUEEN,
  THEGLASSCOMPOSER: THE_GLASS_COMPOSER,
  THEWINDMAPPER: THE_WIND_MAPPER,
  THEANIMALWHISPERER: THE_ANIMAL_WHISPERER,
  THEDREAMARCHITECT: THE_DREAM_ARCHITECT,
  THECHRONONAUTS: THE_CHRONONAUTS,
  THEPAPERGARDEN: THE_PAPER_GARDEN,
  THESPACEFARMER: THE_SPACE_FARMER,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

function resolveStoryId(raw: string): string {
  const upper = raw.toLocaleUpperCase().replace(/[\s_\-]/g, "");
  return upper.replace(/Г/g, "G");
}

// ─── PAGE DOTS ────────────────────────────────────────────────────────────────
// Cada dot estica com mola quando vira o ativo — efeito "pílula" 💊
const SpringDot = ({ active, accent }: { active: boolean; accent: string }) => {
  const w = useSharedValue(active ? 22 : 8);
  React.useEffect(() => {
    w.value = withSpring(active ? 22 : 8, { damping: 14, stiffness: 220 });
  }, [active, w]);
  const aStyle = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <Reanimated.View
      style={[
        s.dot,
        { backgroundColor: active ? accent : "#00000022" },
        aStyle,
      ]}
    />
  );
};

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
      <SpringDot key={i} active={i === current} accent={accent} />
    ))}
  </View>
);

// "Chapter N" é rótulo estrutural → traduz via i18n; qualquer outro título passa direto.
const chapterLabel = (
  t: ReturnType<typeof useTranslation>["t"],
  title: string,
) => {
  const m = /^Chapter (\d+)$/.exec(title);
  return m ? t("details.chapter", { number: m[1] }) : title;
};

// ─── CHAPTER TAB ──────────────────────────────────────────────────────────────
const ChapterTab = ({
  chapter,
  active,
  read, // ── INTEGRAÇÃO PROGRESSO: capítulo já lido ──
  theme,
  onPress,
}: {
  chapter: ChapterMock;
  active: boolean;
  read: boolean;
  theme: StoryTheme;
  onPress: () => void;
}) => {
  const { t } = useTranslation();
  return (
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
        {chapterLabel(t, chapter.title)}
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
    {/* ── INTEGRAÇÃO PROGRESSO: check de capítulo lido ── */}
    {!chapter.locked && read && (
      <View style={[s.readBadge, { backgroundColor: theme.accent }]}>
        <Text style={{ fontSize: 10, color: "#fff", fontWeight: "800" }}>
          ✓
        </Text>
      </View>
    )}
    </TouchableOpacity>
  );
};

// ─── HIGHLIGHTED TEXT ─────────────────────────────────────────────────────────

/**
 * Renderiza o texto do capítulo com highlight word-by-word sincronizado ao TTS.
 *
 * charIndex: posição atual sendo lida (do onBoundary/onProgress do Speech)
 * charLength: comprimento da palavra atual
 * accent: cor do tema para o highlight
 * isDarkBg: ajusta contraste do texto base
 */
const HighlightedPageText = React.memo(
  ({
    text,
    charIndex,
    charLength,
    accent,
    isDarkBg,
    isSpeaking,
  }: {
    text: string;
    charIndex: number;
    charLength: number;
    accent: string;
    isDarkBg: boolean;
    isSpeaking: boolean;
  }) => {
    // Tokeniza apenas quando o texto muda (memoized)
    const tokens = useMemo(() => tokenizeText(text), [text]);

    // Determina o índice final da palavra atual no texto original
    const highlightEnd = charIndex + charLength;

    return (
      <Text
        style={[
          s.pageText,
          isDarkBg && { color: "#CBD5E0" },
          { fontFamily: "FredokaOne_400Regular", fontSize: 16, lineHeight: 26 },
        ]}
      >
        {tokens.map((token, idx) => {
          if (!isSpeaking || !token.isWord) {
            // Sem highlight: texto normal
            return (
              <Text
                key={idx}
                style={isDarkBg ? { color: "#CBD5E0" } : { color: "#3D3D3D" }}
              >
                {token.text}
              </Text>
            );
          }

          const tokenEnd = token.charStart + token.text.length;
          const isActive =
            token.charStart >= charIndex && tokenEnd <= highlightEnd + 1;

          // Palavra sendo lida agora: highlight colorido com underline suave
          if (isActive) {
            return (
              <Text
                key={idx}
                style={[
                  sh.wordHighlight,
                  {
                    backgroundColor: accent + "33", // 20% opacidade
                    color: accent,
                    textDecorationColor: accent,
                  },
                ]}
              >
                {token.text}
              </Text>
            );
          }

          // Palavras já lidas: levemente apagadas para guiar o olho
          const alreadyRead = token.charStart < charIndex;
          if (alreadyRead) {
            return (
              <Text
                key={idx}
                style={{ color: isDarkBg ? "#5A7A8A" : "#AAAAAA" }}
              >
                {token.text}
              </Text>
            );
          }

          // Palavras ainda não lidas: cor normal
          return (
            <Text
              key={idx}
              style={isDarkBg ? { color: "#CBD5E0" } : { color: "#3D3D3D" }}
            >
              {token.text}
            </Text>
          );
        })}
      </Text>
    );
  },
);

// ─── WIDGETS ──────────────────────────────────────────────────────────────────

const RiddleWidget = ({
  riddle,
  accent,
}: {
  riddle: NonNullable<ChapterMock["riddle"]>;
  accent: string;
}) => {
  const [revealed, setRevealed] = useState(false);
  const { t } = useTranslation();
  return (
    <View style={[sw.riddleCard, { borderColor: accent }]}>
      <Text style={[sw.riddleLabel, { color: accent }]}>
        🧩 {t("details.riddle")}
      </Text>
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
            {t("details.revealAnswer")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const DictionaryWidget = ({
  entry,
  accent,
}: {
  entry: NonNullable<ChapterMock["dictionaryEntry"]>;
  accent: string;
}) => (
  <View style={[sw.dictCard, { borderLeftColor: accent }]}>
    <Text style={[sw.dictWord, { color: accent }]}>{entry.word}</Text>
    <Text style={sw.dictPronunciation}>{entry.pronunciation}</Text>
    <Text style={sw.dictDefinition}>{entry.definition}</Text>
  </View>
);

const WordEntryWidget = ({
  entry,
  accent,
}: {
  entry: NonNullable<ChapterMock["wordEntry"]>;
  accent: string;
}) => (
  <View style={[sw.wordCard, { borderLeftColor: accent }]}>
    <View style={sw.wordHeader}>
      <Text style={[sw.wordTitle, { color: accent }]}>{entry.word}</Text>
      <Text
        style={[sw.wordPos, { backgroundColor: accent + "22", color: accent }]}
      >
        {entry.partOfSpeech}
      </Text>
    </View>
    <Text style={sw.wordPhonetic}>{entry.phonetic}</Text>
    <Text style={sw.wordDefinition}>{entry.definition}</Text>
    <Text style={sw.wordExample}>"{entry.example}"</Text>
  </View>
);

const MatchReportWidget = ({
  report,
  accent,
}: {
  report: NonNullable<ChapterMock["matchReport"]>;
  accent: string;
}) => {
  const { t } = useTranslation();
  return (
    <View style={[sw.matchCard, { borderColor: accent }]}>
      <Text style={[sw.matchLabel, { color: accent }]}>
        📋 {t("details.matchReport")}
      </Text>
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
};

const MissionWidget = ({
  mission,
  accent,
}: {
  mission: NonNullable<ChapterMock["mission"]>;
  accent: string;
}) => (
  <View style={[sw.missionCard, { borderColor: accent }]}>
    <View style={sw.missionHeader}>
      <Text style={[sw.missionCode, { color: accent }]}>{mission.code}</Text>
      <Text style={[sw.missionTitle, { color: accent }]}>{mission.title}</Text>
    </View>
    {mission.objectives.map((obj) => (
      <View key={obj.id} style={sw.missionObjective}>
        <Text style={[sw.missionCheck, { color: obj.done ? accent : "#CCC" }]}>
          {obj.done ? "✓" : "○"}
        </Text>
        <Text
          style={[
            sw.missionLabel,
            {
              color: obj.done ? "#333" : "#999",
              textDecorationLine: obj.done ? "line-through" : "none",
            },
          ]}
        >
          {obj.label}
        </Text>
      </View>
    ))}
  </View>
);

const FeelingCardWidget = ({
  card,
  accent,
}: {
  card: NonNullable<ChapterMock["feelingCard"]>;
  accent: string;
}) => (
  <View
    style={[
      sw.feelingCard,
      { borderColor: accent + "44", backgroundColor: accent + "0D" },
    ]}
  >
    <Text style={sw.feelingEmoji}>{card.emoji}</Text>
    <Text style={[sw.feelingEmotion, { color: accent }]}>{card.emotion}</Text>
    <Text style={sw.feelingPrompt}>{card.prompt}</Text>
    <View style={[sw.feelingAffirmBox, { backgroundColor: accent + "22" }]}>
      <Text style={[sw.feelingAffirm, { color: accent }]}>
        💛 {card.affirmation}
      </Text>
    </View>
  </View>
);

const LetterFriendWidget = ({
  friend,
  accent,
}: {
  friend: NonNullable<ChapterMock["letterFriend"]>;
  accent: string;
}) => {
  const { t } = useTranslation();
  return (
    <View style={[sw.letterCard, { borderColor: accent }]}>
      <View style={[sw.letterBig, { backgroundColor: accent }]}>
        <Text style={sw.letterBigText}>{friend.letter}</Text>
      </View>
      <View style={sw.letterInfo}>
        <Text style={[sw.letterCharacter, { color: accent }]}>
          {friend.character}
        </Text>
        <Text style={sw.letterWord}>
          {t("details.word")}:{" "}
          <Text style={{ fontWeight: "700" }}>{friend.word}</Text>
        </Text>
        <Text style={sw.letterSound}>🔊 {friend.sound}</Text>
      </View>
    </View>
  );
};

const DiaryDateWidget = ({
  date,
  accent,
}: {
  date: string;
  accent: string;
}) => (
  <View style={[sw.diaryDate, { borderBottomColor: accent + "44" }]}>
    <Text style={[sw.diaryDateText, { color: accent }]}>📔 {date}</Text>
  </View>
);

const RuneWidget = ({
  rune,
  accent,
}: {
  rune: NonNullable<ChapterMock["rune"]>;
  accent: string;
}) => (
  <View style={[sw.runeCard, { borderColor: accent + "44" }]}>
    <Text style={[sw.runeSymbol, { color: accent }]}>{rune.symbol}</Text>
    <Text style={[sw.runeName, { color: accent }]}>{rune.name}</Text>
    <Text style={sw.runeMeaning}>{rune.meaning}</Text>
  </View>
);

const VerseWidget = ({
  verse,
  accent,
}: {
  verse: NonNullable<ChapterMock["verse"]>;
  accent: string;
}) => (
  <View style={[sw.verseCard, { borderLeftColor: accent }]}>
    {verse.lines.map((line, i) => (
      <Text key={i} style={sw.verseLine}>
        {line}
      </Text>
    ))}
    <Text style={[sw.verseAuthor, { color: accent }]}>— {verse.author}</Text>
  </View>
);

const RecipeWidget = ({
  recipe,
  accent,
}: {
  recipe: NonNullable<ChapterMock["recipe"]>;
  accent: string;
}) => {
  const { t } = useTranslation();
  return (
    <View style={[sw.recipeCard, { borderColor: accent + "55" }]}>
      <Text style={[sw.recipeName, { color: accent }]}>🍽 {recipe.name}</Text>
      <Text style={sw.recipeSection}>{t("details.ingredients")}:</Text>
      {recipe.ingredients.map((ing, i) => (
        <Text key={i} style={sw.recipeIngredient}>
          • {ing}
        </Text>
      ))}
      <Text style={sw.recipeSection}>{t("details.instructions")}:</Text>
      <Text style={sw.recipeInstructions}>{recipe.instructions}</Text>
    </View>
  );
};

const CreatureCardWidget = ({
  creature,
  accent,
}: {
  creature: NonNullable<ChapterMock["creatureCard"]>;
  accent: string;
}) => {
  const { t } = useTranslation();
  return (
    <View style={[sw.creatureCard, { borderColor: accent }]}>
      <Text style={[sw.creatureName, { color: accent }]}>{creature.name}</Text>
      <View style={sw.creatureRows}>
        <Text style={sw.creatureLabel}>{t("details.classification")}:</Text>
        <Text style={sw.creatureValue}>{creature.classification}</Text>
      </View>
      <View style={sw.creatureRows}>
        <Text style={sw.creatureLabel}>{t("details.size")}:</Text>
        <Text style={sw.creatureValue}>{creature.size}</Text>
      </View>
      <View style={sw.creatureRows}>
        <Text style={sw.creatureLabel}>{t("details.habitat")}:</Text>
        <Text style={sw.creatureValue}>{creature.habitat}</Text>
      </View>
      <View style={sw.creatureRows}>
        <Text style={sw.creatureLabel}>{t("details.diet")}:</Text>
        <Text style={sw.creatureValue}>{creature.diet}</Text>
      </View>
      <View style={[sw.creatureNotes, { backgroundColor: accent + "11" }]}>
        <Text style={[sw.creatureNotesLabel, { color: accent }]}>
          📋 {t("details.notes")}
        </Text>
        <Text style={sw.creatureNotesText}>{creature.notes}</Text>
      </View>
    </View>
  );
};

// ─── WIDGET RENDERER ──────────────────────────────────────────────────────────

const TopWidgets = ({
  chapter,
  accent,
}: {
  chapter: ChapterMock;
  accent: string;
}) => (
  <>
    {chapter.letterFriend && (
      <LetterFriendWidget friend={chapter.letterFriend} accent={accent} />
    )}
    {chapter.diaryDate && (
      <DiaryDateWidget date={chapter.diaryDate} accent={accent} />
    )}
    {chapter.rune && <RuneWidget rune={chapter.rune} accent={accent} />}
    {chapter.verse && <VerseWidget verse={chapter.verse} accent={accent} />}
    {chapter.wordEntry && (
      <WordEntryWidget entry={chapter.wordEntry} accent={accent} />
    )}
    {chapter.dictionaryEntry && (
      <DictionaryWidget entry={chapter.dictionaryEntry} accent={accent} />
    )}
    {chapter.mission && (
      <MissionWidget mission={chapter.mission} accent={accent} />
    )}
    {chapter.feelingCard && (
      <FeelingCardWidget card={chapter.feelingCard} accent={accent} />
    )}
    {chapter.recipe && <RecipeWidget recipe={chapter.recipe} accent={accent} />}
    {chapter.creatureCard && (
      <CreatureCardWidget creature={chapter.creatureCard} accent={accent} />
    )}
  </>
);

const BottomWidgets = ({
  chapter,
  accent,
}: {
  chapter: ChapterMock;
  accent: string;
}) => (
  <>
    {chapter.riddle && <RiddleWidget riddle={chapter.riddle} accent={accent} />}
    {chapter.matchReport && (
      <MatchReportWidget report={chapter.matchReport} accent={accent} />
    )}
  </>
);

// ─── PAGE VIEW ────────────────────────────────────────────────────────────────
const PageView = ({
  page,
  chapter,
  isFirstPage,
  isLastPage,
  isDarkBg,
  theme,
  // Highlight props
  isSpeaking,
  speechCharIndex,
  speechCharLength,
}: {
  page: string;
  chapter: ChapterMock;
  isFirstPage: boolean;
  isLastPage: boolean;
  isDarkBg: boolean;
  theme: StoryTheme;
  isSpeaking: boolean;
  speechCharIndex: number;
  speechCharLength: number;
}) => {
  const cleanedPage = chapter.dictionaryEntry
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
        {isFirstPage && (
          <Reanimated.View entering={enterPop(60)}>
            <TopWidgets chapter={chapter} accent={theme.accent} />
          </Reanimated.View>
        )}

        <Reanimated.View
          entering={enterRise(120)}
          style={[s.pageCard, { backgroundColor: theme.cardBg }]}
        >
          {/* ── TEXTO COM HIGHLIGHT SINCRONIZADO ── */}
          <HighlightedPageText
            text={cleanedPage}
            charIndex={speechCharIndex}
            charLength={speechCharLength}
            accent={theme.accent}
            isDarkBg={isDarkBg}
            isSpeaking={isSpeaking}
          />
        </Reanimated.View>

        {isLastPage && (
          <Reanimated.View entering={enterPop(200)}>
            <BottomWidgets chapter={chapter} accent={theme.accent} />
          </Reanimated.View>
        )}
      </ScrollView>
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ReadStoryScreen() {
  const router = useRouter();
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const { t, i18n } = useTranslation();

  const id = resolveStoryId(storyId ?? "TAIRBRTY");
  // Fonte canônica (inglês) — fallback garantido para toda história/idioma.
  const enChapters: ChapterMock[] =
    STORY_CHAPTERS[id] ?? STORY_CHAPTERS["TAIRBRTY"];
  // Sobrepõe a tradução do idioma ativo (ou devolve o inglês, se não houver).
  // Memoizado por [id, idioma] — não re-localiza a cada frame do highlight/TTS.
  const chapters: ChapterMock[] = useMemo(
    () => localizeChapters(id, enChapters) as ChapterMock[],
    [id, enChapters, i18n.language],
  );
  const theme = deriveTheme(id, chapters);
  const isDarkBg = parseInt(theme.bg.replace("#", ""), 16) < 0x303030_00 >> 8;

  const [activeChapter, setActiveChapter] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── INTEGRAÇÃO PROGRESSO ────────────────────────────────────────────────────
  // IDs dos capítulos desta história que já foram lidos (para o ✓ nas tabs)
  const [readChapters, setReadChapters] = useState<(string | number)[]>([]);

  // ── Cronômetro de leitura ───────────────────────────────────────────────────
  // Mede o tempo em foco nesta tela e grava no progresso diário, alimentando o
  // gráfico "This week" do Profile. (Pausa sozinho quando o app vai pro background.)
  useReadingTimer();

  // ── TRACKING (analytics local — no-op, sem terceiros) ───────────────────────
  // Evita disparar o mesmo evento várias vezes nesta sessão de tela
  // (ex.: ao reler um capítulo ou voltar página).
  const trackedViewRef = useRef(false);
  const firedChaptersRef = useRef<Set<string>>(new Set());
  const firedStoryRef = useRef(false);

  // ── EXERCÍCIOS: overlay de fim de capítulo (abre 1× por capítulo na sessão) ──
  const [showExercises, setShowExercises] = useState(false);
  const exercisesShownRef = useRef<Set<string>>(new Set());

  // VIEW de conteúdo: dispara uma vez quando o leitor abre esta história.
  useEffect(() => {
    if (trackedViewRef.current) return;
    trackedViewRef.current = true;
    trackContentView({
      contentId: id,
      contentName: id,
      contentType: "story",
    });
  }, [id]);

  // ── Estado do highlight ─────────────────────────────────────────────────────
  // charIndex: offset no texto da palavra atual sendo lida
  // charLength: comprimento da palavra atual
  const [speechCharIndex, setSpeechCharIndex] = useState(0);
  const [speechCharLength, setSpeechCharLength] = useState(0);

  const flatRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const player = useAudioPlayer({ uri: BG_MUSIC_URL });
  const playerStatus = useAudioPlayerStatus(player);

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });

  // ─── INTEGRAÇÃO PROGRESSO: carrega capítulos já lidos ao abrir ────────────
  useEffect(() => {
    let active = true;
    getProgress().then((p) => {
      if (active) setReadChapters(p.chaptersRead[id] ?? []);
    });
    return () => {
      active = false;
    };
  }, [id]);

  // ─── INTEGRAÇÃO PROGRESSO: REGRA DE CAPÍTULO LIDO ─────────────────────────
  // Quando a criança chega na ÚLTIMA página do capítulo, ele conta como lido.
  // markChapterCompleted é idempotente (reler não duplica estrelas) e, quando
  // todos os capítulos forem lidos, marca a história como completa — o que
  // desbloqueia os badges/achievements no Profile.
  useEffect(() => {
    const ch = chapters[activeChapter];
    if (!ch || ch.locked) return;
    if (currentPage === ch.pages.length - 1) {
      markChapterCompleted(id, ch.id, chapters.length).then((p) => {
        setReadChapters(p.chaptersRead[id] ?? []);

        // ── TRACKING: capítulo concluído (1× por capítulo nesta sessão) ──
        const chKey = String(ch.id);
        if (!firedChaptersRef.current.has(chKey)) {
          firedChaptersRef.current.add(chKey);
          trackChapterCompleted({
            storyId: id,
            chapterId: ch.id,
            chapterIndex: activeChapter,
            totalChapters: chapters.length,
          });
        }

        // ── TRACKING: história 100% concluída (1× nesta sessão) ──
        if (!firedStoryRef.current && p.storiesCompleted.includes(id)) {
          firedStoryRef.current = true;
          trackStoryCompleted({
            storyId: id,
            storyName: id,
            totalChapters: chapters.length,
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeChapter]);

  // ── EXERCÍCIOS (premium): quiz no fim do ÚLTIMO capítulo de cada história ──
  // Aparece só pra ASSINANTE (@subscription_status === "active") — que é quem
  // consegue abrir o último capítulo (locked). Effect próprio: NÃO tem o guard
  // `ch.locked` do effect de conclusão, então dispara mesmo no capítulo premium.
  useEffect(() => {
    const ch = chapters[activeChapter];
    if (!ch) return;
    const isLastChapter = activeChapter === chapters.length - 1;
    const atLastPage = currentPage === ch.pages.length - 1;
    if (!isLastChapter || !atLastPage) return;
    if (exercisesShownRef.current.has(id) || !hasStoryExercises(id)) return;

    let alive = true;
    AsyncStorage.getItem("@subscription_status").then((s) => {
      if (alive && s === "active") {
        exercisesShownRef.current.add(id);
        setShowExercises(true);
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeChapter, id]);

  // ─── Para tudo ao trocar página ou capítulo ──────────────────────────────
  useEffect(() => {
    stopAll();
  }, [currentPage, activeChapter]);

  // ─── Cleanup ao sair da tela ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  // ─── Para Speech + música + reseta highlight ─────────────────────────────
  const stopAll = useCallback(() => {
    Speech.stop();
    try {
      player.pause();
      player.seekTo(0);
    } catch (_) {}
    setIsSpeaking(false);
    setSpeechCharIndex(0);
    setSpeechCharLength(0);
  }, [player]);

  // ─── Resolve o texto limpo da página atual ────────────────────────────────
  const getCleanedText = useCallback(
    (chapterIdx: number, pageIdx: number): string => {
      const ch = chapters[chapterIdx];
      const raw = ch.pages[pageIdx];
      return ch.dictionaryEntry ? raw.replace(/^.+?─{5,}\n\n/s, "") : raw;
    },
    [chapters],
  );

  // ─── HANDLER: botão ▶️ / ⏸ ───────────────────────────────────────────────
  const handleSpeech = async () => {
    const status = await AsyncStorage.getItem("@subscription_status");
    if (status !== "active") {
      router.push("/(paywall)");
      return;
    }

    if (isSpeaking) {
      stopAll();
      return;
    }

    const cleanedText = getCleanedText(activeChapter, currentPage);

    // Liga música de fundo
    try {
      player.seekTo(0);
      player.volume = 0.18;
      player.loop = true;
      player.play();
    } catch (_) {}

    // Reseta highlight
    setSpeechCharIndex(0);
    setSpeechCharLength(0);
    setIsSpeaking(true);

    Speech.speak(cleanedText, {
      language: "en-US",
      rate: 0.85,
      pitch: 1.0,

      // ── WORD BOUNDARY CALLBACK ──
      // Chamado em cada palavra pelo engine TTS (iOS e Android)
      // charIndex: posição do caractere no texto
      // charLength: comprimento da palavra (nem sempre disponível no Android)
      onBoundary: (event: { charIndex: number; charLength?: number }) => {
        setSpeechCharIndex(event.charIndex ?? 0);
        // charLength pode ser undefined em alguns devices Android;
        // nesse caso inferimos a partir do próximo espaço
        if (event.charLength != null) {
          setSpeechCharLength(event.charLength);
        } else {
          // Fallback: calcula até o próximo espaço
          const remaining = cleanedText.slice(event.charIndex);
          const nextSpace = remaining.search(/\s/);
          setSpeechCharLength(nextSpace >= 0 ? nextSpace : remaining.length);
        }
      },

      onDone: () => stopAll(),
      onStopped: () => stopAll(),
      onError: () => stopAll(),
    });
  };

  // ─── Chapter switch ───────────────────────────────────────────────────────
  const switchChapter = async (idx: number) => {
    const status = await AsyncStorage.getItem("@subscription_status");
    if (chapters[idx].locked && status !== "active") {
      router.push("/(paywall)");
      return;
    }
    stopAll();
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
    if (currentPage < chapter.pages.length - 1) {
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

  if (!fontsLoaded) return <AppLoading />;

  const chapter = chapters[activeChapter];
  const pages = chapter.pages;
  const isLastPage = currentPage === pages.length - 1;
  const nextChapter = chapters[activeChapter + 1];

  // ── INTEGRAÇÃO PROGRESSO: helper para saber se um capítulo foi lido ──
  const isChapterRead = (chId: string | number) =>
    readChapters.some((c) => String(c) === String(chId));

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      {/* ── HEADER ── */}
      <Reanimated.View entering={enterUp(0)} style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backBtn, { backgroundColor: theme.cardBg }]}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={fredoka(16, theme.accent)}>
            {chapter.emoji} {chapterLabel(t, chapter.title)}
          </Text>
          <Text style={[s.headerSub, isDarkBg && { color: "#638596" }]}>
            {chapter.subtitle} · 📖 {readChapters.length}/{chapters.length}
          </Text>
        </View>

        {/* ── BOTÃO VOZ + MÚSICA ── (pulsa enquanto está narrando) */}
        {isSpeaking ? (
          <Breathe scaleTo={1.12} duration={700}>
            <TouchableOpacity
              onPress={handleSpeech}
              activeOpacity={0.8}
              style={[
                s.speechBtn,
                {
                  backgroundColor: theme.accent,
                  borderColor: theme.accent,
                },
              ]}
            >
              <Text style={{ fontSize: 16 }}>⏸</Text>
            </TouchableOpacity>
          </Breathe>
        ) : (
          <TouchableOpacity
            onPress={handleSpeech}
            activeOpacity={0.8}
            style={[
              s.speechBtn,
              {
                backgroundColor: theme.accentSoft,
                borderColor: theme.accent,
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>▶️</Text>
          </TouchableOpacity>
        )}

        <View style={[s.pageCounter, { backgroundColor: theme.accentSoft }]}>
          <Text style={fredoka(12, theme.accent)}>
            {currentPage + 1}/{pages.length}
          </Text>
        </View>
      </Reanimated.View>

      {/* ── CHAPTER TABS ── */}
      <View style={s.chapterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {chapters.map((ch, i) => (
            <ChapterTab
              key={String(ch.id)}
              chapter={ch}
              active={activeChapter === i}
              read={isChapterRead(ch.id)}
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
              isFirstPage={index === 0}
              isLastPage={index === pages.length - 1}
              isDarkBg={isDarkBg}
              theme={theme}
              // Passa o estado de highlight para a página ativa
              isSpeaking={isSpeaking && index === currentPage}
              speechCharIndex={speechCharIndex}
              speechCharLength={speechCharLength}
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
            ← {t("details.back")}
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
                ? `🔒 ${t("details.nextChapter")}`
                : `${nextChapter.emoji} ${t("details.nextChapter")}`
              : `${t("details.next")} →`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── EXERCÍCIOS DE FIM DE CAPÍTULO (overlay sobre a leitura) ── */}
      {showExercises && (
        <ExerciseSession
          storyId={id}
          exercises={getStoryExercises(id, {
            shuffle: true,
            limit: 8,
            // onlyTrusted: true,  // ← ligue em produção (só conteúdo verificado/curado)
          })}
          theme={{
            accent: theme.accent,
            accentSoft: theme.accentSoft,
            bg: theme.bg,
            cardBg: theme.cardBg,
          }}
          onClose={() => setShowExercises(false)}
        />
      )}
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
    gap: 8,
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
  speechBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  pageCounter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
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
  // ── INTEGRAÇÃO PROGRESSO: badge de capítulo lido ──
  readBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    borderWidth: 2,
    borderColor: "#fff",
  },
  pagesArea: { flex: 1 },
  pageView: { paddingHorizontal: 20, position: "relative", flex: 1 },
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

// ─── HIGHLIGHT STYLES ─────────────────────────────────────────────────────────
const sh = StyleSheet.create({
  wordHighlight: {
    borderRadius: 4,
    textDecorationStyle: "solid",
    fontWeight: "800",
    // paddingHorizontal: 1 — não suportado inline no RN Text nesting, mas o
    // backgroundColor + borderRadius já cria o efeito visual desejado
  },
});

// ─── WIDGET STYLES ────────────────────────────────────────────────────────────
const sw = StyleSheet.create({
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
  dictCard: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 4,
  },
  dictWord: { fontSize: 22, fontFamily: "FredokaOne_400Regular" },
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
  wordCard: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 6,
  },
  wordHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  wordTitle: { fontSize: 24, fontFamily: "FredokaOne_400Regular" },
  wordPos: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    textTransform: "uppercase",
  },
  wordPhonetic: { fontSize: 13, color: "#888", fontStyle: "italic" },
  wordDefinition: { fontSize: 15, color: "#444", lineHeight: 22 },
  wordExample: {
    fontSize: 13,
    color: "#777",
    fontStyle: "italic",
    lineHeight: 20,
  },
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
  missionCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
    backgroundColor: "#F8FAFF",
  },
  missionHeader: { gap: 2 },
  missionCode: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  missionTitle: { fontSize: 16, fontWeight: "700" },
  missionObjective: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  missionCheck: { fontSize: 16, fontWeight: "700", width: 20 },
  missionLabel: { flex: 1, fontSize: 14, lineHeight: 20 },
  feelingCard: {
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  feelingEmoji: { fontSize: 40 },
  feelingEmotion: { fontSize: 18, fontWeight: "800" },
  feelingPrompt: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
  feelingAffirmBox: { borderRadius: 14, padding: 12, width: "100%" },
  feelingAffirm: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  letterCard: {
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FAFAFA",
  },
  letterBig: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  letterBigText: {
    fontSize: 36,
    color: "#fff",
    fontFamily: "FredokaOne_400Regular",
  },
  letterInfo: { flex: 1, gap: 4 },
  letterCharacter: { fontSize: 15, fontWeight: "700" },
  letterWord: { fontSize: 13, color: "#666" },
  letterSound: { fontSize: 12, color: "#888", fontStyle: "italic" },
  diaryDate: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1 },
  diaryDateText: { fontSize: 14, fontWeight: "700", fontStyle: "italic" },
  runeCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  runeSymbol: { fontSize: 42 },
  runeName: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  runeMeaning: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 18,
  },
  verseCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingVertical: 12,
    gap: 4,
  },
  verseLine: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    fontStyle: "italic",
  },
  verseAuthor: { fontSize: 11, fontWeight: "700", marginTop: 8 },
  recipeCard: {
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    gap: 8,
    backgroundColor: "#FFFAF5",
  },
  recipeName: { fontSize: 16, fontWeight: "800" },
  recipeSection: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  recipeIngredient: { fontSize: 13, color: "#555", lineHeight: 20 },
  recipeInstructions: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
    fontStyle: "italic",
  },
  creatureCard: {
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 2,
    padding: 18,
    gap: 8,
    backgroundColor: "#FAFFFE",
  },
  creatureName: { fontSize: 18, fontWeight: "800" },
  creatureRows: { flexDirection: "row", gap: 6 },
  creatureLabel: { fontSize: 12, fontWeight: "700", color: "#888", width: 100 },
  creatureValue: { fontSize: 12, color: "#444", flex: 1 },
  creatureNotes: { borderRadius: 12, padding: 12, marginTop: 4, gap: 4 },
  creatureNotesLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  creatureNotesText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    fontStyle: "italic",
  },
});
