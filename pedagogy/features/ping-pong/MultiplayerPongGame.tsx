/**
 * MultiplayerPongGame.tsx — Shell da PARTIDA multiplayer.
 *
 * Monta a cena (GLView) + HUD com os apelidos fofos dos dois jogadores e
 * usa o motor de rede `useNetPong`. A partida começa sozinha assim que a dupla
 * é casada (o host saca após um curto "MATCH FOUND").
 */

import { GLView } from "expo-gl";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FloatLabel, GameOverModal, Glass, RankButton, RankingModal, Scoreboard } from "./components";
import { WIN_SCORE } from "./constants";
import { useNetPong } from "./hooks/useNetPong";
import { useRanking } from "./hooks/useRanking";
import type { Identity, NetChannel } from "./net";
import { FF, NEON } from "./theme";
import type { Phase } from "./types";

const HINT: Record<Phase, string> = {
  idle: "WAIT…",
  serving: "GET READY…",
  play: "DRAG TO MOVE YOUR PADDLE",
  paused: "PAUSED",
  over: "MATCH OVER",
};

interface Props {
  you: Identity;
  opponent: Identity;
  net: NetChannel;
  opponentLeft: boolean;
  onExit: () => void;
  onBackToLobby: () => void;
}

export const MultiplayerPongGame: React.FC<Props> = ({
  you,
  opponent,
  net,
  opponentLeft,
  onExit,
  onBackToLobby,
}) => {
  const insets = useSafeAreaInsets();
  const ranking = useRanking();
  const [rankOpen, setRankOpen] = useState(false);

  // Motor em rede + RANKED: anuncio meu MMR, informo quem é o oponente e
  // registro a partida no ranking persistente ao terminar (mesma trilha de
  // pontos do solo + rating de Elo próprio do multiplayer).
  const g = useNetPong({
    net,
    selfMMR: ranking.profile.mmr,
    opponent: { nick: opponent.nick, emoji: opponent.emoji },
    onMatchEnd: ranking.recordMatch,
  });

  const [splash, setSplash] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(id);
  }, []);

  const iWon = g.score.p >= WIN_SCORE;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={s.canvasWrap} onLayout={g.onCanvasLayout}>
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={g.onContextCreate}
          onTouchStart={g.onTouchStart}
          onTouchMove={g.onTouchMove}
        />

        <Scoreboard
          top={insets.top + 10}
          score={g.score}
          rally={g.rally}
          bestRally={g.bestRally}
          speedMul={g.speedMul}
          leftName={`${you.emoji} ${you.nick}`}
          rightName={`${opponent.emoji} ${opponent.nick}`}
        />

        {/* sair */}
        <TouchableOpacity
          style={[s.exitBtn, { top: insets.top + 12 }]}
          onPress={onExit}
          activeOpacity={0.8}
        >
          <Glass style={s.exitGlass} intensity={55}>
            <Text style={s.exitTxt}>✕</Text>
          </Glass>
        </TouchableOpacity>

        {/* divisão ranked (MMR) — abre o painel de ranking */}
        <RankButton
          top={insets.top + 92}
          variant="ranked"
          rankedMMR={ranking.profile.mmr}
          totalPoints={ranking.profile.totalPoints}
          onPress={() => setRankOpen(true)}
        />

        {/* floating labels */}
        {g.floatLabels.map((lbl) => (
          <View
            key={lbl.id}
            style={[s.floatWrap, { left: lbl.x - 70, top: lbl.y - 20 }]}
            pointerEvents="none"
          >
            <FloatLabel label={lbl} />
          </View>
        ))}

        <Animated.Text
          style={[s.hintTxt, { bottom: insets.bottom + 24, opacity: g.pulseOpacity }]}
          pointerEvents="none"
        >
          {HINT[g.phase]}
        </Animated.Text>

        {/* MATCH FOUND splash */}
        {splash && (
          <View style={s.splashWrap} pointerEvents="none">
            <Glass style={s.splashCard} intensity={65}>
              <Text style={s.splashTitle}>MATCH FOUND!</Text>
              <View style={s.splashRow}>
                <Text style={[s.splashSide, { color: NEON.cyan }]}>
                  {you.emoji} {you.nick}
                </Text>
                <Text style={s.splashVs}>VS</Text>
                <Text style={[s.splashSide, { color: NEON.magenta }]}>
                  {opponent.emoji} {opponent.nick}
                </Text>
              </View>
              <Text style={s.splashSub}>
                {g.isHost ? "you serve first 🏓" : "good luck! 🍀"}
              </Text>
            </Glass>
          </View>
        )}
      </View>

      {/* Fim de partida → revanche (com pontos ganhos + variação de MMR) */}
      <GameOverModal
        visible={g.overVisible && !opponentLeft}
        playerWon={iWon}
        score={g.score}
        bestRally={g.bestRally}
        onPlayAgain={g.startGame}
        mode="ranked"
        opponentName={`${opponent.emoji} ${opponent.nick}`}
        earnedPoints={ranking.lastRecord?.points}
        totalPoints={ranking.profile.totalPoints}
        mmrDelta={ranking.lastRecord?.mmrDelta}
        newMMR={ranking.profile.mmr}
        onViewRanking={() => setRankOpen(true)}
      />

      {/* Oponente saiu */}
      <Modal transparent visible={opponentLeft} animationType="fade" onRequestClose={onExit}>
        <View style={s.leftOverlay}>
          <View style={s.leftCard}>
            <Text style={s.leftEmoji}>👋</Text>
            <Text style={s.leftTitle}>OPPONENT LEFT</Text>
            <Text style={s.leftSub}>
              {opponent.emoji} {opponent.nick} disconnected
            </Text>
            <TouchableOpacity style={s.leftBtn} onPress={onBackToLobby} activeOpacity={0.85}>
              <Text style={s.leftBtnTxt}>BACK TO LOBBY</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onExit} style={s.leftLink}>
              <Text style={s.leftLinkTxt}>‹ MENU</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Esperando o host reiniciar (guest pediu revanche) */}
      {g.waitingRematch && !opponentLeft && (
        <View style={s.waitWrap} pointerEvents="none">
          <Glass style={s.waitCard} intensity={60}>
            <Text style={s.waitTxt}>⏳ waiting for the host to restart…</Text>
          </Glass>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NEON.bg },
  canvasWrap: { flex: 1, backgroundColor: NEON.bg, position: "relative" },
  exitBtn: { position: "absolute", right: 16 },
  exitGlass: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  exitTxt: { fontFamily: FF, fontSize: 15, color: NEON.text },
  hintTxt: {
    position: "absolute",
    alignSelf: "center",
    fontFamily: FF,
    fontSize: 11,
    color: NEON.dim,
    letterSpacing: 2.5,
  },
  floatWrap: { position: "absolute", width: 140, alignItems: "center" },
  splashWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  splashCard: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 24,
    borderRadius: 24,
    gap: 10,
    borderColor: "rgba(34,211,238,0.5)",
  },
  splashTitle: { fontFamily: FF, fontSize: 20, color: NEON.text, letterSpacing: 3 },
  splashRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  splashSide: { fontFamily: FF, fontSize: 14 },
  splashVs: { fontFamily: FF, fontSize: 12, color: NEON.dim, letterSpacing: 2 },
  splashSub: { fontFamily: FF, fontSize: 11, color: NEON.dim, letterSpacing: 1 },
  leftOverlay: {
    flex: 1,
    backgroundColor: "rgba(4,8,22,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  leftCard: {
    backgroundColor: "#0E1530",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: NEON.rose,
    padding: 30,
    alignItems: "center",
    gap: 8,
    width: 300,
  },
  leftEmoji: { fontSize: 46 },
  leftTitle: { fontFamily: FF, fontSize: 20, color: NEON.rose, letterSpacing: 2 },
  leftSub: { fontFamily: FF, fontSize: 12, color: NEON.text },
  leftBtn: {
    marginTop: 10,
    backgroundColor: NEON.cyan,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 14,
  },
  leftBtnTxt: { fontFamily: FF, fontSize: 13, color: NEON.bg, letterSpacing: 2 },
  leftLink: { marginTop: 4, paddingVertical: 4 },
  leftLinkTxt: { fontFamily: FF, fontSize: 11, color: NEON.dim, letterSpacing: 1.5 },
  waitWrap: { position: "absolute", bottom: 80, alignSelf: "center", left: 0, right: 0, alignItems: "center" },
  waitCard: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  waitTxt: { fontFamily: FF, fontSize: 12, color: NEON.text, letterSpacing: 0.5 },
});
