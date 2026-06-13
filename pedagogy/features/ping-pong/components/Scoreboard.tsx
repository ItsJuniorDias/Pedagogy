/**
 * Scoreboard.tsx — Painel flutuante no topo: placar gigante + rally + best
 * + linha de velocidade neon embutida.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { shared } from "../styles";
import { FF, NEON } from "../theme";
import { Glass } from "./Glass";
import { SpeedLine } from "./SpeedLine";

interface Props {
  top: number;
  score: { p: number; c: number };
  rally: number;
  bestRally: number;
  speedMul: number;
  /** Apelido do lado esquerdo (você). Padrão: "YOU". */
  leftName?: string;
  /** Apelido do lado direito (oponente). Padrão: "CPU". */
  rightName?: string;
}

export const Scoreboard: React.FC<Props> = ({
  top,
  score,
  rally,
  bestRally,
  speedMul,
  leftName = "YOU",
  rightName = "CPU",
}) => (
  <View style={[sb.scoreWrap, { top }]} pointerEvents="none">
    <View style={shared.floatShadow}>
      <Glass style={sb.scoreBoard} intensity={55}>
        <View style={sb.scoreTop}>
          <View style={sb.scoreSide}>
            <View style={[sb.sideDot, { backgroundColor: NEON.cyan }]} />
            <Text
              style={[sb.scoreName, { color: NEON.cyan }]}
              numberOfLines={1}
            >
              {leftName}
            </Text>
            <Text style={[sb.scoreBig, { color: NEON.cyan }]}>{score.p}</Text>
          </View>

          <View style={sb.scoreMid}>
            <Text style={sb.scoreVs}>VS</Text>
            <Text style={sb.rallyTxt}>🔥 {rally}</Text>
            <Text style={sb.bestTxt}>BEST {bestRally}</Text>
          </View>

          <View style={sb.scoreSide}>
            <View style={[sb.sideDot, { backgroundColor: NEON.magenta }]} />
            <Text
              style={[sb.scoreName, { color: NEON.magenta }]}
              numberOfLines={1}
            >
              {rightName}
            </Text>
            <Text style={[sb.scoreBig, { color: NEON.magenta }]}>{score.c}</Text>
          </View>
        </View>

        <SpeedLine speedMul={speedMul} />
      </Glass>
    </View>
  </View>
);

const sb = StyleSheet.create({
  scoreWrap: {
    position: "absolute",
    left: 18,
    right: 18,
  },
  scoreBoard: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 9,
  },
  scoreTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreSide: { alignItems: "center", width: 92 },
  sideDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 2 },
  scoreName: {
    fontFamily: FF,
    fontSize: 9,
    letterSpacing: 1.2,
    maxWidth: 92,
  },
  scoreBig: {
    fontFamily: FF,
    fontSize: 34,
    lineHeight: 38,
  },
  scoreMid: { alignItems: "center", gap: 1 },
  scoreVs: {
    fontFamily: FF,
    fontSize: 10,
    color: NEON.dim,
    letterSpacing: 3,
  },
  rallyTxt: { fontFamily: FF, fontSize: 13, color: NEON.text },
  bestTxt: {
    fontFamily: FF,
    fontSize: 8,
    color: NEON.dim,
    letterSpacing: 1.5,
  },
});
