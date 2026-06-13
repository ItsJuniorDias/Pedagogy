// features/farm-game/data/structures.ts
import type { StructureId } from "../types";

// ─── Direções de tela → vetores no chão ───────────────────────────────────────
// A câmera é fixa (só dá pan, não gira), então estes vetores são constantes.
// Derivados da câmera ortográfica em (8,10,8) olhando pra origem:
//   • arrastar pra CIMA  revela  screenUp   = (-0.7071, 0, -0.7071)
//   • arrastar pra DIR.  revela  screenRight= ( 0.7071, 0, -0.7071)
//   • arrastar pra BAIXO revela  screenDown = ( 0.7071, 0,  0.7071)
const SQ = Math.SQRT1_2; // 0.7071

export const SCREEN_DIRS = {
  up: { x: -SQ, z: -SQ },
  right: { x: SQ, z: -SQ },
  down: { x: SQ, z: SQ },
  left: { x: -SQ, z: SQ },
} as const;

export type ScreenDir = keyof typeof SCREEN_DIRS;

export interface Structure {
  id: StructureId;
  emoji: string;
  name: string;
  desc: string;
  /** Custo em moedas. */
  cost: number;
  /** Nível mínimo pra desbloquear (alto — recompensa de fim de jogo). */
  minLevel: number;
  /** Em qual direção da tela ela aparece (e o pan necessário pra vê-la). */
  dir: ScreenDir;
  /** Distância do centro da fazenda, em unidades de mundo. */
  dist: number;
  /** Dica mostrada na loja. */
  hint: string;
}

// ─── Catálogo ─────────────────────────────────────────────────────────────────

export const STRUCTURES: Record<StructureId, Structure> = {
  doghouse: {
    id: "doghouse",
    emoji: "🐶",
    name: "Doghouse",
    desc: "A loyal pup that guards the farm.",
    cost: 2_000,
    minLevel: 7,
    dir: "up",
    dist: 6,
    hint: "⬆️ Drag up to visit",
  },
  farmhouse: {
    id: "farmhouse",
    emoji: "🏡",
    name: "Farmer's House",
    desc: "A cozy cottage with a chimney and flower boxes.",
    cost: 6_000,
    minLevel: 9,
    dir: "left",
    dist: 6,
    hint: "⬅️ Drag left to visit",
  },
  barn: {
    id: "barn",
    emoji: "🐮",
    name: "Barn & Cow",
    desc: "A red barn sheltering a happy dairy cow.",
    cost: 14_000,
    minLevel: 11,
    dir: "right",
    dist: 6,
    hint: "➡️ Drag right to visit",
  },
  beehive: {
    id: "beehive",
    emoji: "🐝",
    name: "Beehive",
    desc: "Buzzing bees and jars of sweet honey.",
    cost: 45_000,
    minLevel: 14,
    dir: "down",
    dist: 6,
    hint: "⬇️ Drag down to visit",
  },
};

export const STRUCTURE_LIST = Object.values(STRUCTURES).sort(
  (a, b) => a.minLevel - b.minLevel,
);

/** Posição da construção no mundo (chão), a partir da direção + distância. */
export function structurePos(id: StructureId): { x: number; z: number } {
  const st = STRUCTURES[id];
  const d = SCREEN_DIRS[st.dir];
  return { x: d.x * st.dist, z: d.z * st.dist };
}
