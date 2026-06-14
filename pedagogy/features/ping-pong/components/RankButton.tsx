/**
 * RankButton.tsx — Pílula flutuante em dark glass que mostra a patente +
 * pontuação vitalícia e abre o ranking ao toque.
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { shared } from "../styles";
import { rankedDivisionForMMR, tierForPoints } from "../storage";
import { FF } from "../theme";
import { Glass } from "./Glass";

interface Props {
  top: number;
  totalPoints: number;
  onPress: () => void;
  /** "points" (padrão) mostra a patente vitalícia; "ranked" mostra a divisão/MMR. */
  variant?: "points" | "ranked";
  /** MMR atual — usado quando variant === "ranked". */
  rankedMMR?: number;
}

export const RankButton: React.FC<Props> = ({
  top,
  totalPoints,
  onPress,
  variant = "points",
  rankedMMR = 0,
}) => {
  const ranked = variant === "ranked";
  const tier = ranked
    ? rankedDivisionForMMR(rankedMMR)
    : tierForPoints(totalPoints);
  const value = ranked
    ? String(rankedMMR)
    : totalPoints.toLocaleString("en-US");
  return (
    <TouchableOpacity
      style={[rb.wrap, { top }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Glass style={rb.pill} intensity={55}>
        <Text style={rb.emoji}>{tier.current.emoji}</Text>
        <Text style={[rb.pts, { color: tier.current.color }]}>{value}</Text>
      </Glass>
    </TouchableOpacity>
  );
};

const rb = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 18,
    ...shared.floatShadow,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  emoji: { fontSize: 15 },
  pts: { fontFamily: FF, fontSize: 13, letterSpacing: 1 },
});
