import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import {
  Breathe,
  enterPop,
  enterRight,
  enterUp,
  FloatY,
  PressBounce,
  Swing,
} from "../../shared/motion";

const { width } = Dimensions.get("window");

// Mantém a splash visível enquanto a fonte carrega (substitui o expo-app-loading, descontinuado)
SplashScreen.preventAutoHideAsync();

// ─── FONT HELPER ─────────────────────────────────────────────────────────────
const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

// ─── SVG PRIMITIVES (reutilizáveis) ──────────────────────────────────────────

/** Estrelinha de 4 pontas — usada como brilho em várias ilustrações */
const Sparkle = ({
  cx,
  cy,
  r,
  fill = "#FFD93D",
}: {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
}) => (
  <Path
    d={`M${cx},${cy - r} Q${cx + r * 0.22},${cy - r * 0.22} ${cx + r},${cy} Q${
      cx + r * 0.22
    },${cy + r * 0.22} ${cx},${cy + r} Q${cx - r * 0.22},${
      cy + r * 0.22
    } ${cx - r},${cy} Q${cx - r * 0.22},${cy - r * 0.22} ${cx},${cy - r} Z`}
    fill={fill}
  />
);

/** Bochecha rosada — dá vida aos personagens */
const Blush = ({ cx, cy, r = 3 }: { cx: number; cy: number; r?: number }) => (
  <Ellipse cx={cx} cy={cy} rx={r} ry={r * 0.7} fill="rgba(255,107,138,0.45)" />
);

// ─── SVG ILLUSTRATIONS ────────────────────────────────────────────────────────

/** 🌿 Nature — arvorezinha fofa em colina ensolarada */
const NatureIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="natSky" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#BDEFFF" />
        <Stop offset="1" stopColor="#E2FBEF" />
      </LinearGradient>
      <LinearGradient id="natHill" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#7ED98A" />
        <Stop offset="1" stopColor="#4CAF50" />
      </LinearGradient>
      <RadialGradient id="natSun" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0" stopColor="#FFE680" />
        <Stop offset="1" stopColor="#FFD93D" />
      </RadialGradient>
    </Defs>
    <Rect width="64" height="64" rx="32" fill="url(#natSky)" />
    {/* Sol com raios */}
    <Circle cx="49" cy="14" r="7" fill="url(#natSun)" />
    <Circle
      cx="49"
      cy="14"
      r="9.5"
      fill="none"
      stroke="rgba(255,217,61,0.4)"
      strokeWidth="2"
    />
    {/* Nuvem fofa */}
    <G fill="#fff" opacity={0.95}>
      <Ellipse cx="16" cy="18" rx="8" ry="5" />
      <Ellipse cx="22" cy="15" rx="6" ry="4.5" />
      <Ellipse cx="26" cy="18.5" rx="5" ry="3.5" />
    </G>
    {/* Colina */}
    <Path d="M0,52 Q32,40 64,52 L64,64 L0,64 Z" fill="url(#natHill)" />
    {/* Tronco */}
    <Path d="M29,34 Q28,46 27,50 L37,50 Q36,46 35,34 Z" fill="#8B5E3C" />
    {/* Copa em blobs arredondados */}
    <Circle cx="25" cy="28" r="9" fill="#2ECC71" />
    <Circle cx="39" cy="28" r="9" fill="#2ECC71" />
    <Circle cx="32" cy="18" r="10" fill="#3DDC84" />
    <Circle cx="32" cy="28" r="10" fill="#35C975" />
    {/* Brilho na copa */}
    <Circle cx="28" cy="16" r="3" fill="rgba(255,255,255,0.35)" />
    {/* Frutinhas */}
    <Circle cx="26" cy="25" r="1.8" fill="#FF6B8A" />
    <Circle cx="38" cy="23" r="1.8" fill="#FF6B8A" />
    <Circle cx="33" cy="31" r="1.8" fill="#FFD93D" />
    {/* Florzinhas na grama */}
    <Circle cx="14" cy="55" r="2" fill="#FF8FD8" />
    <Circle cx="14" cy="55" r="0.8" fill="#FFD93D" />
    <Circle cx="50" cy="56" r="2" fill="#fff" />
    <Circle cx="50" cy="56" r="0.8" fill="#FFD93D" />
  </Svg>
);

