import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Ellipse,
  Line,
  Path,
  Polygon,
  Rect,
} from "react-native-svg";

const { width } = Dimensions.get("window");

// ─── FONT HELPER ─────────────────────────────────────────────────────────────
const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

// ─── SVG ILLUSTRATIONS ────────────────────────────────────────────────────────

/** 🌿 Nature — little tree on grass */
const NatureIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    {/* Sky */}
    <Rect width="64" height="64" rx="32" fill="#D4F5E9" />
    {/* Sun */}
    <Circle cx="50" cy="14" r="8" fill="#FFD93D" />
    {/* Cloud */}
    <Ellipse cx="18" cy="18" rx="9" ry="6" fill="#fff" />
    <Ellipse cx="25" cy="16" rx="7" ry="5" fill="#fff" />
    {/* Grass */}
    <Ellipse cx="32" cy="55" rx="26" ry="8" fill="#5DBB63" />
    {/* Tree trunk */}
    <Rect x="28" y="36" width="8" height="16" rx="3" fill="#8B5E3C" />
    {/* Tree top layers */}
    <Polygon points="32,8 48,38 16,38" fill="#2ECC71" />
    <Polygon points="32,18 46,42 18,42" fill="#27AE60" />
  </Svg>
);

/** 🧚 Fantasy — little unicorn */
const FantasyIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="32" fill="#F9E4F7" />
    {/* Stars */}
    <Circle cx="10" cy="12" r="2" fill="#FF8FD8" />
    <Circle cx="54" cy="18" r="2" fill="#B388FF" />
    <Circle cx="48" cy="8" r="1.5" fill="#FFD93D" />
    {/* Body */}
    <Ellipse cx="34" cy="44" rx="16" ry="12" fill="#fff" />
    {/* Head */}
    <Circle cx="22" cy="32" r="12" fill="#fff" />
    {/* Horn */}
    <Polygon points="22,10 18,26 26,26" fill="#FFD93D" />
    {/* Eye */}
    <Circle cx="18" cy="32" r="2" fill="#2D2D2D" />
    <Circle cx="17" cy="31" r="0.7" fill="#fff" />
    {/* Mane */}
    <Path
      d="M28,22 Q38,18 36,32"
      stroke="#FF8FD8"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M30,26 Q40,22 38,36"
      stroke="#B388FF"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    {/* Legs */}
    <Rect x="22" y="52" width="6" height="10" rx="3" fill="#fff" />
    <Rect x="34" y="52" width="6" height="10" rx="3" fill="#fff" />
    {/* Tail */}
    <Path
      d="M50,44 Q58,36 54,52"
      stroke="#FF8FD8"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

/** 🔬 Science — rocket */
const ScienceIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="32" fill="#D6EAF8" />
    {/* Stars */}
    <Circle cx="12" cy="14" r="1.5" fill="#85C1E9" />
    <Circle cx="52" cy="20" r="1.5" fill="#85C1E9" />
    <Circle cx="44" cy="10" r="1" fill="#fff" />
    <Circle cx="20" cy="24" r="1" fill="#fff" />
    {/* Rocket body */}
    <Rect x="26" y="22" width="12" height="24" rx="4" fill="#ECF0F1" />
    {/* Rocket nose */}
    <Path d="M26,22 Q32,6 38,22 Z" fill="#E74C3C" />
    {/* Window */}
    <Circle cx="32" cy="30" r="5" fill="#85C1E9" />
    <Circle cx="32" cy="30" r="3" fill="#3498DB" />
    {/* Fins */}
    <Path d="M26,38 L18,48 L26,46 Z" fill="#E74C3C" />
    <Path d="M38,38 L46,48 L38,46 Z" fill="#E74C3C" />
    {/* Fire */}
    <Ellipse cx="32" cy="49" rx="4" ry="6" fill="#FFD93D" />
    <Ellipse cx="32" cy="51" rx="2.5" ry="4" fill="#FF6B35" />
  </Svg>
);

