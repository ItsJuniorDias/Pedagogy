import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Breathe, enterPop, enterUp, PressBounce } from "../../shared/motion";

import { fredoka, HIT_SLOP, MIN_TOUCH, Theme } from "@/constants/theme";
import { useTranslation } from "react-i18next";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackOnboardingCompleted } from "../../lib/analytics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Slide data ───────────────────────────────────────────────────────────────

type SlideSlug = "welcome" | "library" | "learning";

type Slide = {
  id: string;
  slug: SlideSlug; // resolve os textos via i18n (onboarding.slides.<slug>.*)
  image: ImageSourcePropType;
};

const SLIDES: Slide[] = [
  {
    id: "1",
    slug: "welcome",
    image: require("../../assets/images/background-onboarding.png"),
  },
  {
    id: "2",
    slug: "library",
    image: require("../../assets/images/background-onboarding.png"),
  },
  {
    id: "3",
    slug: "learning",
    image: require("../../assets/images/background-onboarding.png"),
  },
];

// ─── Dot indicator ────────────────────────────────────────────────────────────

// Variante centralizada do helper de fonte do design system
const fredokaCenter = (size: number, color?: string) =>
  ({ ...fredoka(size, color), textAlign: "center" }) as const;

// Cada dot estica e muda de cor conforme o dedo arrasta o carrossel —
// a transição acompanha o gesto em tempo real, não o "snap" da página.
function Dot({ i, scrollX }: { i: number; scrollX: SharedValue<number> }) {
  const aStyle = useAnimatedStyle(() => {
    const range = [
      (i - 1) * SCREEN_WIDTH,
      i * SCREEN_WIDTH,
      (i + 1) * SCREEN_WIDTH,
    ];
    return {
      width: interpolate(scrollX.value, range, [8, 24, 8], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(scrollX.value, range, [
        "#E0E0E0",
        Theme.colors.primary,
        "#E0E0E0",
      ]),
    };
  });
  return <Animated.View style={[styles.dot, aStyle]} />;
}

function Dots({
  total,
  scrollX,
}: {
  total: number;
  scrollX: SharedValue<number>;
}) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} i={i} scrollX={scrollX} />
      ))}
    </View>
  );
}

// ─── Single slide ─────────────────────────────────────────────────────────────

// Parallax dirigido pelo gesto: a ilustração viaja mais devagar que a
// página (meio scroll), encolhe e gira de leve ao sair; o texto entra
// atrasado vindo de baixo e some em fade. Tudo interpolado do scrollX.
function SlideItem({
  item,
  index,
  scrollX,
}: {
  item: Slide;
  index: number;
  scrollX: SharedValue<number>;
}) {
  const range = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          range,
          [SCREEN_WIDTH * 0.45, 0, -SCREEN_WIDTH * 0.45],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          scrollX.value,
          range,
          [0.55, 1, 0.55],
          Extrapolation.CLAMP,
        ),
      },
      {
        rotate: `${interpolate(
          scrollX.value,
          range,
          [8, 0, -8],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollX.value,
          range,
          [36, 0, 36],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const { t } = useTranslation();

  return (
    <View style={styles.slideItem}>
      <Animated.View style={[styles.imageContainer, imageStyle]}>
        <Image
          source={item.image}
          style={styles.illustration}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.textSection, textStyle]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {t(`onboarding.slides.${item.slug}.badge`)}
          </Text>
        </View>

        <Text style={fredokaCenter(30, Theme.colors.ink)}>
          {t(`onboarding.slides.${item.slug}.title`)}
        </Text>

        <Text style={styles.description}>
          {t(`onboarding.slides.${item.slug}.description`)}
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AppScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  // Posição do scroll compartilhada com a UI thread (parallax + dots)
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const isLastSlide = activeIndex === SLIDES.length - 1;

  // Conclui o onboarding: marca no analytics e segue pro app ou pra paywall.
  const finishOnboarding = async () => {
    // ── TRACKING: onboarding concluído ──
    trackOnboardingCompleted();

    const status = await AsyncStorage.getItem("@subscription_status");

    if (status === "active") {
      router.push("/(tabs)");
    } else {
      router.replace("/(paywall)");
    }
  };

  const handleButtonPress = async () => {
    if (isLastSlide) {
      await finishOnboarding();
    } else {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      {/* Skip — pais com pressa não precisam ver os 3 slides. Some no último,
          onde o CTA principal já assume o papel. */}
      {!isLastSlide && (
        <PressBounce
          style={[styles.skipBtn, { top: insets.top + 12 }]}
          onPress={finishOnboarding}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.skip")}
        >
          <Text style={styles.skipText}>{t("onboarding.skip")}</Text>
        </PressBounce>
      )}

      {/* Carousel com parallax */}
      <Animated.FlatList
        ref={flatListRef as any}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flatList}
      />

      {/* Dots + Button pinned at bottom */}
      <Animated.View entering={enterUp(300)} style={styles.bottomArea}>
        <Dots total={SLIDES.length} scrollX={scrollX} />

        <Breathe scaleTo={1.03} duration={1400} style={styles.btnArea}>
          <View style={styles.btnShadow} />
          <PressBounce
            onPress={handleButtonPress}
            style={styles.btn}
            scaleTo={0.95}
            accessibilityRole="button"
            accessibilityLabel={
              isLastSlide ? t("onboarding.start") : t("onboarding.next")
            }
          >
            <Animated.Text
              key={isLastSlide ? "go" : "next"}
              entering={enterPop(0)}
              style={fredokaCenter(20, Theme.colors.onAccent)}
            >
              {isLastSlide ? t("onboarding.start") : t("onboarding.next")}
            </Animated.Text>
          </PressBounce>
        </Breathe>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bg,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },

  // Blobs
  blob: { position: "absolute", borderRadius: 999 },
  blob1: {
    width: 220,
    height: 220,
    backgroundColor: Theme.colors.primaryTint,
    top: -60,
    right: -60,
  },
  blob2: {
    width: 160,
    height: 160,
    backgroundColor: "#E8F4FF",
    bottom: 140,
    left: -50,
  },

  // Carousel
  flatList: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  slideItem: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },

  // Illustration
  imageContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  illustration: {
    width: "90%",
    height: "85%",
  },

  // Text
  textSection: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  badge: {
    backgroundColor: Theme.colors.primaryTint,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  description: {
    fontSize: 15,
    color: Theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "600",
  },

  // Bottom area
  bottomArea: {
    width: "100%",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 24,
  },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E0E0E0" },

  // Skip
  skipBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    minHeight: MIN_TOUCH,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "800",
    color: Theme.colors.textMuted,
  },

  // Button — rosa da marca (o laranja anterior não existia em nenhuma outra
  // tela) mantendo a sombra 3D deslocada que dá o ar de botão de brinquedo.
  btnArea: {
    width: "85%",
    position: "relative",
  },
  btnShadow: {
    position: "absolute",
    bottom: -6,
    left: 4,
    right: -4,
    height: 60,
    backgroundColor: Theme.colors.primaryDeep,
    borderRadius: 40,
  },
  btn: {
    width: "100%",
    height: 60,
    backgroundColor: Theme.colors.primary,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
});
