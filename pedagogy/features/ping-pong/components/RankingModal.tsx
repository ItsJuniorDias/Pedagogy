/**
 * RankingModal.tsx — Persistent ranking panel (dark neon).
 *
 * Presentation only: receives the accumulated `profile` and shows the tier,
 * lifetime points, progress to the next tier, stats and the leaderboard of
 * best matches. `onReset` wipes the saved ranking.
 */

import React from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DIFFS, SCREEN_W } from "../constants";
import type { RankingProfile } from "../storage";
import { tierForPoints, winRate } from "../storage";
import { FF, NEON } from "../theme";
import type { DiffId } from "../types";

interface Props {
  visible: boolean;
  profile: RankingProfile;
  onClose: () => void;
  onReset: () => void;
}

const DIFF_IDS: DiffId[] = ["easy", "normal", "hard"];

function fmtDate(ms: number): string {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

export const RankingModal: React.FC<Props> = ({
  visible,
  profile,
  onClose,
  onReset,
}) => {
  const tier = tierForPoints(profile.totalPoints);
  const rate = Math.round(winRate(profile) * 100);
  const accent = tier.current.color;

  const confirmReset = () =>
    Alert.alert(
      "Reset ranking?",
      "This erases all saved matches and stats. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: onReset },
      ],
    );

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={rk.overlay}>
        <View style={[rk.card, { borderColor: accent }]}>
          {/* Header */}
          <View style={rk.header}>
            <Text style={rk.headTitle}>🏆 RANKING</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={rk.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={rk.scroll}
            contentContainerStyle={rk.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Tier + lifetime points */}
            <View style={[rk.tierBox, { borderColor: accent }]}>
              <Text style={rk.tierEmoji}>{tier.current.emoji}</Text>
              <Text style={[rk.tierLabel, { color: accent }]}>
                {tier.current.label}
              </Text>
              <Text style={rk.tierPoints}>
                {profile.totalPoints.toLocaleString("en-US")} pts
              </Text>

              {/* Progress bar to the next tier */}
              <View style={rk.track}>
                <View
                  style={[
                    rk.fill,
                    {
                      backgroundColor: accent,
                      width: `${Math.round(tier.progress * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={rk.tierNext}>
                {tier.next
                  ? `${tier.toNext.toLocaleString("en-US")} pts to ${tier.next.label}`
                  : "max tier reached 👑"}
              </Text>
            </View>

            {/* Accumulated stats */}
            <View style={rk.statGrid}>
              <Stat label="MATCHES" value={profile.matchesPlayed} />
              <Stat
                label="W — L"
                value={`${profile.wins}—${profile.losses}`}
                color={NEON.cyan}
              />
              <Stat label="WIN RATE" value={`${rate}%`} color={NEON.mint} />
              <Stat
                label="BEST RALLY"
                value={profile.bestRallyAllTime}
                color={NEON.yellow}
              />
              <Stat
                label="STREAK"
                value={`🔥 ${profile.currentStreak}`}
                color={NEON.amber}
              />
              <Stat
                label="BEST STREAK"
                value={profile.bestStreak}
                color={NEON.rose}
              />
            </View>

            {/* By difficulty */}
            <Text style={rk.sectionTitle}>BY DIFFICULTY</Text>
            <View style={rk.diffRow}>
              {DIFF_IDS.map((id) => {
                const t = profile.byDiff[id];
                const cfg = DIFFS[id];
                return (
                  <View
                    key={id}
                    style={[rk.diffCell, { borderColor: cfg.color + "55" }]}
                  >
                    <Text style={rk.diffEmoji}>{cfg.emoji}</Text>
                    <Text style={[rk.diffLabel, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                    <Text style={rk.diffTally}>
                      {t.wins}W · {t.losses}L
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Leaderboard of best matches */}
            <Text style={rk.sectionTitle}>BEST MATCHES</Text>
            {profile.top.length === 0 ? (
              <Text style={rk.empty}>
                No matches yet. Play to get on the leaderboard!
              </Text>
            ) : (
              profile.top.map((m, i) => {
                const cfg = DIFFS[m.diff];
                const won = m.result === "win";
                return (
                  <View key={m.id} style={rk.lbRow}>
                    <Text style={rk.lbRank}>{i + 1}</Text>
                    <Text
                      style={[
                        rk.lbResult,
                        { color: won ? NEON.cyan : NEON.magenta },
                      ]}
                    >
                      {won ? "WIN" : "LOSS"}
                    </Text>
                    <Text style={rk.lbScore}>
                      {m.playerScore}–{m.cpuScore}
                    </Text>
                    <Text style={[rk.lbDiff, { color: cfg.color }]}>
                      {cfg.emoji}
                    </Text>
                    <Text style={rk.lbDate}>{fmtDate(m.date)}</Text>
                    <Text style={[rk.lbPts, { color: accent }]}>
                      +{m.points}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View style={rk.footer}>
            <TouchableOpacity
              onPress={confirmReset}
              style={rk.resetBtn}
              activeOpacity={0.8}
            >
              <Text style={rk.resetTxt}>↺ RESET</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={[rk.closeBtn, { backgroundColor: accent }]}
              activeOpacity={0.85}
            >
              <Text style={rk.closeBtnTxt}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Stat: React.FC<{
  label: string;
  value: string | number;
  color?: string;
}> = ({ label, value, color = NEON.text }) => (
  <View style={rk.stat}>
    <Text style={[rk.statValue, { color }]}>{value}</Text>
    <Text style={rk.statLabel}>{label}</Text>
  </View>
);

const rk = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(4,8,22,0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#0E1530",
    borderRadius: 24,
    borderWidth: 1.5,
    width: Math.min(SCREEN_W * 0.9, 420),
    maxHeight: "86%",
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 18,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headTitle: {
    fontFamily: FF,
    fontSize: 18,
    color: NEON.text,
    letterSpacing: 2,
  },
  close: { fontFamily: FF, fontSize: 18, color: NEON.dim },
  scroll: { marginVertical: 4 },
  scrollBody: { paddingBottom: 6 },

  tierBox: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 2,
  },
  tierEmoji: { fontSize: 38 },
  tierLabel: { fontFamily: FF, fontSize: 20, letterSpacing: 3 },
  tierPoints: {
    fontFamily: FF,
    fontSize: 13,
    color: NEON.text,
    marginBottom: 6,
  },
  track: {
    width: "100%",
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(125,140,180,0.20)",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
  tierNext: {
    fontFamily: FF,
    fontSize: 9,
    color: NEON.dim,
    marginTop: 5,
    letterSpacing: 0.5,
  },

  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 6,
  },
  stat: { width: "31%", alignItems: "center" },
  statValue: { fontFamily: FF, fontSize: 20 },
  statLabel: {
    fontFamily: FF,
    fontSize: 7.5,
    color: NEON.dim,
    letterSpacing: 1.2,
    marginTop: 2,
  },

  sectionTitle: {
    fontFamily: FF,
    fontSize: 10,
    color: NEON.dim,
    letterSpacing: 2,
    marginTop: 16,
    marginBottom: 8,
  },
  diffRow: { flexDirection: "row", gap: 8 },
  diffCell: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    gap: 2,
  },
  diffEmoji: { fontSize: 18 },
  diffLabel: { fontFamily: FF, fontSize: 9, letterSpacing: 1 },
  diffTally: { fontFamily: FF, fontSize: 11, color: NEON.text },

  empty: {
    fontFamily: FF,
    fontSize: 11,
    color: NEON.dim,
    textAlign: "center",
    paddingVertical: 14,
  },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(125,140,180,0.18)",
    gap: 8,
  },
  lbRank: {
    fontFamily: FF,
    fontSize: 12,
    color: NEON.dim,
    width: 18,
    textAlign: "center",
  },
  lbResult: { fontFamily: FF, fontSize: 11, width: 42 },
  lbScore: { fontFamily: FF, fontSize: 12, color: NEON.text, width: 44 },
  lbDiff: { fontSize: 13, width: 22, textAlign: "center" },
  lbDate: {
    fontFamily: FF,
    fontSize: 10,
    color: NEON.dim,
    flex: 1,
    textAlign: "center",
  },
  lbPts: { fontFamily: FF, fontSize: 13, width: 52, textAlign: "right" },

  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(125,140,180,0.20)",
  },
  resetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: NEON.rose,
  },
  resetTxt: {
    fontFamily: FF,
    fontSize: 12,
    color: NEON.rose,
    letterSpacing: 1.5,
  },
  closeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
  },
  closeBtnTxt: {
    fontFamily: FF,
    fontSize: 13,
    color: "#0B1026",
    letterSpacing: 2,
  },
});