/** 🍎 Fruit — cute apple */
const FruitIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="32" fill="#FDEBD0" />
    {/* Leaf */}
    <Path d="M32,14 Q40,8 42,18 Q36,20 32,14 Z" fill="#2ECC71" />
    {/* Stem */}
    <Line
      x1="32"
      y1="14"
      x2="32"
      y2="22"
      stroke="#8B5E3C"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Apple body */}
    <Path
      d="M16,34 Q14,22 26,20 Q32,18 38,20 Q50,22 48,34 Q48,50 32,54 Q16,50 16,34 Z"
      fill="#E74C3C"
    />
    {/* Shine */}
    <Ellipse
      cx="24"
      cy="28"
      rx="4"
      ry="5"
      fill="rgba(255,255,255,0.35)"
      transform="rotate(-20,24,28)"
    />
    {/* Happy face */}
    <Circle cx="26" cy="36" r="2" fill="#2D2D2D" />
    <Circle cx="38" cy="36" r="2" fill="#2D2D2D" />
    <Path
      d="M26,44 Q32,50 38,44"
      stroke="#2D2D2D"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

/** 🐶 Banner — dog face */
const BannerIllustration = ({ size = 130 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 130 140">
    {/* Body */}
    <Ellipse cx="65" cy="110" rx="40" ry="30" fill="#C68642" />
    {/* Head */}
    <Circle cx="65" cy="72" r="38" fill="#D4956A" />
    {/* Ears */}
    <Ellipse
      cx="32"
      cy="60"
      rx="14"
      ry="22"
      fill="#C68642"
      transform="rotate(-10,32,60)"
    />
    <Ellipse
      cx="98"
      cy="60"
      rx="14"
      ry="22"
      fill="#C68642"
      transform="rotate(10,98,60)"
    />
    <Ellipse
      cx="32"
      cy="62"
      rx="8"
      ry="14"
      fill="#E8A87C"
      transform="rotate(-10,32,62)"
    />
    <Ellipse
      cx="98"
      cy="62"
      rx="8"
      ry="14"
      fill="#E8A87C"
      transform="rotate(10,98,62)"
    />
    {/* Snout */}
    <Ellipse cx="65" cy="82" rx="20" ry="15" fill="#E8A87C" />
    {/* Nose */}
    <Ellipse cx="65" cy="75" rx="8" ry="6" fill="#2D2D2D" />
    <Ellipse cx="63" cy="73" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.5)" />
    {/* Eyes */}
    <Circle cx="48" cy="62" r="8" fill="#fff" />
    <Circle cx="82" cy="62" r="8" fill="#fff" />
    <Circle cx="50" cy="63" r="5" fill="#2D2D2D" />
    <Circle cx="84" cy="63" r="5" fill="#2D2D2D" />
    <Circle cx="51" cy="61" r="1.8" fill="#fff" />
    <Circle cx="85" cy="61" r="1.8" fill="#fff" />
    {/* Smile */}
    <Path
      d="M50,90 Q65,102 80,90"
      stroke="#C68642"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Tongue */}
    <Ellipse cx="65" cy="95" rx="8" ry="6" fill="#FF6B8A" />
    {/* Paws */}
    <Ellipse cx="40" cy="130" rx="14" ry="10" fill="#D4956A" />
    <Ellipse cx="90" cy="130" rx="14" ry="10" fill="#D4956A" />
  </Svg>
);

/** Popular book card illustrations */
const BookIllustration1 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" rx="20" fill="#FFE066" />
    <Rect x="20" y="20" width="60" height="60" rx="8" fill="#FF8C42" />
    <Circle cx="50" cy="42" r="12" fill="#fff" />
    <Circle cx="50" cy="42" r="7" fill="#FF8C42" />
    <Rect x="30" y="62" width="40" height="6" rx="3" fill="#fff" />
    <Rect
      x="35"
      y="72"
      width="30"
      height="4"
      rx="2"
      fill="rgba(255,255,255,0.6)"
    />
  </Svg>
);

const BookIllustration2 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" rx="20" fill="#A8EDEA" />
    {/* Ocean waves */}
    <Path
      d="M0,60 Q25,50 50,60 Q75,70 100,60 L100,100 L0,100 Z"
      fill="#00CEC9"
    />
    <Path
      d="M0,70 Q25,62 50,70 Q75,78 100,70 L100,100 L0,100 Z"
      fill="#00B894"
    />
    {/* Boat */}
    <Path d="M30,55 L70,55 L60,65 L40,65 Z" fill="#E17055" />
    <Rect x="47" y="35" width="6" height="20" rx="2" fill="#636e72" />
    <Path d="M53,35 L70,50 L53,50 Z" fill="#FDCB6E" />
    {/* Sun */}
    <Circle cx="78" cy="22" r="10" fill="#FDCB6E" />
  </Svg>
);

