/**
 * ─── PAYWALL · LINHA DO TEMPO DO TESTE ───────────────────────────────────────
 *
 * O maior medo de quem inicia um teste grátis não é o preço: é ESQUECER e ser
 * cobrado sem perceber. Tornar o calendário explícito é o componente que mais
 * reduz esse atrito em paywalls de assinatura — e ele não existia nesta tela.
 *
 * ⚠️ Cada linha aqui é FACTUAL. Em especial, NÃO prometemos "avisaremos você
 * antes de cobrar": o app não envia notificação nem e-mail (não há
 * expo-notifications no projeto, e a Apple não garante lembrete de fim de teste
 * para todo usuário). Prometer um aviso que não existe é cobrança inesperada —
 * e conteúdo enganoso perante a App Review. Se um dia você implementar um
 * lembrete local de verdade, aí sim troque o texto do passo do meio.
 *
 * Os dias vêm de `getTrialInfo`, ou seja, do introPrice real do StoreKit.
 */

import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";

import { fredoka, Theme } from "@/constants/theme";

import { enterUp } from "../../../shared/motion";
import { getTrialReminderDay } from "../pricing";

interface TrialTimelineProps {
  /** Duração do teste em dias (já normalizada). */
  days: number;
  /** Duração já formatada no idioma ("7 dias", "7-day") — ver `trialCopy`. */
  durationLabel: string;
  /** Preço que passa a valer no fim do teste, formatado pela loja. */
  price: string;
  /** Sufixo de período (ex.: "/ano"). */
  period: string;
}

export function TrialTimeline({
  days,
  durationLabel,
  price,
  period,
}: TrialTimelineProps) {
  const { t } = useTranslation();
  const reminderDay = getTrialReminderDay(days);

  const steps = [
    {
      icon: "🔓",
      tone: Theme.colors.success,
      label: t("paywall.timeline.todayLabel"),
      text: t("paywall.timeline.todayText"),
    },
    {
      icon: "📖",
      tone: Theme.colors.accent,
      label: t("paywall.timeline.midLabel", { day: reminderDay }),
      text: t("paywall.timeline.midText"),
    },
    {
      icon: "🔔",
      tone: Theme.colors.primary,
      label: t("paywall.timeline.endLabel", { day: days }),
      text: t("paywall.timeline.endText", { price: `${price}${period}` }),
    },
  ];

  return (
    <Animated.View entering={enterUp(120)} style={s.wrap}>
      <Text style={[fredoka(16, Theme.colors.ink), s.title]}>
        {t("paywall.timeline.title", { duration: durationLabel })}
      </Text>

      {steps.map((step, i) => (
        <View key={step.label} style={s.step}>
          <View style={s.rail}>
            <View style={[s.dot, { backgroundColor: step.tone }]}>
              <Text style={{ fontSize: 13 }}>{step.icon}</Text>
            </View>
            {i < steps.length - 1 && <View style={s.line} />}
          </View>

          <View style={s.stepBody}>
            <Text style={[fredoka(13, Theme.colors.ink)]}>{step.label}</Text>
            <Text style={s.stepText}>{step.text}</Text>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.space.xl,
    borderRadius: Theme.radius.xl,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    padding: Theme.space.xl,
    marginBottom: Theme.space.xxl,
  },
  title: { marginBottom: Theme.space.lg },
  step: { flexDirection: "row", gap: Theme.space.md },
  rail: { alignItems: "center", width: 30 },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    flex: 1,
    width: 2,
    minHeight: 14,
    backgroundColor: Theme.colors.track,
    marginVertical: 2,
  },
  stepBody: { flex: 1, paddingBottom: Theme.space.lg },
  stepText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 2,
  },
});
