// features/farm-game/components/DayModal.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Modal, Text, TouchableOpacity, View } from "react-native";

import { s } from "../styles";

// ─── Day Modal ────────────────────────────────────────────────────────────────

export const DayModal: React.FC<{
  visible: boolean;
  day: number;
  gold: number;
  totalHarvested: number;
  onClose: () => void;
}> = ({ visible, day, gold, totalHarvested, onClose }) => {
  const sc = useRef(new Animated.Value(0.5)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sc, { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.timing(op, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      sc.setValue(0.5);
      op.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View style={[s.dayOverlay, { opacity: op }]}>
        <Animated.View style={[s.dayCard, { transform: [{ scale: sc }] }]}>
          <Text style={s.daySun}>🌅</Text>
          <Text style={s.dayTitle}>Day {day} Complete!</Text>
          <Text style={s.dayStat}>💰 Total coins: {gold.toLocaleString()}</Text>
          <Text style={s.dayStat}>🧺 Total harvested: {totalHarvested}</Text>
          <Text style={s.dayHint}>
            🌙 New day — crops need watering again. Level up to unlock more
            seeds!
          </Text>
          <TouchableOpacity style={s.dayBtn} onPress={onClose}>
            <Text style={s.dayBtnTxt}>Next Day ➡</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