const BookIllustration3 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" rx="20" fill="#C3B1E1" />
    {/* Night sky */}
    <Circle cx="20" cy="20" r="3" fill="#fff" />
    <Circle cx="60" cy="15" r="2" fill="#fff" />
    <Circle cx="80" cy="30" r="2.5" fill="#fff" />
    <Circle cx="40" cy="28" r="1.5" fill="#fff" />
    {/* Moon */}
    <Circle cx="75" cy="22" r="12" fill="#FDCB6E" />
    <Circle cx="80" cy="18" r="8" fill="#C3B1E1" />
    {/* Castle */}
    <Rect x="20" y="50" width="60" height="40" fill="#7C5CBF" />
    <Rect x="18" y="42" width="16" height="16" fill="#7C5CBF" />
    <Rect x="66" y="42" width="16" height="16" fill="#7C5CBF" />
    <Rect x="42" y="36" width="16" height="22" fill="#9B59B6" />
    {/* Battlements */}
    <Rect x="18" y="38" width="4" height="6" fill="#7C5CBF" />
    <Rect x="26" y="38" width="4" height="6" fill="#7C5CBF" />
    <Rect x="66" y="38" width="4" height="6" fill="#7C5CBF" />
    <Rect x="74" y="38" width="4" height="6" fill="#7C5CBF" />
    {/* Door */}
    <Path d="M42,90 L42,70 Q50,62 58,70 L58,90 Z" fill="#FDCB6E" />
    {/* Windows */}
    <Circle cx="32" cy="60" r="5" fill="#FDCB6E" />
    <Circle cx="68" cy="60" r="5" fill="#FDCB6E" />
  </Svg>
);

const BookIllustration4 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" rx="20" fill="#B8F0D0" />
    {/* Dino body */}
    <Ellipse cx="52" cy="68" rx="26" ry="20" fill="#2ECC71" />
    {/* Head */}
    <Ellipse cx="30" cy="52" rx="18" ry="16" fill="#27AE60" />
    {/* Spikes */}
    <Polygon points="52,46 56,36 60,46" fill="#27AE60" />
    <Polygon points="62,44 66,34 70,44" fill="#27AE60" />
    <Polygon points="72,48 76,38 80,48" fill="#27AE60" />
    {/* Eye */}
    <Circle cx="24" cy="48" r="5" fill="#fff" />
    <Circle cx="25" cy="49" r="3" fill="#2D2D2D" />
    <Circle cx="25.5" cy="48" r="1" fill="#fff" />
    {/* Smile */}
    <Path
      d="M20,60 Q30,68 40,60"
      stroke="#fff"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Legs */}
    <Rect x="34" y="82" width="10" height="14" rx="5" fill="#27AE60" />
    <Rect x="56" y="82" width="10" height="14" rx="5" fill="#27AE60" />
    {/* Tail */}
    <Path
      d="M78,68 Q96,60 90,80"
      stroke="#2ECC71"
      strokeWidth="10"
      fill="none"
      strokeLinecap="round"
    />
    {/* Stars */}
    <Circle cx="84" cy="18" r="3" fill="#FFD93D" />
    <Circle cx="72" cy="12" r="2" fill="#FFD93D" />
    <Circle cx="90" cy="28" r="2" fill="#FFD93D" />
  </Svg>
);

/** Reading list thumbnails */
const ReadingIllustration1 = ({ size = 70 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 70 70">
    <Rect width="70" height="70" rx="18" fill="#FFF0F5" />
    {/* Open book */}
    <Path
      d="M10,20 Q10,16 35,16 Q60,16 60,20 L60,54 Q35,50 35,50 Q10,54 10,54 Z"
      fill="#FF5B8D"
    />
    <Line x1="35" y1="16" x2="35" y2="54" stroke="#fff" strokeWidth="2" />
    {/* Lines on left page */}
    <Line
      x1="16"
      y1="28"
      x2="30"
      y2="26"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="16"
      y1="34"
      x2="30"
      y2="32"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="16"
      y1="40"
      x2="28"
      y2="38"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Lines on right page */}
    <Line
      x1="40"
      y1="26"
      x2="54"
      y2="28"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="40"
      y1="32"
      x2="54"
      y2="34"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line
      x1="42"
      y1="38"
      x2="54"
      y2="40"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Stars */}
    <Circle cx="20" cy="60" r="3" fill="#FFD93D" />
    <Circle cx="50" cy="60" r="3" fill="#FFD93D" />
    <Circle cx="35" cy="64" r="2" fill="#FFD93D" />
  </Svg>
);

