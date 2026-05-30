import React from "react";
import Svg, {
  Circle,
  Ellipse,
  Line,
  Path,
  Polygon,
  Rect,
} from "react-native-svg";

// ─── SVG ILLUSTRATIONS ────────────────────────────────────────────────────────

export const NatureIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="32" fill="#D4F5E9" />
    <Circle cx="50" cy="14" r="8" fill="#FFD93D" />
    <Ellipse cx="18" cy="18" rx="9" ry="6" fill="#fff" />
    <Ellipse cx="25" cy="16" rx="7" ry="5" fill="#fff" />
    <Ellipse cx="32" cy="55" rx="26" ry="8" fill="#5DBB63" />
    <Rect x="28" y="36" width="8" height="16" rx="3" fill="#8B5E3C" />
    <Polygon points="32,8 48,38 16,38" fill="#2ECC71" />
    <Polygon points="32,18 46,42 18,42" fill="#27AE60" />
  </Svg>
);

export const FantasyIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="32" fill="#F9E4F7" />
    <Circle cx="10" cy="12" r="2" fill="#FF8FD8" />
    <Circle cx="54" cy="18" r="2" fill="#B388FF" />
    <Circle cx="48" cy="8" r="1.5" fill="#FFD93D" />
    <Ellipse cx="34" cy="44" rx="16" ry="12" fill="#fff" />
    <Circle cx="22" cy="32" r="12" fill="#fff" />
    <Polygon points="22,10 18,26 26,26" fill="#FFD93D" />
    <Circle cx="18" cy="32" r="2" fill="#2D2D2D" />
    <Circle cx="17" cy="31" r="0.7" fill="#fff" />
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
    <Rect x="22" y="52" width="6" height="10" rx="3" fill="#fff" />
    <Rect x="34" y="52" width="6" height="10" rx="3" fill="#fff" />
    <Path
      d="M50,44 Q58,36 54,52"
      stroke="#FF8FD8"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

export const ScienceIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="32" fill="#D6EAF8" />
    <Circle cx="12" cy="14" r="1.5" fill="#85C1E9" />
    <Circle cx="52" cy="20" r="1.5" fill="#85C1E9" />
    <Circle cx="44" cy="10" r="1" fill="#fff" />
    <Circle cx="20" cy="24" r="1" fill="#fff" />
    <Rect x="26" y="22" width="12" height="24" rx="4" fill="#ECF0F1" />
    <Path d="M26,22 Q32,6 38,22 Z" fill="#E74C3C" />
    <Circle cx="32" cy="30" r="5" fill="#85C1E9" />
    <Circle cx="32" cy="30" r="3" fill="#3498DB" />
    <Path d="M26,38 L18,48 L26,46 Z" fill="#E74C3C" />
    <Path d="M38,38 L46,48 L38,46 Z" fill="#E74C3C" />
    <Ellipse cx="32" cy="49" rx="4" ry="6" fill="#FFD93D" />
    <Ellipse cx="32" cy="51" rx="2.5" ry="4" fill="#FF6B35" />
  </Svg>
);

export const FruitIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="32" fill="#FDEBD0" />
    <Path d="M32,14 Q40,8 42,18 Q36,20 32,14 Z" fill="#2ECC71" />
    <Line
      x1="32"
      y1="14"
      x2="32"
      y2="22"
      stroke="#8B5E3C"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Path
      d="M16,34 Q14,22 26,20 Q32,18 38,20 Q50,22 48,34 Q48,50 32,54 Q16,50 16,34 Z"
      fill="#E74C3C"
    />
    <Ellipse
      cx="24"
      cy="28"
      rx="4"
      ry="5"
      fill="rgba(255,255,255,0.35)"
      transform="rotate(-20,24,28)"
    />
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

export const SpaceIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="32" fill="#1a1a2e" />
    <Circle cx="10" cy="10" r="1.5" fill="#fff" />
    <Circle cx="54" cy="8" r="1" fill="#fff" />
    <Circle cx="58" cy="22" r="1.5" fill="#fff" />
    <Circle cx="8" cy="44" r="1" fill="#fff" />
    <Circle cx="32" cy="32" r="16" fill="#4a90d9" />
    <Ellipse
      cx="32"
      cy="32"
      rx="26"
      ry="7"
      fill="none"
      stroke="#E67E22"
      strokeWidth="3"
    />
    <Ellipse cx="26" cy="26" rx="7" ry="5" fill="#2ECC71" />
    <Ellipse cx="40" cy="36" rx="5" ry="4" fill="#2ECC71" />
    <Circle cx="52" cy="48" r="6" fill="#FFD93D" />
    <Circle cx="55" cy="45" r="4" fill="#1a1a2e" />
  </Svg>
);

