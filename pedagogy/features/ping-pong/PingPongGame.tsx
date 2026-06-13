/**
 * PingPongGame.tsx — NEON PONG 🏓 (Three.js + Expo)
 *
 * Shell de apresentação: monta o cenário (GLView) em tela cheia e empilha a
 * HUD em dark glass. Toda a lógica de jogo mora em hooks/usePongGame.ts.
 *
 * Install dependencies:
 *   npx expo install expo-gl expo-three three
 *   npx expo install expo-blur react-native-safe-area-context
 *   npx expo install @expo-google-fonts/fredoka-one expo-font
 *
 * Usage:
 *   import PingPongGame from "@/features/ping-pong";
 *   <PingPongGame />
 */

import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import { GLView } from "expo-gl";
import React from "react";
import { Animated, StatusBar, StyleSheet, View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  ControlBar,
  FloatLabel,
  GameOverModal,
  RankButton,
  RankingModal,
  Scoreboard,
  StartOverlay,
} from "./components";
import { WIN_SCORE } from "./constants";
import { usePongGame } from "./hooks/usePongGame";
import { useRanking } from "./hooks/useRanking";
import { FF, NEON } from "./theme";
import type { Phase } from "./types";

const HINT: Record<Phase, string> = {
  idle: "FIRST TO 7 POINTS",
  serving: "GET READY…",
  play: "DRAG TO MOVE YOUR PADDLE",
  paused: "PAUSED",
  over: "MATCH OVER",
};

export function PongGameInner() {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const insets = useSafeAreaInsets();

  const ranking = useRanking();
  const [rankOpen, setRankOpen] = React.useState(false);
  // O motor avisa o fim da partida -> registra no ranking persistente.
  const g = usePongGame({ onMatchEnd: ranking.recordMatch });

  const playerWon = g.score.p >= WIN_SCORE;
  const showStart = g.phase === "idle";

  if (!fontsLoaded) return null;

  return (
    <View style={s.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Cenário em tela cheia — toda a HUD flutua em dark glass ── */}
      <View style={s.canvasWrap} onLayout={g.onCanvasLayout}>
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={g.onContextCreate}
          onTouchStart={g.onTouchStart}
          onTouchMove={g.onTouchMove}
        />

        {/* ── Scoreboard flutuante ── */}
        <Scoreboard
          top={insets.top + 10}
          score={g.score}
          rally={g.rally}
          bestRally={g.bestRally}
          speedMul={g.speedMul}
        />

        {/* ── Botão de ranking (patente + pontos) ── */}
        <RankButton
          top={insets.top + 92}
          totalPoints={ranking.profile.totalPoints}
          onPress={() => setRankOpen(true)}
        />

        {/* Floating labels */}
        {g.floatLabels.map((lbl) => (
          <View
            key={lbl.id}
            style={[s.floatWrap, { left: lbl.x - 70, top: lbl.y - 20 }]}
            pointerEvents="none"
          >
            <FloatLabel label={lbl} />
          </View>
        ))}

        {/* Overlay arcade de início */}
        {showStart && (
          <StartOverlay
            pulseOpacity={g.pulseOpacity}
            pulseScale={g.pulseScale}
            onPlay={g.startGame}
          />
        )}

        {/* Dica neon pulsante acima da barra de controle */}
        <Animated.Text
          style={[
            s.hintTxt,
            { bottom: insets.bottom + 86, opacity: g.pulseOpacity },
          ]}
          pointerEvents="none"
        >
          {HINT[g.phase]}
        </Animated.Text>

        {/* ── Barra de controle única em dark glass ── */}
        <ControlBar
          bottom={insets.bottom + 14}
          phase={g.phase}
          diff={g.diff}
          onTogglePause={g.togglePause}
          onResetGame={g.resetGame}
          onSelectDiff={g.setDiff}
        />
      </View>

      {/* ── Game Over ── */}
      <GameOverModal
        visible={g.overVisible}
        playerWon={playerWon}
        score={g.score}
        bestRally={g.bestRally}
        onPlayAgain={g.startGame}
        earnedPoints={ranking.lastRecord?.points}
        totalPoints={ranking.profile.totalPoints}
        onViewRanking={() => setRankOpen(true)}
      />

      {/* ── Ranking persistente ── */}
      <RankingModal
        visible={rankOpen}
        profile={ranking.profile}
        onClose={() => setRankOpen(false)}
        onReset={ranking.reset}
      />
    </View>
  );
}

export default function PingPongGame() {
  return (
    <SafeAreaProvider>
      <PongGameInner />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NEON.bg },
  canvasWrap: {
    flex: 1,
    backgroundColor: NEON.bg,
    position: "relative",
  },
  hintTxt: {
    position: "absolute",
    alignSelf: "center",
    fontFamily: FF,
    fontSize: 11,
    color: NEON.dim,
    letterSpacing: 2.5,
  },
  floatWrap: {
    position: "absolute",
    width: 140,
    alignItems: "center",
  },
});