/** 🧚 Fantasy — unicórnio com crina arco-íris */
const FantasyIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="fanBg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#E8D5FF" />
        <Stop offset="1" stopColor="#FDE7FB" />
      </LinearGradient>
      <LinearGradient id="fanHorn" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFE680" />
        <Stop offset="1" stopColor="#FFB13D" />
      </LinearGradient>
    </Defs>
    <Rect width="64" height="64" rx="32" fill="url(#fanBg)" />
    {/* Brilhos */}
    <Sparkle cx={10} cy={13} r={4} fill="#FF8FD8" />
    <Sparkle cx={54} cy={18} r={3.5} fill="#B388FF" />
    <Sparkle cx={46} cy={8} r={2.5} fill="#FFD93D" />
    {/* Corpo */}
    <Ellipse cx="36" cy="45" rx="16" ry="11" fill="#FFFFFF" />
    <Ellipse cx="36" cy="48" rx="14" ry="7" fill="#F4EDFF" />
    {/* Patas */}
    <Rect x="24" y="50" width="6" height="11" rx="3" fill="#fff" />
    <Rect x="40" y="50" width="6" height="11" rx="3" fill="#fff" />
    <Rect x="24" y="57" width="6" height="4" rx="2" fill="#E8D5FF" />
    <Rect x="40" y="57" width="6" height="4" rx="2" fill="#E8D5FF" />
    {/* Cauda arco-íris */}
    <Path
      d="M51,44 Q60,38 56,52"
      stroke="#FF8FD8"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M52,46 Q59,42 56,52"
      stroke="#B388FF"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Cabeça */}
    <Circle cx="22" cy="31" r="12" fill="#fff" />
    {/* Orelha */}
    <Path d="M28,20 Q31,14 33,21 Q30,23 28,20 Z" fill="#fff" />
    <Path d="M29,20 Q30.5,17 31.5,20.5 Z" fill="#FF8FD8" />
    {/* Chifre dourado */}
    <Path d="M21,8 L17.5,25 L25,25 Z" fill="url(#fanHorn)" />
    <Path
      d="M19.5,16 L23.8,15"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="1.2"
    />
    <Path
      d="M18.6,20 L24.4,19"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="1.2"
    />
    {/* Crina arco-íris */}
    <Path
      d="M29,21 Q40,17 38,33"
      stroke="#FF8FD8"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M31,25 Q42,21 40,37"
      stroke="#B388FF"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M33,29 Q44,26 41,41"
      stroke="#7FD8FF"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Rosto */}
    <Circle cx="17" cy="31" r="2.2" fill="#2D2D2D" />
    <Circle cx="16.2" cy="30.2" r="0.8" fill="#fff" />
    <Blush cx={14} cy={36} r={3} />
    <Path
      d="M19,38 Q21,40 23,38"
      stroke="#2D2D2D"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

/** 🔬 Science — foguete decolando entre planetas */
const ScienceIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="sciBg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#1B2A52" />
        <Stop offset="1" stopColor="#3E5BA9" />
      </LinearGradient>
      <LinearGradient id="sciBody" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#FFFFFF" />
        <Stop offset="1" stopColor="#D5DEE8" />
      </LinearGradient>
      <LinearGradient id="sciFire" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFD93D" />
        <Stop offset="1" stopColor="#FF6B35" />
      </LinearGradient>
    </Defs>
    <Rect width="64" height="64" rx="32" fill="url(#sciBg)" />
    {/* Estrelas */}
    <Sparkle cx={12} cy={14} r={2.5} fill="#fff" />
    <Sparkle cx={52} cy={22} r={2} fill="#9FD0FF" />
    <Circle cx="44" cy="10" r="1.2" fill="#fff" />
    <Circle cx="18" cy="26" r="1" fill="#9FD0FF" />
    <Circle cx="56" cy="44" r="1.2" fill="#fff" />
    {/* Planetinha com anel */}
    <Circle cx="13" cy="46" r="6" fill="#FF9F68" />
    <Ellipse
      cx="13"
      cy="46"
      rx="9"
      ry="2.6"
      fill="none"
      stroke="#FFD0A8"
      strokeWidth="1.6"
      transform="rotate(-18,13,46)"
    />
    {/* Foguete */}
    <G transform="rotate(8,34,32)">
      {/* Fogo */}
      <Ellipse cx="34" cy="50" rx="4.5" ry="7" fill="url(#sciFire)" />
      <Ellipse cx="34" cy="52" rx="2.4" ry="4" fill="#FFF3C2" />
      {/* Corpo */}
      <Path
        d="M28,24 Q28,8 34,5 Q40,8 40,24 L40,42 Q34,46 28,42 Z"
        fill="url(#sciBody)"
      />
      {/* Bico */}
      <Path d="M28,18 Q34,4 40,18 Q34,14 28,18 Z" fill="#E74C3C" />
      {/* Janela */}
      <Circle cx="34" cy="25" r="5" fill="#9FD0FF" />
      <Circle
        cx="34"
        cy="25"
        r="5"
        fill="none"
        stroke="#E74C3C"
        strokeWidth="1.8"
      />
      <Circle cx="32.5" cy="23.5" r="1.4" fill="#fff" />
      {/* Aletas */}
      <Path d="M28,34 Q20,40 24,47 Q28,43 28,40 Z" fill="#E74C3C" />
      <Path d="M40,34 Q48,40 44,47 Q40,43 40,40 Z" fill="#E74C3C" />
      {/* Listra */}
      <Rect
        x="28.5"
        y="36"
        width="11"
        height="3"
        rx="1.5"
        fill="#E74C3C"
        opacity={0.85}
      />
    </G>
  </Svg>
);