const ReadingIllustration2 = ({ size = 70 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 70 70">
    <Rect width="70" height="70" rx="18" fill="#E8F4FF" />
    {/* Planet */}
    <Circle cx="35" cy="35" r="20" fill="#3498DB" />
    {/* Ring */}
    <Ellipse
      cx="35"
      cy="35"
      rx="30"
      ry="8"
      fill="none"
      stroke="#E67E22"
      strokeWidth="4"
    />
    {/* Continent blobs */}
    <Ellipse cx="28" cy="28" rx="8" ry="6" fill="#2ECC71" />
    <Ellipse cx="44" cy="40" rx="6" ry="5" fill="#2ECC71" />
    {/* Stars */}
    <Circle cx="10" cy="12" r="2" fill="#fff" />
    <Circle cx="58" cy="10" r="2" fill="#fff" />
    <Circle cx="62" cy="55" r="2" fill="#fff" />
    <Circle cx="8" cy="52" r="1.5" fill="#fff" />
    {/* Rocket */}
    <Path d="M54,18 Q58,10 62,18 Z" fill="#E74C3C" />
    <Rect x="54" y="18" width="8" height="12" rx="2" fill="#ECF0F1" />
    <Ellipse cx="58" cy="32" rx="3" ry="4" fill="#FFD93D" />
  </Svg>
);

// ─── DATA ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    type: "nature",
    title: "Nature",
    bg: "#E8F8F5",
    emoji: "🌿",
    Illustration: NatureIllustration,
  },
  {
    type: "fantasy",
    title: "Fantasy",
    bg: "#FDEDEC",
    emoji: "🧚",
    Illustration: FantasyIllustration,
  },
  {
    type: "science",
    title: "Science",
    bg: "#EBF5FB",
    emoji: "🔬",
    Illustration: ScienceIllustration,
  },
  {
    type: "fruit",
    title: "Fruit",
    bg: "#FEF9E7",
    emoji: "🍎",
    Illustration: FruitIllustration,
  },
];

const POPULAR_BOOKS = [
  {
    title: "Tairbrty",
    author: "Burl",
    rating: "5.4",
    bg: "#FFF5B1",
    dotColor: "#FFD32A",
    Illustration: BookIllustration1,
  },
  {
    title: "Sthm sthap",
    author: "Sray Bhar",
    rating: "5.4",
    bg: "#C8F7F5",
    dotColor: "#00CEC9",
    Illustration: BookIllustration2,
  },
  {
    title: "Katuion",
    author: "Statoam",
    rating: "5.4",
    bg: "#D8D8FF",
    dotColor: "#6C5CE7",
    Illustration: BookIllustration3,
  },
  {
    title: "Struck ball",
    author: "Sray Bhar",
    rating: "5.4",
    bg: "#C8FFD4",
    dotColor: "#00B894",
    Illustration: BookIllustration4,
  },
];

const READING_LIST = [
  {
    title: "Kekkihy",
    subtitle: "Long established fact that a reader.",
    rating: "5.4",
    progress: "68%",
    Illustration: ReadingIllustration1,
  },
  {
    title: "Space Adventure",
    subtitle: "Explore the stars and planets.",
    rating: "5.0",
    progress: "100%",
    Illustration: ReadingIllustration2,
  },
];

// ─── BOUNCY CARD ─────────────────────────────────────────────────────────────
const BouncyCard = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const animIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
  const animOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable onPressIn={animIn} onPressOut={animOut} onPress={onPress}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