export const AnimalsIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Rect width="64" height="64" rx="32" fill="#FFF3E0" />
    <Ellipse cx="32" cy="42" rx="18" ry="14" fill="#FF8C42" />
    <Circle cx="32" cy="26" r="14" fill="#FFA55A" />
    <Ellipse
      cx="20"
      cy="20"
      rx="7"
      ry="10"
      fill="#FF8C42"
      transform="rotate(-15,20,20)"
    />
    <Ellipse
      cx="44"
      cy="20"
      rx="7"
      ry="10"
      fill="#FF8C42"
      transform="rotate(15,44,20)"
    />
    <Circle cx="26" cy="24" r="4" fill="#fff" />
    <Circle cx="38" cy="24" r="4" fill="#fff" />
    <Circle cx="27" cy="25" r="2.5" fill="#333" />
    <Circle cx="39" cy="25" r="2.5" fill="#333" />
    <Circle cx="27.5" cy="24.5" r="0.8" fill="#fff" />
    <Ellipse cx="32" cy="32" rx="8" ry="6" fill="#FF7043" />
    <Ellipse cx="32" cy="30" rx="4" ry="3" fill="#333" />
    <Path
      d="M26,38 Q32,44 38,38"
      stroke="#fff"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

export const BannerIllustration = ({ size = 130 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 130 140">
    <Ellipse cx="65" cy="110" rx="40" ry="30" fill="#C68642" />
    <Circle cx="65" cy="72" r="38" fill="#D4956A" />
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
    <Ellipse cx="65" cy="82" rx="20" ry="15" fill="#E8A87C" />
    <Ellipse cx="65" cy="75" rx="8" ry="6" fill="#2D2D2D" />
    <Ellipse cx="63" cy="73" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.5)" />
    <Circle cx="48" cy="62" r="8" fill="#fff" />
    <Circle cx="82" cy="62" r="8" fill="#fff" />
    <Circle cx="50" cy="63" r="5" fill="#2D2D2D" />
    <Circle cx="84" cy="63" r="5" fill="#2D2D2D" />
    <Circle cx="51" cy="61" r="1.8" fill="#fff" />
    <Circle cx="85" cy="61" r="1.8" fill="#fff" />
    <Path
      d="M50,90 Q65,102 80,90"
      stroke="#C68642"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <Ellipse cx="65" cy="95" rx="8" ry="6" fill="#FF6B8A" />
    <Ellipse cx="40" cy="130" rx="14" ry="10" fill="#D4956A" />
    <Ellipse cx="90" cy="130" rx="14" ry="10" fill="#D4956A" />
  </Svg>
);

export const BookIllustration1 = ({ size = 100 }: { size?: number }) => (
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

export const BookIllustration2 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" rx="20" fill="#A8EDEA" />
    <Path
      d="M0,60 Q25,50 50,60 Q75,70 100,60 L100,100 L0,100 Z"
      fill="#00CEC9"
    />
    <Path
      d="M0,70 Q25,62 50,70 Q75,78 100,70 L100,100 L0,100 Z"
      fill="#00B894"
    />
    <Path d="M30,55 L70,55 L60,65 L40,65 Z" fill="#E17055" />
    <Rect x="47" y="35" width="6" height="20" rx="2" fill="#636e72" />
    <Path d="M53,35 L70,50 L53,50 Z" fill="#FDCB6E" />
    <Circle cx="78" cy="22" r="10" fill="#FDCB6E" />
  </Svg>
);

export const BookIllustration3 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" rx="20" fill="#C3B1E1" />
    <Circle cx="20" cy="20" r="3" fill="#fff" />
    <Circle cx="60" cy="15" r="2" fill="#fff" />
    <Circle cx="80" cy="30" r="2.5" fill="#fff" />
    <Circle cx="40" cy="28" r="1.5" fill="#fff" />
    <Circle cx="75" cy="22" r="12" fill="#FDCB6E" />
    <Circle cx="80" cy="18" r="8" fill="#C3B1E1" />
    <Rect x="20" y="50" width="60" height="40" fill="#7C5CBF" />
    <Rect x="18" y="42" width="16" height="16" fill="#7C5CBF" />
    <Rect x="66" y="42" width="16" height="16" fill="#7C5CBF" />
    <Rect x="42" y="36" width="16" height="22" fill="#9B59B6" />
    <Rect x="18" y="38" width="4" height="6" fill="#7C5CBF" />
    <Rect x="26" y="38" width="4" height="6" fill="#7C5CBF" />
    <Rect x="66" y="38" width="4" height="6" fill="#7C5CBF" />
    <Rect x="74" y="38" width="4" height="6" fill="#7C5CBF" />
    <Path d="M42,90 L42,70 Q50,62 58,70 L58,90 Z" fill="#FDCB6E" />
    <Circle cx="32" cy="60" r="5" fill="#FDCB6E" />
    <Circle cx="68" cy="60" r="5" fill="#FDCB6E" />
  </Svg>
);

