/**
 * Lobby.tsx — Saguão de espera (dark neon).
 *
 * Mostra seu apelido fofo, o status da conexão e fica "procurando oponente".
 * Assim que o servidor casa uma dupla, o container troca para a partida.
 */

import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ConnStatus, Identity } from "../net";
import { shared } from "../styles";
import { FF, NEON } from "../theme";
import { Glass } from "./Glass";

interface Props {
  status: ConnStatus;
  you: Identity;
  players: Identity[];
  count: number;
  onRetry: () => void;
  onLeave: () => void;
}

export const Lobby: React.FC<Props> = ({
  status,
  you,
  players,
  count,
  onRetry,
  onLeave,
}) => {
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ]),
    ).start();
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2600, useNativeDriver: true, easing: Easing.linear }),
    ).start();
  }, []);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const others = players.filter((p) => p.id !== you.id);
  const online = status === "online";

  return (
    <View style={[lb.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Text style={lb.title}>🏓 LOBBY</Text>

      {/* Sua identidade fofa */}
      <View style={shared.floatShadow}>
        <Glass style={lb.youCard} intensity={60}>
          <Text style={lb.youLabel}>YOU ARE</Text>
          <Text style={lb.youEmoji}>{you.emoji}</Text>
          <Text style={lb.youNick}>{you.nick}</Text>
        </Glass>
      </View>

      {/* Status / procurando */}
      {online ? (
        <Animated.View style={[lb.searchWrap, { opacity }]}>
          <Animated.Text style={[lb.searchSpin, { transform: [{ rotate }] }]}>🏓</Animated.Text>
          <Text style={lb.searchTxt}>FINDING OPPONENT…</Text>
          <Text style={lb.searchSub}>
            {count <= 1
              ? "you're alone in the lobby — the match starts as soon as someone joins!"
              : `${count} players in the lobby`}
          </Text>
        </Animated.View>
      ) : status === "connecting" ? (
        <View style={lb.searchWrap}>
          <ActivityIndicator color={NEON.cyan} />
          <Text style={lb.searchTxt}>CONNECTING…</Text>
        </View>
      ) : (
        <View style={lb.searchWrap}>
          <Text style={lb.offEmoji}>📡</Text>
          <Text style={[lb.searchTxt, { color: NEON.rose }]}>NO CONNECTION</Text>
          <Text style={lb.searchSub}>the lobby server is offline</Text>
          <TouchableOpacity style={lb.retryBtn} onPress={onRetry} activeOpacity={0.85}>
            <Text style={lb.retryTxt}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Outros jogadores esperando */}
      {online && others.length > 0 && (
        <ScrollView style={lb.listScroll} contentContainerStyle={lb.listContent}>
          <Text style={lb.listLabel}>IN QUEUE</Text>
          {others.map((p) => (
            <Glass key={p.id} style={lb.chip} intensity={45}>
              <Text style={lb.chipEmoji}>{p.emoji}</Text>
              <Text style={lb.chipNick}>{p.nick}</Text>
            </Glass>
          ))}
        </ScrollView>
      )}

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={lb.leaveBtn} onPress={onLeave} activeOpacity={0.85}>
        <Text style={lb.leaveTxt}>‹ BACK TO MENU</Text>
      </TouchableOpacity>
    </View>
  );
};

const lb = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NEON.bg,
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 18,
  },
  title: {
    fontFamily: FF,
    fontSize: 24,
    color: NEON.text,
    letterSpacing: 4,
  },
  youCard: {
    alignItems: "center",
    paddingHorizontal: 46,
    paddingVertical: 22,
    borderRadius: 28,
    gap: 4,
    borderColor: "rgba(34,211,238,0.5)",
  },
  youLabel: { fontFamily: FF, fontSize: 10, color: NEON.dim, letterSpacing: 3 },
  youEmoji: { fontSize: 54 },
  youNick: { fontFamily: FF, fontSize: 22, color: NEON.cyan, letterSpacing: 1 },
  searchWrap: { alignItems: "center", gap: 8, paddingHorizontal: 10 },
  searchSpin: { fontSize: 40 },
  searchTxt: { fontFamily: FF, fontSize: 14, color: NEON.text, letterSpacing: 2.5 },
  searchSub: {
    fontFamily: FF,
    fontSize: 11,
    color: NEON.dim,
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 17,
  },
  offEmoji: { fontSize: 38 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: NEON.cyan,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 14,
  },
  retryTxt: { fontFamily: FF, fontSize: 13, color: NEON.bg, letterSpacing: 2 },
  listScroll: { alignSelf: "stretch", maxHeight: 200 },
  listContent: { alignItems: "center", gap: 8, paddingVertical: 4 },
  listLabel: { fontFamily: FF, fontSize: 9, color: NEON.dim, letterSpacing: 3 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipEmoji: { fontSize: 18 },
  chipNick: { fontFamily: FF, fontSize: 13, color: NEON.text },
  leaveBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  leaveTxt: { fontFamily: FF, fontSize: 12, color: NEON.dim, letterSpacing: 2 },
});
