import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTranslation } from "react-i18next";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { fredoka, HIT_SLOP, MIN_TOUCH, Shadow, Theme } from "@/constants/theme";
import {
  Breathe,
  enterPop,
  enterRise,
  GrowBar,
  PressBounce,
} from "../../shared/motion";

// Chave i18n de exibição de cada trilha. NÃO substitui `title`, que continua
// sendo a fonte estável do slug de rota e da chave de progresso (resolveStoryId).
type PathKey =
  | "letters"
  | "school"
  | "astronaut"
  | "space"
  | "dinosaurs"
  | "oceanLife"
  | "colorsArt"
  | "scienceLab";

// ─── PROGRESSO REAL ───────────────────────────────────────────────────────────
// Mesma fonte de verdade usada pelo leitor. NÃO criamos um storage paralelo:
// lemos o que o leitor já grava (chaptersRead por história) via AsyncStorage.
import { getProgress } from "../../lib/readingProgress";

// Total REAL de capítulos por trilha. É o mesmo array que o leitor usa em
// markChapterCompleted(id, ch.id, chapters.length). Importar daqui garante que
// o "total" da barra bata exatamente com o que o leitor registra como completo.
// ⚠️ Se o caminho dos mocks for diferente nesta pasta, ajuste o "../../".
import {
  ASTRONAUT,
  COLORS_ART,
  DINOSAURS,
  LETTERS,
  OCEAN_LIFE,
  SCHOLL,
  SCIENCE_LAB,
  SPACE,
} from "../../mocks/learningMocks";

// ─── EMOJI ANIMADO ────────────────────────────────────────────────────────────
// Balança de leve (rotação vai-e-volta) + sobe-e-desce sutil, em loop infinito.
// `delay` desencontra a animação entre os cards e `dir` espelha a direção entre
// as colunas — assim os emojis "mexem" de forma orgânica, não robótica.
const WigglyEmoji = ({
  emoji,
  delay = 0,
  dir = 1,
}: {
  emoji: string;
  delay?: number;
  dir?: 1 | -1;
}) => {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        true, // reverse: vai e volta suave
      ),
    );
  }, []);

  const aStyle = useAnimatedStyle(() => {
    const rotate = interpolate(t.value, [0, 1], [-7 * dir, 7 * dir]);
    const translateY = interpolate(t.value, [0, 1], [3, -4]);
    return { transform: [{ translateY }, { rotate: `${rotate}deg` }] };
  });

  return <Animated.Text style={[s.emoji, aStyle]}>{emoji}</Animated.Text>;
};

// Resolve o título da trilha para a MESMA chave que o leitor usa no storage.
// (No leitor: raw.toLocaleUpperCase().replace(/[\s_\-]/g, "").replace(/Г/g,"G"))
const resolveStoryId = (raw: string) =>
  raw
    .toLocaleUpperCase()
    .replace(/[\s_\-]/g, "")
    .replace(/Г/g, "G");

// Total real de capítulos por chave resolvida.
const CHAPTER_COUNTS: Record<string, number> = {
  LETTERS: LETTERS.length,
  SCHOOL: SCHOLL.length,
  ASTRONAUT: ASTRONAUT.length,
  SPACE: SPACE.length,
  DINOSAURS: DINOSAURS.length,
  OCEANLIFE: OCEAN_LIFE.length,
  "COLORS&ART": COLORS_ART.length,
  SCIENCELAB: SCIENCE_LAB.length,
};