export const BookIllustration4 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" rx="20" fill="#B8F0D0" />
    <Ellipse cx="52" cy="68" rx="26" ry="20" fill="#2ECC71" />
    <Ellipse cx="30" cy="52" rx="18" ry="16" fill="#27AE60" />
    <Polygon points="52,46 56,36 60,46" fill="#27AE60" />
    <Polygon points="62,44 66,34 70,44" fill="#27AE60" />
    <Polygon points="72,48 76,38 80,48" fill="#27AE60" />
    <Circle cx="24" cy="48" r="5" fill="#fff" />
    <Circle cx="25" cy="49" r="3" fill="#2D2D2D" />
    <Circle cx="25.5" cy="48" r="1" fill="#fff" />
    <Path
      d="M20,60 Q30,68 40,60"
      stroke="#fff"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <Rect x="34" y="82" width="10" height="14" rx="5" fill="#27AE60" />
    <Rect x="56" y="82" width="10" height="14" rx="5" fill="#27AE60" />
    <Path
      d="M78,68 Q96,60 90,80"
      stroke="#2ECC71"
      strokeWidth="10"
      fill="none"
      strokeLinecap="round"
    />
    <Circle cx="84" cy="18" r="3" fill="#FFD93D" />
    <Circle cx="72" cy="12" r="2" fill="#FFD93D" />
    <Circle cx="90" cy="28" r="2" fill="#FFD93D" />
  </Svg>
);

export const ReadingIllustration1 = ({ size = 70 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 70 70">
    <Rect width="70" height="70" rx="18" fill="#FFF0F5" />
    <Path
      d="M10,20 Q10,16 35,16 Q60,16 60,20 L60,54 Q35,50 35,50 Q10,54 10,54 Z"
      fill="#FF5B8D"
    />
    <Line x1="35" y1="16" x2="35" y2="54" stroke="#fff" strokeWidth="2" />
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
    <Circle cx="20" cy="60" r="3" fill="#FFD93D" />
    <Circle cx="50" cy="60" r="3" fill="#FFD93D" />
    <Circle cx="35" cy="64" r="2" fill="#FFD93D" />
  </Svg>
);

export const ReadingIllustration2 = ({ size = 70 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 70 70">
    <Rect width="70" height="70" rx="18" fill="#E8F4FF" />
    <Circle cx="35" cy="35" r="20" fill="#3498DB" />
    <Ellipse
      cx="35"
      cy="35"
      rx="30"
      ry="8"
      fill="none"
      stroke="#E67E22"
      strokeWidth="4"
    />
    <Ellipse cx="28" cy="28" rx="8" ry="6" fill="#2ECC71" />
    <Ellipse cx="44" cy="40" rx="6" ry="5" fill="#2ECC71" />
    <Circle cx="10" cy="12" r="2" fill="#fff" />
    <Circle cx="58" cy="10" r="2" fill="#fff" />
    <Circle cx="62" cy="55" r="2" fill="#fff" />
    <Circle cx="8" cy="52" r="1.5" fill="#fff" />
    <Path d="M54,18 Q58,10 62,18 Z" fill="#E74C3C" />
    <Rect x="54" y="18" width="8" height="12" rx="2" fill="#ECF0F1" />
    <Ellipse cx="58" cy="32" rx="3" ry="4" fill="#FFD93D" />
  </Svg>
);

// ─── DATA ────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  {
    id: "nature",
    title: "Nature",
    bg: "#E8F8F5",
    emoji: "🌿",
    color: "#2ECC71",
    Illustration: NatureIllustration,
    description:
      "Explore the wonders of the natural world — forests, oceans, animals, and more.",
    bookCount: 24,
  },
  {
    id: "fantasy",
    title: "Fantasy",
    bg: "#FDEDEC",
    emoji: "🧚",
    color: "#FF8FD8",
    Illustration: FantasyIllustration,
    description:
      "Magical worlds full of dragons, fairies, and incredible adventures.",
    bookCount: 31,
  },
  {
    id: "science",
    title: "Science",
    bg: "#EBF5FB",
    emoji: "🔬",
    color: "#3498DB",
    Illustration: ScienceIllustration,
    description:
      "Rockets, planets, chemistry, and the secrets of the universe.",
    bookCount: 18,
  },
  {
    id: "fruit",
    title: "Fruit",
    bg: "#FEF9E7",
    emoji: "🍎",
    color: "#E74C3C",
    Illustration: FruitIllustration,
    description:
      "Fun and colorful stories about fruits, vegetables, and healthy eating.",
    bookCount: 12,
  },
  {
    id: "space",
    title: "Space",
    bg: "#E8EAF6",
    emoji: "🚀",
    color: "#6C5CE7",
    Illustration: SpaceIllustration,
    description: "Journey to the stars and discover galaxies far, far away.",
    bookCount: 20,
  },
  {
    id: "animals",
    title: "Animals",
    bg: "#FFF3E0",
    emoji: "🐶",
    color: "#FF8C42",
    Illustration: AnimalsIllustration,
    description:
      "Stories about your favourite animals and their amazing lives.",
    bookCount: 28,
  },
];

