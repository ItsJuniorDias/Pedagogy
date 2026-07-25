/**
 * ─── PAYWALL · CTA FIXO ──────────────────────────────────────────────────────
 *
 * Duas correções de conversão moram aqui:
 *
 *  1. O BOTÃO NÃO SOME. Antes o CTA vivia no meio de um scroll longo: features,
 *     planos, aviso do portão parental e só então o botão. Quem abria a tela não
 *     via nenhuma ação na primeira dobra. Agora a barra é fixa no rodapé desde o
 *     primeiro pixel e acompanha o scroll inteiro.
 *
 *  2. O BOTÃO VENDE O TESTE, NÃO O PREÇO. A versão anterior estampava
 *     "Depois R$ 399,90/ano" em branco DENTRO do botão — gritando o número que
 *     assusta exatamente no instante do toque. Agora o botão diz "Começar 7 dias
 *     grátis" e a informação de cobrança desce para uma nota em cinza, fora do
 *     botão, menor. Ela continua presente e legível (é exigência da Apple e do
 *     consumidor), só deixa de competir com a ação.
 *
 * A altura real da barra é devolvida via `onHeight` para o ScrollView reservar
 * o padding equivalente — nada de número mágico que quebra em iPhone SE.
 */

import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fredoka, HIT_SLOP, Theme } from "@/constants/theme";

import { Breathe, PressBounce } from "../../../shared/motion";
import { tapImpact } from "../haptics";

interface StickyCtaProps {
  /** Texto do botão (já resolvido: teste grátis ou assinatura direta). */
  label: string;
  /** Nota de cobrança, exibida FORA do botão. */
  footnote?: string | null;
  loading?: boolean;
  disabled?: boolean;
  restoring?: boolean;
  onPress: () => void;
  onRestore: () => void;
  /** Devolve a altura medida da barra para o scroll reservar espaço. */
  onHeight?: (h: number) => void;
}

export function StickyCta({
  label,
  footnote,
  loading = false,
  disabled = false,
  restoring = false,
  onPress,
  onRestore,
  onHeight,
}: StickyCtaProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    if (disabled || loading) return;
    tapImpact();
    onPress();
  };

  return (
    <View
      style={[s.bar, { paddingBottom: Math.max(insets.bottom, Theme.space.md) }]}
      onLayout={(e) => onHeight?.(e.nativeEvent.layout.height)}
    >
      <Breathe scaleTo={1.015} duration={1400}>
        <PressBounce
          onPress={handlePress}
          disabled={disabled || loading}
          scaleTo={0.96}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: disabled || loading, busy: loading }}
        >
          <View style={s.ctaShadow} />
          <View style={[s.cta, (disabled || loading) && { opacity: 0.7 }]}>
            {loading ? (
              <ActivityIndicator color={Theme.colors.onAccent} />
            ) : (
              <Text style={fredoka(20, Theme.colors.onAccent)}>{label}</Text>
            )}
          </View>
        </PressBounce>
      </Breathe>

      {footnote ? <Text style={s.footnote}>{footnote}</Text> : null}

      <PressBounce
        onPress={onRestore}
        disabled={restoring || loading}
        scaleTo={0.97}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={t("paywall.restore")}
        style={s.restore}
      >
        {restoring ? (
          <ActivityIndicator color={Theme.colors.textMuted} size="small" />
        ) : (
          <Text style={s.restoreText}>{t("paywall.restore")}</Text>
        )}
      </PressBounce>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Theme.space.xl,
    paddingTop: Theme.space.lg,
    backgroundColor: Theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  ctaShadow: {
    position: "absolute",
    bottom: -6,
    left: 4,
    right: -4,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primaryDeep,
  },
  cta: {
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
  },
  footnote: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.textMuted,
    textAlign: "center",
    marginTop: Theme.space.md,
  },
  restore: {
    alignSelf: "center",
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: Theme.space.md,
    marginTop: Theme.space.xs,
  },
  restoreText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
