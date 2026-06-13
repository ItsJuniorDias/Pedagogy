// features/farm-game/data/shop.ts
import type { Crop, Rarity } from "../types";
import { CROP_LIST, RARITY_META } from "./crops";
import type { Structure } from "./structures";
import { STRUCTURE_LIST } from "./structures";

// ─── Catálogo da loja (uma única fonte da verdade pra UI) ─────────────────────
// A loja não é mais só de sementes: agora tem sementes (agrupadas por raridade)
// E construções. Pra escalar — mais itens, mais níveis, ou um TIPO novo de item
// (ex.: animais, ferramentas) — basta adicionar entradas/seções aqui; o
// ShopModal renderiza o que vier sem precisar mudar.
//
// Estrutura:
//   ShopEntry   → um item comprável (discriminado por `kind`)
//   ShopSection → um painel do accordion (título, faixa de nível, itens)
//   SHOP_SECTIONS → a lista pronta, derivada dos catálogos estáticos

/** Um item da loja. União discriminada → o render escolhe a linha certa por `kind`. */
export type ShopEntry =
  | { kind: "crop"; id: string; minLevel: number; crop: Crop }
  | { kind: "structure"; id: string; minLevel: number; structure: Structure };

/** Tipo da seção — guia o resumo do cabeçalho (desbloqueadas vs. possuídas). */
export type SectionKind = "seeds" | "buildings";

export interface ShopSection {
  /** ID estável (usado como chave do accordion). */
  id: string;
  kind: SectionKind;
  emoji: string;
  title: string;
  /** Cor de destaque (ponto + título). */
  color: string;
  /** Dica curta sob o título quando aberta. */
  hint?: string;
  /** Faixa de níveis cobertos por esta seção: [min, max]. */
  levelRange: [number, number];
  items: ShopEntry[];
}

/** [min, max] de minLevel numa lista de itens (assume lista não-vazia). */
function levelRangeOf(items: ShopEntry[]): [number, number] {
  const levels = items.map((it) => it.minLevel);
  return [Math.min(...levels), Math.max(...levels)];
}

// ─── Seções de sementes: uma por raridade que tenha sementes ──────────────────
// Crescem sozinhas: adicione uma semente em data/crops.ts (ou suba o nível máximo)
// e ela cai na seção da raridade certa, na ordem de nível.

function seedSections(): ShopSection[] {
  const byRarity = new Map<Rarity, Crop[]>();
  for (const crop of CROP_LIST) {
    const arr = byRarity.get(crop.rarity) ?? [];
    arr.push(crop);
    byRarity.set(crop.rarity, arr);
  }

  return (
    [...byRarity.entries()]
      // ordena pela ordem canônica das raridades (common → legendary)
      .sort(([a], [b]) => RARITY_META[a].order - RARITY_META[b].order)
      .map(([rarity, crops]) => {
        const meta = RARITY_META[rarity];
        const items: ShopEntry[] = crops
          .slice()
          .sort((a, b) => a.minLevel - b.minLevel)
          .map((crop) => ({
            kind: "crop" as const,
            id: crop.id,
            minLevel: crop.minLevel,
            crop,
          }));
        return {
          id: `seeds:${rarity}`,
          kind: "seeds" as const,
          emoji: "🌱",
          title: meta.label,
          color: meta.color,
          hint:
            rarity === "common"
              ? "· starter seeds"
              : "· slower to grow · pays more",
          levelRange: levelRangeOf(items),
          items,
        };
      })
  );
}

// ─── Seção de construções ─────────────────────────────────────────────────────
// Mesma ideia: adicione uma construção em data/structures.ts e ela entra aqui,
// ordenada por nível. (Se um dia houver muitas, dá pra quebrar em sub-seções.)

function buildingSections(): ShopSection[] {
  if (STRUCTURE_LIST.length === 0) return [];
  const items: ShopEntry[] = STRUCTURE_LIST.slice()
    .sort((a, b) => a.minLevel - b.minLevel)
    .map((structure) => ({
      kind: "structure" as const,
      id: structure.id,
      minLevel: structure.minLevel,
      structure,
    }));
  return [
    {
      id: "buildings",
      kind: "buildings" as const,
      emoji: "🏗️",
      title: "Buildings",
      color: "#8B5CF6",
      hint: "· décor · drag the field to visit",
      levelRange: levelRangeOf(items),
      items,
    },
  ];
}

/**
 * Todas as seções da loja, na ordem de exibição.
 * Sementes primeiro (por raridade), construções depois. Tipos novos de item
 * podem ser anexados aqui sem tocar no componente.
 */
export const SHOP_SECTIONS: ShopSection[] = [
  ...seedSections(),
  ...buildingSections(),
];
