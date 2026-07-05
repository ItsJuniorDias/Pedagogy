import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

// ─── CHAVES i18n DE EXIBIÇÃO ──────────────────────────────────────────────────
// Só rótulos visíveis passam por aqui. As chaves de rota/categoria/storage
// (category, title p/ slug e resolveStoryId, id/gameName p/ analytics) continuam
// ESTÁVEIS em inglês no objeto de dados — nunca traduzidas.
type NavKey = "space" | "art" | "toys" | "dinos";
type ChipKey = "all" | "drawing" | "space" | "animals" | "magic" | "music";
type InterestKey = "explore" | "pets" | "space" | "science";
type PathKey = "letters" | "school" | "astronaut" | "space";
type GameKey = "farmGame" | "pingPong" | "pixelRun" | "gravity";
type TagKey = "new" | "top" | "hot";

// ─── PROGRESSO REAL ───────────────────────────────────────────────────────────
// Mesma fonte de verdade do leitor e da tela "Learning Path" (View all).
// Não criamos storage paralelo: lemos o que o leitor já grava (chaptersRead).
import { getProgress } from "../../lib/readingProgress";

// Total REAL de capítulos por trilha (mesmo array usado em
// markChapterCompleted(id, ch.id, chapters.length) no leitor).
// ⚠️ Se o caminho dos mocks for diferente nesta pasta, ajuste o "../../".
import { ASTRONAUT, LETTERS, SCHOLL, SPACE } from "../../mocks/learningMocks";

import { trackGameOpen, trackContentOpen } from "../../lib/analytics";

// Nome da criança (onboarding) para personalizar a saudação.
import { useKidProfile } from "../../lib/kidProfile";

const { width } = Dimensions.get("window");

// ─── ANIMATION HELPERS ───────────────────────────────────────────────────────

// Spring "fofo" padrão do app — bounce sutil, ideal para app infantil
const SPRING = { damping: 14, stiffness: 180, mass: 0.6 };

// Entrada padrão de seções/cards: desliza de baixo com spring + stagger
const enterUp = (delay = 0) =>
  FadeInDown.delay(delay)
    .springify()
    .damping(16)
    .stiffness(160)
    .reduceMotion(ReduceMotion.System);

// Entrada lateral (listas horizontais)
const enterRight = (delay = 0) =>
  FadeInRight.delay(delay)
    .springify()
    .damping(16)
    .stiffness(160)
    .reduceMotion(ReduceMotion.System);

// Transição de layout compartilhada (reordenação suave ao filtrar)
const layoutSpring = LinearTransition.springify()
  .damping(18)
  .stiffness(180)
  .reduceMotion(ReduceMotion.System);

/**
 * Bouncy — wrapper de toque reutilizável.
 * Padrão: scale-down no pressIn + spring de volta no pressOut.
 * Substitui activeOpacity por feedback tátil mais "vivo".
 */
const Bouncy = ({
  children,
  onPress,
  style,
  wrapperStyle,
  scaleTo = 0.93,
  entering,
  layout,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  wrapperStyle?: ViewStyle | ViewStyle[];
  scaleTo?: number;
  entering?: any;
  layout?: any;
}) => {
  const scale = useSharedValue(1);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={entering}
      layout={layout}
      style={[wrapperStyle, aStyle]}
    >
      <Pressable
        style={style}
        onPressIn={() => {
          scale.value = withSpring(scaleTo, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        onPress={onPress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

/** Blob de fundo flutuando em loop infinito (movimento ambiente sutil). */
const FloatingBlob = ({
  style,
  range = 14,
  duration = 4200,
  delay = 0,
}: {
  style: ViewStyle | ViewStyle[];
  range?: number;
  duration?: number;
  delay?: number;
}) => {
  const ty = useSharedValue(0);

  useEffect(() => {
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-range, {
            duration,
            easing: Easing.inOut(Easing.sin),
            reduceMotion: ReduceMotion.System,
          }),
          withTiming(range, {
            duration,
            easing: Easing.inOut(Easing.sin),
            reduceMotion: ReduceMotion.System,
          }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));

  return <Animated.View style={[style, aStyle]} pointerEvents="none" />;
};

// ─── FONT HELPER ─────────────────────────────────────────────────────────────
// ─── WAVE HAND ───────────────────────────────────────────────────────────────
// A mãozinha do "Hi" acena de verdade: gira a partir da base da mão,
// faz tchau duas vezes, descansa e repete.
const WaveHand = () => {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(22, { duration: 160, reduceMotion: ReduceMotion.System }),
          withTiming(-8, { duration: 180, reduceMotion: ReduceMotion.System }),
          withTiming(18, { duration: 160, reduceMotion: ReduceMotion.System }),
          withTiming(0, { duration: 180, reduceMotion: ReduceMotion.System }),
          withDelay(
            2400,
            withTiming(0, { duration: 1, reduceMotion: ReduceMotion.System }),
          ),
        ),
        -1,
        false,
      ),
    );
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));
  return (
    <Animated.Text
      style={[{ fontSize: 24, transformOrigin: "70% 80%" }, aStyle]}
    >
      👋
    </Animated.Text>
  );
};

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

