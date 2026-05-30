import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

// ─── DATA ────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$ 14.90",
    period: "/month",
    tag: null,
    bg: "#fff",
    border: "#E0E0E0",
    highlight: false,
  },
  {
    id: "annual",
    label: "Annual",
    price: "$ 143.00",
    period: "/year",
    tag: "🏆 Most popular",
    tagBg: "#FF5B8D",
    sub: "Billed $ 143.00/year (save 20%)",
    bg: "#FFF0F5",
    border: "#FF5B8D",
    highlight: true,
  },
];

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

// ─── BOUNCY BUTTON ────────────────────────────────────────────────────────────
const BouncyButton = ({
  label,
  subLabel,
  bg,
  shadowBg,
  onPress,
}: {
  label: string;
  subLabel?: string;
  bg: string;
  shadowBg: string;
  onPress: () => void;
}) => {
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
    <Pressable onPressIn={animIn} onPressOut={animOut} onPress={onPress}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[s.cta3dShadow, { backgroundColor: shadowBg }]} />
        <View style={[s.ctaBtn, { backgroundColor: bg }]}>
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
        </View>
      </Animated.View>
    </Pressable>
  );
};

// ─── PLAN CARD ────────────────────────────────────────────────────────────────
const PlanCard = ({
  plan,
  selected,
  onSelect,
}: {
  plan: (typeof PLANS)[0];
  selected: boolean;
  onSelect: () => void;
}) => (
  <TouchableOpacity
    onPress={onSelect}
    activeOpacity={0.85}
    style={[
      s.planCard,
      {
        backgroundColor: plan.bg,
        borderColor: selected ? plan.border : "#E8E8E8",
      },
      selected && s.planCardSelected,
    ]}
  >
    {plan.tag && (
      <View style={[s.planTag, { backgroundColor: (plan as any).tagBg }]}>
        <Text style={fredoka(11, "#fff")}>{plan.tag}</Text>
      </View>
    )}
    <View style={s.planRow}>
      <View style={[s.planRadio, selected && { borderColor: plan.border }]}>
        {selected && (
          <View style={[s.planRadioFill, { backgroundColor: plan.border }]} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={fredoka(16, "#2D2D2D")}>{plan.label}</Text>
        {(plan as any).sub && (
          <Text style={s.planSub}>{(plan as any).sub}</Text>
        )}
      </View>
      <View style={s.planPriceBox}>
        <Text style={fredoka(20, plan.highlight ? "#FF5B8D" : "#2D2D2D")}>
          {plan.price}
        </Text>
        <Text style={s.planPeriod}>{plan.period}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  // Pulse animation on mount for urgency
  React.useEffect(() => {
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

  const currentPlan = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── CLOSE ── */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.closeBtn}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18, color: "#AAA" }}>✕</Text>
        </TouchableOpacity>

        {/* ── HERO ── */}
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
            {"Unlock\nstories! 🚀"}
          </Text>
          <Text style={s.heroSub}>
            Over 50 adventures waiting for your little reader
          </Text>
        </View>

        {/* ── FEATURES ── */}
        <View style={s.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={s.featureCheck}>
                <Text style={{ fontSize: 14 }}>✅</Text>
              </View>
              <Text
                style={{
                  fontSize: 15,
                  color: "#3D3D3D",
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                <Text style={{ fontSize: 16 }}>{f.emoji} </Text>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        {/* ── PLANS ── */}
        <View style={s.sectionHdr}>
          <Text style={fredoka(20, "#2D2D2D")}>Choose your plan</Text>
        </View>

        <View style={s.plansCol}>
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan === plan.id}
              onSelect={() => setSelectedPlan(plan.id)}
            />
          ))}
        </View>

        {/* ── URGENCY BANNER ── */}
        <View style={s.urgency}>
          <Text style={{ fontSize: 18 }}>⏰</Text>
          <Text style={[fredoka(13, "#C0305A"), { flex: 1 }]}>
            20% off for the first 100 subscribers!
          </Text>
        </View>

        {/* ── CTA ── */}
        <View style={s.ctaWrap}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <BouncyButton
              label="🎉 Start Free!"
              subLabel={`Then ${currentPlan.price}${currentPlan.period} · Cancel anytime`}
              bg="#FF5B8D"
              shadowBg="#C0305A"
              onPress={() => console.log("Subscribe:", selectedPlan)}
            />
          </Animated.View>
        </View>

        {/* ── REVIEWS ── */}
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

        {/* ── FINE PRINT ── */}
        <Text style={s.finePrint}>
          Billing is done automatically. You can cancel at any time in your
          account settings. By subscribing, you agree to our Terms of Use and
          Privacy Policy.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
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

  // hero
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
  socialProof: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  socialText: { fontSize: 14, color: "#3D3D3D", fontWeight: "600" },

  // features
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

  // plans
  sectionHdr: { paddingHorizontal: 20, marginBottom: 14 },
  plansCol: { paddingHorizontal: 20, gap: 10, marginBottom: 16 },
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

  // urgency
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

  // cta
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

  // reviews
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
    fontSize: 11,
    color: "#CCC",
    textAlign: "center",
    paddingHorizontal: 28,
    marginTop: 20,
    lineHeight: 17,
    fontWeight: "600",
  },
});
