import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import illustration from "../../assets/images/background-onboarding.png";

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

export default function AppScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  const handleButtonPress = () => {
    router.push("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Blobs decorativos */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      {/* Ilustração */}
      <View style={styles.imageContainer}>
        <Image
          source={illustration}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Texto */}
      <View style={styles.textSection}>
        <Text style={fredoka(34, "#2D2D2D")}>
          {"Innovative learning\nmodern learner"}
        </Text>

        <Text style={styles.description}>
          It is a long established fact that a reader will be distracted by the
          readable content of a page when looking at its layout.
        </Text>

        {/* Dots indicadores */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* Botão */}
      <View style={styles.btnArea}>
        {/* Sombra 3D */}
        <View style={styles.btnShadow} />
        <TouchableOpacity
          onPress={handleButtonPress}
          style={styles.btn}
          activeOpacity={0.85}
        >
          <Text style={fredoka(20, "#fff")}>Let's go 👍</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F0",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },

  blob: { position: "absolute", borderRadius: 999 },
  blob1: {
    width: 220,
    height: 220,
    backgroundColor: "#FFE8F0",
    top: -60,
    right: -60,
  },
  blob2: {
    width: 160,
    height: 160,
    backgroundColor: "#E8F4FF",
    bottom: 140,
    left: -50,
  },

  imageContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  illustration: {
    width: "90%",
    height: "85%",
  },

  textSection: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  description: {
    fontSize: 15,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "600",
  },

  dots: { flexDirection: "row", gap: 8, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E0E0E0" },
  dotActive: { width: 24, backgroundColor: "#FF5B8D" },

  btnArea: {
    width: "85%",
    marginBottom: 20,
    position: "relative",
  },
  btnShadow: {
    position: "absolute",
    bottom: -6,
    left: 4,
    right: -4,
    height: 60,
    backgroundColor: "#C0540A",
    borderRadius: 40,
  },
  btn: {
    width: "100%",
    height: 60,
    backgroundColor: "#FF7A2F",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF7A2F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
});
