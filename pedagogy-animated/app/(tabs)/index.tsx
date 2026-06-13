import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
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
      <Animated.View
        style={style}
        onTouchStart={() => {
          scale.value = withSpring(scaleTo, SPRING);
        }}
        onTouchEnd={() => {
          scale.value = withSpring(1, SPRING);
          onPress?.();
        }}
        onTouchCancel={() => {
          scale.value = withSpring(1, SPRING);
        }}
      >
        {children}
      </Animated.View>
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

const CHIPS = ["All", "Drawing", "Space", "Animals", "Magic", "Music"];

const INTERESTS = [
  {
    emoji: "🌿",
    label: "Explore",
    bg: "#FFF0F8",
    color: "#D63384",
    category: "all",
  },
  {
    emoji: "🐶",
    label: "Pets",
    bg: "#FFF7E0",
    color: "#B45309",
    category: "animals",
  },
  {
    emoji: "🌍",
    label: "Space",
    bg: "#EBF4FF",
    color: "#1D4ED8",
    category: "space",
  },
  {
    emoji: "🔬",
    label: "Science",
    bg: "#E8F8F0",
    color: "#15803D",
    category: "science",
  },
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
];

const GAMES = [
  {
    id: "farm-game",
    title: "Farm Game",
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
  linkLabel = "See all",
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
}) => (
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
      <Text style={[s.secLink, { color: linkColor }]}>{linkLabel}</Text>
    </Bouncy>
  </Animated.View>
);

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
  progress,
  total,
  cardBorder,
  imgBg,
  barColor,
  index,
}: (typeof LEARNING_PATHS)[0] & { index: number }) => {
  const pct = (progress / total) * 100;
  const done = progress === total;
  const router = useRouter();

  return (
    <Bouncy
      entering={enterUp(80 * index)}
      layout={layoutSpring}
      scaleTo={0.95}
      wrapperStyle={s.learnCardWrap}
      style={[s.learnCard, { borderColor: cardBorder }]}
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
        <AnimatedProgressBar
          pct={pct}
          barColor={barColor}
          delay={300 + 80 * index}
        />
        <Text style={s.progressLabel}>
          {progress} / {total} done {done ? "🎉" : "⭐"}
        </Text>
      </View>
    </Bouncy>
  );
};

const PopularCard = ({
  id,
  emoji,
  title,
  sub,
  tagLabel,
  tagBg,
  tagColor,
  iconBg,
  index,
}: (typeof GAMES)[0] & { index: number }) => {
  const router = useRouter();

  const redirectGameScreen = () => {
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
        <Text style={[s.popTitle, fredoka(16, "#2D2D2D")]}>{title}</Text>
        <Text style={s.popSub}>{sub}</Text>
      </View>
      <View style={[s.popTag, { backgroundColor: tagBg }]}>
        <Text style={[s.popTagText, { color: tagColor }]}>{tagLabel}</Text>
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
  const [activeChip, setActiveChip] = useState(0);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });

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

  const selectedCategory = CHIPS[activeChip].toLowerCase();

  const filteredPaths =
    activeChip === 0
      ? LEARNING_PATHS
      : LEARNING_PATHS.filter((p) => p.category === selectedCategory);

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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={fredoka(26, "#2D2D2D")}>
                Hi, <Text style={fredoka(26, "#FF5B8D")}>Everyone</Text>
              </Text>
              <WaveHand />
            </View>
            <Text style={s.greetSub}>Let's learn something cool today ✨</Text>
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
                  params: { type: item.category, label: item.label },
                })
              }
            >
              <Text style={s.navEmoji}>{item.emoji}</Text>
              <Text style={[fredoka(11, item.color)]}>{item.label}</Text>
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
              {"Magic World\nof Stories"}
            </Text>
            <Bouncy
              scaleTo={0.92}
              style={s.bannerCta}
              onPress={() => router.push("/(stories)")}
            >
              <Text style={[fredoka(15, "#5A3E00")]}>🔍 Explore Now!</Text>
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
              key={chip}
              label={chip}
              index={i}
              active={activeChip === i}
              onPress={() => setActiveChip(i)}
            />
          ))}
        </ScrollView>

        {/* ── YOUR FAVORITES ── */}
        <SectionHeader
          title="Your Favorites 🌟"
          delay={350}
          onLinkPress={() =>
            router.push({
              pathname: "/(category)",
              params: { type: "all", label: "Favorites" },
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
                  params: { type: item.category, label: item.label },
                })
              }
            >
              <Text style={s.intEmoji}>{item.emoji}</Text>
              <Text style={[fredoka(13, item.color)]}>{item.label}</Text>
            </Bouncy>
          ))}
        </ScrollView>

        {/* ── LEARNING PATH ── filtro com layout transition ── */}
        <SectionHeader
          title="Learning Path"
          badge="New"
          linkLabel="View all"
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
              No paths for this category yet 🌱
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
          title="Games 🎮"
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
              No games for this category yet 🎯
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