// Resolve o título da trilha para a MESMA chave que o leitor usa no storage.
const resolveStoryId = (raw: string) =>
  raw
    .toLocaleUpperCase()
    .replace(/[\s_\-]/g, "")
    .replace(/Г/g, "G");

// Total real de capítulos por chave resolvida (só as trilhas exibidas na Home).
const CHAPTER_COUNTS: Record<string, number> = {
  LETTERS: LETTERS.length,
  SCHOOL: SCHOLL.length,
  ASTRONAUT: ASTRONAUT.length,
  SPACE: SPACE.length,
};

// ─── DATA ────────────────────────────────────────────────────────────────────

const NAV_ICONS = [
  {
    emoji: "🚀",
    label: "Space",
    bg: "#FFF0F5",
    color: "#FF5B8D",
    category: "space",
  },
  {
    emoji: "🎨",
    label: "Art",
    bg: "#FFF7E0",
    color: "#F5A623",
    category: "art",
  },
  {
    emoji: "🧸",
    label: "Toys",
    bg: "#E8F8F0",
    color: "#27AE60",
    category: "toys",
  },
  {
    emoji: "🦖",
    label: "Dinos",
    bg: "#EBF4FF",
    color: "#3B82F6",
    category: "dinos",
  },
];

// `cat` é a chave ESTÁVEL de filtro (comparada com path.category / game.category)
// e também a chave i18n do rótulo. O texto exibido vem de t(`home.chips.${cat}`).
const CHIPS: { cat: ChipKey }[] = [
  { cat: "all" },
  { cat: "drawing" },
  { cat: "space" },
  { cat: "animals" },
  { cat: "magic" },
  { cat: "music" },
];

const INTERESTS = [
  {
    emoji: "🌿",
    label: "Explore",
    i18nKey: "explore" as InterestKey,
    bg: "#FFF0F8",
    color: "#D63384",
    category: "all",
  },
  {
    emoji: "🐶",
    label: "Pets",
    i18nKey: "pets" as InterestKey,
    bg: "#FFF7E0",
    color: "#B45309",
    category: "animals",
  },
  {
    emoji: "🌍",
    label: "Space",
    i18nKey: "space" as InterestKey,
    bg: "#EBF4FF",
    color: "#1D4ED8",
    category: "space",
  },
  {
    emoji: "🔬",
    label: "Science",
    i18nKey: "science" as InterestKey,
    bg: "#E8F8F0",
    color: "#15803D",
    category: "science",
  },
];

// progress/total aqui são apenas fallback — o valor real vem do storage
// (progress) e do CHAPTER_COUNTS (total).
const LEARNING_PATHS = [
  {
    id: 1,
    emoji: "🔤",
    title: "Letters",
    i18nKey: "letters" as PathKey,
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
    i18nKey: "school" as PathKey,
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
    i18nKey: "astronaut" as PathKey,
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
    i18nKey: "space" as PathKey,
    progress: 2,
    total: 6,
    cardBorder: "#B0C4FF",
    imgBg: "#F0F4FF",
    barColor: "#5C7CFF",
    category: "space",
  },
];

