/**
 * ─── PAYWALL · CARD DE PLANO ─────────────────────────────────────────────────
 * Mudanças de conversão em relação à versão anterior:
 *
 *  • ÂNCORA DE PREÇO — o anual agora mostra "12× o mensal: R$ 718,80" riscado
 *    acima do preço. O desconto deixa de ser uma AFIRMAÇÃO ("Economize 44%") e
 *    vira aritmética que o pai confere sozinho. É a alteração isolada de maior
 *    impacto num card de plano.
 *  • Selo de teste grátis só aparece quando o teste é REALMENTE grátis
 *    (introPrice === 0) — ver `getTrialInfo`.
 *  • Semântica de rádio para leitores de tela (role + accessibilityState), que
 *    antes não existia: o card era um TouchableOpacity mudo.
 *  • Sem hex solto: os antigos "#DDD" e "#2BB673" viraram tokens do tema.
 */

import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  PACKAGE_TYPE,
  PurchasesPackage as Package,
} from "react-native-purchases";

import { fredoka, Shadow, Theme } from "@/constants/theme";

import { getTrialInfo, isHighlightedPackage } from "../pricing";
import { formatTrialDuration } from "../trialCopy";
import type { TFunction } from "i18next";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function getPackageLabel(pkg: Package, t: TFunction): string {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return t("paywall.period.annual");
    case PACKAGE_TYPE.SIX_MONTH:
      return t("paywall.period.sixMonth");
    case PACKAGE_TYPE.THREE_MONTH:
      return t("paywall.period.threeMonth");
    case PACKAGE_TYPE.TWO_MONTH:
      return t("paywall.period.twoMonth");
    case PACKAGE_TYPE.MONTHLY:
      return t("paywall.period.monthly");
    case PACKAGE_TYPE.WEEKLY:
      return t("paywall.period.weekly");
    default:
      return pkg.identifier;
  }
}

export function getPackagePeriod(pkg: Package, t: TFunction): string {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return t("paywall.periodShort.year");
    case PACKAGE_TYPE.SIX_MONTH:
      return t("paywall.periodShort.sixMo");
    case PACKAGE_TYPE.THREE_MONTH:
      return t("paywall.periodShort.threeMo");
    case PACKAGE_TYPE.MONTHLY:
      return t("paywall.periodShort.month");
    case PACKAGE_TYPE.WEEKLY:
      return t("paywall.periodShort.week");
    default:
      return "";
  }
}

/** Selo de teste grátis do card ("7 dias grátis"), ou null.
 *  Sempre em DIAS, igual ao botão e à linha do tempo — ver `trialCopy`. */
export function getTrialLabel(pkg: Package, t: TFunction): string | null {
  const trial = getTrialInfo(pkg);
  if (!trial) return null;
  return t("paywall.trialPill", {
    duration: formatTrialDuration(trial.days, t),
  });
}

interface PlanCardProps {
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
  /** Preço mensal equivalente (só no plano anual). */
  perMonth?: string | null;
  /** % de economia vs. mensal (só no plano anual). */
  savingsPct?: number | null;
  /** Custo de 12 meses no plano mensal, riscado (só no plano anual). */
  anchorPrice?: string | null;
}

export function PlanCard({
  pkg,
  selected,
  onSelect,
  perMonth,
  savingsPct,
  anchorPrice,
}: PlanCardProps) {
  const { t } = useTranslation();
  const highlight = isHighlightedPackage(pkg);
  const label = getPackageLabel(pkg, t);
  const period = getPackagePeriod(pkg, t);
  const price = pkg.product.priceString;
  const trialText = getTrialLabel(pkg, t);

  // O card selecionado "incha" levemente com mola, como se fosse abraçado.
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(selected ? 1.02 : 1, {
      damping: 12,
      stiffness: 180,
    });
  }, [selected, scale]);
  const selStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={onSelect}
      activeOpacity={0.85}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={[label, price, period, trialText]
        .filter(Boolean)
        .join(" · ")}
      style={[
        selStyle,
        s.card,
        {
          backgroundColor: highlight
            ? Theme.colors.primaryFaint
            : Theme.colors.surface,
          borderColor: selected ? Theme.colors.primary : Theme.colors.border,
        },
        selected && s.cardSelected,
      ]}
    >
      {highlight && (
        <View style={[s.tag, { backgroundColor: Theme.colors.primary }]}>
          <Text style={fredoka(11, Theme.colors.onAccent)}>
            {t("paywall.mostPopular")}
          </Text>
        </View>
      )}

      {savingsPct != null && savingsPct > 0 && (
        <View style={s.saveTag}>
          <Text style={fredoka(11, Theme.colors.onAccent)}>
            {t("paywall.save", { percent: savingsPct })}
          </Text>
        </View>
      )}

      <View style={s.row}>
        <View style={[s.radio, selected && { borderColor: Theme.colors.primary }]}>
          {selected && (
            <View style={[s.radioFill, { backgroundColor: Theme.colors.primary }]} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={fredoka(16, Theme.colors.ink)}>{label}</Text>
          {perMonth && (
            <Text style={s.perMonth}>
              {t("paywall.perMonth", { price: perMonth })} ·{" "}
              {t("paywall.billedAnnually")}
            </Text>
          )}
          {trialText && (
            <View style={s.trialPill}>
              <Text style={s.trialPillText}>🎁 {trialText}</Text>
            </View>
          )}
        </View>

        <View style={s.priceBox}>
          {/* Âncora: o que 12 meses custariam no plano mensal. */}
          {anchorPrice && (
            <Text style={s.anchor} accessibilityLabel={t("paywall.anchorA11y", { price: anchorPrice })}>
              {anchorPrice}
            </Text>
          )}
          <Text
            style={fredoka(
              20,
              highlight ? Theme.colors.primary : Theme.colors.ink,
            )}
          >
            {price}
          </Text>
          <Text style={s.period}>{period}</Text>
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: Theme.radius.lg,
    borderWidth: 2,
    padding: Theme.space.lg,
    position: "relative",
    ...Shadow.card,
  },
  cardSelected: { elevation: 5 },
  tag: {
    position: "absolute",
    top: -10,
    left: Theme.space.lg,
    paddingHorizontal: Theme.space.md,
    paddingVertical: Theme.space.xs,
    borderRadius: Theme.radius.xs,
  },
  saveTag: {
    position: "absolute",
    top: -10,
    right: Theme.space.lg,
    paddingHorizontal: Theme.space.sm + 2,
    paddingVertical: Theme.space.xs,
    borderRadius: Theme.radius.xs,
    backgroundColor: Theme.colors.success,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.space.md,
    marginTop: Theme.space.xs,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  perMonth: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: "700",
    marginTop: 3,
  },
  trialPill: {
    alignSelf: "flex-start",
    marginTop: Theme.space.sm,
    paddingHorizontal: Theme.space.sm,
    paddingVertical: 3,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.successTint,
  },
  trialPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.colors.success,
  },
  priceBox: { alignItems: "flex-end" },
  anchor: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.colors.textFaint,
    textDecorationLine: "line-through",
    marginBottom: 1,
  },
  period: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontWeight: "700",
  },
});
