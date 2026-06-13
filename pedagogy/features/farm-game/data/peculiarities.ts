// features/farm-game/data/peculiarities.ts
import type {
  Crop,
  Peculiarity,
  PeculiarityEffect,
  PeculiarityId,
} from "../types";

// ─── Peculiarity catalog ──────────────────────────────────────────────────────
// Cada semente tem UM traço característico. O efeito é lido por:
//   - state/rewards.ts  → sell / xp / yield / water / coin (na colheita)
//   - state/reducer.ts  → growth (no tick de crescimento)
//   - three/plants.ts   → accent (floreio visual na planta madura)
// Mantemos um único {kind,value} por traço pra regra ficar simples e testável.

export const PECULIARITIES: Record<PeculiarityId, Peculiarity> = {
  hardy: {
    id: "hardy",
    emoji: "🌾",
    label: "Hardy",
    desc: "Tough little grain — grows 12% faster.",
    effect: { kind: "growth", value: 1.12 },
  },
  tender: {
    id: "tender",
    emoji: "🥬",
    label: "Tender Leaf",
    desc: "Crisp and quick — grows 15% faster.",
    effect: { kind: "growth", value: 1.15 },
  },
  deep_root: {
    id: "deep_root",
    emoji: "🥕",
    label: "Deep Root",
    desc: "Soaks up the soil — +15% XP.",
    effect: { kind: "xp", value: 1.15 },
  },
  sprouter: {
    id: "sprouter",
    emoji: "🥔",
    label: "Sprouter",
    desc: "Multiplies underground — 20% chance of a double harvest.",
    effect: { kind: "yield", value: 0.2 },
  },
  full_ear: {
    id: "full_ear",
    emoji: "🌽",
    label: "Full Ear",
    desc: "Loves water — watering pays +35% (vs +20%).",
    effect: { kind: "water", value: 0.35 },
  },
  succulent: {
    id: "succulent",
    emoji: "🍅",
    label: "Succulent",
    desc: "Plump and rich — +12% coins.",
    effect: { kind: "sell", value: 1.12 },
  },
  sweet: {
    id: "sweet",
    emoji: "🍓",
    label: "Sweet",
    desc: "Everyone's favorite — +20% XP.",
    effect: { kind: "xp", value: 1.2 },
  },
  heliotrope: {
    id: "heliotrope",
    emoji: "🌻",
    label: "Heliotrope",
    desc: "Chases the sun — grows 20% faster.",
    effect: { kind: "growth", value: 1.2 },
    accent: "petals",
  },
  giant: {
    id: "giant",
    emoji: "🎃",
    label: "Giant",
    desc: "Grows huge — 25% chance of a double harvest.",
    effect: { kind: "yield", value: 0.25 },
  },
  juicy: {
    id: "juicy",
    emoji: "🍉",
    label: "Juicy",
    desc: "Bursting with water — watering pays +40%.",
    effect: { kind: "water", value: 0.4 },
  },
  noble: {
    id: "noble",
    emoji: "🍇",
    label: "Noble Cluster",
    desc: "A fine vintage — +18% coins.",
    effect: { kind: "sell", value: 1.18 },
  },
  exotic: {
    id: "exotic",
    emoji: "🐉",
    label: "Exotic",
    desc: "Rare and prized — +25% XP.",
    effect: { kind: "xp", value: 1.25 },
  },
  aureate: {
    id: "aureate",
    emoji: "✨",
    label: "Aureate",
    desc: "Drips pure gold — +1,500 bonus coins per harvest.",
    effect: { kind: "coin", value: 1500 },
    accent: "spark",
  },
  shimmer: {
    id: "shimmer",
    emoji: "💎",
    label: "Shimmering",
    desc: "Fractures into more — 30% chance of a double harvest.",
    effect: { kind: "yield", value: 0.3 },
    accent: "glow",
  },
  stellar: {
    id: "stellar",
    emoji: "🌟",
    label: "Stellar",
    desc: "Worth a fortune — +40% coins.",
    effect: { kind: "sell", value: 1.4 },
    accent: "spark",
  },
};

export const peculiarityOf = (c: Crop): Peculiarity => PECULIARITIES[c.peculiarity];

export const effectOf = (c: Crop): PeculiarityEffect =>
  PECULIARITIES[c.peculiarity].effect;
