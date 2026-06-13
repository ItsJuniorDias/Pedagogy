/**
 * theme.ts — Identidade visual do NEON PONG 🏓
 *
 *  • NEON  → paleta usada na UI (React Native / dark glass)
 *  • C3D   → cores da cena Three.js (mundo 3D)
 *  • FF    → família de fonte compartilhada (Fredoka One)
 */

// ─── Neon palette (UI) ──────────────────────────────────────────────────────

export const NEON = {
  bg: "#0B1026", // azul-espacial
  panel: "rgba(13,20,45,0.50)", // vidro escuro
  edge: "rgba(96,165,250,0.35)", // borda azulada do vidro
  cyan: "#22D3EE", // jogador
  magenta: "#F472B6", // CPU
  yellow: "#FDE047", // bola / velocidade
  mint: "#34D399",
  amber: "#FBBF24",
  rose: "#FB7185",
  text: "#E2E8F0",
  dim: "#7C8DB5",
};

// ─── 3D colors ──────────────────────────────────────────────────────────────

export const C3D = {
  fog: 0x0b1026,
  tableTop: 0x111a3a,
  tableSide: 0x0a1128,
  lines: 0x22d3ee, // linhas neon (material unlit = brilham)
  net: 0x93c5fd,
  glassWall: 0x60a5fa,
  legs: 0x1e293b,
  floor: 0x0d1330,
  gridA: 0x2563eb,
  gridB: 0x16275f,
  player: 0x22d3ee,
  ai: 0xf472b6,
  rubberPlayer: 0x0e7490, // borracha ciano-escura da face
  rubberAi: 0x9d2f63, // borracha magenta-escura da face
  rubberBack: 0x1f2937, // verso preto da lâmina
  wood: 0xd6a35c, // cabo de madeira
  ball: 0xfde047,
  orbs: [0x22d3ee, 0xf472b6, 0x818cf8, 0xfde047],
};

// ─── Fonte compartilhada ────────────────────────────────────────────────────

export const FF = "FredokaOne_400Regular";
