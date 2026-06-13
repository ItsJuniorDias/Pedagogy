// features/farm-game/data/crops.ts
import type { CropId, PeculiarityId, PlantVisual, Rarity } from "../types";
import type { Crop } from "../types";

// ─── Rarity meta ──────────────────────────────────────────────────────────────

export const RARITY_META: Record<
  Rarity,
  { label: string; color: string; order: number }
> = {
  common: { label: "Common", color: "#78716C", order: 0 },
  uncommon: { label: "Uncommon", color: "#22C55E", order: 1 },
  rare: { label: "Rare", color: "#3B82F6", order: 2 },
  epic: { label: "Epic", color: "#A855F7", order: 3 },
  legendary: { label: "Legendary", color: "#F59E0B", order: 4 },
};

// ─── Regra nova: tudo escala com o NÍVEL ──────────────────────────────────────
// Antes a loja sorteava itens raros por dia (aleatório). Agora a disponibilidade
// é determinística: cada semente destrava num nível (`minLevel`) e existe uma
// semente por nível (1..15). Quanto MAIOR o nível:
//   • MAIOR o tempo de cultivo (growTime)
//   • MAIOR o ganho (price + xp)
// Os números abaixo são DERIVADOS do nível por curvas suaves e estritamente
// crescentes — uma única fonte da verdade. Pra rebalancear, mexa nas constantes.

const TIME_BASE = 15;
const TIME_RATE = 1.449; // ~15 s no nível 1 → ~45 min no nível 15
const PRICE_BASE = 12;
const PRICE_RATE = 1.664; // ~10 → ~15 000 moedas
const XP_BASE = 8;
const XP_RATE = 1.446;
const SEED_RATIO = 0.32; // semente ≈ 1/3 do preço de venda → margem saudável

/** Arredonda pra valores "redondos" e legíveis na loja. */
function niceRound(n: number): number {
  if (n < 10) return Math.round(n);
  if (n < 100) return Math.round(n / 5) * 5;
  if (n < 1000) return Math.round(n / 10) * 10;
  if (n < 10000) return Math.round(n / 50) * 50;
  return Math.round(n / 100) * 100;
}

const growSeconds = (lvl: number) =>
  niceRound(TIME_BASE * TIME_RATE ** (lvl - 1));
const sellPrice = (lvl: number) =>
  niceRound(PRICE_BASE * PRICE_RATE ** (lvl - 1));
const xpReward = (lvl: number) => niceRound(XP_BASE * XP_RATE ** (lvl - 1));
const seedCost = (lvl: number) => niceRound(sellPrice(lvl) * SEED_RATIO);

/** Faixa de raridade por nível (mantém o mesmo agrupamento de antes). */
function rarityForLevel(lvl: number): Rarity {
  if (lvl <= 4) return "common";
  if (lvl <= 8) return "uncommon";
  if (lvl <= 11) return "rare";
  if (lvl <= 13) return "epic";
  return "legendary";
}

// ─── Identidade de cada semente (a "escada" — 1 por nível) ────────────────────
// Só identidade/aparência/peculiaridade ficam aqui; tempo/preço/xp vêm do nível.

interface CropSeed {
  id: CropId;
  emoji: string;
  name: string;
  color: string;
  color3d: number;
  visual: PlantVisual;
  peculiarity: PeculiarityId;
}

