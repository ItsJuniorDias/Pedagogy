// features/farm-game/state/rewards.ts
import { effectOf } from "../data/peculiarities";
import type { Crop, Tile } from "../types";

export interface HarvestResult {
  gold: number;
  xp: number;
  /** A peculiaridade "yield" rendeu colheita dupla nesta vez. */
  doubled: boolean;
}

const WATER_BONUS_DEFAULT = 0.2; // +20% de moedas ao colher algo que foi regado

/**
 * Recompensa pura de uma colheita, já aplicando a peculiaridade da semente.
 * `rand` é injetável pra deixar o efeito "yield" testável (default = Math.random).
 */
export function computeHarvest(
  crop: Crop,
  tile: Pick<Tile, "watered" | "waterCount">,
  rand: () => number = Math.random,
): HarvestResult {
  const eff = effectOf(crop);
  const watered = tile.waterCount > 0;
  const waterFrac = eff.kind === "water" ? eff.value : WATER_BONUS_DEFAULT;

  let gold = crop.price;
  if (watered) gold += Math.floor(crop.price * waterFrac);
  if (eff.kind === "sell") gold = Math.floor(gold * eff.value);
  if (eff.kind === "coin") gold += eff.value;

  let xp = crop.xp;
  if (eff.kind === "xp") xp = Math.floor(xp * eff.value);

  let doubled = false;
  if (eff.kind === "yield" && rand() < eff.value) {
    doubled = true;
    gold *= 2;
    xp *= 2;
  }

  return { gold, xp, doubled };
}

/** Multiplicador de velocidade de crescimento da semente (1 = normal). */
export function growthMultiplier(crop: Crop): number {
  const eff = effectOf(crop);
  return eff.kind === "growth" ? eff.value : 1;
}
