import { initializePurchases } from "@/service/purchasesService";
import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Slide data ───────────────────────────────────────────────────────────────

type Slide = {
  id: string;
  badge: string;
  title: string;
  description: string;
  image: ReturnType<typeof require>;
  buttonLabel: string;
};

const SLIDES: Slide[] = [
  {
    id: "1",
    badge: "Welcome to Pedagogy",
    title: "Stories that teach\nand delight",
    description:
      "Pedagogy is a children's story app with educational content, designed to develop kids aged 2–10 in a playful and engaging way.",
    image: require("../../assets/images/background-onboarding.png"),
    buttonLabel: "Next",
  },
  {
    id: "2",
    badge: "Infinite library",
    title: "Hundreds of stories\nto explore",
    description:
      "Fables, adventures, science and more. New content every month, with audio narration and colourful illustrations.",
    image: require("../../assets/images/background-onboarding.png"),
    buttonLabel: "Next",
  },
  {
    id: "3",
    badge: "Real learning",
    title: "Track your child's\nprogress",
    description:
      "Quizzes, achievements and reading reports for parents. Teaching has never been this fun and easy to follow.",
    image: require("../../assets/images/background-onboarding.png"),
    buttonLabel: "Let's go 👍",
  },
];

// ─── Dot indicator ────────────────────────────────────────────────────────────

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

function Dots({ total, activeIndex }: { total: number; activeIndex: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex && styles.dotActive]}
        />
      ))}
    </View>
  );
}

// ─── Single slide ─────────────────────────────────────────────────────────────

function SlideItem({ item }: { item: Slide }) {
  return (
    <View style={styles.slideItem}>
      <View style={styles.imageContainer}>
        <Image
          source={item.image}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>

        <Text style={fredoka(30, "#2D2D2D")}>{item.title}</Text>

        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AppScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  // useEffect(() => {
  //   const removeSubscriptionStatus = async () => {
  //     await AsyncStorage.removeItem("@subscription_status");
  //   };

  //   removeSubscriptionStatus();
  // }, []);

  // Inicializa RevenueCat uma única vez (sem buscar offerings aqui)
  useEffect(() => {
    initializePurchases();
  }, []);

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

  if (!fontsLoaded) return <AppLoading />;

  const isLastSlide = activeIndex === SLIDES.length - 1;

  const handleButtonPress = () => {
    if (isLastSlide) {
      router.push("/(tabs)");
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

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SlideItem item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flatList}
      />

      {/* Dots + Button pinned at bottom */}
      <View style={styles.bottomArea}>
        <Dots total={SLIDES.length} activeIndex={activeIndex} />

        <View style={styles.btnArea}>
          <View style={styles.btnShadow} />
          <TouchableOpacity
            onPress={handleButtonPress}
            style={styles.btn}
            activeOpacity={0.85}
          >
            <Text style={fredoka(20, "#fff")}>
              {isLastSlide ? "Let's go 👍" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
});
