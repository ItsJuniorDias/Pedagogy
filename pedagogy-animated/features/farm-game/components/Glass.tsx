// features/farm-game/components/Glass.tsx
import { BlurView } from "expo-blur";
import React from "react";

import { s } from "../styles";

// ─── Liquid Glass wrapper ─────────────────────────────────────────────────────

export const Glass: React.FC<{
  style?: any;
  intensity?: number;
  children: React.ReactNode;
}> = ({ style, intensity = 45, children }) => (
  <BlurView
    intensity={intensity}
    tint="light"
    experimentalBlurMethod="dimezisBlurView"
    style={[s.glass, style]}
  >
    {children}
  </BlurView>
);
