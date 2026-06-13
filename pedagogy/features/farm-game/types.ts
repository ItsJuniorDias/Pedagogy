// features/farm-game/types.ts
import type { Animated } from "react-native";

// ─── IDs & enums ──────────────────────────────────────────────────────────────

export type CropId =
  | "wheat"
  | "lettuce"
  | "carrot"
  | "potato"
  | "corn"
  | "tomato"
  | "strawberry"
  | "sunflower"
  | "pumpkin"
  | "watermelon"
  | "grape"
  | "dragonfruit"
  | "golden_wheat"
  | "crystal_rose"
  | "star_fruit";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type TileState = "empty" | "tilled" | "planted" | "growing" | "ready";
export type ToolId = "till" | "seed" | "harvest" | "water";

/** Construções decorativas compráveis na loja (níveis altos). */
export type StructureId = "doghouse" | "farmhouse" | "barn" | "beehive";

/** Traço único de cada semente — sua "peculiaridade". */
export type PeculiarityId =
  | "hardy"
  | "tender"
  | "deep_root"
  | "sprouter"
  | "full_ear"
  | "succulent"
  | "sweet"
  | "heliotrope"
  | "giant"
  | "juicy"
  | "noble"
  | "exotic"
  | "aureate"
  | "shimmer"
  | "stellar";

/**
 * Como a peculiaridade age na colheita/crescimento. Um único `kind` + `value`
 * por semente mantém a regra simples e testável:
 *  - growth → multiplicador de velocidade de crescimento (>1 = mais rápido)
 *  - sell   → multiplicador de moedas na venda (>1)
 *  - xp     → multiplicador de XP (>1)
 *  - yield  → probabilidade (0-1) de colheita dupla
 *  - water  → fração de bônus ao regar (substitui o padrão de 0.20)
 *  - coin   → moedas fixas somadas a cada colheita
 */
export type PeculiarityEffectKind =
  | "growth"
  | "sell"
  | "xp"
  | "yield"
  | "water"
  | "coin";

export interface PeculiarityEffect {
  kind: PeculiarityEffectKind;
  value: number;
}

/** Floreio 3D opcional exibido na planta madura ("no mapa"). */
export type PlantAccent = "spark" | "glow" | "petals";

export interface Peculiarity {
  id: PeculiarityId;
  emoji: string;
  label: string;
  /** Texto curto mostrado na loja. */
  desc: string;
  effect: PeculiarityEffect;
  accent?: PlantAccent;
}

/** Arquétipos visuais 3D — um modelo dedicado por cultura. */
export type PlantVisual =
  | "wheat"
  | "lettuce"
  | "carrot"
  | "potato"
  | "corn"
  | "tomato"
  | "strawberry"
  | "sunflower"
  | "starfruit"
  | "pumpkin"
  | "watermelon"
  | "grape"
  | "dragonfruit"
  | "crystal";

// ─── Entidades ──────────────────────────────────────────────────────────────

export interface Crop {
  id: CropId;
  emoji: string;
  name: string;
  growTime: number; // ms — derivado do nível (quanto maior o nível, maior o tempo)
  price: number; // derivado do nível (quanto maior o nível, maior o ganho)
  seedCost: number;
  xp: number;
  color: string;
  color3d: number; // cor principal da planta 3D madura
  rarity: Rarity;
  /** Nível em que a semente é destravada na loja. É a ÚNICA regra de disponibilidade. */
  minLevel: number;
  visual: PlantVisual;
  /** Traço característico desta semente. */
  peculiarity: PeculiarityId;
}

export interface Tile {
  id: number;
  state: TileState;
  cropId?: CropId;
  plantedAt?: number;
  watered: boolean;
  waterCount: number;
}

export interface FloatingLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  anim: Animated.Value;
}

export interface GameState {
  tiles: Tile[];
  gold: number;
  xp: number;
  level: number;
  selectedTool: ToolId;
  selectedCrop: CropId;
  day: number;
  totalHarvested: number;
  /** Total de moedas compradas no mercado (analytics / conquistas). */
  coinsPurchased: number;
  /** Construções já compradas (aparecem no cenário ao redor da fazenda). */
  structures: Record<StructureId, boolean>;
}
