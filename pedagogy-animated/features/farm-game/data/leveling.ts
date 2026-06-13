// features/farm-game/data/leveling.ts

export const LEVEL_THRESHOLDS = [
  0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 8000, 12000, 17500, 25000,
  35000, 50000,
];

export const XP_FOR_LEVEL = (lvl: number) =>
  LEVEL_THRESHOLDS[Math.min(lvl, LEVEL_THRESHOLDS.length - 1)];

export function xpToLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 1; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}