const GAMES = [
  {
    id: "farm-game",
    title: "Farm Game",
    i18nKey: "farmGame" as GameKey,
    tagKey: "new" as TagKey,
    sub: "Manage your farm and harvest crops!",
    tagLabel: "New ✨",
    tagVariant: "emerald",
    tagBg: "#D1FAE5",
    tagColor: "#065F46",
    iconBg: "#FFF7E0",
    canvasBg: "#FFFBEB",
    emoji: "🚜",
    category: "farming",
  },
  {
    id: "ping-pong",
    title: "Ping Pong",
    i18nKey: "pingPong" as GameKey,
    tagKey: "top" as TagKey,
    sub: "Classic ping pong game!",
    tagLabel: "Top ⭐",
    tagVariant: "yellow",
    tagBg: "#FEF3C7",
    tagColor: "#92400E",
    iconBg: "#FFF7E0",
    canvasBg: "#FFFBEB",
    emoji: "🏓",
    category: "sports",
  },
  {
    id: "pixel-run",
    title: "Pixel Run",
    i18nKey: "pixelRun" as GameKey,
    tagKey: "hot" as TagKey,
    sub: "Endless runner in space!",
    tagLabel: "Hot 🔥",
    tagVariant: "amber",
    tagBg: "#FEF3C7",
    tagColor: "#92400E",
    iconBg: "#FFF7E0",
    canvasBg: "#FFFBEB",
    emoji: "👾",
    category: "space",
  },
  {
    id: "gravity",
    title: "Gravity Game",
    i18nKey: "gravity" as GameKey,
    tagKey: "new" as TagKey,
    sub: "Classic gravity game!",
    tagLabel: "New ✨",
    tagVariant: "emerald",
    tagBg: "#D1FAE5",
    tagColor: "#065F46",
    iconBg: "#ECFDF5",
    canvasBg: "#ECFDF5",
    emoji: "🧲",
    category: "science",
  },
];

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const SectionHeader = ({
  title,
  badge,
  linkLabel,
  linkColor = "#6C5CE7",
  onLinkPress,
  delay = 0,
}: {
  title: string;
  badge?: string;
  linkLabel?: string;
  linkColor?: string;
  onLinkPress?: () => void;
  delay?: number;
}) => {
  const { t } = useTranslation();
  return (
    <Animated.View entering={enterUp(delay)} style={s.secHdr}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={[s.secTitle, fredoka(20, "#2D2D2D")]}>{title}</Text>
        {badge && (
          <Animated.View
            entering={ZoomIn.delay(delay + 250)
              .springify()
              .damping(10)
              .reduceMotion(ReduceMotion.System)}
            style={s.newBadge}
          >
            <Text style={s.newBadgeText}>{badge.toUpperCase()}</Text>
          </Animated.View>
        )}
      </View>
      <Bouncy onPress={onLinkPress} scaleTo={0.9}>
        <Text style={[s.secLink, { color: linkColor }]}>
          {linkLabel ?? t("common.seeAll")}
        </Text>
      </Bouncy>
    </Animated.View>
  );
};

