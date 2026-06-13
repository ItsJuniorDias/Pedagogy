// features/farm-game/data/tools.ts
import type { ToolId } from "../types";

export const TOOLS: {
  id: ToolId;
  emoji: string;
  label: string;
  color: string;
}[] = [
  { id: "till", emoji: "⛏️", label: "Till", color: "#78716C" },
  { id: "seed", emoji: "🌱", label: "Plant", color: "#22C55E" },
  { id: "water", emoji: "💧", label: "Water", color: "#3B82F6" },
  { id: "harvest", emoji: "🧺", label: "Harvest", color: "#F59E0B" },
];
