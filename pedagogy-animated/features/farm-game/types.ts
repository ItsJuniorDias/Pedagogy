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
  growTime: number; // ms
  price: number;
  seedCost: number;
  xp: number;
  color: string;
  color3d: number; // cor principal da planta 3D madura
  rarity: Rarity;
  minLevel: number;
  visual: PlantVisual;
  /** Chance (0-1) de aparecer na loja a cada novo dia. 1 = sempre. */
  appearChance: number;
  /** Estoque por dia quando aparece. Infinity para comuns. */
  stockPerDay: number;
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
  /** Estoque diário de itens rare+ sorteados hoje. Ausente = não apareceu. */
  dailyStock: Partial<Record<CropId, number>>;
  /** Total de moedas compradas no mercado (analytics / conquistas). */
  coinsPurchased: number;
}