// Apenas metadados estáticos da trilha. O "total" aqui é só fallback —
// o número real vem de CHAPTER_COUNTS, e o "progress" vem do storage.
const ALL_PATHS = [
  {
    id: 1,
    emoji: "🔤",
    title: "Letters",
    i18nKey: "letters" as PathKey,
    total: 6,
    cardBorder: "#FFD93D",
    imgBg: "#FFFBEB",
    barColor: "#FFD93D",
    category: "drawing",
  },
  {
    id: 2,
    emoji: "🏫",
    title: "School",
    i18nKey: "school" as PathKey,
    total: 6,
    cardBorder: "#A0E7A0",
    imgBg: "#F0FFF0",
    barColor: "#52C878",
    category: "all",
  },
  {
    id: 3,
    emoji: "👨‍🚀",
    title: "Astronaut",
    i18nKey: "astronaut" as PathKey,
    total: 6,
    cardBorder: "#FFA07A",
    imgBg: "#FFF5F0",
    barColor: "#FF7043",
    category: "space",
  },
  {
    id: 4,
    emoji: "🪐",
    title: "Space",
    i18nKey: "space" as PathKey,
    total: 6,
    cardBorder: "#B0C4FF",
    imgBg: "#F0F4FF",
    barColor: "#5C7CFF",
    category: "space",
  },
  {
    id: 5,
    emoji: "🦕",
    title: "Dinosaurs",
    i18nKey: "dinosaurs" as PathKey,
    total: 8,
    cardBorder: "#A0E7A0",
    imgBg: "#F0FFF0",
    barColor: "#27AE60",
    category: "dinos",
  },
  {
    id: 6,
    emoji: "🌊",
    title: "Ocean Life",
    i18nKey: "oceanLife" as PathKey,
    total: 6,
    cardBorder: "#B0C4FF",
    imgBg: "#EBF4FF",
    barColor: "#3B82F6",
    category: "animals",
  },
  {
    id: 7,
    emoji: "🎨",
    title: "Colors & Art",
    i18nKey: "colorsArt" as PathKey,
    total: 8,
    cardBorder: "#FFA07A",
    imgBg: "#FFF5F0",
    barColor: "#F5A623",
    category: "art",
  },
  {
    id: 8,
    emoji: "🔬",
    title: "Science Lab",
    i18nKey: "scienceLab" as PathKey,
    total: 10,
    cardBorder: "#A0E7A0",
    imgBg: "#E8F8F0",
    barColor: "#15803D",
    category: "science",
  },
];

// Só as CHAVES i18n — o filtro em si usa o índice (activeFilter), então trocar
// o rótulo não afeta a lógica de filtragem.
const FILTER_KEYS = ["all", "inProgress", "notStarted", "completed"] as const;

