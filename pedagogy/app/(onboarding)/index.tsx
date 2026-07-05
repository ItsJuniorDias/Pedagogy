import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
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

import { Breathe, enterPop, enterUp, PressBounce } from "../../shared/motion";

import { useTranslation } from "react-i18next";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackOnboardingCompleted } from "../../lib/analytics";
import { MAX_AGE, MIN_AGE, saveKidProfile } from "../../lib/kidProfile";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Slide data ───────────────────────────────────────────────────────────────

type SlideSlug = "welcome" | "library" | "learning";

type Slide = {
  id: string;
  slug: SlideSlug; // resolve os textos via i18n (onboarding.slides.<slug>.*)
  image: ReturnType<typeof require>;
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

// Fases do fluxo: carrossel informativo → nome → idade → (paywall/tabs)
type Phase = "slides" | "name" | "age";

const AGES = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

// ─── Dot indicator ────────────────────────────────────────────────────────────

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  textAlign: "center",
  ...(color ? { color } : {}),
});

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
        "#FF5B8D",
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

        <Text style={fredoka(30, "#2D2D2D")}>
          {t(`onboarding.slides.${item.slug}.title`)}
        </Text>

        <Text style={styles.description}>
          {t(`onboarding.slides.${item.slug}.description`)}
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Step indicator (fases nome/idade) ───────────────────────────────────────
// Dois pontos indicando "nome" (1) e "idade" (2). Espelha o mesmo vocabulário
// visual dos dots do carrossel para o fluxo parecer contínuo.
function StepDots({ active }: { active: 0 | 1 }) {
  return (
    <View style={styles.dots}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={[styles.dot, i === active && styles.stepDotActive]}
        />
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AppScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });

  const [phase, setPhase] = useState<Phase>("slides");

  // Dados coletados
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const nameInputRef = useRef<TextInput>(null);

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

  // Foca o campo de nome ao entrar na fase (autoFocus é instável junto da
  // transição de fase; focamos manualmente após um tick).
  useEffect(() => {
    if (phase === "name") {
      const id = setTimeout(() => nameInputRef.current?.focus(), 350);
      return () => clearTimeout(id);
    }
  }, [phase]);

  if (!fontsLoaded) return <AppLoading />;

  const isLastSlide = activeIndex === SLIDES.length - 1;
  const trimmedName = name.trim();
  const canContinueName = trimmedName.length > 0;
  const canFinish = canContinueName && age != null && !saving;

  // Botão do carrossel: avança slide ou entra na coleta de dados.
  const handleSlidesButton = () => {
    if (isLastSlide) {
      setPhase("name");
    } else {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  const finishOnboarding = async () => {
    if (!canFinish) return;
    setSaving(true);
    Keyboard.dismiss();

    // Persiste o perfil ANTES de navegar — Paywall/Profile já leem daqui.
    await saveKidProfile({ name: trimmedName, age });

    // ── TRACKING: onboarding concluído ──
    trackOnboardingCompleted();

    const status = await AsyncStorage.getItem("@subscription_status");

    // replace (não push): não queremos o onboarding no histórico de volta.
    if (status === "active") {
      router.replace("/(tabs)");
    } else {
      router.replace("/(paywall)");
    }
  };

  // ── FASE: carrossel informativo ──────────────────────────────────────────
  if (phase === "slides") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />

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

        <Animated.View entering={enterUp(300)} style={styles.bottomArea}>
          <Dots total={SLIDES.length} scrollX={scrollX} />

          <Breathe scaleTo={1.03} duration={1400} style={styles.btnArea}>
            <View style={styles.btnShadow} />
            <PressBounce
              onPress={handleSlidesButton}
              style={styles.btn}
              scaleTo={0.95}
            >
              <Animated.Text
                key={isLastSlide ? "go" : "next"}
                entering={enterPop(0)}
                style={fredoka(20, "#fff")}
              >
                {isLastSlide ? t("onboarding.continue") : t("onboarding.next")}
              </Animated.Text>
            </PressBounce>
          </Breathe>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── FASES: coleta de nome / idade ────────────────────────────────────────
  const onFormBack = () => {
    if (phase === "age") setPhase("name");
    else setPhase("slides");
  };

  const primaryAction = phase === "name" ? () => setPhase("age") : finishOnboarding;
  const primaryEnabled = phase === "name" ? canContinueName : canFinish;
  const primaryLabel =
    phase === "name" ? t("onboarding.continue") : t("onboarding.start");

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.formRoot}>
            {/* Topo: voltar + indicador de passo */}
            <View style={styles.formHeader}>
              <PressBounce style={styles.backBtn} onPress={onFormBack}>
                <Text style={{ fontSize: 20 }}>←</Text>
              </PressBounce>
              <StepDots active={phase === "name" ? 0 : 1} />
              <View style={{ width: 44 }} />
            </View>

            {/* Conteúdo central da fase */}
            {phase === "name" ? (
              <Animated.View
                key="name"
                entering={enterUp(0)}
                style={styles.formBody}
              >
                <Breathe scaleTo={1.06} duration={2600}>
                  <Text style={styles.formEmoji}>🧒</Text>
                </Breathe>
                <Text style={[fredoka(26, "#2D2D2D"), styles.formTitle]}>
                  {t("onboarding.name.title")}
                </Text>
                <Text style={styles.formSubtitle}>
                  {t("onboarding.name.subtitle")}
                </Text>

                <TextInput
                  ref={nameInputRef}
                  value={name}
                  onChangeText={setName}
                  placeholder={t("onboarding.name.placeholder")}
                  placeholderTextColor="#C7C7CF"
                  style={styles.input}
                  maxLength={24}
                  returnKeyType="next"
                  autoCapitalize="words"
                  autoCorrect={false}
                  onSubmitEditing={() => canContinueName && setPhase("age")}
                />
              </Animated.View>
            ) : (
              <Animated.View
                key="age"
                entering={enterUp(0)}
                style={styles.formBody}
              >
                <Breathe scaleTo={1.06} duration={2600}>
                  <Text style={styles.formEmoji}>🎂</Text>
                </Breathe>
                <Text style={[fredoka(26, "#2D2D2D"), styles.formTitle]}>
                  {t("onboarding.age.title")}
                </Text>
                <Text style={styles.formSubtitle}>
                  {trimmedName
                    ? t("onboarding.age.subtitleNamed", { name: trimmedName })
                    : t("onboarding.age.subtitle")}
                </Text>

                <View style={styles.ageGrid}>
                  {AGES.map((n) => {
                    const selected = age === n;
                    return (
                      <PressBounce
                        key={n}
                        scaleTo={0.9}
                        onPress={() => setAge(n)}
                        style={[
                          styles.ageChip,
                          selected && styles.ageChipSelected,
                        ]}
                      >
                        <Text
                          style={fredoka(22, selected ? "#fff" : "#2D2D2D")}
                        >
                          {n}
                        </Text>
                      </PressBounce>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* Botão principal da fase */}
            <View style={styles.bottomArea}>
              <Breathe
                scaleTo={primaryEnabled ? 1.03 : 1}
                duration={1400}
                style={styles.btnArea}
              >
                <View
                  style={[styles.btnShadow, !primaryEnabled && styles.btnShadowOff]}
                />
                <PressBounce
                  onPress={primaryAction}
                  disabled={!primaryEnabled}
                  style={[styles.btn, !primaryEnabled && styles.btnDisabled]}
                  scaleTo={0.95}
                >
                  <Text style={fredoka(20, "#fff")}>{primaryLabel}</Text>
                </PressBounce>
              </Breathe>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, width: "100%" },
  container: {
    flex: 1,
    backgroundColor: "#FFF9F0",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },

  // Blobs
  blob: { position: "absolute", borderRadius: 999 },
  blob1: {
    width: 220,
    height: 220,
    backgroundColor: "#FFE8F0",
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
    backgroundColor: "#FFE8F0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF5B8D",
  },
  description: {
    fontSize: 15,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "600",
  },

  // ─── Form (nome / idade) ───
  formRoot: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
  },
  formHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  formBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  formEmoji: { fontSize: 68, marginBottom: 4 },
  formTitle: { textAlign: "center", lineHeight: 32 },
  formSubtitle: {
    fontSize: 15,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 8,
  },

  // Campo de nome
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFE1EC",
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "ios" ? 18 : 12,
    fontSize: 20,
    fontFamily: "FredokaOne_400Regular",
    color: "#2D2D2D",
    textAlign: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Chips de idade
  ageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 4,
  },
  ageChip: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#EFEFF4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  ageChipSelected: {
    backgroundColor: "#FF7A2F",
    borderColor: "#FF7A2F",
    shadowColor: "#FF7A2F",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
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
  dotActive: { width: 24, backgroundColor: "#FF5B8D" },
  stepDotActive: { width: 24, backgroundColor: "#FF5B8D" },

  // Back button (form)
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  // Button
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
    backgroundColor: "#C0540A",
    borderRadius: 40,
  },
  btnShadowOff: { backgroundColor: "#E3D9CF" },
  btn: {
    width: "100%",
    height: 60,
    backgroundColor: "#FF7A2F",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF7A2F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  btnDisabled: {
    backgroundColor: "#F0C9AE",
    shadowOpacity: 0,
    elevation: 0,
  },
});