/** 🍎 Fruit — maçã feliz com brilho */
const FruitIllustration = ({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="fruBg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFF3D6" />
        <Stop offset="1" stopColor="#FFE2B8" />
      </LinearGradient>
      <RadialGradient id="fruApple" cx="0.35" cy="0.3" r="0.9">
        <Stop offset="0" stopColor="#FF6B5E" />
        <Stop offset="1" stopColor="#D63031" />
      </RadialGradient>
    </Defs>
    <Rect width="64" height="64" rx="32" fill="url(#fruBg)" />
    {/* Brilhos de fundo */}
    <Sparkle cx={12} cy={16} r={2.5} fill="#FFB344" />
    <Sparkle cx={52} cy={14} r={3} fill="#FF8FD8" />
    {/* Folha com veio */}
    <Path d="M33,14 Q42,7 45,17 Q37,21 33,14 Z" fill="#2ECC71" />
    <Path
      d="M35,14.5 Q40,12.5 43,16"
      stroke="#27AE60"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Cabinho */}
    <Path
      d="M32,22 Q31,17 33,13"
      stroke="#8B5E3C"
      strokeWidth="2.6"
      fill="none"
      strokeLinecap="round"
    />
    {/* Corpo da maçã */}
    <Path
      d="M16,35 Q14,22 26,21 Q32,19 38,21 Q50,22 48,35 Q48,50 32,55 Q16,50 16,35 Z"
      fill="url(#fruApple)"
    />
    {/* Brilho */}
    <Ellipse
      cx="23"
      cy="29"
      rx="4"
      ry="6"
      fill="rgba(255,255,255,0.4)"
      transform="rotate(-22,23,29)"
    />
    {/* Rostinho */}
    <Circle cx="26" cy="36" r="2.2" fill="#2D2D2D" />
    <Circle cx="38" cy="36" r="2.2" fill="#2D2D2D" />
    <Circle cx="25.2" cy="35.2" r="0.8" fill="#fff" />
    <Circle cx="37.2" cy="35.2" r="0.8" fill="#fff" />
    <Blush cx={21} cy={41} r={3} />
    <Blush cx={43} cy={41} r={3} />
    <Path
      d="M27,43 Q32,48 37,43"
      stroke="#2D2D2D"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

/** 🐶 Banner — cachorrinho com coleira e coraçõezinhos */
const BannerIllustration = ({ size = 130 }: { size?: number }) => (
  <Svg width={size} height={(size * 140) / 130} viewBox="0 0 130 140">
    <Defs>
      <LinearGradient id="dogHead" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#E0A57C" />
        <Stop offset="1" stopColor="#C98A5B" />
      </LinearGradient>
      <LinearGradient id="dogBody" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#C68642" />
        <Stop offset="1" stopColor="#A96F33" />
      </LinearGradient>
    </Defs>
    {/* Coraçõezinhos flutuando */}
    <Path
      d="M14,28 q3,-5 6,0 q3,5 -3,9 q-6,-4 -3,-9 Z"
      fill="#FF6B8A"
      opacity={0.85}
    />
    <Path
      d="M112,40 q2.4,-4 4.8,0 q2.4,4 -2.4,7.2 q-4.8,-3.2 -2.4,-7.2 Z"
      fill="#FFD93D"
      opacity={0.9}
    />
    {/* Corpo */}
    <Ellipse cx="65" cy="112" rx="40" ry="29" fill="url(#dogBody)" />
    <Ellipse cx="65" cy="118" rx="24" ry="17" fill="#E8C9A8" />
    {/* Orelhas (atrás da cabeça) */}
    <Ellipse
      cx="30"
      cy="62"
      rx="14"
      ry="23"
      fill="#A96F33"
      transform="rotate(-14,30,62)"
    />
    <Ellipse
      cx="100"
      cy="62"
      rx="14"
      ry="23"
      fill="#A96F33"
      transform="rotate(14,100,62)"
    />
    <Ellipse
      cx="31"
      cy="64"
      rx="8"
      ry="15"
      fill="#E8A87C"
      transform="rotate(-14,31,64)"
    />
    <Ellipse
      cx="99"
      cy="64"
      rx="8"
      ry="15"
      fill="#E8A87C"
      transform="rotate(14,99,64)"
    />
    {/* Cabeça */}
    <Circle cx="65" cy="72" r="38" fill="url(#dogHead)" />
    {/* Manchinha na sobrancelha */}
    <Ellipse cx="84" cy="48" rx="10" ry="8" fill="#C98A5B" opacity={0.6} />
    {/* Focinho */}
    <Ellipse cx="65" cy="84" rx="21" ry="16" fill="#F2D5B8" />
    {/* Nariz */}
    <Ellipse cx="65" cy="76" rx="8" ry="6" fill="#2D2D2D" />
    <Ellipse
      cx="62.5"
      cy="74"
      rx="2.6"
      ry="1.6"
      fill="rgba(255,255,255,0.55)"
    />
    {/* Olhos */}
    <Circle cx="48" cy="62" r="8" fill="#fff" />
    <Circle cx="82" cy="62" r="8" fill="#fff" />
    <Circle cx="50" cy="63" r="5" fill="#2D2D2D" />
    <Circle cx="84" cy="63" r="5" fill="#2D2D2D" />
    <Circle cx="51.5" cy="61" r="1.8" fill="#fff" />
    <Circle cx="85.5" cy="61" r="1.8" fill="#fff" />
    {/* Bochechas */}
    <Blush cx={38} cy={76} r={5} />
    <Blush cx={92} cy={76} r={5} />
    {/* Sorriso + língua */}
    <Path
      d="M52,90 Q65,101 78,90"
      stroke="#A96F33"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <Path d="M58,95 Q65,106 72,95 Q65,99 58,95 Z" fill="#FF6B8A" />
    <Path
      d="M65,96 L65,101"
      stroke="#E0507A"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    {/* Coleira com pingente */}
    <Path d="M34,102 Q65,116 96,102 L96,108 Q65,122 34,108 Z" fill="#FF5B8D" />
    <Circle cx="65" cy="118" r="5" fill="#FFD93D" />
    <Circle cx="65" cy="118" r="2" fill="#FFB13D" />
    {/* Patinhas */}
    <Ellipse cx="40" cy="132" rx="14" ry="9" fill="#D4956A" />
    <Ellipse cx="90" cy="132" rx="14" ry="9" fill="#D4956A" />
    <Path
      d="M34,130 L34,134 M40,131 L40,135 M46,130 L46,134"
      stroke="#A96F33"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <Path
      d="M84,130 L84,134 M90,131 L90,135 M96,130 L96,134"
      stroke="#A96F33"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </Svg>
);

/** 📕 Livro 1 — coruja leitora */
const BookIllustration1 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="b1Bg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFE680" />
        <Stop offset="1" stopColor="#FFC93D" />
      </LinearGradient>
    </Defs>
    <Rect width="100" height="100" rx="20" fill="url(#b1Bg)" />
    <Sparkle cx={16} cy={16} r={3.5} fill="#fff" />
    <Sparkle cx={86} cy={22} r={3} fill="#FF8C42" />
    {/* Galho */}
    <Path
      d="M10,78 Q50,72 90,78"
      stroke="#8B5E3C"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Corpo da coruja */}
    <Ellipse cx="50" cy="54" rx="24" ry="27" fill="#FF8C42" />
    <Ellipse cx="50" cy="62" rx="15" ry="16" fill="#FFE0B8" />
    {/* Penas da barriga */}
    <Path
      d="M44,56 Q50,61 56,56 M42,64 Q50,70 58,64"
      stroke="#FFC98A"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Tufos */}
    <Path d="M32,32 Q30,22 38,28 Z" fill="#FF8C42" />
    <Path d="M68,32 Q70,22 62,28 Z" fill="#FF8C42" />
    {/* Olhos grandes */}
    <Circle cx="40" cy="42" r="11" fill="#fff" />
    <Circle cx="60" cy="42" r="11" fill="#fff" />
    <Circle cx="41" cy="43" r="5.5" fill="#2D2D2D" />
    <Circle cx="59" cy="43" r="5.5" fill="#2D2D2D" />
    <Circle cx="42.8" cy="41" r="2" fill="#fff" />
    <Circle cx="60.8" cy="41" r="2" fill="#fff" />
    {/* Bico */}
    <Path d="M46,52 L54,52 L50,58 Z" fill="#FFB13D" />
    {/* Asinhas */}
    <Path d="M27,48 Q18,56 28,68 Q31,58 30,50 Z" fill="#E8762C" />
    <Path d="M73,48 Q82,56 72,68 Q69,58 70,50 Z" fill="#E8762C" />
    {/* Patinhas no galho */}
    <Path
      d="M44,79 L44,75 M48,79 L48,75 M52,79 L52,75 M56,79 L56,75"
      stroke="#FFB13D"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </Svg>
);

