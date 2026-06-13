/**
 * GameOverModal.tsx — Modal de fim de partida (dark neon).
 */

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SCREEN_W } from "../constants";
import { tierForPoints } from "../storage";
import { FF, NEON } from "../theme";

export const GameOverModal: React.FC<{
  visible: boolean;
  playerWon: boolean;
  score: { p: number; c: number };
  bestRally: number;
  onPlayAgain: () => void;
  /** Pontos de acúmulo ganhos nesta partida (opcional). */
  earnedPoints?: number;
  /** Pontuação vitalícia após esta partida (opcional). */
  totalPoints?: number;
  /** Abre o ranking completo (opcional). */
  onViewRanking?: () => void;
}> = ({
  visible,
  playerWon,
  score,
  bestRally,
  onPlayAgain,
  earnedPoints,
  totalPoints,
  onViewRanking,
}) => {
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

  const accent = playerWon ? NEON.cyan : NEON.magenta;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onPlayAgain}
    >
      <Animated.View style={[gm.overOverlay, { opacity: op }]}>
        <Animated.View
          style={[
            gm.overCard,
            { borderColor: accent, transform: [{ scale: sc }] },
          ]}
        >
          <Text style={gm.overEm}>{playerWon ? "🏆" : "🤖"}</Text>
          <Text style={[gm.overTitle, { color: accent }]}>
            {playerWon ? "YOU WIN" : "CPU WINS"}
          </Text>
          <View style={gm.overScoreRow}>
            <Text style={[gm.overScore, { color: NEON.cyan }]}>{score.p}</Text>
            <Text style={gm.overDash}>—</Text>
            <Text style={[gm.overScore, { color: NEON.magenta }]}>
              {score.c}
            </Text>
          </View>
          <Text style={gm.overStat}>🔥 Best rally: {bestRally}</Text>

          {/* Acúmulos: pontos ganhos + patente atualizada */}
          {earnedPoints != null && (
            <Text style={[gm.overPts, { color: accent }]}>
              +{earnedPoints} pts
            </Text>
          )}
          {totalPoints != null &&
            (() => {
              const tier = tierForPoints(totalPoints);
              return (
                <Text style={gm.overTier}>
                  {tier.current.emoji} {tier.current.label} ·{" "}
                  {totalPoints.toLocaleString("pt-BR")} pts
                </Text>
              );
            })()}

          <TouchableOpacity
            style={[gm.overBtn, { backgroundColor: accent }]}
            onPress={onPlayAgain}
          >
            <Text style={gm.overBtnTxt}>PLAY AGAIN</Text>
          </TouchableOpacity>

          {onViewRanking && (
            <TouchableOpacity onPress={onViewRanking} style={gm.overLink}>
              <Text style={gm.overLinkTxt}>🏆 VER RANKING</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const gm = StyleSheet.create({
  overOverlay: {
    flex: 1,
    backgroundColor: "rgba(4,8,22,0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  overCard: {
    backgroundColor: "#0E1530",
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 30,
    alignItems: "center",
    width: SCREEN_W * 0.78,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  overEm: { fontSize: 50 },
  overTitle: {
    fontFamily: FF,
    fontSize: 24,
    letterSpacing: 3,
  },
  overScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 2,
  },
  overScore: { fontFamily: FF, fontSize: 38 },
  overDash: { fontFamily: FF, fontSize: 22, color: NEON.dim },
  overStat: { fontFamily: FF, fontSize: 13, color: NEON.text },
  overPts: { fontFamily: FF, fontSize: 18, letterSpacing: 1, marginTop: 2 },
  overTier: {
    fontFamily: FF,
    fontSize: 11,
    color: NEON.dim,
    letterSpacing: 1,
  },
  overLink: { marginTop: 4, paddingVertical: 4 },
  overLinkTxt: {
    fontFamily: FF,
    fontSize: 11,
    color: NEON.dim,
    letterSpacing: 1.5,
  },
  overBtn: {
    marginTop: 10,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
  },
  overBtnTxt: {
    fontFamily: FF,
    fontSize: 14,
    color: "#0B1026",
    letterSpacing: 2,
  },
});
