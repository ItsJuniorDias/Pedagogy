// features/farm-game/components/FloatLabel.tsx
import React from "react";
import { Animated } from "react-native";

import { s } from "../styles";
import type { FloatingLabel } from "../types";

// ─── Floating Label ───────────────────────────────────────────────────────────

export const FloatLabel: React.FC<{ label: FloatingLabel }> = ({ label }) => {
  const ty = label.anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });
  const op = label.anim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });
  return (
    <Animated.Text
      style={[
        s.floatText,
        { color: label.color, transform: [{ translateY: ty }], opacity: op },
      ]}
    >
      {label.text}
    </Animated.Text>
  );
};
