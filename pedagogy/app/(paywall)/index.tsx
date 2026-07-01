import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import {
  Breathe,
  enterPop,
  enterRight,
  enterUp,
  FloatY,
  PressBounce,
  Swing,
  Wiggle,
} from "../../shared/motion";

// 🔒 Portão parental (Kids Category — Guideline 1.3)
import { ParentalGate } from "../../shared/ParentalGate";

import {
  PurchasesPackage as Package,
  PACKAGE_TYPE,
} from "react-native-purchases";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePurchases } from "../../hooks/usePurchases";
import { trackCheckoutInitiated, trackPaywallView } from "../../lib/analytics";

import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const { width } = Dimensions.get("window");

// ⚠️ ATENÇÃO: estes são links do EDITOR do Notion (app.notion.com) e podem
// exigir login — o revisor da Apple provavelmente NÃO conseguirá abrir.
// Troque pelos links PUBLICADOS (formato "...notion.site/...", via Share →
// Publish) e teste numa aba anônima, sem estar logado, antes de enviar.
const TERMS_URL =
  "https://app.notion.com/p/Terms-of-Use-EULA-Pedagogy-3790df0a2e798017b3d2d9d60a5d8308";
const PRIVACY_URL =
  "https://app.notion.com/p/Pol-tica-de-Privacidade-Pedagogy-3750df0a2e798004a8fcd6029d729866?source=copy_link";

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

function getPackageLabel(pkg: Package, t: TFunction): string {
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

function getPackagePeriod(pkg: Package, t: TFunction): string {
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

function isHighlightedPackage(pkg: Package): boolean {
  return pkg.packageType === PACKAGE_TYPE.ANNUAL;
}

const FEATURES = [
  { emoji: "📚", key: "paywall.features.stories" },
  { emoji: "🧩", key: "paywall.features.activities" },
] as const;

// ⚠️ Não use depoimentos inventados — a Apple rejeita conteúdo enganoso
// (Guideline 2.3). Estes são selos de confiança factuais. Se quiser exibir
// avaliações, use SOMENTE reviews reais da App Store.
const TRUST = [
  {
    icon: "🔒",
    titleKey: "paywall.trust.safeTitle",
    textKey: "paywall.trust.safeText",
  },
  {
    icon: "🚫",
    titleKey: "paywall.trust.noAdsTitle",
    textKey: "paywall.trust.noAdsText",
  },
  {
    icon: "↩️",
    titleKey: "paywall.trust.cancelTitle",
    textKey: "paywall.trust.cancelText",
  },
] as const;

const BouncyButton = ({
  label,
  subLabel,
  bg,
  shadowBg,
  onPress,
  isLoading,
}: any) => (
  <PressBounce onPress={onPress} disabled={isLoading} scaleTo={0.96}>
    <View style={[s.cta3dShadow, { backgroundColor: shadowBg }]} />
    <View
      style={[s.ctaBtn, { backgroundColor: bg, opacity: isLoading ? 0.7 : 1 }]}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={fredoka(20, "#fff")}>{label}</Text>
          {subLabel && (
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                fontWeight: "700",
                marginTop: 2,
              }}
            >
              {subLabel}
            </Text>
          )}
        </>
      )}
    </View>
  </PressBounce>
);

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PlanCardProps {
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
}

