// features/farm-game/state/persistence.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEY } from "../constants";
import type { GameState } from "../types";

export function toPersistable(state: GameState) {
  // Tudo é serializável (plantedAt é epoch ms → crescimento offline grátis)
  const {
    tiles,
    gold,
    xp,
    level,
    selectedTool,
    selectedCrop,
    day,
    totalHarvested,
    coinsPurchased,
    structures,
  } = state;
  return {
    tiles,
    gold,
    xp,
    level,
    selectedTool,
    selectedCrop,
    day,
    totalHarvested,
    coinsPurchased,
    structures,
  };
}

export async function loadSave(): Promise<Partial<GameState> | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<GameState>) : null;
  } catch (e) {
    console.warn("[FarmGame] Failed to load save:", e);
    return null;
  }
}
