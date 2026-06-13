/**
 * FloatLabel.tsx — Texto que sobe e some (POINT! / CPU POINT…).
 */

import React from "react";
import { Animated, StyleSheet } from "react-native";
import { FF } from "../theme";
import type { FloatingLabel } from "../types";

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
        fs.floatText,
        { color: label.color, transform: [{ translateY: ty }], opacity: op },
      ]}
    >
      {label.text}
    </Animated.Text>
  );
};

const fs = StyleSheet.create({
  floatText: {
    fontFamily: FF,
    fontSize: 18,
    letterSpacing: 1.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
