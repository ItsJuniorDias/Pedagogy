/**
 * ControlBar.tsx — Barra de controle única em dark glass:
 * ⏸ / play · dificuldade segmentada · ↺ reset.
 */

import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DIFF_LIST } from "../constants";
import { shared } from "../styles";
import { FF, NEON } from "../theme";
import type { DiffId, Phase } from "../types";
import { Glass } from "./Glass";

interface Props {
  bottom: number;
  phase: Phase;
  diff: DiffId;
  onTogglePause: () => void;
  onResetGame: () => void;
  onSelectDiff: (id: DiffId) => void;
}

export const ControlBar: React.FC<Props> = ({
  bottom,
  phase,
  diff,
  onTogglePause,
  onResetGame,
  onSelectDiff,
}) => {
  const pauseDisabled = phase === "idle" || phase === "over";

  return (
    <View style={[cb.controlWrap, { bottom }]} pointerEvents="box-none">
      <View style={shared.floatShadow}>
        <Glass style={cb.controlBar} intensity={60}>
          {/* Pause / Play */}
          <TouchableOpacity
            onPress={onTogglePause}
            activeOpacity={0.8}
            disabled={pauseDisabled}
            style={[cb.ctrlBtn, pauseDisabled && cb.ctrlDim]}
          >
            <Text style={cb.ctrlEm}>{phase === "paused" ? "▶️" : "⏸"}</Text>
          </TouchableOpacity>

          <View style={cb.ctrlDivider} />

          {/* Dificuldade segmentada */}
          <View style={cb.segWrap}>
            {DIFF_LIST.map((d) => {
              const active = diff === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    cb.segBtn,
                    active && {
                      backgroundColor: d.color + "33", // 20% alpha
                      borderColor: d.color,
                    },
                  ]}
                  onPress={() => onSelectDiff(d.id)}
                  activeOpacity={0.8}
                >
                  <Text style={cb.segEm}>{d.emoji}</Text>
                  <Text style={[cb.segLbl, active && { color: d.color }]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={cb.ctrlDivider} />

          {/* Reset */}
          <TouchableOpacity
            onPress={onResetGame}
            activeOpacity={0.8}
            style={cb.ctrlBtn}
          >
            <Text style={cb.ctrlEm}>↺</Text>
          </TouchableOpacity>
        </Glass>
      </View>
    </View>
  );
};

const cb = StyleSheet.create({
  controlWrap: {
    position: "absolute",
    left: 18,
    right: 18,
  },
  controlBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 6,
  },
  ctrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlDim: { opacity: 0.35 },
  ctrlEm: { fontSize: 19, color: NEON.text },
  ctrlDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(125,140,180,0.25)",
  },
  segWrap: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },
  segBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 0,
  },
  segEm: { fontSize: 15 },
  segLbl: {
    fontFamily: FF,
    fontSize: 8,
    color: NEON.dim,
    letterSpacing: 1.2,
  },
});
