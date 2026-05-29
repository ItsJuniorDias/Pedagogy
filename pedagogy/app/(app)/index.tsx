import React from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import illustration from "../../assets/images/background-onboarding.png"; // Substitua pelo caminho da sua imagem local

export default function AppScreen() {
  const router = useRouter();

  const handleButtonPress = () => {
    router.push("/(tabs)"); // Navega para a tela de abas
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Seção da Imagem/Ilustração */}
      <View style={styles.imageContainer}>
        <Image
          source={illustration} // Substitua pelo caminho da sua imagem local
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Conteúdo de Texto */}
      <View style={styles.textSection}>
        <Text style={styles.title}>
          Innovative learning{"\n"}modern learner
        </Text>

        <Text style={styles.description}>
          It is a long established fact that a reader wil by the readable
          content of a page when.
        </Text>
      </View>

      {/* Botão Customizado */}
      <TouchableOpacity
        onPress={handleButtonPress}
        style={styles.buttonWrapper}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Let's go 👍</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F6E5", // Tom de bege claro do fundo
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  imageContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  illustration: {
    width: "90%",
    height: "80%",
  },
  textSection: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2D2D2D",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: "#8A8A8A",
    textAlign: "center",
    lineHeight: 24,
  },
  buttonWrapper: {
    width: "85%",
    height: 60,
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "#E67E22", // Tom de laranja vibrante
    borderRadius: 40,
    shadowColor: "#E67E22",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
    alignItems: "center",
  },
  gradientButton: {
    height: 65,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonShadow: {
    position: "absolute",
    bottom: 5,
    width: "100%",
    height: 65,
    backgroundColor: "#634226", // Cor marrom da base
    borderRadius: 25,
    zIndex: 1,
  },
});
