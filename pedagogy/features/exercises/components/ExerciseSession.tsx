// features/exercises/components/ExerciseSession.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Sessão de atividades que aparece ao terminar um capítulo.
// - Tematizada pela cor da própria história (recebe `theme` por props).
// - Lê o enunciado em voz alta (expo-speech), bom pra quem ainda não lê sozinho.
// - Háptico no acerto/erro; animações respeitam "reduzir movimento".
// - Renderiza os 5 tipos: fill-blank, vocabulary, comprehension, true-false, sequence.
// Sem dependências novas — só o que já está no package.json.
// ─────────────────────────────────────────────────────────────────────────────

import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import { useFonts } from "expo-font";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { getChapterExercises } from "../data";
import type { Exercise } from "../types";

export interface ExerciseSessionTheme {
  accent: string;
  accentSoft: string;
  bg: string;
  cardBg: string;
}

export interface ExerciseSessionProps {
  storyId: string;
  chapterId?: string | number;
  chapterTitle?: string;
  /** se passado, usa esta lista direto (ex.: quiz da história inteira) */
  exercises?: Exercise[];
  theme: ExerciseSessionTheme;
  onClose: () => void;
  onComplete?: (result: { correct: number; total: number }) => void;
  /** produção: true → só exercícios confiáveis. Default false. */
  onlyTrusted?: boolean;
  /** lê o enunciado em voz alta. Default true. */
  speak?: boolean;
  /** máximo de exercícios por sessão. Default 6. */
  limit?: number;
}

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

// ─── helpers de correção por tipo ────────────────────────────────────────────

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** índice da resposta correta p/ tipos de múltipla escolha (-1 se não se aplica) */
function correctIndexOf(ex: Exercise): number {
  if (ex.type === "comprehension" || ex.type === "vocabulary")
    return ex.answerIndex;
  if (ex.type === "fill-blank") return ex.options.indexOf(ex.answer);
  return -1;
}

