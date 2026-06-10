import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  PurchasesPackage as Package,
  PACKAGE_TYPE,
} from "react-native-purchases";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePurchases } from "../../hooks/usePurchases";

const { width } = Dimensions.get("window");

const TERMS_URL =
  "https://app.notion.com/p/Terms-of-Use-EULA-Pedagogy-3790df0a2e798017b3d2d9d60a5d8308";
const PRIVACY_URL =
  "https://app.notion.com/p/Pol-tica-de-Privacidade-Pedagogy-3750df0a2e798004a8fcd6029d729866?source=copy_link";

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

function getPackageLabel(pkg: Package): string {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return "Annual";
    case PACKAGE_TYPE.SIX_MONTH:
      return "6 Months";
    case PACKAGE_TYPE.THREE_MONTH:
      return "3 Months";
    case PACKAGE_TYPE.TWO_MONTH:
      return "2 Months";
    case PACKAGE_TYPE.MONTHLY:
      return "Monthly";
    case PACKAGE_TYPE.WEEKLY:
      return "Weekly";
    default:
      return pkg.identifier;
  }
}

function getPackagePeriod(pkg: Package): string {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return "/year";
    case PACKAGE_TYPE.SIX_MONTH:
      return "/6 mo";
    case PACKAGE_TYPE.THREE_MONTH:
      return "/3 mo";
    case PACKAGE_TYPE.MONTHLY:
      return "/month";
    case PACKAGE_TYPE.WEEKLY:
      return "/week";
    default:
      return "";
  }
}

function isHighlightedPackage(pkg: Package): boolean {
  return pkg.packageType === PACKAGE_TYPE.ANNUAL;
}

const FEATURES = [
  { emoji: "📚", text: "Access to over 50 stories" },
  { emoji: "🧩", text: "Educational activities and mini-games" },
];

const REVIEWS = [
  {
    name: "Ana Paula",
    stars: 5,
    text: "My 4-year-old loves it! Sleeps listening to the stories every night.",
  },
  {
    name: "Rodrigo M.",
    stars: 5,
    text: "Worth every penny. The quality of the content is amazing.",
  },
  {
    name: "Carla F.",
    stars: 5,
    text: "My daughter learned to read faster with the interactive stories!",
  },
];

const BouncyButton = ({
  label,
  subLabel,
  bg,
  shadowBg,
  onPress,
  isLoading,
}: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const animIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const animOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable
      onPressIn={animIn}
      onPressOut={animOut}
      onPress={onPress}
      disabled={isLoading}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[s.cta3dShadow, { backgroundColor: shadowBg }]} />
        <View
          style={[
            s.ctaBtn,
            { backgroundColor: bg, opacity: isLoading ? 0.7 : 1 },
          ]}
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
      </Animated.View>
    </Pressable>
  );
};

interface PlanCardProps {
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
}

const PlanCard = ({ pkg, selected, onSelect }: PlanCardProps) => {
  const highlight = isHighlightedPackage(pkg);
  const label = getPackageLabel(pkg);
  const period = getPackagePeriod(pkg);
  const price = pkg.product.priceString;
  const introText = pkg.product.introPrice?.priceString
    ? `Try free for ${pkg.product.introPrice.periodNumberOfUnits} ${pkg.product.introPrice.periodUnit.toLowerCase()}(s)`
    : null;

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.85}
      style={[
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
          <Text style={fredoka(11, "#fff")}>🏆 Most popular</Text>
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
    </TouchableOpacity>
  );
};

