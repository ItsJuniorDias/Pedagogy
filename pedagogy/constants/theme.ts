/**
 * ─── DESIGN SYSTEM — Pedagogy ─────────────────────────────────────────────────
 * Fonte única de verdade para cor, tipografia, raio, espaçamento e sombra.
 *
 * Antes, cada tela hardcodava os próprios hexes — e eles derivaram: 5 rosas
 * diferentes (#FF5B8D, #FB456E, #FF6B8A, #FF4F86, #FF8FD8), 8 cinzas de texto
 * (#888 → #CCC, muitos abaixo do contraste AA) e raios de 14 a 30. Este arquivo
 * consolida a paleta REAL do app (creme + rosa + roxo + amarelo, fonte Fredoka)
 * em tokens semânticos. Regras:
 *
 *   • Telas importam `Theme` (semântico) — nunca hex solto.
 *   • `Palette` é a matéria-prima; só o próprio Theme e cores decorativas de
 *     cards (que são CONTEÚDO, ex.: capa de cada trilha) podem usá-la direto.
 *   • Texto corrido nunca usa cor abaixo de `textMuted`. `textFaint` é
 *     reservado para rótulos grandes/bold ≥13 com peso ≥700.
 */

import { Platform } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";

// ─── PALETA CRUA ──────────────────────────────────────────────────────────────

export const Palette = {
  // Marca
  pink: "#FF5B8D",
  pinkDeep: "#C0305A", // sombra 3D / pressed do rosa
  pinkSoft: "#FFB8D0",
  pinkTint: "#FFE8F0",
  pinkFaint: "#FFF0F5",

  purple: "#6C5CE7",
  purpleDeep: "#4B3596",
  purpleTint: "#F3F0FF",

  yellow: "#FFD93D",
  yellowDeep: "#C99500", // sombra 3D / texto sobre amarelo usa ink
  yellowTint: "#FFF5B1",
  yellowFaint: "#FFFBEB",

  // Apoio (usadas por cards de conteúdo)
  orange: "#FF7043",
  green: "#27AE60",
  greenTint: "#E8F8F0",
  blue: "#3B82F6",
  blueTint: "#EBF4FF",
  teal: "#00CEC9",

  // Neutros quentes (combinam com o fundo creme)
  cream: "#FFF9F0",
  surface: "#FFFFFF",
  ink: "#2D2D2D",
  // 4.9:1 sobre branco / 4.5:1 sobre creme → AA para texto pequeno
  gray600: "#6E6E78",
  // 3.4:1 → só para texto grande/bold (rótulos ≥13 e peso ≥700)
  gray400: "#8E8E99",
  border: "#ECE8E0",
  track: "#F1EEE8",
  overlay: "rgba(20, 18, 40, 0.45)",
} as const;

// ─── TOKENS SEMÂNTICOS ────────────────────────────────────────────────────────

export const Theme = {
  colors: {
    /** Fundo padrão de tela */
    bg: Palette.cream,
    /** Cards, sheets, botões neutros */
    surface: Palette.surface,

    /** Títulos e texto principal */
    ink: Palette.ink,
    /** Texto secundário (subtítulos, descrições) — AA em corpo pequeno */
    textMuted: Palette.gray600,
    /** Rótulos grandes/bold apenas (progress labels, metadados ≥13/700+) */
    textFaint: Palette.gray400,
    /** Texto sobre cores fortes (rosa/roxo) */
    onAccent: Palette.surface,

    /** Ação primária (CTAs, seleção, links) */
    primary: Palette.pink,
    primaryDeep: Palette.pinkDeep,
    primarySoft: Palette.pinkSoft,
    primaryTint: Palette.pinkTint,
    primaryFaint: Palette.pinkFaint,

    /** Ação/realce secundário (banners, splash) */
    accent: Palette.purple,
    accentDeep: Palette.purpleDeep,
    accentTint: Palette.purpleTint,

    /** Destaque lúdico (estrelas, avatar, CTA do banner) */
    highlight: Palette.yellow,
    highlightTint: Palette.yellowTint,

    success: Palette.green,
    successTint: Palette.greenTint,

    border: Palette.border,
    track: Palette.track,
    overlay: Palette.overlay,
  },

  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 28,
    pill: 999,
  },

  /** Grade de 4pt. Use múltiplos; evita os 3/6/7/9/11 espalhados. */
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
} as const;

// ─── SOMBRAS ─────────────────────────────────────────────────────────────────
// Três níveis padronizados (antes: 14 combinações de opacity/radius diferentes).

export const Shadow = {
  /** Cards em repouso */
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  } as ViewStyle,
  /** Elementos flutuantes (headers de volta, badges, sheets) */
  raised: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  } as ViewStyle,
  /** Brilho de marca em CTAs rosa */
  glowPrimary: {
    shadowColor: Palette.pink,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  } as ViewStyle,
  /** Brilho do amarelo (avatar, botão do banner) */
  glowHighlight: {
    shadowColor: "#FF9500",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  } as ViewStyle,
} as const;

// ─── TIPOGRAFIA ──────────────────────────────────────────────────────────────

/**
 * Fredoka One — a voz visual do app. Antes este helper era copiado em 12
 * arquivos; agora vive aqui. Sempre com lineHeight proporcional para o texto
 * não "cortar" descendentes em pt/es/fr.
 */
export const fredoka = (size: number, color?: string): TextStyle => ({
  fontFamily: "FredokaOne_400Regular",
  fontSize: size,
  lineHeight: Math.round(size * 1.25),
  ...(color ? { color } : {}),
});

/** Corpo de texto (system font) com pesos consistentes. */
export const body = (
  size: number,
  color: string = Theme.colors.textMuted,
  weight: TextStyle["fontWeight"] = "600",
): TextStyle => ({
  fontSize: size,
  color,
  fontWeight: weight,
  lineHeight: Math.round(size * 1.45),
});

// ─── TOQUE / ACESSIBILIDADE ──────────────────────────────────────────────────

/** Alvo mínimo de toque (HIG). Use em botões de ícone. */
export const MIN_TOUCH = 44;

/** hitSlop padrão para alvos ≤44pt. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

// ─── COMPAT: exports do template Expo ────────────────────────────────────────
// Mantidos porque hooks/use-theme-color e componentes do template consomem
// este shape. O app em si é light-only (userInterfaceStyle: "light").

const tintColorLight = Palette.pink;
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: Palette.ink,
    background: Palette.cream,
    tint: tintColorLight,
    icon: Palette.gray600,
    tabIconDefault: Palette.gray400,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
