/**
 * ─── PAYWALL ─────────────────────────────────────────────────────────────────
 * Tela de assinatura do Pedagogy. Refatorada com foco em conversão.
 *
 * O QUE MUDOU E POR QUÊ
 *
 *  1. CTA FIXO NO RODAPÉ (`StickyCta`). Antes o botão ficava depois de seis
 *     features, dos planos e do aviso do portão parental — a primeira dobra não
 *     tinha nenhuma ação. Agora existe ação desde o primeiro pixel.
 *
 *  2. O BOTÃO VENDE O TESTE, NÃO O PREÇO. "Começar 7 dias grátis" no botão;
 *     "Depois R$ X · Cancele quando quiser" em cinza, menor, FORA dele. Antes o
 *     preço cheio era estampado em branco dentro do botão, no exato momento do
 *     toque.
 *
 *  3. ÂNCORA DE PREÇO no plano anual: 12× o mensal, riscado, ao lado do preço.
 *     O desconto vira conta conferível em vez de afirmação ("Economize 44%").
 *
 *  4. LINHA DO TEMPO DO TESTE — o medo real não é o preço, é esquecer e ser
 *     cobrado. Só aparece quando existe teste grátis de verdade.
 *
 *  5. PROVA SOCIAL pronta, desligada por padrão (`features/paywall/socialProof`).
 *     Ligue preenchendo a nota REAL da App Store.
 *
 *  6. AVISO DO PORTÃO PARENTAL saiu de cima do CTA. Sinalizar fricção no
 *     instante da decisão custa conversão; a informação continua na tela, junto
 *     das letras miúdas.
 *
 *  7. HIERARQUIA MAIS CURTA: herói compacto, lista de features com um glifo por
 *     linha (o ✅ era redundante com o emoji temático) e planos ordenados com o
 *     anual primeiro — coerente com a pré-seleção.
 *
 * CORREÇÕES DE COMPORTAMENTO
 *
 *  • FONTE DA VERDADE DA ASSINATURA. A versão anterior fechava a tela sempre que
 *    `@subscription_status === "active"` no AsyncStorage. Como esse flag nunca
 *    era limpo, um assinante que cancelava (ou cujo teste expirava) ficava com o
 *    paywall se fechando sozinho — sem NENHUMA forma de assinar de novo. Perda
 *    direta de receita em reativação. Agora quem manda é o RevenueCat: o flag é
 *    espelho, e é apagado quando o entitlement não está mais ativo.
 *  • TESTE GRÁTIS SÓ QUANDO É GRÁTIS: qualquer `introPrice` era rotulado como
 *    grátis, inclusive preço promocional de entrada — cobrança inesperada.
 *  • BOTÃO DE TENTAR DE NOVO quando os planos falham ao carregar. Antes a tela
 *    virava um beco sem saída: mensagem de erro e nada mais.
 *  • `source` de origem no evento de paywall (onboarding, leitor, capítulo
 *    bloqueado) — sem isso é impossível saber qual entrada converte.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PACKAGE_TYPE,
  PurchasesPackage as Package,
} from "react-native-purchases";

import { fredoka, HIT_SLOP, Shadow, Theme } from "@/constants/theme";

import {
  enterPop,
  enterUp,
  FloatY,
  PressBounce,
  Swing,
} from "../../shared/motion";

// 🔒 Portão parental (Kids Category — Guideline 1.3)
import { ParentalGate } from "../../shared/ParentalGate";

import { usePurchases } from "../../hooks/usePurchases";
import {
  trackCheckoutInitiated,
  trackPaywallDismissed,
  trackPaywallPlanSelected,
  trackPaywallView,
} from "../../lib/analytics";

import {
  getPackagePeriod,
  PlanCard,
} from "../../features/paywall/components/PlanCard";
import { SocialProof } from "../../features/paywall/components/SocialProof";
import { StickyCta } from "../../features/paywall/components/StickyCta";
import { TrialTimeline } from "../../features/paywall/components/TrialTimeline";
import {
  FeatureList,
  TrustRow,
} from "../../features/paywall/components/ValueProps";
import { tapSelection, tapSuccess } from "../../features/paywall/haptics";
import { formatTrialDuration } from "../../features/paywall/trialCopy";
import {
  findAnnual,
  getAnnualAnchorPrice,
  getAnnualPerMonth,
  getAnnualSavingsPct,
  getTrialInfo,
  sortPackagesForDisplay,
} from "../../features/paywall/pricing";

// ⚠️ ATENÇÃO: estes são links do EDITOR do Notion (app.notion.com) e podem
// exigir login — o revisor da Apple provavelmente NÃO conseguirá abrir.
// Troque pelos links PUBLICADOS (formato "...notion.site/...", via Share →
// Publish) e teste numa aba anônima, sem estar logado, antes de enviar.
const TERMS_URL =
  "https://app.notion.com/p/Terms-of-Use-EULA-Pedagogy-3790df0a2e798017b3d2d9d60a5d8308";
const PRIVACY_URL =
  "https://app.notion.com/p/Pol-tica-de-Privacidade-Pedagogy-3750df0a2e798004a8fcd6029d729866?source=copy_link";

/** Espelho local do entitlement. Continua existindo porque outras telas leem
 *  este flag de forma síncrona; a VERDADE, porém, é sempre o RevenueCat. */
