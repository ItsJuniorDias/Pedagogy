/**
 * Glass.tsx — Vidro ESCURO (tint dark + véu azul-noite + borda azulada).
 * Identidade própria deste jogo, diferente do vidro claro do FarmGame.
 */

import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet } from "react-native";
import { NEON } from "../theme";

export const Glass: React.FC<{
  style?: any;
  intensity?: number;
  children: React.ReactNode;
}> = ({ style, intensity = 50, children }) => (
  <BlurView
    intensity={intensity}
    tint="dark"
    experimentalBlurMethod="dimezisBlurView"
    style={[gs.glass, style]}
  >
    {children}
  </BlurView>
);

const gs = StyleSheet.create({
  glass: {
    overflow: "hidden",
    backgroundColor: NEON.panel,
    borderWidth: 1,
    borderColor: NEON.edge,
  },
});