export const POPULAR_BOOKS = [
  {
    id: "tairbrty",
    title: "Tairbrty",
    author: "Burl",
    rating: "5.4",
    bg: "#FFF5B1",
    dotColor: "#FFD32A",
    category: "nature",
    pages: 48,
    age: "4-8",
    synopsis:
      "A little seedling grows into the tallest tree in the forest, making friends along the way. A heartwarming tale about patience and perseverance.",
    Illustration: BookIllustration1,
  },
  {
    id: "sthmSthap",
    title: "Sthm Sthap",
    author: "Sray Bhar",
    rating: "5.4",
    bg: "#C8F7F5",
    dotColor: "#00CEC9",
    category: "fantasy",
    pages: 64,
    age: "5-9",
    synopsis:
      "A brave young sailor sets off across the ocean of dreams, discovering magical islands and making lifelong friends.",
    Illustration: BookIllustration2,
  },
  {
    id: "katuion",
    title: "Katuion",
    author: "Statoam",
    rating: "5.4",
    bg: "#D8D8FF",
    dotColor: "#6C5CE7",
    category: "fantasy",
    pages: 72,
    age: "6-10",
    synopsis:
      "A princess discovers an ancient castle hidden in the moonlit forest. Inside, a centuries-old mystery awaits.",
    Illustration: BookIllustration3,
  },
  {
    id: "struckBall",
    title: "Struck Ball",
    author: "Sray Bhar",
    rating: "5.4",
    bg: "#C8FFD4",
    dotColor: "#00B894",
    category: "science",
    pages: 56,
    age: "4-8",
    synopsis:
      "Dino learns that being different is what makes you special. A fun-filled adventure through prehistoric jungles.",
    Illustration: BookIllustration4,
  },
];

export const READING_LIST = [
  {
    id: "kekkihy",
    title: "Kekkihy",
    subtitle: "Long established fact that a reader.",
    rating: "5.4",
    progress: "68%",
    category: "fantasy",
    pages: 64,
    Illustration: ReadingIllustration1,
  },
  {
    id: "spaceAdventure",
    title: "Space Adventure",
    subtitle: "Explore the stars and planets.",
    rating: "5.0",
    progress: "100%",
    category: "space",
    pages: 80,
    Illustration: ReadingIllustration2,
  },
];

export const ALL_BOOKS = [
  ...POPULAR_BOOKS,
  {
    id: "kekkihy",
    title: "Kekkihy",
    author: "Luna Press",
    rating: "5.4",
    bg: "#FFF0F5",
    dotColor: "#FF5B8D",
    category: "fantasy",
    pages: 64,
    age: "5-9",
    synopsis:
      "A magical journey through an enchanted library where every book comes alive at night.",
    Illustration: ReadingIllustration1,
  },
  {
    id: "spaceAdventure",
    title: "Space Adventure",
    author: "Cosmo Kids",
    rating: "5.0",
    bg: "#E8F4FF",
    dotColor: "#3498DB",
    category: "space",
    pages: 80,
    age: "6-10",
    synopsis:
      "Zoom through the galaxy on a rocket ship and discover planets you never imagined.",
    Illustration: ReadingIllustration2,
  },
];
