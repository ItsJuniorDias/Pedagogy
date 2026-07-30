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

// ─── Balanceamento (30/07/2026): aperto econômico ────────────────────────────
// Late-game estava com "torneiras" que somavam demais em campos cheios.
// Alvo do nerf: multiplicadores de MOEDAS (sell/coin/yield). XP e growth ficam
// como estavam — não são vetores de dinheiro, aceleram progressão sadia.
// Ver assertEconomyProfile() no fim do arquivo para os limites que não podem
// ser furados sem alarme.

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
    // Nerf: 20% → 15%. Double harvest ainda vale a pena, mas menos torneira.
    desc: "Multiplies underground — 15% chance of a double harvest.",
    effect: { kind: "yield", value: 0.15 },
  },
  full_ear: {
    id: "full_ear",
    emoji: "🌽",
    label: "Full Ear",
    // Water default caiu de +20% pra +10%, então o "vs" mudou de referência.
    desc: "Loves water — watering pays +25% (vs +10%).",
    effect: { kind: "water", value: 0.25 },
  },
  succulent: {
    id: "succulent",
    emoji: "🍅",
    label: "Succulent",
    // Nerf: +12% → +8%. Sell multiplier era o dreno mais silencioso em mid-game.
    desc: "Plump and rich — +8% coins.",
    effect: { kind: "sell", value: 1.08 },
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
    // Nerf: 25% → 18%.
    desc: "Grows huge — 18% chance of a double harvest.",
    effect: { kind: "yield", value: 0.18 },
  },
  juicy: {
    id: "juicy",
    emoji: "🍉",
    label: "Juicy",
    // Nerf: +40% → +30%. Ainda o maior water bonus — segue sendo o incentivo.
    desc: "Bursting with water — watering pays +30%.",
    effect: { kind: "water", value: 0.3 },
  },
  noble: {
    id: "noble",
    emoji: "🍇",
    label: "Noble Cluster",
    // Nerf: +18% → +12%.
    desc: "A fine vintage — +12% coins.",
    effect: { kind: "sell", value: 1.12 },
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
    // Nerf pesado: 1.500 → 500 moedas fixas. Campo cheio de golden_wheat dava
    // +37.500 moedas grátis por ciclo, mais que qualquer coisa razoável — era
    // um cheat pack disfarçado de peculiaridade.
    desc: "Drips pure gold — +500 bonus coins per harvest.",
    effect: { kind: "coin", value: 500 },
    accent: "spark",
  },
  shimmer: {
    id: "shimmer",
    emoji: "💎",
    label: "Shimmering",
    // Nerf: 30% → 20%.
    desc: "Fractures into more — 20% chance of a double harvest.",
    effect: { kind: "yield", value: 0.2 },
    accent: "glow",
  },
  stellar: {
    id: "stellar",
    emoji: "🌟",
    label: "Stellar",
    // Nerf: +40% → +22%. Continua sendo o maior sell multiplier (endgame),
    // mas não vira mais torneira quando o preço-base já é 14.800 moedas.
    desc: "Worth a fortune — +22% coins.",
    effect: { kind: "sell", value: 1.22 },
    accent: "spark",
  },
};

export const peculiarityOf = (c: Crop): Peculiarity => PECULIARITIES[c.peculiarity];

export const effectOf = (c: Crop): PeculiarityEffect =>
  PECULIARITIES[c.peculiarity].effect;

// ─── Trava de perfil econômico (validado em dev) ─────────────────────────────
// Mesma ideia dos assertLevelCurve() e assertCoinLadder(): garante que ninguém
// (nem eu daqui a 3 meses esquecido do porquê) inflacione a economia de volta
// pro "modo torneira" que forçou o aperto de 30/07/2026. Se editar aqui pra
// afrouxar, é pra ser uma decisão deliberada — não erro de vírgula.

const CAPS = {
  sell: 1.25, // teto de multiplicador de venda por peculiaridade
  yield: 0.22, // teto de chance de colheita dupla
  water: 0.35, // teto de bônus de água por peculiaridade
  coin: 800, // teto de bônus fixo em moedas por colheita
  xp: 1.3, // teto de multiplicador de XP (não é dinheiro mas empurra progressão)
  growth: 1.3, // teto de multiplicador de velocidade
};

export function assertEconomyProfile(): void {
  for (const p of Object.values(PECULIARITIES)) {
    const { kind, value } = p.effect;
    const cap = CAPS[kind];
    if (value > cap) {
      throw new Error(
        `[peculiarity] "${p.id}" com ${kind}=${value} acima do teto ${cap}. ` +
          `Se é intencional, suba o cap em CAPS e documente por quê.`,
      );
    }
  }
}

// @ts-ignore — __DEV__ existe em runtime React Native
if (typeof __DEV__ !== "undefined" && __DEV__) assertEconomyProfile();