/** monta a frase do fill-blank com a lacuna visível */
function blankedSentence(sentence: string, word: string): string {
  const re = new RegExp(
    `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "i",
  );
  return sentence.replace(re, "  ______  ");
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ExerciseSession({
  storyId,
  chapterId,
  chapterTitle,
  exercises: providedExercises,
  theme,
  onClose,
  onComplete,
  onlyTrusted = false,
  speak = true,
  limit = 6,
}: ExerciseSessionProps) {
  const { t } = useTranslation();
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const [reduceMotion, setReduceMotion] = useState(false);

  // Congela a lista no mount — não re-embaralha no meio da sessão. Como o
  // overlay desmonta ao fechar, reabrir gera um novo embaralhamento.
  const [exercises] = useState<Exercise[]>(
    () =>
      providedExercises ??
      getChapterExercises(storyId, chapterId ?? "", {
        onlyTrusted,
        shuffle: true,
        limit,
      }),
  );

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"playing" | "result">("playing");
  const [correctCount, setCorrectCount] = useState(0);

  // estado da questão atual
  const [picked, setPicked] = useState<number | null>(null); // MCQ / true-false
  const [order, setOrder] = useState<number[]>([]); // sequence
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  const current = exercises[index];
  const completedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduceMotion(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  // animações de entrada da questão + shake no erro
  const enter = useSharedValue(0);
  const shake = useSharedValue(0);

  const resetQuestionState = useCallback(() => {
    setPicked(null);
    setOrder([]);
    setAnswered(false);
    setWasCorrect(false);
  }, []);

  // ao trocar de questão: reset + entrada + fala
  useEffect(() => {
    if (phase !== "playing" || !current) return;
    resetQuestionState();
    if (reduceMotion) {
      enter.value = 1;
    } else {
      enter.value = 0;
      enter.value = withTiming(1, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      });
    }
    if (speak) {
      const toRead =
        current.type === "true-false"
          ? `${current.prompt}. ${current.statement}`
          : current.prompt;
      try {
        Speech.stop();
        Speech.speak(toRead, { rate: 0.92, pitch: 1.05 });
      } catch {}
    }
    return () => {
      try {
        Speech.stop();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase, reduceMotion]);

  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: (1 - enter.value) * 16 },
      { translateX: shake.value },
    ],
  }));

  const triggerShake = useCallback(() => {
    if (reduceMotion) return;
    shake.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [reduceMotion, shake]);

  const replayPrompt = useCallback(() => {
    if (!current) return;
    const toRead =
      current.type === "true-false"
        ? `${current.prompt}. ${current.statement}`
        : current.prompt;
    try {
      Speech.stop();
      Speech.speak(toRead, { rate: 0.92, pitch: 1.05 });
    } catch {}
  }, [current]);

  // ── responder ──────────────────────────────────────────────────────────────
  const commitResult = useCallback(
    (correct: boolean) => {
      setAnswered(true);
      setWasCorrect(correct);
      if (correct) setCorrectCount((c) => c + 1);
      try {
        Haptics.notificationAsync(
          correct
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error,
        );
      } catch {}
      if (!correct) triggerShake();
    },
    [triggerShake],
  );

  const pickOption = useCallback(
    (i: number) => {
      if (answered || !current) return;
      try {
        Haptics.selectionAsync();
      } catch {}
      setPicked(i);
      const correctIdx = correctIndexOf(current);
      commitResult(i === correctIdx);
    },
    [answered, current, commitResult],
  );

  const pickTrueFalse = useCallback(
    (value: boolean) => {
      if (answered || current?.type !== "true-false") return;
      try {
        Haptics.selectionAsync();
      } catch {}
      setPicked(value ? 0 : 1);
      commitResult(value === current.answer);
    },
    [answered, current, commitResult],
  );

  const toggleSeq = useCallback(
    (itemIdx: number) => {
      if (answered) return;
      try {
        Haptics.selectionAsync();
      } catch {}
      setOrder((prev) =>
        prev.includes(itemIdx)
          ? prev.filter((x) => x !== itemIdx)
          : [...prev, itemIdx],
      );
    },
    [answered],
  );

  const checkSeq = useCallback(() => {
    if (current?.type !== "sequence") return;
    commitResult(arraysEqual(order, current.correctOrder));
  }, [current, order, commitResult]);

  // ── avançar ──────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    try {
      Speech.stop();
    } catch {}
    if (index + 1 < exercises.length) {
      setIndex((i) => i + 1);
    } else {
      setPhase("result");
    }
  }, [index, exercises.length]);

  useEffect(() => {
    if (phase === "result" && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ correct: correctCount, total: exercises.length });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
  }, [phase, correctCount, exercises.length, onComplete]);

  const restart = useCallback(() => {
    completedRef.current = false;
    setCorrectCount(0);
    setIndex(0);
    setPhase("playing");
    resetQuestionState();
  }, [resetQuestionState]);

  if (!fontsLoaded) return null;

  // ── estado vazio ───────────────────────────────────────────────────────────
  if (exercises.length === 0) {
    return (
      <View style={[s.fill, { backgroundColor: theme.bg }]}>
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🌱</Text>
          <Text style={[fredoka(20, "#2D2D2D"), { textAlign: "center" }]}>
            No activities here yet
          </Text>
          <Text style={[s.muted, { textAlign: "center", marginTop: 6 }]}>
            Keep reading — more are on the way!
          </Text>
          <Pressable
            onPress={onClose}
            style={[
              s.primaryBtn,
              { backgroundColor: theme.accent, marginTop: 24 },
            ]}
          >
            <Text style={fredoka(16, "#fff")}>Back to the story</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── tela de resultado ────────────────────────────────────────────────────────
  if (phase === "result") {
    const total = exercises.length;
    const ratio = total > 0 ? correctCount / total : 0;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;
    const headline =
      stars === 3
        ? t("exercises.resultAmazing")
        : stars === 2
          ? t("exercises.resultGreat")
          : stars === 1
            ? t("exercises.resultNice")
            : t("exercises.resultPractice");
    return (
      <View style={[s.fill, { backgroundColor: theme.bg }]}>
        <View style={s.center}>
          <View style={s.starsRow}>
            {[0, 1, 2].map((i) => (
              <Text
                key={i}
                style={{ fontSize: 44, opacity: i < stars ? 1 : 0.22 }}
              >
                ⭐
              </Text>
            ))}
          </View>
          <Text style={[fredoka(28, "#2D2D2D"), { marginTop: 8 }]}>
            {headline}
          </Text>
          <Text style={[fredoka(18, theme.accent), { marginTop: 4 }]}>
            {t("exercises.score", { correct: correctCount, total })}
          </Text>

          <Pressable
            onPress={restart}
            style={[
              s.primaryBtn,
              { backgroundColor: theme.accent, marginTop: 28 },
            ]}
          >
            <Text style={fredoka(16, "#fff")}>{t("exercises.playAgain")}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={[s.ghostBtn, { marginTop: 12 }]}>
            <Text style={fredoka(16, theme.accent)}>{t("exercises.done")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── tela de jogo ─────────────────────────────────────────────────────────────
  return (
    <View style={[s.fill, { backgroundColor: theme.bg }]}>
      {/* topo: fechar + progresso */}
      <View style={s.topBar}>
        <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
          <Text style={{ fontSize: 20, color: "#2D2D2D" }}>✕</Text>
        </Pressable>
        <View style={s.dots}>
          {exercises.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  backgroundColor:
                    i < index
                      ? theme.accent
                      : i === index
                        ? theme.accent
                        : "#00000018",
                  opacity: i === index ? 1 : i < index ? 0.55 : 1,
                  width: i === index ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[enterStyle]}>
          {/* enunciado + botão de ouvir */}
          <View style={s.promptRow}>
            <Text style={[fredoka(13, theme.accent), s.skillTag]}>
              {t(`exercises.${labelForSkill(current)}`)}
            </Text>
            <Pressable onPress={replayPrompt} hitSlop={10} style={s.speakBtn}>
              <Text style={{ fontSize: 18 }}>🔊</Text>
            </Pressable>
          </View>
          <Text style={[fredoka(22, "#2D2D2D"), s.prompt]}>
            {current.prompt}
          </Text>

          {/* corpo por tipo */}
          {current.type === "fill-blank" && (
            <View
              style={[s.sentenceCard, { backgroundColor: theme.accentSoft }]}
            >
              <Text style={[fredoka(18, "#2D2D2D"), { lineHeight: 28 }]}>
                {blankedSentence(current.sourceSentence, current.blankWord)}
              </Text>
            </View>
          )}

          {current.type === "vocabulary" && (
            <View style={[s.wordChip, { borderColor: theme.accent }]}>
              <Text style={fredoka(20, theme.accent)}>{current.word}</Text>
            </View>
          )}

          {current.type === "true-false" && (
            <View
              style={[s.sentenceCard, { backgroundColor: theme.accentSoft }]}
            >
              <Text style={[fredoka(18, "#2D2D2D"), { lineHeight: 28 }]}>
                “{current.statement}”
              </Text>
            </View>
          )}

          {/* opções */}
          {(current.type === "comprehension" ||
            current.type === "vocabulary" ||
            current.type === "fill-blank") &&
            current.options.map((opt, i) => {
              const correctIdx = correctIndexOf(current);
              const state = optionState(answered, picked, i, correctIdx);
              return (
                <OptionButton
                  key={i}
                  label={opt}
                  state={state}
                  accent={theme.accent}
                  cardBg={theme.cardBg}
                  onPress={() => pickOption(i)}
                />
              );
            })}

          {current.type === "true-false" && (
            <View style={s.tfRow}>
              {[
                { label: t("exercises.tfTrue"), value: true, idx: 0 },
                { label: t("exercises.tfFalse"), value: false, idx: 1 },
              ].map(({ label, value, idx }) => {
                const correctIdx = current.answer ? 0 : 1;
                const state = optionState(answered, picked, idx, correctIdx);
                return (
                  <View key={idx} style={{ flex: 1 }}>
                    <OptionButton
                      label={label}
                      state={state}
                      accent={theme.accent}
                      cardBg={theme.cardBg}
                      big
                      onPress={() => pickTrueFalse(value)}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {current.type === "sequence" && (
            <SequenceBody
              items={current.items}
              order={order}
              answered={answered}
              correctOrder={current.correctOrder}
              accent={theme.accent}
              accentSoft={theme.accentSoft}
              cardBg={theme.cardBg}
              onToggle={toggleSeq}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* rodapé: feedback + ação */}
      <View style={s.footer}>
        {answered && (
          <Text
            style={[
              fredoka(16, wasCorrect ? "#1F9D55" : "#E0552B"),
              { marginBottom: 10 },
            ]}
          >
            {wasCorrect
              ? t("exercises.correct")
              : t("exercises.incorrect")}
          </Text>
        )}

        {current.type === "sequence" && !answered ? (
          <Pressable
            disabled={order.length !== current.items.length}
            onPress={checkSeq}
            style={[
              s.primaryBtn,
              {
                backgroundColor:
                  order.length === current.items.length
                    ? theme.accent
                    : "#00000020",
              },
            ]}
          >
            <Text style={fredoka(17, "#fff")}>{t("exercises.check")}</Text>
          </Pressable>
        ) : answered ? (
          <Pressable
            onPress={goNext}
            style={[s.primaryBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={fredoka(17, "#fff")}>
              {index + 1 < exercises.length
                ? t("exercises.next")
                : t("exercises.seeStars")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ─── subcomponentes ──────────────────────────────────────────────────────────

type OptState = "idle" | "correct" | "wrong" | "revealed" | "dim";

function optionState(
  answered: boolean,
  picked: number | null,
  i: number,
  correctIdx: number,
): OptState {
  if (!answered) return "idle";
  if (i === correctIdx) return "correct";
  if (i === picked) return "wrong";
  return "dim";
}

function OptionButton({
  label,
  state,
  accent,
  cardBg,
  big,
  onPress,
}: {
  label: string;
  state: OptState;
  accent: string;
  cardBg: string;
  big?: boolean;
  onPress: () => void;
}) {
  const bg =
    state === "correct" ? "#E7F8EE" : state === "wrong" ? "#FDECE5" : cardBg;
  const border =
    state === "correct"
      ? "#1F9D55"
      : state === "wrong"
        ? "#E0552B"
        : state === "dim"
          ? "#00000010"
          : accent + "55";
  const opacity = state === "dim" ? 0.5 : 1;
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.option,
        big && s.optionBig,
        { backgroundColor: bg, borderColor: border, opacity },
      ]}
    >
      <Text
        style={[
          fredoka(big ? 20 : 17, "#2D2D2D"),
          { textAlign: big ? "center" : "left", flex: 1 },
        ]}
      >
        {label}
      </Text>
      {state === "correct" && <Text style={{ fontSize: 18 }}>✅</Text>}
      {state === "wrong" && <Text style={{ fontSize: 18 }}>❌</Text>}
    </Pressable>
  );
}

function SequenceBody({
  items,
  order,
  answered,
  correctOrder,
  accent,
  accentSoft,
  cardBg,
  onToggle,
}: {
  items: string[];
  order: number[];
  answered: boolean;
  correctOrder: number[];
  accent: string;
  accentSoft: string;
  cardBg: string;
  onToggle: (i: number) => void;
}) {
  return (
    <View style={{ marginTop: 4 }}>
      {items.map((item, i) => {
        const pos = order.indexOf(i); // 0-based na ordem escolhida
        const chosen = pos !== -1;
        const correctPos = answered ? correctOrder.indexOf(i) : -1;
        return (
          <Pressable
            key={i}
            onPress={() => onToggle(i)}
            style={[
              s.seqItem,
              {
                backgroundColor: chosen ? accentSoft : cardBg,
                borderColor: chosen ? accent : "#00000012",
              },
            ]}
          >
            <View
              style={[
                s.seqBadge,
                {
                  backgroundColor: chosen ? accent : "#00000010",
                },
              ]}
            >
              <Text style={fredoka(15, chosen ? "#fff" : "#9A9A9A")}>
                {chosen ? pos + 1 : "•"}
              </Text>
            </View>
            <Text style={[fredoka(15, "#2D2D2D"), { flex: 1, lineHeight: 21 }]}>
              {item}
            </Text>
            {answered && (
              <Text style={fredoka(13, "#1F9D55")}>#{correctPos + 1}</Text>
            )}
          </Pressable>
        );
      })}
      {answered && (
        <Text style={[s.muted, { marginTop: 6 }]}>
          Green numbers show the correct order.
        </Text>
      )}
    </View>
  );
}

// Retorna o sufixo da chave i18n (exercises.<sufixo>) — traduzido no call site.
type SkillKey =
  | "skillSounds"
  | "skillWords"
  | "skillOrder"
  | "skillThink"
  | "skillReading";
function labelForSkill(ex: Exercise): SkillKey {
  switch (ex.skill) {
    case "phonics":
      return "skillSounds";
    case "vocabulary":
      return "skillWords";
    case "sequence":
      return "skillOrder";
    case "inference":
      return "skillThink";
    default:
      return "skillReading";
  }
}

// ─── estilos ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, zIndex: 50 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  muted: {
    fontFamily: "FredokaOne_400Regular",
    fontSize: 13,
    color: "#9A9A9A",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  dot: { height: 8, borderRadius: 4 },

  scroll: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28 },

  promptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  skillTag: { letterSpacing: 1 },
  speakBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFFAA",
  },
  prompt: { lineHeight: 30, marginBottom: 16 },

  sentenceCard: { borderRadius: 18, padding: 18, marginBottom: 18 },
  wordChip: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 18,
    backgroundColor: "#FFFFFFAA",
  },

  option: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionBig: { minHeight: 88, justifyContent: "center" },
  tfRow: { flexDirection: "row", gap: 12 },

  seqItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  seqBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    paddingHorizontal: 22,
    paddingBottom: 34,
    paddingTop: 6,
    alignItems: "center",
  },
  primaryBtn: {
    width: "100%",
    minHeight: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  ghostBtn: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  starsRow: { flexDirection: "row", gap: 10 },
});