// A ordem É o nível: índice 0 → nível 1, índice 14 → nível 15.
const LADDER: CropSeed[] = [
  { id: "wheat",        emoji: "🌾", name: "Wheat",        color: "#F59E0B", color3d: 0xd9a02b, visual: "wheat",       peculiarity: "hardy" },
  { id: "lettuce",      emoji: "🥬", name: "Lettuce",      color: "#84CC16", color3d: 0x84cc16, visual: "lettuce",     peculiarity: "tender" },
  { id: "carrot",       emoji: "🥕", name: "Carrot",       color: "#F97316", color3d: 0xf97316, visual: "carrot",      peculiarity: "deep_root" },
  { id: "potato",       emoji: "🥔", name: "Potato",       color: "#A16207", color3d: 0xb8860b, visual: "potato",      peculiarity: "sprouter" },
  { id: "corn",         emoji: "🌽", name: "Corn",         color: "#FCD34D", color3d: 0xfcd34d, visual: "corn",        peculiarity: "full_ear" },
  { id: "tomato",       emoji: "🍅", name: "Tomato",       color: "#EF4444", color3d: 0xef4444, visual: "tomato",      peculiarity: "succulent" },
  { id: "strawberry",   emoji: "🍓", name: "Strawberry",   color: "#FB7185", color3d: 0xfb7185, visual: "strawberry",  peculiarity: "sweet" },
  { id: "sunflower",    emoji: "🌻", name: "Sunflower",    color: "#EAB308", color3d: 0xfacc15, visual: "sunflower",   peculiarity: "heliotrope" },
  { id: "pumpkin",      emoji: "🎃", name: "Pumpkin",      color: "#EA580C", color3d: 0xea580c, visual: "pumpkin",     peculiarity: "giant" },
  { id: "watermelon",   emoji: "🍉", name: "Watermelon",   color: "#16A34A", color3d: 0x15803d, visual: "watermelon",  peculiarity: "juicy" },
  { id: "grape",        emoji: "🍇", name: "Grape",        color: "#7C3AED", color3d: 0x7c3aed, visual: "grape",       peculiarity: "noble" },
  { id: "dragonfruit",  emoji: "🐉", name: "Dragonfruit",  color: "#EC4899", color3d: 0xec4899, visual: "dragonfruit", peculiarity: "exotic" },
  { id: "golden_wheat", emoji: "✨", name: "Golden Wheat", color: "#FBBF24", color3d: 0xffd700, visual: "wheat",       peculiarity: "aureate" },
  { id: "crystal_rose", emoji: "💎", name: "Crystal Rose", color: "#22D3EE", color3d: 0x22d3ee, visual: "crystal",     peculiarity: "shimmer" },
  { id: "star_fruit",   emoji: "🌟", name: "Star Fruit",   color: "#FDE047", color3d: 0xfde047, visual: "starfruit",   peculiarity: "stellar" },
];

function buildCrop(seed: CropSeed, level: number): Crop {
  return {
    ...seed,
    minLevel: level,
    rarity: rarityForLevel(level),
    growTime: growSeconds(level) * 1000,
    price: sellPrice(level),
    seedCost: seedCost(level),
    xp: xpReward(level),
  };
}

// ─── Catálogo (o "mapa" das sementes) ─────────────────────────────────────────

export const CROPS: Record<CropId, Crop> = LADDER.reduce(
  (acc, seed, i) => {
    acc[seed.id] = buildCrop(seed, i + 1);
    return acc;
  },
  {} as Record<CropId, Crop>,
);

export const CROP_LIST = Object.values(CROPS).sort(
  (a, b) => a.minLevel - b.minLevel,
);

/** Sementes destravadas no nível atual (loja sempre mostra todas; estas são compráveis). */
export const unlockedCrops = (level: number) =>
  CROP_LIST.filter((c) => level >= c.minLevel);

// ─── Invariante da regra (validado em dev) ────────────────────────────────────
// Garante "quanto maior o nível, maior o tempo e maior o ganho". Se alguém
// reorganizar o LADDER ou as constantes e quebrar a monotonicidade, estoura cedo.

export function assertLevelCurve(): void {
  let pt = -1;
  let pp = -1;
  let px = -1;
  for (const c of CROP_LIST) {
    if (c.growTime <= pt || c.price <= pp || c.xp <= px) {
      throw new Error(
        `[crops] curva de nível não-crescente em "${c.id}" (lvl ${c.minLevel}): ` +
          `growTime=${c.growTime} price=${c.price} xp=${c.xp}`,
      );
    }
    if (c.price <= c.seedCost) {
      throw new Error(
        `[crops] "${c.id}" sem margem de lucro (price ${c.price} <= seed ${c.seedCost})`,
      );
    }
    pt = c.growTime;
    pp = c.price;
    px = c.xp;
  }
}

// @ts-ignore — __DEV__ existe em runtime React Native
if (typeof __DEV__ !== "undefined" && __DEV__) assertLevelCurve();
