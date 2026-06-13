/**
 * ModeSelect.tsx — Menu inicial: jogar contra a CPU ou no saguão multiplayer.
 */

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Identity } from "../net";
import { shared } from "../styles";
import { FF, NEON } from "../theme";
import { Glass } from "./Glass";

interface Props {
  you: Identity;
  onSolo: () => void;
  onMultiplayer: () => void;
}

export const ModeSelect: React.FC<Props> = ({ you, onSolo, onMultiplayer }) => {
  const insets = useSafeAreaInsets();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(float, { toValue: 0, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]),
    ).start();
  }, []);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <View style={[ms.root, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 24 }]}>
      <Animated.Text style={[ms.logo, { transform: [{ translateY }] }]}>🏓</Animated.Text>
      <Text style={ms.title}>NEON PONG</Text>
      <Text style={ms.sub}>
        hi, {you.emoji} {you.nick}
      </Text>

      <View style={ms.menu}>
        <TouchableOpacity activeOpacity={0.85} onPress={onMultiplayer}>
          <View style={shared.floatShadow}>
            <Glass style={[ms.card, { borderColor: "rgba(34,211,238,0.55)" }]} intensity={60}>
              <Text style={ms.cardEmoji}>🌐</Text>
              <View style={ms.cardText}>
                <Text style={[ms.cardTitle, { color: NEON.cyan }]}>MULTIPLAYER</Text>
                <Text style={ms.cardSub}>join the lobby and face another player</Text>
              </View>
            </Glass>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={onSolo}>
          <View style={shared.floatShadow}>
            <Glass style={[ms.card, { borderColor: "rgba(244,114,182,0.5)" }]} intensity={60}>
              <Text style={ms.cardEmoji}>🤖</Text>
              <View style={ms.cardText}>
                <Text style={[ms.cardTitle, { color: NEON.magenta }]}>SOLO vs CPU</Text>
                <Text style={ms.cardSub}>train against the machine · persistent ranking</Text>
              </View>
            </Glass>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />
      <Text style={ms.foot}>first to 7 · drag to move your paddle</Text>
    </View>
  );
};

const ms = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NEON.bg,
    alignItems: "center",
    paddingHorizontal: 26,
  },
  logo: { fontSize: 64, marginBottom: 4 },
  title: { fontFamily: FF, fontSize: 32, color: NEON.text, letterSpacing: 6 },
  sub: { fontFamily: FF, fontSize: 12, color: NEON.dim, letterSpacing: 1, marginTop: 4, marginBottom: 30 },
  menu: { alignSelf: "stretch", gap: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderRadius: 24,
  },
  cardEmoji: { fontSize: 38 },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: FF, fontSize: 18, letterSpacing: 2 },
  cardSub: { fontFamily: FF, fontSize: 10, color: NEON.dim, letterSpacing: 0.5, lineHeight: 15 },
  foot: { fontFamily: FF, fontSize: 10, color: NEON.dim, letterSpacing: 1.5 },
});