/** Barra de progresso animada — preenche com spring após a entrada do card. */
const AnimatedProgressBar = ({
  pct,
  barColor,
  delay = 0,
}: {
  pct: number;
  barColor: string;
  delay?: number;
}) => {
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withDelay(
      delay,
      withTiming(pct, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [pct]);

  const aStyle = useAnimatedStyle(() => ({
    width: `${w.value}%`,
  }));

  return (
    <View style={s.progressWrap}>
      <Animated.View
        style={[s.progressFill, { backgroundColor: barColor }, aStyle]}
      />
    </View>
  );
};

const LearningCard = ({
  emoji,
  title,
  i18nKey,
  progress,
  total,
  cardBorder,
  imgBg,
  barColor,
  index,
}: (typeof LEARNING_PATHS)[0] & { index: number }) => {
  const { t } = useTranslation();
  const pct = total > 0 ? (progress / total) * 100 : 0;
  const done = total > 0 && progress >= total;
  const router = useRouter();

  return (
    <Bouncy
      entering={enterUp(80 * index)}
      layout={layoutSpring}
      scaleTo={0.95}
      wrapperStyle={s.learnCardWrap}
      style={[s.learnCard, { borderColor: cardBorder }]}
      onPress={() => {
        const slug = title.toLowerCase().replace(/\s/g, "");
        // ── TRACKING: história aberta a partir da home ──
        trackContentOpen({
          contentId: slug,
          contentName: title,
          contentType: "story",
          source: "home",
        });
        router.push({
          pathname: "/(details)",
          params: { storyId: slug },
        });
      }}
    >
      <View style={[s.learnImgBox, { backgroundColor: imgBg }]}>
        <Text style={s.learnEmoji}>{emoji}</Text>
      </View>
      <View style={s.learnBody}>
        <Text style={[s.learnTitle, fredoka(16, "#2D2D2D")]}>
          {t(`paths.${i18nKey}`)}
        </Text>
        <AnimatedProgressBar
          pct={pct}
          barColor={barColor}
          delay={300 + 80 * index}
        />
        <Text style={s.progressLabel}>
          {progress} / {total} {t("home.pathDone")} {done ? "🎉" : "⭐"}
        </Text>
      </View>
    </Bouncy>
  );
};

const PopularCard = ({
  id,
  emoji,
  title,
  i18nKey,
  tagKey,
  tagBg,
  tagColor,
  iconBg,
  index,
}: (typeof GAMES)[0] & { index: number }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const redirectGameScreen = () => {
    // ── TRACKING: abertura de jogo a partir da home (gameName estável em EN) ──
    trackGameOpen({ gameId: String(id), gameName: title });
    if (id === "pixel-run") router.push("/(pixel-run)");
    else if (id === "gravity") router.push("/(gravity)");
    else if (id === "farm-game") router.push("/(farm-game)");
    else if (id === "ping-pong") router.push("/(ping-pong)");
  };

  return (
    <Bouncy
      entering={enterUp(70 * index)}
      layout={layoutSpring}
      scaleTo={0.96}
      wrapperStyle={{ marginBottom: 12 }}
      style={s.popCard}
      onPress={redirectGameScreen}
    >
      <View style={[s.popIcon, { backgroundColor: iconBg }]}>
        <Text style={s.popIconEmoji}>{emoji}</Text>
      </View>
      <View style={s.popBody}>
        <Text style={[s.popTitle, fredoka(16, "#2D2D2D")]}>
          {t(`games.${i18nKey}.title`)}
        </Text>
        <Text style={s.popSub}>{t(`games.${i18nKey}.sub`)}</Text>
      </View>
      <View style={[s.popTag, { backgroundColor: tagBg }]}>
        <Text style={[s.popTagText, { color: tagColor }]}>
          {t(`games.tags.${tagKey}`)}
        </Text>
      </View>
    </Bouncy>
  );
};

/** Chip com pulso de escala ao selecionar. */
const Chip = ({
  label,
  active,
  onPress,
  index,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  index: number;
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    // Pulso rápido: cresce e volta com spring
    scale.value = withSequence(
      withTiming(1.12, { duration: 90, reduceMotion: ReduceMotion.System }),
      withSpring(1, SPRING),
    );
    onPress();
  };

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={enterRight(60 * index)} style={aStyle}>
      <Text
        onPress={handlePress}
        style={[
          s.chip,
          s.chipText,
          active && s.chipActive,
          active && s.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t } = useTranslation();
  const { profile: kid } = useKidProfile();
  const [activeChip, setActiveChip] = useState(0);
  // Mapa id_da_trilha -> nº de capítulos lidos (vindo do storage).
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const router = useRouter();

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });

  // Recarrega o progresso sempre que a Home ganha foco (ex.: ao voltar do
  // leitor). Assim as barras da section Learning Path ficam sempre atuais.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProgress().then((p) => {
        if (!active) return;
        const map: Record<number, number> = {};
        for (const path of LEARNING_PATHS) {
          const rid = resolveStoryId(path.title);
          map[path.id] = (p.chaptersRead?.[rid] ?? []).length;
        }
        setProgressMap(map);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  // Loops ambientes do banner (sempre chamar hooks antes do early return)
  const planetRotate = useSharedValue(-10);
  const starsOpacity = useSharedValue(0.25);

  useEffect(() => {
    // Planeta balança suavemente
    planetRotate.value = withRepeat(
      withSequence(
        withTiming(-4, {
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(-16, {
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          reduceMotion: ReduceMotion.System,
        }),
      ),
      -1,
      true,
    );
    // Estrelas piscam ("twinkle")
    starsOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1400, reduceMotion: ReduceMotion.System }),
        withTiming(0.15, { duration: 1400, reduceMotion: ReduceMotion.System }),
      ),
      -1,
      true,
    );
  }, []);

  const planetStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${planetRotate.value}deg` }],
  }));
  const starsStyle = useAnimatedStyle(() => ({
    opacity: starsOpacity.value,
  }));

  if (!fontsLoaded) return <AppLoading />;

  const selectedCategory = CHIPS[activeChip].cat;

  // Enriquecemos cada trilha com progresso REAL (storage) + total REAL (mocks),
  // com clamp pra nunca passar de 100%.
  const enrichedPaths = LEARNING_PATHS.map((p) => {
    const rid = resolveStoryId(p.title);
    const total = CHAPTER_COUNTS[rid] ?? p.total;
    const progress = Math.min(progressMap[p.id] ?? 0, total);
    return { ...p, total, progress };
  });

  const filteredPaths =
    activeChip === 0
      ? enrichedPaths
      : enrichedPaths.filter((p) => p.category === selectedCategory);

  const filteredGames =
    activeChip === 0
      ? GAMES
      : GAMES.filter((g) => g.category === selectedCategory);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F0" />

      {/* Background blobs flutuando em loop */}
      <FloatingBlob style={[s.blob, s.blob1]} range={16} duration={4600} />
      <FloatingBlob
        style={[s.blob, s.blob2]}
        range={12}
        duration={5200}
        delay={400}
      />
      <FloatingBlob
        style={[s.blob, s.blob3]}
        range={10}
        duration={4000}
        delay={800}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── HEADER ── */}
        <Animated.View entering={enterUp(0)} style={s.header}>
          <View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={fredoka(26, "#2D2D2D")}>
                {t("home.greetingHi")}{" "}
                <Text style={fredoka(26, "#FF5B8D")}>
                  {kid?.name || t("home.greetingName")}
                </Text>
              </Text>
              <WaveHand />
            </View>
            <Text style={s.greetSub}>{t("home.greetingSub")}</Text>
          </View>
          <Bouncy
            entering={ZoomIn.delay(200)
              .springify()
              .damping(11)
              .reduceMotion(ReduceMotion.System)}
            scaleTo={0.88}
            style={s.avatar}
            onPress={() => router.push("/(profile)")}
          >
            <Text style={{ fontSize: 30 }}>🐻</Text>
          </Bouncy>
        </Animated.View>

        {/* ── NAV ICON ROW ── entrada escalonada */}
        <View style={s.navRow}>
          {NAV_ICONS.map((item, i) => (
            <Bouncy
              key={item.category}
              entering={enterUp(100 + i * 70)}
              scaleTo={0.9}
              style={[s.navBtn, { backgroundColor: item.bg }]}
              onPress={() =>
                router.push({
                  pathname: "/(category)",
                  params: {
                    type: item.category,
                    label: t(`home.nav.${item.category as NavKey}`),
                  },
                })
              }
            >
              <Text style={s.navEmoji}>{item.emoji}</Text>
              <Text style={[fredoka(11, item.color)]}>
                {t(`home.nav.${item.category as NavKey}`)}
              </Text>
            </Bouncy>
          ))}
        </View>

        {/* ── BANNER ── */}
        <Animated.View entering={enterUp(250)} style={s.banner}>
          <View style={s.bannerContent}>
            <Text
              style={[
                fredoka(24, "#fff"),
                { lineHeight: 30, marginBottom: 14 },
              ]}
            >
              {t("home.banner.title")}
            </Text>
            <Bouncy
              scaleTo={0.92}
              style={s.bannerCta}
              onPress={() => router.push("/(stories)")}
            >
              <Text style={[fredoka(15, "#5A3E00")]}>
                {t("home.banner.cta")}
              </Text>
            </Bouncy>
          </View>
          <Animated.Text style={[s.bannerPlanet, planetStyle]}>
            🪐
          </Animated.Text>
          <Animated.Text style={[s.bannerStars, starsStyle]}>
            ⭐🌟✨
          </Animated.Text>
        </Animated.View>

        {/* ── CATEGORY CHIPS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
        >
          {CHIPS.map((chip, i) => (
            <Chip
              key={chip.cat}
              label={t(`home.chips.${chip.cat}`)}
              index={i}
              active={activeChip === i}
              onPress={() => setActiveChip(i)}
            />
          ))}
        </ScrollView>

        {/* ── YOUR FAVORITES ── */}
        <SectionHeader
          title={t("home.favoritesTitle")}
          delay={350}
          onLinkPress={() =>
            router.push({
              pathname: "/(category)",
              params: { type: "all", label: t("home.favoritesLabel") },
            })
          }
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.interestsRow}
        >
          {INTERESTS.map((item, i) => (
            <Bouncy
              key={item.label}
              entering={enterRight(400 + i * 80)}
              scaleTo={0.9}
              style={[s.intCard, { backgroundColor: item.bg }]}
              onPress={() =>
                router.push({
                  pathname: "/(category)",
                  params: {
                    type: item.category,
                    label: t(`home.interests.${item.i18nKey}`),
                  },
                })
              }
            >
              <Text style={s.intEmoji}>{item.emoji}</Text>
              <Text style={[fredoka(13, item.color)]}>
                {t(`home.interests.${item.i18nKey}`)}
              </Text>
            </Bouncy>
          ))}
        </ScrollView>

        {/* ── LEARNING PATH ── filtro com layout transition ── */}
        <SectionHeader
          title={t("home.learningPathTitle")}
          badge={t("common.new")}
          linkLabel={t("common.viewAll")}
          linkColor="#FF5B8D"
          delay={450}
          onLinkPress={() => router.push("/(learning-all)")}
        />
        <Animated.View layout={layoutSpring} style={s.learnGrid}>
          {filteredPaths.length === 0 ? (
            <Animated.Text
              entering={enterUp()}
              exiting={FadeOut.duration(150)}
              style={s.emptyMsg}
            >
              {t("home.emptyPaths")}
            </Animated.Text>
          ) : (
            filteredPaths.map((item, i) => (
              <LearningCard
                key={`${selectedCategory}-${item.id}`}
                {...item}
                index={i}
              />
            ))
          )}
        </Animated.View>

        {/* ── GAMES ── */}
        <SectionHeader
          title={t("home.gamesTitle")}
          delay={500}
          onLinkPress={() => router.push("/(games-all)")}
        />
        <Animated.View layout={layoutSpring}>
          {filteredGames.length === 0 ? (
            <Animated.Text
              entering={enterUp()}
              exiting={FadeOut.duration(150)}
              style={[s.emptyMsg, { marginBottom: 16 }]}
            >
              {t("home.emptyGames")}
            </Animated.Text>
          ) : (
            filteredGames.map((item, i) => (
              <PopularCard
                key={`${selectedCategory}-${item.id}`}
                {...item}
                index={i}
              />
            ))
          )}
        </Animated.View>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },

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
  },
  bannerStars: {
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 28,
  },

  chipsRow: { paddingBottom: 24, gap: 10 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#EDEDED",
    overflow: "hidden",
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
  learnCardWrap: {
    width: "48%",
    marginBottom: 14,
  },
  learnCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 2.5,
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

  emptyMsg: {
    width: "100%",
    textAlign: "center",
    fontSize: 14,
    color: "#BBB",
    fontWeight: "700",
    marginVertical: 12,
  },
});