/** 🌊 Livro 2 — baleia e barquinho no mar */
const BookIllustration2 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="b2Sky" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#C9F4F2" />
        <Stop offset="1" stopColor="#A8EDEA" />
      </LinearGradient>
      <LinearGradient id="b2Sea" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#00CEC9" />
        <Stop offset="1" stopColor="#0098A8" />
      </LinearGradient>
    </Defs>
    <Rect width="100" height="100" rx="20" fill="url(#b2Sky)" />
    {/* Sol e nuvem */}
    <Circle cx="80" cy="20" r="9" fill="#FDCB6E" />
    <Ellipse cx="26" cy="20" rx="9" ry="5" fill="#fff" />
    <Ellipse cx="33" cy="17" rx="6" ry="4" fill="#fff" />
    {/* Mar */}
    <Path
      d="M0,58 Q25,50 50,58 Q75,66 100,58 L100,100 L0,100 Z"
      fill="url(#b2Sea)"
    />
    <Path
      d="M0,70 Q25,63 50,70 Q75,77 100,70"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="2.5"
      fill="none"
    />
    {/* Baleia */}
    <Path
      d="M22,80 Q22,62 42,62 Q62,62 62,78 Q62,86 42,86 Q22,86 22,80 Z"
      fill="#5BA7E8"
    />
    <Path d="M58,72 Q70,66 68,78 Q63,77 58,76 Z" fill="#5BA7E8" />
    {/* Barriga */}
    <Path d="M26,82 Q42,90 58,80 Q42,88 26,82 Z" fill="#BCDFFF" />
    {/* Olho + bochecha */}
    <Circle cx="33" cy="72" r="2.4" fill="#2D2D2D" />
    <Circle cx="32.2" cy="71.2" r="0.9" fill="#fff" />
    <Blush cx={29} cy={77} r={2.6} />
    <Path
      d="M36,77 Q39,79 42,77"
      stroke="#2D2D2D"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
    />
    {/* Jato d'água */}
    <Path
      d="M40,60 Q38,52 33,50 M40,60 Q40,50 40,47 M40,60 Q43,52 47,50"
      stroke="#7FD8FF"
      strokeWidth="2.4"
      fill="none"
      strokeLinecap="round"
    />
    {/* Barquinho */}
    <Path d="M64,52 L88,52 L82,60 L70,60 Z" fill="#E17055" />
    <Rect x="75" y="36" width="3" height="16" rx="1.5" fill="#636e72" />
    <Path d="M78,36 L90,49 L78,49 Z" fill="#FDCB6E" />
  </Svg>
);

