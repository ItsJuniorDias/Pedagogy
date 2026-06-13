/**
 * StartOverlay.tsx — Overlay arcade "TAP TO PLAY" (pulsa continuamente).
 */

import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { shared } from "../styles";
import { FF, NEON } from "../theme";
import { Glass } from "./Glass";

interface Props {
  pulseOpacity: Animated.AnimatedInterpolation<number>;
  pulseScale: Animated.AnimatedInterpolation<number>;
  onPlay: () => void;
}

export const StartOverlay: React.FC<Props> = ({
  pulseOpacity,
  pulseScale,
  onPlay,
}) => (
  <View style={so.startWrap} pointerEvents="box-none">
    <Animated.View
      style={[
        shared.floatShadow,
        { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
      ]}
    >
      <TouchableOpacity onPress={onPlay} activeOpacity={0.85}>
        <Glass style={so.startBtn} intensity={60}>
          <Text style={so.startEm}>🏓</Text>
          <Text style={so.startTxt}>TAP TO PLAY</Text>
          <Text style={so.startSub}>drag your paddle · first to 7</Text>
        </Glass>
      </TouchableOpacity>
    </Animated.View>
  </View>
);

const so = StyleSheet.create({
  startWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtn: {
    alignItems: "center",
    paddingHorizontal: 38,
    paddingVertical: 22,
    borderRadius: 28,
    gap: 3,
    borderColor: "rgba(34,211,238,0.5)",
  },
  startEm: { fontSize: 36 },
  startTxt: {
    fontFamily: FF,
    fontSize: 21,
    color: NEON.cyan,
    letterSpacing: 3,
  },
  startSub: {
    fontFamily: FF,
    fontSize: 9,
    color: NEON.dim,
    letterSpacing: 1.5,
  },
});
