// components/WeeklyReadingCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Card "This week" — gráfico de barras com o tempo de leitura de cada dia da
// semana atual (segunda → domingo). O dia de hoje vem destacado em rosa, com
// o rótulo em roxo. Dias sem leitura aparecem como pílulas claras na base.
//
// Fonte dos dados: lib/readingProgress (getWeeklyReading / todayReadingSeconds).
// O tempo é gravado pelo useReadingTimer dentro do leitor.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { enterUp } from "../shared/motion";
import {
  formatReadTime,
  getWeeklyReading,
  ReadingProgress,
  todayReadingSeconds,
  WeekDay,
} from "../lib/readingProgress";

// ─── DIMENSÕES / CORES ───────────────────────────────────────────────────────
const TRACK_HEIGHT = 172; // altura da área onde as barras crescem
const MAX_BAR = 150; // barra cheia (dia mais lido da semana)
const MIN_ACTIVE_BAR = 30; // barra mínima visível pra um dia COM leitura
const EMPTY_PILL = 6; // pílula da base pra um dia SEM leitura

const C = {
  card: "#FFFFFF",
  title: "#2D2A45",
  subtitle: "#A7A7B4",
  today: "#FB456E", // rosa vivo (barra de hoje)
  past: "#FFB3C7", // rosa claro (outros dias com leitura)
  emptyPill: "#FCE3EC", // trilho rosa clarinho (dia sem leitura)
  labelToday: "#7C5CFC", // roxo (rótulo de hoje)
  labelDefault: "#B7B7C2",
};

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

// ─── BARRA INDIVIDUAL ────────────────────────────────────────────────────────
function Bar({
  day,
  targetHeight,
  index,
}: {
  day: WeekDay;
  targetHeight: number;
  index: number;
}) {
  const reduce = useReducedMotion();
  const h = useSharedValue(reduce ? targetHeight : 0);

  useEffect(() => {
    h.value = reduce
      ? targetHeight
      : withDelay(
          index * 70,
          withTiming(targetHeight, {
            duration: 700,
            easing: Easing.out(Easing.cubic),
          }),
        );
  }, [targetHeight, index, reduce, h]);

  const style = useAnimatedStyle(() => ({ height: h.value }));

  const hasReading = day.seconds > 0;
  const barColor = day.isToday ? C.today : hasReading ? C.past : C.emptyPill;

  return (
    <View style={s.column}>
      <View style={s.track}>
        <Animated.View
          style={[
            s.bar,
            style,
            { backgroundColor: barColor },
            // pílula achatada quando o dia não tem leitura
            !hasReading && s.barEmpty,
          ]}
        />
      </View>
      <Text
        style={[
          s.label,
          { color: day.isToday ? C.labelToday : C.labelDefault },
          day.isToday && fredoka(13, C.labelToday),
        ]}
      >
        {day.label}
      </Text>
    </View>
  );
}

// ─── CARD ────────────────────────────────────────────────────────────────────
export default function WeeklyReadingCard({
  progress,
  delay = 0,
}: {
  progress: ReadingProgress | null;
  delay?: number;
}) {
  const week: WeekDay[] = progress ? getWeeklyReading(progress) : [];
  const todaySec = progress ? todayReadingSeconds(progress) : 0;

  // Pico da semana → normaliza as alturas das barras.
  const maxSec = week.reduce((m, d) => Math.max(m, d.seconds), 0);

  const heightFor = (day: WeekDay): number => {
    if (day.seconds <= 0 || maxSec <= 0) return EMPTY_PILL;
    const ratio = day.seconds / maxSec;
    return MIN_ACTIVE_BAR + ratio * (MAX_BAR - MIN_ACTIVE_BAR);
  };

  return (
    <Animated.View entering={enterUp(delay)} style={s.card}>
      {/* Cabeçalho */}
      <View style={s.header}>
        <Text style={fredoka(20, C.title)}>This week</Text>
        <Text style={s.headerRight}>{formatReadTime(todaySec)}</Text>
      </View>

      {/* Barras */}
      <View style={s.row}>
        {week.length === 0
          ? // estado de carregamento: 7 pílulas vazias
            Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={s.column}>
                <View style={s.track}>
                  <View style={[s.bar, s.barEmpty, { height: EMPTY_PILL }]} />
                </View>
                <Text style={[s.label, { color: C.labelDefault }]}> </Text>
              </View>
            ))
          : week.map((day, i) => (
              <Bar
                key={day.dateStr}
                day={day}
                index={i}
                targetHeight={heightFor(day)}
              />
            ))}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerRight: {
    fontSize: 14,
    fontWeight: "700",
    color: C.subtitle,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    alignItems: "center",
  },
  track: {
    height: TRACK_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "62%",
    minWidth: 26,
    borderRadius: 16,
  },
  barEmpty: {
    // dia sem leitura: pílula bem baixinha e mais larga, encostada na base
    width: "70%",
    borderRadius: 8,
  },
  label: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "800",
  },
});