/** 🏰 Livro 3 — castelo encantado à noite */
const BookIllustration3 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="b3Bg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#6C5CE7" />
        <Stop offset="1" stopColor="#C3B1E1" />
      </LinearGradient>
      <LinearGradient id="b3Castle" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#8E6CD9" />
        <Stop offset="1" stopColor="#6B4BB8" />
      </LinearGradient>
    </Defs>
    <Rect width="100" height="100" rx="20" fill="url(#b3Bg)" />
    {/* Estrelas */}
    <Sparkle cx={18} cy={18} r={3} fill="#fff" />
    <Sparkle cx={56} cy={12} r={2.4} fill="#FFD93D" />
    <Circle cx="38" cy="24" r="1.4" fill="#fff" />
    <Circle cx="12" cy="36" r="1.2" fill="#fff" />
    {/* Lua crescente */}
    <Circle cx="78" cy="20" r="11" fill="#FDCB6E" />
    <Circle cx="83" cy="16" r="8.5" fill="#6C5CE7" />
    {/* Morro */}
    <Path d="M0,86 Q50,72 100,86 L100,100 L0,100 Z" fill="#4B3596" />
    {/* Torres laterais */}
    <Rect x="18" y="46" width="15" height="42" rx="2" fill="url(#b3Castle)" />
    <Rect x="67" y="46" width="15" height="42" rx="2" fill="url(#b3Castle)" />
    <Path d="M16,46 L25.5,32 L35,46 Z" fill="#FF5B8D" />
    <Path d="M65,46 L74.5,32 L84,46 Z" fill="#FF5B8D" />
    {/* Torre central */}
    <Rect x="38" y="36" width="24" height="52" rx="2" fill="#9B72E8" />
    <Path d="M35,36 L50,18 L65,36 Z" fill="#FF5B8D" />
    {/* Bandeirinha */}
    <Rect x="49" y="6" width="2" height="14" fill="#fff" />
    <Path d="M51,7 L62,10 L51,13 Z" fill="#FFD93D" />
    {/* Porta */}
    <Path d="M44,88 L44,72 Q50,64 56,72 L56,88 Z" fill="#FDCB6E" />
    <Circle cx="53" cy="79" r="1.2" fill="#A96F33" />
    {/* Janelas acesas */}
    <Circle cx="25.5" cy="58" r="4" fill="#FFE680" />
    <Circle cx="74.5" cy="58" r="4" fill="#FFE680" />
    <Path d="M46,46 L54,46 L54,54 Q50,57 46,54 Z" fill="#FFE680" />
  </Svg>
);