const PlanCard = ({ pkg, selected, onSelect }: PlanCardProps) => {
  const { t } = useTranslation();
  const highlight = isHighlightedPackage(pkg);
  const label = getPackageLabel(pkg, t);
  const period = getPackagePeriod(pkg, t);
  const price = pkg.product.priceString;

  // Rótulo de teste grátis (só aparece se houver introPrice). A unidade vem do
  // SDK em inglês (DAY/WEEK/MONTH/YEAR) → mapeamos para uma chave traduzida.
  let introText: string | null = null;
  const intro = pkg.product.introPrice;
  if (intro?.priceString) {
    const raw = intro.periodUnit.toLowerCase();
    const unitKey = (
      ["day", "week", "month", "year"].includes(raw) ? raw : "day"
    ) as "day" | "week" | "month" | "year";
    introText = t("paywall.tryFree", {
      count: intro.periodNumberOfUnits,
      unit: t(`paywall.units.${unitKey}`),
    });
  }

  // O card selecionado "incha" levemente com mola, como se fosse abraçado
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(selected ? 1.03 : 1, {
      damping: 11,
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
      style={[
        selStyle,
        s.planCard,
        {
          backgroundColor: highlight ? "#FFF0F5" : "#fff",
          borderColor: selected ? "#FF5B8D" : "#E8E8E8",
        },
        selected && s.planCardSelected,
      ]}
    >
      {highlight && (
        <View style={[s.planTag, { backgroundColor: "#FF5B8D" }]}>
          <Text style={fredoka(11, "#fff")}>{t("paywall.mostPopular")}</Text>
        </View>
      )}
      <View style={s.planRow}>
        <View style={[s.planRadio, selected && { borderColor: "#FF5B8D" }]}>
          {selected && (
            <View style={[s.planRadioFill, { backgroundColor: "#FF5B8D" }]} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={fredoka(16, "#2D2D2D")}>{label}</Text>
          {introText && <Text style={s.planSub}>{introText}</Text>}
        </View>
        <View style={s.planPriceBox}>
          <Text style={fredoka(20, highlight ? "#FF5B8D" : "#2D2D2D")}>
            {price}
          </Text>
          <Text style={s.planPeriod}>{period}</Text>
        </View>
      </View>
    </AnimatedTouchable>
  );
};

export default function PaywallScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { packages, state, error, isSubscribed, purchase, restore } =
    usePurchases();

  const defaultPkg =
    packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ??
    packages[0] ??
    null;
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(defaultPkg);

  // 🔒 Estado do portão parental.
  // Toda ação sensível (compra, restore e links externos) passa por aqui:
  // guardamos a ação pendente e só a executamos quando um adulto acerta a conta.
  const [gateVisible, setGateVisible] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const runBehindGate = (action: () => void) => {
    pendingAction.current = action;
    setGateVisible(true);
  };

  // ── TRACKING: paywall exibido (1× ao abrir a tela) ──
  useEffect(() => {
    trackPaywallView({ source: "reader" });
  }, []);

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

  useEffect(() => {
    if (!selectedPkg && packages.length > 0) {
      setSelectedPkg(
        packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ??
          packages[0],
      );
    }
  }, [packages, selectedPkg]);

  // ✅ FIX: router.back() devolve o usuário à história de onde veio
  // em vez de router.replace("/home") que quebrava o fluxo de navegação
  useEffect(() => {
    const checkSubscription = async () => {
      const status = await AsyncStorage.getItem("@subscription_status");

      console.log(status, "STATUSSSSS");

      if (status === "active") {
        router.back();
      }
    };

    checkSubscription();
  }, [isSubscribed, router]);

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return null;

  const isProcessing = state === "purchasing" || state === "restoring";

  const handleSubscribe = async () => {
    if (!selectedPkg) return;

    // ── TRACKING: checkout iniciado (usuário tocou em "assinar") ──
    trackCheckoutInitiated({
      productId: selectedPkg.product.identifier,
      price: selectedPkg.product.price,
      currency: selectedPkg.product.currencyCode,
    });

    const success = await purchase(selectedPkg);

    console.log(success, "SUCCESSSS");

    if (success) {
      // ✅ FIX: só marca como ativo SE a compra realmente deu certo
      await AsyncStorage.setItem("@subscription_status", "active");

      Alert.alert(
        t("paywall.alerts.activeTitle"),
        t("paywall.alerts.activeBody"),
        [{ text: t("paywall.alerts.activeCta"), onPress: () => router.back() }],
      );
    } else if (state === "error" && error) {
      // ✅ FIX: erro só exibe alerta — não navega automaticamente,
      // permitindo o usuário tentar novamente
      Alert.alert(t("paywall.alerts.errorTitle"), error);
    }
    // state === 'cancelled': nenhuma mensagem — usuário cancelou voluntariamente
  };

  const handleRestore = async () => {
    const found = await restore();

    if (found) {
      // ✅ FIX: restaurou com sucesso → volta para a história
      Alert.alert(
        t("paywall.alerts.restoredTitle"),
        t("paywall.alerts.restoredBody"),
        [{ text: t("paywall.alerts.restoredCta"), onPress: () => router.back() }],
      );
    } else if (state === "error" && error) {
      Alert.alert(t("paywall.alerts.restoreFailedTitle"), error);
    } else {
      // ✅ FIX: sem assinatura encontrada → apenas avisa, não navega para fora
      Alert.alert(
        t("paywall.alerts.noSubTitle"),
        t("paywall.alerts.noSubBody"),
      );
    }
  };

  const currentPkg = selectedPkg;

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.closeBtn}
          disabled={isProcessing}
        >
          <Text style={{ fontSize: 18, color: "#AAA" }}>✕</Text>
        </TouchableOpacity>

        <View style={s.hero}>
          <View style={s.heroBlob1} />
          <View style={s.heroBlob2} />
          {/* O livrão flutua e balança como num sonho */}
          <Animated.View entering={enterPop(0)}>
            <FloatY distance={8} duration={2400}>
              <Swing angle={4} duration={3200}>
                <Text style={{ fontSize: 72, marginBottom: 8 }}>📚</Text>
              </Swing>
            </FloatY>
          </Animated.View>
          <Animated.Text
            entering={enterUp(150)}
            style={[
              fredoka(30, "#2D2D2D"),
              { textAlign: "center", lineHeight: 36 },
            ]}
          >
            {t("paywall.hero.title")}
          </Animated.Text>
          <Animated.Text entering={enterUp(280)} style={s.heroSub}>
            {t("paywall.hero.subtitle")}
          </Animated.Text>
        </View>

        <Animated.View entering={enterUp(350)} style={s.featuresCard}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.key}
              entering={enterRight(450 + i * 120)}
              style={s.featureRow}
            >
              <View style={s.featureCheck}>
                <Text style={{ fontSize: 14 }}>✅</Text>
              </View>
              <Text
                style={[fredoka(15, "#3D3D3D"), { fontWeight: "600", flex: 1 }]}
              >
                <Text style={{ fontSize: 16 }}>{f.emoji} </Text>
                {t(f.key)}
              </Text>
            </Animated.View>
          ))}
        </Animated.View>

        <View style={s.sectionHdr}>
          <Text style={fredoka(20, "#2D2D2D")}>{t("paywall.choosePlan")}</Text>
        </View>

        {state === "loading" ? (
          <View style={s.loadingPlans}>
            <ActivityIndicator color="#FF5B8D" size="large" />
            <Text style={[s.heroSub, { marginTop: 12 }]}>
              {t("paywall.loadingPlans")}
            </Text>
          </View>
        ) : state === "error" && packages.length === 0 ? (
          <View style={s.loadingPlans}>
            <Text style={{ color: "#FF5B8D", textAlign: "center" }}>
              {error ?? t("paywall.loadError")}
            </Text>
          </View>
        ) : (
          <View style={s.plansCol}>
            {packages.map((pkg, i) => (
              <Animated.View key={pkg.identifier} entering={enterPop(i * 130)}>
                <PlanCard
                  pkg={pkg}
                  selected={selectedPkg?.identifier === pkg.identifier}
                  onSelect={() => !isProcessing && setSelectedPkg(pkg)}
                />
              </Animated.View>
            ))}
          </View>
        )}

        <View style={s.urgency}>
          <Wiggle angle={14} pause={1200}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
          </Wiggle>
          <Text style={[fredoka(13, "#C0305A"), { flex: 1 }]}>
            {t("paywall.gateNotice")}
          </Text>
        </View>

        <View style={s.ctaWrap}>
          <Breathe scaleTo={1.03} duration={900}>
            <BouncyButton
              label={t("paywall.cta")}
              subLabel={
                currentPkg
                  ? t("paywall.ctaSub", {
                      price: `${currentPkg.product.priceString}${getPackagePeriod(currentPkg, t)}`,
                    })
                  : undefined
              }
              bg="#FF5B8D"
              shadowBg="#C0305A"
              isLoading={state === "purchasing"}
              onPress={() => runBehindGate(handleSubscribe)}
            />
          </Breathe>

          <TouchableOpacity
            onPress={() => runBehindGate(handleRestore)}
            disabled={isProcessing}
            style={s.restoreBtn}
          >
            {state === "restoring" ? (
              <ActivityIndicator color="#AAA" size="small" />
            ) : (
              <Text style={s.restoreText}>{t("paywall.restore")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.sectionHdr}>
          <Text style={fredoka(20, "#2D2D2D")}>{t("paywall.whyTitle")}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.reviewsRow}
        >
          {TRUST.map((item, i) => (
            <Animated.View
              key={item.titleKey}
              entering={enterRight(200 + i * 140)}
              style={s.reviewCard}
            >
              <View style={s.reviewAvatar}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <Text style={fredoka(15, "#2D2D2D")}>{t(item.titleKey)}</Text>
              <Text style={s.reviewText}>{t(item.textKey)}</Text>
            </Animated.View>
          ))}
        </ScrollView>

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
  root: { flex: 1, backgroundColor: "#FFF9F0" },
  scroll: { paddingBottom: 60 },
  closeBtn: {
    alignSelf: "flex-end",
    margin: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
    position: "relative",
  },
  heroBlob1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FFE8F0",
    top: -40,
    right: -60,
  },
  link: {
    color: "#FF5B8D",
    textDecorationLine: "underline",
  },
  heroBlob2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#E8F4FF",
    top: 60,
    left: -60,
  },
  heroSub: {
    fontSize: 15,
    color: "#AAA",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  featuresCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    marginBottom: 28,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8FFE8",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHdr: { paddingHorizontal: 20, marginBottom: 14 },
  plansCol: { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  loadingPlans: {
    paddingVertical: 40,
    alignItems: "center",
    marginBottom: 16,
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    position: "relative",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  planCardSelected: { elevation: 5 },
  planTag: {
    position: "absolute",
    top: -10,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
  },
  planRadioFill: { width: 12, height: 12, borderRadius: 6 },
  planSub: { fontSize: 11, color: "#AAA", fontWeight: "600", marginTop: 2 },
  planPriceBox: { alignItems: "flex-end" },
  planPeriod: { fontSize: 11, color: "#AAA", fontWeight: "700" },
  urgency: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF0F5",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#FFB8D0",
  },
  ctaWrap: { paddingHorizontal: 20, marginBottom: 28 },
  cta3dShadow: {
    position: "absolute",
    bottom: -7,
    left: 5,
    right: -5,
    height: 62,
    borderRadius: 32,
  },
  ctaBtn: {
    height: 62,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  restoreText: {
    fontSize: 13,
    color: "#AAA",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  reviewsRow: { gap: 14, paddingHorizontal: 20, paddingBottom: 8 },
  reviewCard: {
    width: width * 0.68,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    gap: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF0F5",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewStars: { fontSize: 14 },
  reviewText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
    lineHeight: 18,
  },
  finePrint: {
    fontSize: 12,
    color: "#CCC",
    textAlign: "center",
    paddingHorizontal: 28,
    marginTop: 20,
    lineHeight: 17,
    fontWeight: "600",
  },
});