export default function PaywallScreen() {
  const router = useRouter();
  const { packages, state, error, isSubscribed, purchase, restore } =
    usePurchases();

  const defaultPkg =
    packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ??
    packages[0] ??
    null;
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(defaultPkg);

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

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return null;

  const isProcessing = state === "purchasing" || state === "restoring";

  const handleSubscribe = async () => {
    if (!selectedPkg) return;

    const success = await purchase(selectedPkg);

    await AsyncStorage.setItem("@subscription_status", "active");

    console.log(success, "PURCHASE RESULT");

    if (success) {
      // ✅ FIX: volta para a história após assinar com sucesso

      Alert.alert(
        "🎉 Subscription Active!",
        "Your stories are unlocked. Happy reading!",
        [{ text: "Let's go!", onPress: () => router.back() }],
      );
    } else if (state === "error" && error) {
      // ✅ FIX: erro só exibe alerta — não navega automaticamente,
      // permitindo o usuário tentar novamente
      Alert.alert("Something went wrong", error);
    }
    // state === 'cancelled': nenhuma mensagem — usuário cancelou voluntariamente
  };

  const handleRestore = async () => {
    const found = await restore();

    if (found) {
      // ✅ FIX: restaurou com sucesso → volta para a história
      Alert.alert(
        "✅ Purchase Restored",
        "Your subscription has been restored.",
        [{ text: "Continue", onPress: () => router.back() }],
      );
    } else if (state === "error" && error) {
      Alert.alert("Restore Failed", error);
    } else {
      // ✅ FIX: sem assinatura encontrada → apenas avisa, não navega para fora
      Alert.alert(
        "No Active Subscription",
        "We couldn't find a previous purchase linked to this account.",
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
          <Text style={{ fontSize: 72, marginBottom: 8 }}>📚</Text>
          <Text
            style={[
              fredoka(30, "#2D2D2D"),
              { textAlign: "center", lineHeight: 36 },
            ]}
          >
            Unlock a world of stories for your child
          </Text>
          <Text style={s.heroSub}>
            Over 50 adventures waiting for your little reader
          </Text>
        </View>

        <View style={s.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={s.featureCheck}>
                <Text style={{ fontSize: 14 }}>✅</Text>
              </View>
              <Text
                style={[fredoka(15, "#3D3D3D"), { fontWeight: "600", flex: 1 }]}
              >
                <Text style={{ fontSize: 16 }}>{f.emoji} </Text>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.sectionHdr}>
          <Text style={fredoka(20, "#2D2D2D")}>Choose your plan</Text>
        </View>

        {state === "loading" ? (
          <View style={s.loadingPlans}>
            <ActivityIndicator color="#FF5B8D" size="large" />
            <Text style={[s.heroSub, { marginTop: 12 }]}>Loading plans...</Text>
          </View>
        ) : state === "error" && packages.length === 0 ? (
          <View style={s.loadingPlans}>
            <Text style={{ color: "#FF5B8D", textAlign: "center" }}>
              {error ?? "Failed to load plans. Please try again."}
            </Text>
          </View>
        ) : (
          <View style={s.plansCol}>
            {packages.map((pkg) => (
              <PlanCard
                key={pkg.identifier}
                pkg={pkg}
                selected={selectedPkg?.identifier === pkg.identifier}
                onSelect={() => !isProcessing && setSelectedPkg(pkg)}
              />
            ))}
          </View>
        )}

        <View style={s.urgency}>
          <Text style={{ fontSize: 18 }}>⏰</Text>
          <Text style={[fredoka(13, "#C0305A"), { flex: 1 }]}>
            20% off for the first 100 subscribers!
          </Text>
        </View>

        <View style={s.ctaWrap}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <BouncyButton
              label="🎉 Start Now!"
              subLabel={
                currentPkg
                  ? `Then ${currentPkg.product.priceString}${getPackagePeriod(currentPkg)} · Cancel anytime`
                  : undefined
              }
              bg="#FF5B8D"
              shadowBg="#C0305A"
              isLoading={state === "purchasing"}
              onPress={handleSubscribe}
            />
          </Animated.View>

          <TouchableOpacity
            onPress={handleRestore}
            disabled={isProcessing}
            style={s.restoreBtn}
          >
            {state === "restoring" ? (
              <ActivityIndicator color="#AAA" size="small" />
            ) : (
              <Text style={s.restoreText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.sectionHdr}>
          <Text style={fredoka(20, "#2D2D2D")}>
            What families are saying ⭐
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.reviewsRow}
        >
          {REVIEWS.map((r, i) => (
            <View key={i} style={s.reviewCard}>
              <View style={s.reviewAvatar}>
                <Text style={fredoka(16, "#FF5B8D")}>{r.name[0]}</Text>
              </View>
              <Text style={fredoka(14, "#2D2D2D")}>{r.name}</Text>
              <Text style={s.reviewStars}>{"⭐".repeat(r.stars)}</Text>
              <Text style={s.reviewText}>{r.text}</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={s.finePrint}>
          Billing is done automatically. You can cancel at any time in your
          account settings. By subscribing, you agree to our{" "}
          <Text style={s.link} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms of Use (EULA)
          </Text>{" "}
          and{" "}
          <Text style={s.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>
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