/** 🦕 Livro 4 — dino feliz */
const BookIllustration4 = ({ size = 100 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="b4Bg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#D5FBE4" />
        <Stop offset="1" stopColor="#A8EFC4" />
      </LinearGradient>
      <LinearGradient id="b4Dino" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#3DDC84" />
        <Stop offset="1" stopColor="#27AE60" />
      </LinearGradient>
    </Defs>
    <Rect width="100" height="100" rx="20" fill="url(#b4Bg)" />
    {/* Sol e brilhos */}
    <Circle cx="82" cy="18" r="8" fill="#FFD93D" />
    <Sparkle cx={66} cy={12} r={2.4} fill="#FFB344" />
    <Sparkle cx={16} cy={20} r={3} fill="#fff" />
    {/* Grama */}
    <Path d="M0,88 Q50,80 100,88 L100,100 L0,100 Z" fill="#5DBB63" />
    {/* Cauda */}
    <Path
      d="M76,68 Q94,58 88,80"
      stroke="#27AE60"
      strokeWidth="10"
      fill="none"
      strokeLinecap="round"
    />
    {/* Corpo */}
    <Ellipse cx="52" cy="68" rx="26" ry="20" fill="url(#b4Dino)" />
    {/* Barriga */}
    <Ellipse cx="48" cy="74" rx="16" ry="11" fill="#C9F7D6" />
    {/* Cabeça */}
    <Ellipse cx="30" cy="50" rx="18" ry="16" fill="#3DDC84" />
    {/* Espinhos arredondados */}
    <Path d="M48,46 Q52,36 57,46 Z" fill="#FF8FD8" />
    <Path d="M59,44 Q63,34 68,44 Z" fill="#FFD93D" />
    <Path d="M69,48 Q73,38 78,48 Z" fill="#7FD8FF" />
    {/* Olho */}
    <Circle cx="24" cy="46" r="5.5" fill="#fff" />
    <Circle cx="25" cy="47" r="3" fill="#2D2D2D" />
    <Circle cx="26" cy="45.8" r="1.1" fill="#fff" />
    {/* Bochecha + sorriso */}
    <Blush cx={19} cy={55} r={3.4} />
    <Path
      d="M22,59 Q30,66 39,58"
      stroke="#1B7A43"
      strokeWidth="2.4"
      fill="none"
      strokeLinecap="round"
    />
    {/* Patas */}
    <Rect x="36" y="82" width="10" height="13" rx="5" fill="#27AE60" />
    <Rect x="58" y="82" width="10" height="13" rx="5" fill="#27AE60" />
    {/* Florzinha */}
    <Circle cx="14" cy="90" r="2.4" fill="#FF8FD8" />
    <Circle cx="14" cy="90" r="1" fill="#FFD93D" />
  </Svg>
);

/** 📖 Leitura 1 — livro aberto mágico */
const ReadingIllustration1 = ({ size = 70 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 70 70">
    <Defs>
      <LinearGradient id="r1Bg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFE3EE" />
        <Stop offset="1" stopColor="#FFD0E2" />
      </LinearGradient>
      <LinearGradient id="r1Book" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FF7DA5" />
        <Stop offset="1" stopColor="#FF4F86" />
      </LinearGradient>
    </Defs>
    <Rect width="70" height="70" rx="18" fill="url(#r1Bg)" />
    {/* Brilhos saindo do livro */}
    <Sparkle cx={18} cy={14} r={3.5} fill="#FFD93D" />
    <Sparkle cx={52} cy={12} r={2.8} fill="#B388FF" />
    <Sparkle cx={35} cy={9} r={2.2} fill="#FF8FD8" />
    {/* Capa */}
    <Path
      d="M11,24 Q11,20 35,21 Q59,20 59,24 L59,56 Q35,52 35,52 Q11,56 11,56 Z"
      fill="url(#r1Book)"
    />
    {/* Páginas */}
    <Path d="M13,24 Q13,21 35,22 L35,50 Q24,48 13,52 Z" fill="#fff" />
    <Path d="M57,24 Q57,21 35,22 L35,50 Q46,48 57,52 Z" fill="#FFF4F8" />
    {/* Linhas de texto */}
    <G stroke="#FFB7CF" strokeWidth="2" strokeLinecap="round">
      <Path d="M18,30 L30,28.6" />
      <Path d="M18,36 L30,34.6" />
      <Path d="M18,42 L28,40.8" />
      <Path d="M40,28.6 L52,30" />
      <Path d="M40,34.6 L52,36" />
      <Path d="M42,40.8 L52,42" />
    </G>
    {/* Marcador de página */}
    <Path d="M48,21 L48,32 L51.5,28.5 L55,32 L55,21.6 Z" fill="#FFD93D" />
    {/* Estrelinhas embaixo */}
    <Sparkle cx={20} cy={61} r={2.6} fill="#FFD93D" />
    <Sparkle cx={50} cy={61} r={2.6} fill="#FFD93D" />
  </Svg>
);

/** 🪐 Leitura 2 — planeta com foguete em órbita */
const ReadingIllustration2 = ({ size = 70 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 70 70">
    <Defs>
      <LinearGradient id="r2Bg" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#1B2A52" />
        <Stop offset="1" stopColor="#41549E" />
      </LinearGradient>
      <RadialGradient id="r2Planet" cx="0.35" cy="0.3" r="0.9">
        <Stop offset="0" stopColor="#6FB8F2" />
        <Stop offset="1" stopColor="#2D7DC9" />
      </RadialGradient>
    </Defs>
    <Rect width="70" height="70" rx="18" fill="url(#r2Bg)" />
    {/* Estrelas */}
    <Sparkle cx={11} cy={12} r={2.6} fill="#fff" />
    <Sparkle cx={59} cy={56} r={2.4} fill="#9FD0FF" />
    <Circle cx="58" cy="11" r="1.4" fill="#fff" />
    <Circle cx="9" cy="52" r="1.2" fill="#9FD0FF" />
    {/* Planeta */}
    <Circle cx="35" cy="36" r="18" fill="url(#r2Planet)" />
    {/* Continentes */}
    <Path d="M24,30 Q30,24 36,29 Q32,35 26,34 Q24,32 24,30 Z" fill="#3DDC84" />
    <Ellipse cx="43" cy="42" rx="6" ry="4.5" fill="#3DDC84" />
    {/* Brilho */}
    <Ellipse
      cx="28"
      cy="27"
      rx="4"
      ry="5"
      fill="rgba(255,255,255,0.3)"
      transform="rotate(-25,28,27)"
    />
    {/* Anel */}
    <Ellipse
      cx="35"
      cy="36"
      rx="27"
      ry="8"
      fill="none"
      stroke="#FFB13D"
      strokeWidth="3"
      transform="rotate(-12,35,36)"
      opacity={0.9}
    />
    {/* Foguetinho em órbita */}
    <G transform="rotate(30,56,18)">
      <Path d="M53,18 Q56,11 59,18 Z" fill="#E74C3C" />
      <Rect x="53" y="18" width="6" height="9" rx="2" fill="#ECF0F1" />
      <Circle cx="56" cy="21" r="1.6" fill="#9FD0FF" />
      <Ellipse cx="56" cy="29" rx="2" ry="3" fill="#FFD93D" />
    </G>
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
// Agora baseado no PressBounce (Reanimated): mola na UI thread + entering
const BouncyCard = ({
  children,
  onPress,
  style,
  entering,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  entering?: any;
}) => (
  <PressBounce onPress={onPress} style={style} entering={entering}>
    {children}
  </PressBounce>
);

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
const SectionHeader = ({
  title,
  emoji,
  linkColor = "#FF5B8D",
  delay = 0,
}: {
  title: string;
  emoji: string;
  linkColor?: string;
  delay?: number;
}) => (
  <Animated.View entering={enterUp(delay)} style={s.secHdr}>
    <Text style={fredoka(20, "#2D2D2D")}>
      {emoji} {title}
    </Text>
  </Animated.View>
);

// ─── CATEGORY ITEM ───────────────────────────────────────────────────────────
const CategoryItem = ({
  title,
  bg,
  emoji,
  Illustration,
  type,
  delay = 0,
}: (typeof CATEGORIES)[0] & { delay?: number }) => {
  const router = useRouter();

  return (
    <BouncyCard
      entering={enterPop(100 + delay / 2)}
      style={s.catWrap}
      onPress={() =>
        router.push({
          pathname: "/(category)",
          params: { type: type.toLowerCase(), label: title },
        })
      }
    >
      <View style={[s.catCircle, { backgroundColor: bg }]}>
        {/* "Respira" suavemente, cada categoria num ritmo diferente */}
        <Breathe delay={delay} scaleTo={1.07} duration={2200}>
          <Illustration size={70} />
        </Breathe>
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
  delay = 0,
}: (typeof POPULAR_BOOKS)[0] & { delay?: number }) => {
  const router = useRouter();

  return (
    <BouncyCard
      entering={enterRight(150 + delay / 3)}
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
        {/* Capa flutuando, com delay escalonado entre os cards */}
        <FloatY delay={delay} distance={5} duration={2600}>
          <Illustration size={100} />
        </FloatY>
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
  delay = 0,
}: (typeof READING_LIST)[0] & { delay?: number }) => {
  const done = progress === "100%";
  const pct = parseInt(progress, 10);

  const router = useRouter();

  return (
    <BouncyCard
      entering={enterUp(200 + delay / 3)}
      onPress={() =>
        router.push({
          pathname: "/(details)",
          params: { storyId: title.toLowerCase().replace(/\s/g, "") },
        })
      }
      style={s.readCard}
    >
      <View style={s.readImgWrap}>
        {/* Balança de leve, como um pêndulo bem suave */}
        <Swing delay={delay} angle={3} duration={3000}>
          <Illustration size={70} />
        </Swing>
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

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={s.container} onLayout={onLayoutRootView}>
      <View style={[s.blob, s.blob1]} />
      <View style={[s.blob, s.blob2]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── HEADER ── */}
        <Animated.View entering={enterUp(0)} style={s.header}>
          <Text style={fredoka(26, "#2D2D2D")}>
            Hi, <Text style={fredoka(26, "#FF5B8D")}>Everyone</Text> 👋
          </Text>
          <Text style={s.headerSub}>Let's learn something new today!</Text>
        </Animated.View>

        {/* ── HERO BANNER ── */}
        <BouncyCard entering={enterUp(120)} style={s.banner}>
          {/* Balãozinho pulsando para chamar atenção */}
          <Breathe style={s.bubble} scaleTo={1.08} duration={1600}>
            <Text style={[fredoka(12, "#3E2723"), { textAlign: "center" }]}>
              {"Hi\nFriend!"}
            </Text>
          </Breathe>
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
            {/* Cachorrinho boiando para cima e para baixo */}
            <FloatY distance={7} duration={2200}>
              <BannerIllustration size={130} />
            </FloatY>
          </View>
        </BouncyCard>

        {/* ── CATEGORIES ── */}
        <SectionHeader title="Category" emoji="✨" delay={180} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}
        >
          {CATEGORIES.map((item, i) => (
            <CategoryItem key={item.type} {...item} delay={i * 350} />
          ))}
        </ScrollView>

        {/* ── POPULAR NOW ── */}
        <SectionHeader title="Popular now" emoji="🔥" delay={240} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.popRow}
        >
          {POPULAR_BOOKS.map((item, i) => (
            <PopularCard key={item.title} {...item} delay={i * 400} />
          ))}
        </ScrollView>

        {/* ── CONTINUE READING ── */}
        <SectionHeader title="Continue reading" emoji="📚" delay={300} />

        <View style={s.readList}>
          {READING_LIST.map((item, i) => (
            <ReadingCard key={item.title} {...item} delay={i * 500} />
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