const SectionHeader = ({
  title,
  emoji,
  linkColor = "#FF5B8D",
}: {
  title: string;
  emoji: string;
  linkColor?: string;
}) => (
  <View style={s.secHdr}>
    <Text style={fredoka(20, "#2D2D2D")}>
      {emoji} {title}
    </Text>
    <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Text style={[s.secLink, { color: linkColor }]}>View all</Text>
    </TouchableOpacity>
  </View>
);

// ─── CATEGORY ITEM ───────────────────────────────────────────────────────────
const CategoryItem = ({
  title,
  bg,
  emoji,
  Illustration,
  type,
}: (typeof CATEGORIES)[0]) => {
  const router = useRouter();

  return (
    <BouncyCard
      style={s.catWrap}
      onPress={() =>
        router.push({
          pathname: "/(category)",
          params: { type: type.toLowerCase(), label: title },
        })
      }
    >
      <View style={[s.catCircle, { backgroundColor: bg }]}>
        <Illustration size={60} />
        <View style={s.catEmojiBadge}>
          <Text style={{ fontSize: 14 }}>{emoji}</Text>
        </View>
      </View>
      <Text style={[fredoka(13, "#2D2D2D"), { marginTop: 6 }]}>{title}</Text>
    </BouncyCard>
  );
};

// ─── POPULAR CARD ─────────────────────────────────────────────────────────────
const PopularCard = ({
  title,
  author,
  rating,
  bg,
  dotColor,
  Illustration,
}: (typeof POPULAR_BOOKS)[0]) => {
  const router = useRouter();

  return (
    <BouncyCard
      onPress={() =>
        router.push({
          pathname: "/(details)",
          params: { storyId: title.toLowerCase().replace(/\s/g, "") },
        })
      }
      style={[s.popCard, { backgroundColor: bg }]}
    >
      <View style={s.heartBtn}>
        <Text style={{ fontSize: 16, color: "#CCC" }}>♡</Text>
      </View>
      <View style={s.popImgWrap}>
        <Illustration size={100} />
        <View style={s.starBadge}>
          <Text style={{ fontSize: 11 }}>⭐</Text>
          <Text style={[fredoka(11, "#2D2D2D"), { marginLeft: 2 }]}>
            {rating}
          </Text>
        </View>
      </View>
      <Text
        style={[fredoka(15, "#2D2D2D"), { textAlign: "center", marginTop: 14 }]}
      >
        {title}
      </Text>
      <Text style={s.popAuthor}>{author}</Text>
      <View style={[s.dot, { backgroundColor: dotColor }]} />
    </BouncyCard>
  );
};

