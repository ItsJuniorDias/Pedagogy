import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
// Todas as cores/raios/sombras vêm dos tokens. As cores POR CARD (borda da
// trilha, fundo do ícone do jogo…) são conteúdo, não chrome — ficam nos dados.
import {
  fredoka,
  HIT_SLOP,
  MIN_TOUCH,
  Palette,
  Shadow,
  Theme,
} from "@/constants/theme";
import {
  enterRight,
  enterUp,
  FloatY,
  PressBounce,
} from "../../shared/motion";

// ─── CHAVES i18n DE EXIBIÇÃO ──────────────────────────────────────────────────
// Só rótulos visíveis passam por aqui. As chaves de rota/categoria/storage
// (category, title p/ slug e resolveStoryId, id/gameName p/ analytics) continuam
// ESTÁVEIS em inglês no objeto de dados — nunca traduzidas.
type NavKey = "space" | "art" | "toys" | "dinos";
type ChipKey = "all" | "drawing" | "space" | "science" | "sports" | "farming";
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
import { ASTRONAUT, LETTERS, SCHOLL, SPACE } from "../../mocks/learningMocks";

import { trackGameOpen, trackContentOpen } from "../../lib/analytics";

const { width } = Dimensions.get("window");

// ─── ANIMATION HELPERS ───────────────────────────────────────────────────────

// Transição de layout compartilhada (reordenação suave ao filtrar)
const layoutSpring = LinearTransition.springify()
  .damping(18)
  .stiffness(180)
  .reduceMotion(ReduceMotion.System);

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
    bg: Palette.pinkFaint,
    color: Palette.pink,
    category: "space",
  },
  {
    emoji: "🎨",
    label: "Art",
    bg: "#FFF7E0",
    color: "#B45309",
    category: "art",
  },
  {
    emoji: "🧸",
    label: "Toys",
    bg: Palette.greenTint,
    color: "#15803D",
    category: "toys",
  },
  {
    emoji: "🦖",
    label: "Dinos",
    bg: Palette.blueTint,
    color: "#1D4ED8",
    category: "dinos",
  },
];

// `cat` é a chave ESTÁVEL de filtro (comparada com path.category / game.category)
// e também a chave i18n do rótulo. O texto exibido vem de t(`home.chips.${cat}`).
//
// ⚠️ INVARIANTE: toda chip (exceto "all") precisa bater com ≥1 item em
// LEARNING_PATHS ou GAMES. As antigas "animals"/"magic"/"music" filtravam
// para o vazio nas DUAS seções — a criança tocava e a tela inteira sumia.
const CHIPS: { cat: ChipKey }[] = [
  { cat: "all" },
  { cat: "space" },
  { cat: "drawing" },
  { cat: "science" },
  { cat: "sports" },
  { cat: "farming" },
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
    bg: Palette.blueTint,
    color: "#1D4ED8",
    category: "space",
  },
  {
    emoji: "🔬",
    label: "Science",
    i18nKey: "science" as InterestKey,
    bg: Palette.greenTint,
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
    barColor: "#FFB13D",
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
  onLinkPress,
  delay = 0,
}: {
  title: string;
  badge?: string;
  linkLabel?: string;
  onLinkPress?: () => void;
  delay?: number;
}) => {
  const { t } = useTranslation();
  return (
    <Animated.View entering={enterUp(delay)} style={s.secHdr}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={fredoka(20, Theme.colors.ink)}>{title}</Text>
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
      {/* Link "ver tudo": mesma cor primária em TODAS as seções (antes
          alternava roxo/rosa sem critério) + alvo de toque ≥44pt. */}
      <PressBounce
        onPress={onLinkPress}
        scaleTo={0.9}
        hitSlop={HIT_SLOP}
        style={s.secLinkBtn}
        accessibilityRole="button"
      >
        <Text style={s.secLink}>{linkLabel ?? t("common.seeAll")}</Text>
      </PressBounce>
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
    <PressBounce
      entering={enterUp(80 * index)}
      layout={layoutSpring}
      scaleTo={0.95}
      style={[s.learnCard, { borderColor: cardBorder }]}
      accessibilityRole="button"
      accessibilityLabel={t(`paths.${i18nKey}`)}
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
        <Text style={fredoka(16, Theme.colors.ink)} numberOfLines={1}>
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
    </PressBounce>
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
    <PressBounce
      entering={enterUp(70 * index)}
      layout={layoutSpring}
      scaleTo={0.96}
      style={[s.popCard, { marginBottom: Theme.space.md }]}
      onPress={redirectGameScreen}
      accessibilityRole="button"
      accessibilityLabel={t(`games.${i18nKey}.title`)}
    >
      <View style={[s.popIcon, { backgroundColor: iconBg }]}>
        <Text style={s.popIconEmoji}>{emoji}</Text>
      </View>
      <View style={s.popBody}>
        <Text style={fredoka(16, Theme.colors.ink)}>
          {t(`games.${i18nKey}.title`)}
        </Text>
        <Text style={s.popSub} numberOfLines={1}>
          {t(`games.${i18nKey}.sub`)}
        </Text>
      </View>
      <View style={[s.popTag, { backgroundColor: tagBg }]}>
        <Text style={[s.popTagText, { color: tagColor }]}>
          {t(`games.tags.${tagKey}`)}
        </Text>
      </View>
    </PressBounce>
  );
};