const SUBSCRIPTION_FLAG = "@subscription_status";

export default function PaywallScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // De onde o usuário chegou: "onboarding", "reader", "locked_chapter"…
  // Permite separar no funil qual entrada converte (e qual só gasta impressão).
  const params = useLocalSearchParams<{ source?: string }>();
  const source = typeof params.source === "string" ? params.source : "unknown";

  const {
    packages,
    state,
    error,
    isSubscribed,
    customerInfo,
    purchase,
    restore,
    refresh,
  } = usePurchases();

  const orderedPackages = useMemo(
    () => sortPackagesForDisplay(packages),
    [packages],
  );

  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [ctaHeight, setCtaHeight] = useState(150);

  /**
   * Sai do paywall com segurança.
   *
   * `router.back()` sozinho não bastava: o onboarding entra aqui com
   * `router.replace`, então o paywall é a ÚNICA tela da pilha e o back vira
   * no-op — o usuário ficava preso na tela mesmo depois de assinar. Quando não
   * há para onde voltar, seguimos para as abas.
   */
  const dismiss = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }, [router]);

  // 🔒 Estado do portão parental. Toda ação sensível (compra, restore e links
  // externos) guarda a ação pendente e só executa quando um adulto acerta a conta.
  const [gateVisible, setGateVisible] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const runBehindGate = (action: () => void) => {
    pendingAction.current = action;
    setGateVisible(true);
  };

  const handleGateSuccess = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setGateVisible(false);
    action?.();
  };

  const handleGateCancel = () => {
    pendingAction.current = null;
    setGateVisible(false);
  };

  // ── TRACKING: paywall exibido (1× por abertura, com a origem real) ──
  useEffect(() => {
    trackPaywallView({ source });
  }, [source]);

  // ── Pré-seleção: anual por padrão (melhor LTV e é o plano destacado) ──
  useEffect(() => {
    if (selectedPkg || orderedPackages.length === 0) return;
    setSelectedPkg(findAnnual(orderedPackages) ?? orderedPackages[0]);
  }, [orderedPackages, selectedPkg]);

  /**
   * Sincroniza o flag local com o RevenueCat.
   *
   * Só age depois que o `customerInfo` chegou — antes disso `isSubscribed` é
   * `false` só porque ainda está carregando, e fechar/limpar aqui seria decidir
   * no escuro.
   */
  useEffect(() => {
    if (!customerInfo) return;

    if (isSubscribed) {
      void AsyncStorage.setItem(SUBSCRIPTION_FLAG, "active");
      dismiss();
      return;
    }

    // Entitlement inativo: apaga flag velho para que o paywall volte a abrir
    // normalmente (reativação de quem cancelou ou teve o teste expirado).
    void AsyncStorage.removeItem(SUBSCRIPTION_FLAG);
  }, [customerInfo, isSubscribed, dismiss]);

  const isProcessing = state === "purchasing" || state === "restoring";

  const annualSavingsPct = useMemo(
    () => getAnnualSavingsPct(packages),
    [packages],
  );
  const annualAnchor = useMemo(() => getAnnualAnchorPrice(packages), [packages]);

  const trial = useMemo(() => getTrialInfo(selectedPkg), [selectedPkg]);

  // Uma única fonte de texto para a duração: selo do card, botão e linha do
  // tempo dizem exatamente a mesma coisa.
  const trialDuration = useMemo(
    () => (trial ? formatTrialDuration(trial.days, t) : null),
    [trial, t],
  );

  const priceString = selectedPkg?.product.priceString ?? "";
  const periodString = selectedPkg ? getPackagePeriod(selectedPkg, t) : "";

  // ── Texto do CTA: o teste grátis é o produto aqui, não o preço ──
  const ctaLabel = useMemo(() => {
    if (!selectedPkg || !trialDuration) return t("paywall.ctaNoTrial");
    return t("paywall.ctaTrial", { duration: trialDuration });
  }, [selectedPkg, trialDuration, t]);

  const ctaFootnote = useMemo(() => {
    if (!selectedPkg) return null;
    const price = `${priceString}${periodString}`;
    return trial
      ? t("paywall.ctaFootnoteTrial", { price })
      : t("paywall.ctaFootnote", { price });
  }, [selectedPkg, trial, priceString, periodString, t]);

  const handleSelect = useCallback(
    (pkg: Package) => {
      if (isProcessing) return;
      tapSelection();
      setSelectedPkg(pkg);
      trackPaywallPlanSelected({
        productId: pkg.product.identifier,
        period: pkg.packageType,
        source,
      });
    },
    [isProcessing, source],
  );

  const handleClose = useCallback(() => {
    trackPaywallDismissed({
      source,
      productId: selectedPkg?.product.identifier,
    });
    dismiss();
  }, [dismiss, selectedPkg, source]);

  const handleSubscribe = async () => {
    if (!selectedPkg) return;

    trackCheckoutInitiated({
      productId: selectedPkg.product.identifier,
      price: selectedPkg.product.price,
      currency: selectedPkg.product.currencyCode,
    });

    const success = await purchase(selectedPkg);

    if (success) {
      // Espelha o entitlement; a verdade continua sendo o RevenueCat.
      await AsyncStorage.setItem(SUBSCRIPTION_FLAG, "active");
      tapSuccess();

      Alert.alert(
        t("paywall.alerts.activeTitle"),
        t("paywall.alerts.activeBody"),
        [{ text: t("paywall.alerts.activeCta"), onPress: dismiss }],
      );
    } else if (state === "error" && error) {
      // Erro só exibe alerta — não navega, permitindo tentar de novo.
      Alert.alert(t("paywall.alerts.errorTitle"), error);
    }
    // state === "cancelled": usuário desistiu por conta própria, sem mensagem.
  };

  const handleRestore = async () => {
    const found = await restore();

    if (found) {
      Alert.alert(
        t("paywall.alerts.restoredTitle"),
        t("paywall.alerts.restoredBody"),
        [
          {
            text: t("paywall.alerts.restoredCta"),
            onPress: dismiss,
          },
        ],
      );
    } else if (state === "error" && error) {
      Alert.alert(t("paywall.alerts.restoreFailedTitle"), error);
    } else {
      Alert.alert(t("paywall.alerts.noSubTitle"), t("paywall.alerts.noSubBody"));
    }
  };

  const plansUnavailable = state === "error" && packages.length === 0;

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: ctaHeight + Theme.space.xxl },
        ]}
      >
        <View style={[s.header, { paddingTop: insets.top + Theme.space.sm }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={s.backBtn}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            hitSlop={HIT_SLOP}
          >
            <Text style={{ fontSize: 20, color: Theme.colors.ink }}>←</Text>
          </TouchableOpacity>
        </View>

        {/* ── HERÓI (compacto: o objetivo é chegar aos planos rápido) ── */}
        <View style={s.hero}>
          <View style={s.heroBlob1} />
          <View style={s.heroBlob2} />
          <Animated.View entering={enterPop(0)}>
            <FloatY distance={7} duration={2400}>
              <Swing angle={4} duration={3200}>
                <Text style={{ fontSize: 56, marginBottom: 4 }}>📚</Text>
              </Swing>
            </FloatY>
          </Animated.View>
          <Animated.Text
            entering={enterUp(120)}
            style={[
              fredoka(26, Theme.colors.ink),
              { textAlign: "center", lineHeight: 32 },
            ]}
          >
            {t("paywall.hero.title")}
          </Animated.Text>
          <Animated.Text entering={enterUp(200)} style={s.heroSub}>
            {t("paywall.hero.subtitle")}
          </Animated.Text>
        </View>

        {/* Nota real da App Store — não renderiza nada enquanto não houver dado. */}
        <SocialProof />

        <FeatureList />

        {/* ── PLANOS ── */}
        <View style={s.sectionHdr}>
          <Text style={fredoka(20, Theme.colors.ink)}>
            {t("paywall.choosePlan")}
          </Text>
        </View>

        {state === "loading" && packages.length === 0 ? (
          <View style={s.plansFallback}>
            <ActivityIndicator color={Theme.colors.primary} size="large" />
            <Text style={[s.heroSub, { marginTop: Theme.space.md }]}>
              {t("paywall.loadingPlans")}
            </Text>
          </View>
        ) : plansUnavailable ? (
          // Antes isto era um beco sem saída: erro na tela e nenhuma saída.
          <View style={s.plansFallback}>
            <Text style={s.errorText}>{error ?? t("paywall.loadError")}</Text>
            <PressBounce
              onPress={() => void refresh()}
              scaleTo={0.96}
              accessibilityRole="button"
              accessibilityLabel={t("paywall.retry")}
              style={s.retryBtn}
            >
              <Text style={fredoka(15, Theme.colors.onAccent)}>
                {t("paywall.retry")}
              </Text>
            </PressBounce>
          </View>
        ) : (
          <View style={s.plansCol}>
            {orderedPackages.map((pkg, i) => (
              <Animated.View key={pkg.identifier} entering={enterPop(i * 110)}>
                <PlanCard
                  pkg={pkg}
                  selected={selectedPkg?.identifier === pkg.identifier}
                  onSelect={() => handleSelect(pkg)}
                  perMonth={getAnnualPerMonth(pkg)}
                  savingsPct={
                    pkg.packageType === PACKAGE_TYPE.ANNUAL
                      ? annualSavingsPct
                      : null
                  }
                  anchorPrice={
                    pkg.packageType === PACKAGE_TYPE.ANNUAL
                      ? annualAnchor
                      : null
                  }
                />
              </Animated.View>
            ))}
          </View>
        )}

        {/* ── LINHA DO TEMPO (só quando existe teste grátis de verdade) ── */}
        {trial && trialDuration && (
          <TrialTimeline
            days={trial.days}
            durationLabel={trialDuration}
            price={priceString}
            period={periodString}
          />
        )}

        <View style={s.sectionHdr}>
          <Text style={fredoka(20, Theme.colors.ink)}>
            {t("paywall.whyTitle")}
          </Text>
        </View>
        <TrustRow />

        {/* Aviso do portão parental: informação de rodapé, não obstáculo
            plantado logo antes do botão. */}
        <View style={s.gateNotice}>
          <Text style={{ fontSize: 14 }}>🔒</Text>
          <Text style={s.gateNoticeText}>{t("paywall.gateNotice")}</Text>
        </View>

        <Text style={s.finePrint}>
          {t("paywall.finePrint")}{" "}
          {/* 🔒 Links externos passam pelo portão parental antes de abrir */}
          <Text
            style={s.link}
            onPress={() => runBehindGate(() => Linking.openURL(TERMS_URL))}
          >
            {t("paywall.terms")}
          </Text>{" "}
          {t("paywall.finePrintAnd")}{" "}
          <Text
            style={s.link}
            onPress={() => runBehindGate(() => Linking.openURL(PRIVACY_URL))}
          >
            {t("paywall.privacy")}
          </Text>
          .
        </Text>
      </ScrollView>

      {/* ── CTA FIXO: visível desde o primeiro pixel ── */}
      <StickyCta
        label={ctaLabel}
        footnote={ctaFootnote}
        loading={state === "purchasing"}
        restoring={state === "restoring"}
        disabled={!selectedPkg || isProcessing}
        onPress={() => runBehindGate(handleSubscribe)}
        onRestore={() => runBehindGate(handleRestore)}
        onHeight={setCtaHeight}
      />

      {/* 🔒 Modal do portão parental — sobrepõe a tela inteira */}
      <ParentalGate
        visible={gateVisible}
        onSuccess={handleGateSuccess}
        onCancel={handleGateCancel}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.bg },
  scroll: { paddingBottom: Theme.space.xxxl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.space.lg,
    paddingBottom: Theme.space.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.card,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: Theme.space.xxl,
    paddingBottom: Theme.space.xl,
    position: "relative",
  },
  heroBlob1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Theme.colors.primaryTint,
    top: -40,
    right: -60,
  },
  heroBlob2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Theme.colors.accentTint,
    top: 50,
    left: -60,
  },
  heroSub: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
    marginTop: Theme.space.sm,
    lineHeight: 20,
  },
  sectionHdr: {
    paddingHorizontal: Theme.space.xl,
    marginBottom: Theme.space.md,
  },
  plansCol: {
    paddingHorizontal: Theme.space.xl,
    gap: Theme.space.md,
    marginBottom: Theme.space.xxl,
  },
  plansFallback: {
    paddingVertical: Theme.space.xxxl,
    paddingHorizontal: Theme.space.xxl,
    alignItems: "center",
    marginBottom: Theme.space.lg,
    gap: Theme.space.lg,
  },
  errorText: {
    color: Theme.colors.textMuted,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Theme.space.xxl,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.primary,
  },
  gateNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.space.sm,
    marginTop: Theme.space.xxl,
    paddingHorizontal: Theme.space.xxl,
  },
  gateNoticeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.colors.textMuted,
  },
  link: {
    color: Theme.colors.primary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  finePrint: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: "center",
    paddingHorizontal: Theme.space.xxl + 4,
    marginTop: Theme.space.md,
    lineHeight: 17,
    fontWeight: "600",
  },
});