// ─── CONTINUE READING CARD ────────────────────────────────────────────────────
const ReadingCard = ({
  title,
  subtitle,
  rating,
  progress,
  Illustration,
}: (typeof READING_LIST)[0]) => {
  const done = progress === "100%";
  const pct = parseInt(progress, 10);

  const router = useRouter();

  return (
    <BouncyCard
      onPress={() =>
        router.push({
          pathname: "/(details)",
          params: { storyId: title.toLowerCase().replace(/\s/g, "") },
        })
      }
      style={s.readCard}
    >
      <View style={s.readImgWrap}>
        <Illustration size={70} />
        <View style={s.readStar}>
          <Text style={{ fontSize: 10 }}>⭐ {rating}</Text>
        </View>
      </View>
      <View style={s.readBody}>
        <Text style={fredoka(16, "#2D2D2D")}>{title}</Text>
        <Text style={s.readSub}>{subtitle}</Text>
        <View style={s.progBarWrap}>
          <View
            style={[
              s.progBarFill,
              {
                width: `${pct}%` as any,
                backgroundColor: done ? "#FFD93D" : "#FF5B8D",
              },
            ]}
          />
        </View>
      </View>
      <View style={[s.progBadge, done && s.progBadgeDone]}>
        <Text
          style={{
            fontSize: done ? 22 : 13,
            ...(done ? {} : fredoka(13, "#2D2D2D")),
          }}
        >
          {done ? "🏆" : progress}
        </Text>
      </View>
    </BouncyCard>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function LibraryScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  return (
    <View style={s.container}>
      <View style={[s.blob, s.blob1]} />
      <View style={[s.blob, s.blob2]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── HEADER ── */}
        <View style={s.header}>
          <Text style={fredoka(26, "#2D2D2D")}>
            Hi, <Text style={fredoka(26, "#FF5B8D")}>Everyone</Text> 👋
          </Text>
          <Text style={s.headerSub}>Let's learn something new today!</Text>
        </View>

        {/* ── HERO BANNER ── */}
        <BouncyCard style={s.banner}>
          <View style={s.bubble}>
            <Text style={[fredoka(12, "#3E2723"), { textAlign: "center" }]}>
              {"Hi\nFriend!"}
            </Text>
          </View>
          <View style={s.bannerBody}>
            <Text style={fredoka(22, "#fff")}>Noyse Roise</Text>
            <Text style={s.bannerSub}>Burt Cross</Text>
            <TouchableOpacity
              style={s.bannerBtn}
              activeOpacity={0.8}
              onPress={() => router.push("/(stories)")}
            >
              <Text style={fredoka(14, "#fff")}>Explore now</Text>
            </TouchableOpacity>
          </View>
          <View style={s.bannerImg}>
            <BannerIllustration size={130} />
          </View>
        </BouncyCard>

        {/* ── CATEGORIES ── */}
        <SectionHeader title="Category" emoji="✨" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}
        >
          {CATEGORIES.map((item, i) => (
            <CategoryItem key={i} {...item} />
          ))}
        </ScrollView>

        {/* ── POPULAR NOW ── */}
        <SectionHeader title="Popular now" emoji="🔥" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.popRow}
        >
          {POPULAR_BOOKS.map((item, i) => (
            <PopularCard key={i} {...item} />
          ))}
        </ScrollView>

        {/* ── CONTINUE READING ── */}
        <SectionHeader title="Continue reading" emoji="📚" />

        <View style={s.readList}>
          {READING_LIST.map((item, i) => (
            <ReadingCard key={i} {...item} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF9F0", paddingTop: 45 },
  scroll: { padding: 20, paddingBottom: 90 },

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
    top: 260,
    left: -60,
  },

  header: { marginBottom: 24 },
  headerSub: { fontSize: 15, color: "#AAA", fontWeight: "600", marginTop: 4 },

  banner: {
    backgroundColor: "#3E2723",
    borderRadius: 26,
    height: 160,
    flexDirection: "row",
    overflow: "visible",
    marginBottom: 30,
    marginTop: 10,
    position: "relative",
  },
  bubble: {
    position: "absolute",
    top: -22,
    left: "44%",
    backgroundColor: "#FFD93D",
    borderRadius: 16,
    borderBottomLeftRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bannerBody: { flex: 1, padding: 20, justifyContent: "center" },
  bannerSub: {
    color: "#D7CCC8",
    fontSize: 13,
    fontWeight: "600",
    marginVertical: 4,
  },
  bannerBtn: {
    backgroundColor: "#FF5B8D",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginTop: 6,
    shadowColor: "#FF5B8D",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerImg: {
    width: 140,
    height: "110%",
    position: "absolute",
    right: 10,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  secHdr: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 8,
  },
  secLink: { fontSize: 14, fontWeight: "800" },

  catRow: { gap: 18, paddingBottom: 28, paddingTop: 4 },
  catWrap: { alignItems: "center" },
  catCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  catEmojiBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  popRow: { gap: 10, paddingBottom: 28, paddingTop: 4 },
  popCard: {
    width: 150,
    borderRadius: 24,
    padding: 14,
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  popImgWrap: { position: "relative", marginTop: 12 },
  starBadge: {
    position: "absolute",
    bottom: -10,
    right: -10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  popAuthor: { fontSize: 12, color: "#AAA", fontWeight: "600", marginTop: 4 },
  dot: {
    position: "absolute",
    bottom: 14,
    left: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  readList: { gap: 12, paddingBottom: 10 },
  readCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  readImgWrap: { position: "relative" },
  readStar: {
    position: "absolute",
    bottom: -10,
    alignSelf: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  readBody: { flex: 1, gap: 6 },
  readSub: { fontSize: 12, color: "#AAA", fontWeight: "600", lineHeight: 17 },
  progBarWrap: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progBarFill: { height: 6, borderRadius: 10 },
  progBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  progBadgeDone: {
    backgroundColor: "#FFF5B1",
    borderWidth: 2,
    borderColor: "#FFD93D",
  },
});
