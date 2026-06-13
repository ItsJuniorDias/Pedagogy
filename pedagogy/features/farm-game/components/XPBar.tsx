// features/farm-game/components/XPBar.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";

import { XP_FOR_LEVEL } from "../data/leveling";
import { s } from "../styles";

// ─── XP Bar ───────────────────────────────────────────────────────────────────

export const XPBar: React.FC<{ xp: number; level: number }> = ({
  xp,
  level,
}) => {
  const curXp = XP_FOR_LEVEL(level - 1);
  const nxtXp = XP_FOR_LEVEL(level);
  const progress = nxtXp > curXp ? (xp - curXp) / (nxtXp - curXp) : 1;
  const pct = Math.round(progress * 100);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 450,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [progress]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={s.xpWrap}>
      <View style={s.xpTrack}>
        <Animated.View style={[s.xpFill, { width: barWidth }]}>
          <View style={s.xpShine} />
        </Animated.View>
      </View>
      <View style={s.xpRow}>
        <Text style={s.xpText}>
          {xp - curXp} / {nxtXp - curXp} XP
        </Text>
        <Text style={s.xpPct}>{pct}%</Text>
      </View>
    </View>
  );
};