export default function LearningAllScreen() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState(0);
  // Mapa id_da_trilha -> nº de capítulos lidos (vindo do storage).
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Recarrega o progresso TODA vez que a tela ganha foco — inclusive quando a
  // criança volta do leitor após terminar um capítulo. Assim as barras já
  // aparecem atualizadas sem precisar dar reload manual.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProgress().then((p) => {
        if (!active) return;
        const map: Record<number, number> = {};
        for (const path of ALL_PATHS) {
          const rid = resolveStoryId(path.title);
          map[path.id] = (p.chaptersRead?.[rid] ?? []).length;
        }
        setProgressMap(map);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  // Monta as trilhas já com progresso REAL (storage) + total REAL (mocks).
  // Clampamos o progress no total pra nunca passar de 100% caso haja
  // capítulos antigos registrados que não existam mais.
  const paths = ALL_PATHS.map((p) => {
    const rid = resolveStoryId(p.title);
    const total = CHAPTER_COUNTS[rid] ?? p.total;
    const progress = Math.min(progressMap[p.id] ?? 0, total);
    return { ...p, total, progress };
  });

  const filtered = paths.filter((p) => {
    if (activeFilter === 0) return true;
    if (activeFilter === 1) return p.progress > 0 && p.progress < p.total;
    if (activeFilter === 2) return p.progress === 0;
    if (activeFilter === 3) return p.total > 0 && p.progress >= p.total;
    return true;
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.bg} />

      {/* Header compartilhado — safe-area aware, botão voltar acessível */}
      <ScreenHeader
        title={t("learningAll.header")}
        emoji={
          <Breathe scaleTo={1.18} duration={1800}>
            <Text style={{ fontSize: 20 }}>🌱</Text>
          </Breathe>
        }
      />

      {/* Filter chips — agora ligados ao estado activeFilter (botões funcionam).
          O wrapper externo reserva o espaço corretamente (a margem NÃO pode
          ficar no contentContainerStyle do ScrollView horizontal, senão a
          lista de baixo sobrepõe e corta a base dos chips). */}
      <View style={s.filtersWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersRow}
        >
          {FILTER_KEYS.map((f, i) => {
            const active = activeFilter === i;
            return (
              <PressBounce
                key={f}
                onPress={() => setActiveFilter(i)}
                hitSlop={HIT_SLOP}
                style={[s.chip, active && s.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  style={[s.chipText, active && s.chipTextActive]}
                >
                  {t(`learningAll.filters.${f}`)}
                </Text>
              </PressBounce>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {loading ? (
          <Animated.Text entering={enterPop(100)} style={s.empty}>
            {t("learningAll.loading")}
          </Animated.Text>
        ) : (
          <>
            {/* Jardim crescendo 🌱: cards brotam em cascata e as barras crescem
                de 0 até o progresso REAL salvo no storage. */}
            <View style={s.grid}>
              {filtered.map((item, i) => {
                const pct =
                  item.total > 0 ? (item.progress / item.total) * 100 : 0;
                const done = item.total > 0 && item.progress >= item.total;

                return (
                  <PressBounce
                    key={item.id}
                    entering={enterRise(i * 90)}
                    style={[s.card, { borderColor: item.cardBorder }]}
                    accessibilityRole="button"
                    accessibilityLabel={t(`paths.${item.i18nKey}`)}
                    onPress={() =>
                      router.push({
                        pathname: "/(details)",
                        params: {
                          storyId: item.title.toLowerCase().replace(/\s/g, ""),
                        },
                      })
                    }
                  >
                    <View style={[s.imgBox, { backgroundColor: item.imgBg }]}>
                      {/* emoji "mexendo": delay por card + direção alternada
                          entre as colunas (par/ímpar) */}
                      <WigglyEmoji
                        emoji={item.emoji}
                        delay={i * 180}
                        dir={i % 2 === 0 ? 1 : -1}
                      />
                    </View>
                    <View style={s.body}>
                      <Text style={fredoka(15, Theme.colors.ink)}>
                        {t(`paths.${item.i18nKey}`)}
                      </Text>
                      <View style={s.progressWrap}>
                        {/* key muda quando o progresso muda -> a barra re-anima
                            o crescimento ao voltar do leitor com novo progresso */}
                        <GrowBar
                          key={`growbar-${item.id}-${item.progress}-${item.total}`}
                          pct={pct}
                          color={item.barColor}
                          delay={350 + i * 90}
                          style={s.progressFill}
                        />
                      </View>
                      <View style={s.progressLabelRow}>
                        <Text style={s.progressLabel}>
                          {item.progress}/{item.total}{" "}
                        </Text>
                        {done ? (
                          <Breathe
                            scaleTo={1.25}
                            duration={1400}
                            delay={i * 200}
                          >
                            <Text style={s.progressLabel}>🎉</Text>
                          </Breathe>
                        ) : (
                          <Text style={s.progressLabel}>⭐</Text>
                        )}
                      </View>
                    </View>
                  </PressBounce>
                );
              })}
            </View>

            {filtered.length === 0 && (
              <Animated.Text entering={enterPop(100)} style={s.empty}>
                {t("learningAll.empty")}
              </Animated.Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bg,
  },
  scroll: { paddingHorizontal: Theme.space.xl, paddingBottom: 100 },

  // ── FIX DOS CHIPS ──
  // A margem vai aqui (wrapper externo), não no contentContainerStyle.
  filtersWrap: {
    marginBottom: Theme.space.lg,
  },
  filtersRow: {
    paddingHorizontal: Theme.space.xl,
    paddingVertical: 6,
    gap: 10,
    alignItems: "center",
  },
  chip: {
    height: MIN_TOUCH, // alvo mínimo de toque: o texto não tem como ser cortado
    paddingHorizontal: 18,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: Theme.colors.textMuted,
    textAlign: "center",
  },
  chipTextActive: { color: Theme.colors.onAccent },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.xl,
    borderWidth: 2.5,
    marginBottom: Theme.space.md,
    overflow: "hidden",
    ...Shadow.card,
  },
  imgBox: { height: 90, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 44 },
  body: { paddingHorizontal: 12, paddingVertical: 10 },
  progressWrap: {
    height: 6,
    backgroundColor: Theme.colors.track,
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 10 },
  progressLabelRow: { flexDirection: "row", alignItems: "center" },
  progressLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Theme.colors.textFaint,
    marginTop: 3,
  },
  empty: {
    textAlign: "center",
    fontSize: 14,
    color: Theme.colors.textFaint,
    fontWeight: "700",
    marginTop: 40,
  },
});
