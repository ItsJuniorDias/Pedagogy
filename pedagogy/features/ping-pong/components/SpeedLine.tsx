/**
 * SpeedLine.tsx — Linha de velocidade neon embutida no scoreboard (1x → 2x).
 */

import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { FF, NEON } from "../theme";

export const SpeedLine: React.FC<{ speedMul: number }> = ({ speedMul }) => {
  const progress = Math.min(1, (speedMul - 1) / 1); // 1x → 2x
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 350,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [progress]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["3%", "100%"],
  });

  return (
    <View style={ss.speedRow}>
      <Text style={ss.speedLbl}>SPD</Text>
      <View style={ss.speedTrack}>
        <Animated.View style={[ss.speedFill, { width: barWidth }]} />
      </View>
      <Text style={ss.speedVal}>{speedMul.toFixed(2)}x</Text>
    </View>
  );
};

const ss = StyleSheet.create({
  speedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  speedLbl: {
    fontFamily: FF,
    fontSize: 8,
    color: NEON.dim,
    letterSpacing: 2,
  },
  speedTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(125,140,180,0.25)",
    overflow: "hidden",
  },
  speedFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: NEON.yellow,
  },
  speedVal: { fontFamily: FF, fontSize: 9, color: NEON.yellow },
});
