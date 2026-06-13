/**
 * PongHub.tsx — Container raiz do NEON PONG 🏓
 *
 * Junta tudo: menu inicial → saguão multiplayer → partida em rede, além do
 * modo solo contra a CPU. Carrega a fonte e provê o SafeArea uma única vez.
 *
 *   import PongHub from "@/features/ping-pong";
 *   <PongHub />
 */

import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import React, { useState } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Glass, Lobby, ModeSelect } from "./components";
import { MultiplayerPongGame } from "./MultiplayerPongGame";
import { useLobbySocket } from "./net";
import { PongGameInner } from "./PingPongGame";
import { FF, NEON } from "./theme";

type Mode = "menu" | "solo" | "mp";

function HubInner() {
  const [mode, setMode] = useState<Mode>("menu");
  const lobby = useLobbySocket();

  // ── Menu ──
  if (mode === "menu") {
    return (
      <ModeSelect
        you={lobby.you}
        onSolo={() => setMode("solo")}
        onMultiplayer={() => {
          lobby.joinLobby();
          setMode("mp");
        }}
      />
    );
  }

  // ── Solo vs CPU ──
  if (mode === "solo") {
    return (
      <View style={{ flex: 1 }}>
        <PongGameInner />
        <SoloBackButton onPress={() => setMode("menu")} />
      </View>
    );
  }

  // ── Multiplayer ──
  if (lobby.match) {
    return (
      <MultiplayerPongGame
        you={lobby.you}
        opponent={lobby.match.opponent}
        net={lobby.net}
        opponentLeft={lobby.opponentLeft}
        onExit={() => {
          lobby.leaveMatch();
          setMode("menu");
        }}
        onBackToLobby={() => lobby.backToLobby()}
      />
    );
  }

  return (
    <Lobby
      status={lobby.status}
      you={lobby.you}
      players={lobby.lobby.players}
      count={lobby.lobby.count}
      onRetry={lobby.retry}
      onLeave={() => {
        lobby.leaveLobby();
        setMode("menu");
      }}
    />
  );
}

/** Botãozinho de voltar sobreposto ao jogo solo. */
const SoloBackButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      style={[sb.btn, { top: insets.top + 12 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Glass style={sb.glass} intensity={55}>
        <Text style={sb.txt}>‹</Text>
      </Glass>
    </TouchableOpacity>
  );
};

export default function PongHub() {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: NEON.bg }} />;
  }
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <HubInner />
    </SafeAreaProvider>
  );
}

const sb = StyleSheet.create({
  btn: { position: "absolute", left: 16, zIndex: 20 },
  glass: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  txt: { fontFamily: FF, fontSize: 20, color: NEON.text },
});
