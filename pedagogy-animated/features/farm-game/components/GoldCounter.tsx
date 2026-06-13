// features/farm-game/components/GoldCounter.tsx
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";

import { s } from "../styles";

// ─── Animated Gold Counter ────────────────────────────────────────────────────

export const GoldCounter: React.FC<{ gold: number; onPress?: () => void }> = ({
  gold,
  onPress,
}) => {
  const anim = useRef(new Animated.Value(gold)).current;
  const [display, setDisplay] = useState(gold);

  useEffect(() => {
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: gold,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [gold]);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={s.goldChip}>
        <Text style={s.goldIcon}>💰</Text>
        <Text style={s.goldTxt}>{display.toLocaleString()}</Text>
        {onPress && (
          <View style={s.goldPlus}>
            <Text style={s.goldPlusTxt}>+</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