/** Chip com pulso de escala ao selecionar.
 *  Antes era um <Text onPress> — alvo minúsculo e invisível para leitores de
 *  tela. Agora é Pressable de verdade, com ≥44pt de altura efetiva, role de
 *  botão e estado "selecionado" exposto. */
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
      withSpring(1, { damping: 14, stiffness: 180, mass: 0.6 }),
    );
    onPress();
  };

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={enterRight(60 * index)} style={aStyle}>
      <PressBounce
        onPress={handlePress}
        scaleTo={0.92}
        hitSlop={HIT_SLOP}
        style={[s.chip, active && s.chipActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
      </PressBounce>
    </Animated.View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeChip, setActiveChip] = useState(0);
  // Mapa id_da_trilha -> nº de capítulos lidos (vindo do storage).
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const router = useRouter();

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

  // Loops ambientes do banner
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
    <View style={[s.container, { paddingTop: insets.top + Theme.space.xs }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.bg} />

      {/* Background blobs flutuando em loop */}
      <FloatY style={[s.blob, s.blob1]} distance={16} duration={4600}>
        <View />
      </FloatY>
      <FloatY style={[s.blob, s.blob2]} distance={12} duration={5200} delay={400}>
        <View />
      </FloatY>
      <FloatY style={[s.blob, s.blob3]} distance={10} duration={4000} delay={800}>
        <View />
      </FloatY>

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
              <Text style={fredoka(26, Theme.colors.ink)}>
                {t("home.greetingHi")}{" "}
                <Text style={fredoka(26, Theme.colors.primary)}>
                  {t("home.greetingName")}
                </Text>
              </Text>
              <WaveHand />
            </View>
            <Text style={s.greetSub}>{t("home.greetingSub")}</Text>
          </View>
          <PressBounce
            entering={ZoomIn.delay(200)
              .springify()
              .damping(11)
              .reduceMotion(ReduceMotion.System)}
            scaleTo={0.88}
            style={s.avatar}
            onPress={() => router.push("/(profile)")}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={t("profile.title")}
          >
            <Text style={{ fontSize: 30 }}>🐻</Text>
          </PressBounce>
        </Animated.View>

        {/* ── NAV ICON ROW ── entrada escalonada */}
        <View style={s.navRow}>
          {NAV_ICONS.map((item, i) => (
            <PressBounce
              key={item.category}
              entering={enterUp(100 + i * 70)}
              scaleTo={0.9}
              style={[s.navBtn, { backgroundColor: item.bg }]}
              accessibilityRole="button"
              accessibilityLabel={t(`home.nav.${item.category as NavKey}`)}
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
              <Text style={fredoka(11, item.color)}>
                {t(`home.nav.${item.category as NavKey}`)}
              </Text>
            </PressBounce>
          ))}
        </View>

        {/* ── BANNER ── */}
        <Animated.View entering={enterUp(250)} style={s.banner}>
          <View style={s.bannerContent}>
            <Text
              style={[
                fredoka(24, Theme.colors.onAccent),
                { lineHeight: 30, marginBottom: 14 },
              ]}
            >
              {t("home.banner.title")}
            </Text>
            <PressBounce
              scaleTo={0.92}
              style={s.bannerCta}
              onPress={() => router.push("/(stories)")}
              accessibilityRole="button"
              accessibilityLabel={t("home.banner.cta")}
            >
              <Text style={fredoka(15, "#5A3E00")}>
                {t("home.banner.cta")}
              </Text>
            </PressBounce>
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
            <PressBounce
              key={item.label}
              entering={enterRight(400 + i * 80)}
              scaleTo={0.9}
              style={[s.intCard, { backgroundColor: item.bg }]}
              accessibilityRole="button"
              accessibilityLabel={t(`home.interests.${item.i18nKey}`)}
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
              <Text style={fredoka(13, item.color)}>
                {t(`home.interests.${item.i18nKey}`)}
              </Text>
            </PressBounce>
          ))}
        </ScrollView>

        {/* ── LEARNING PATH ── filtro com layout transition ── */}
        <SectionHeader
          title={t("home.learningPathTitle")}
          badge={t("common.new")}
          linkLabel={t("common.viewAll")}
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
              <View key={`${selectedCategory}-${item.id}`} style={s.learnCardWrap}>
                <LearningCard {...item} index={i} />
              </View>
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
              style={[s.emptyMsg, { marginBottom: Theme.space.lg }]}
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
    backgroundColor: Theme.colors.bg,
  },
  scroll: { paddingHorizontal: Theme.space.xl, paddingBottom: 120 },

  blob: {
    position: "absolute",
    borderRadius: Theme.radius.pill,
    pointerEvents: "none",
  },
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
    marginBottom: Theme.space.xxl,
    marginTop: Theme.space.sm,
  },
  greetSub: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontWeight: "600",
    marginTop: 4,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Theme.colors.highlight,
    borderWidth: 4,
    borderColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.glowHighlight,
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Theme.space.xxl,
  },
  navBtn: {
    width: (width - 56) / 4,
    height: 64,
    borderRadius: Theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navEmoji: { fontSize: 24 },

  banner: {
    height: 165,
    borderRadius: Theme.radius.xxl,
    backgroundColor: Theme.colors.accent,
    marginBottom: Theme.space.xxl,
    overflow: "hidden",
    justifyContent: "center",
  },
  bannerContent: { padding: 22, zIndex: 1 },
  bannerCta: {
    alignSelf: "flex-start",
    backgroundColor: Theme.colors.highlight,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: Theme.radius.pill,
    minHeight: MIN_TOUCH,
    justifyContent: "center",
    shadowColor: Palette.yellow,
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

  chipsRow: { paddingBottom: Theme.space.xxl, gap: 10 },
  chip: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: Theme.space.xl,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "800",
    color: Theme.colors.textMuted,
  },
  chipTextActive: { color: Theme.colors.onAccent },

  secHdr: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.space.md,
    marginTop: Theme.space.xs,
  },
  secLinkBtn: {
    minHeight: MIN_TOUCH,
    justifyContent: "center",
    paddingHorizontal: Theme.space.xs,
  },
  secLink: {
    fontSize: 13,
    fontWeight: "800",
    color: Theme.colors.primary,
  },
  newBadge: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  newBadgeText: {
    color: Theme.colors.onAccent,
    fontSize: 10,
    fontWeight: "900",
  },

  interestsRow: { paddingBottom: 28, gap: 12 },
  intCard: {
    width: 110,
    borderRadius: Theme.radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  intEmoji: { fontSize: 36, marginBottom: 8 },

  learnGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: Theme.space.sm,
  },
  learnCardWrap: {
    width: "48%",
    marginBottom: Theme.space.md,
  },
  learnCard: {
    width: "100%",
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.xl,
    borderWidth: 2.5,
    overflow: "hidden",
    ...Shadow.card,
  },
  learnImgBox: { height: 100, alignItems: "center", justifyContent: "center" },
  learnEmoji: { fontSize: 52 },
  learnBody: {
    paddingHorizontal: Theme.space.md,
    paddingVertical: Theme.space.md,
  },
  progressWrap: {
    height: 7,
    backgroundColor: Theme.colors.track,
    borderRadius: 10,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: { height: 7, borderRadius: 10 },
  progressLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.colors.textFaint,
    marginTop: 4,
  },

  popCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.xl,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...Shadow.card,
  },
  popIcon: {
    width: 64,
    height: 64,
    borderRadius: Theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  popIconEmoji: { fontSize: 34 },
  popBody: { flex: 1 },
  popSub: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.colors.textFaint,
    marginTop: 2,
  },
  popTag: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Theme.radius.sm,
  },
  popTagText: { fontSize: 11, fontWeight: "900" },

  emptyMsg: {
    width: "100%",
    textAlign: "center",
    fontSize: 14,
    color: Theme.colors.textFaint,
    fontWeight: "700",
    marginVertical: Theme.space.md,
  },
});
