import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ==========================================
// Subcomponentes (Podem ser movidos para a pasta /components no futuro)
// ==========================================

const Tag = ({ label, color }) => (
  <View style={[styles.tag, { backgroundColor: color }]}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const ActionButton = ({ title, color, onPress, style, shadowColor }) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      { backgroundColor: color },
      shadowColor && { ...styles.buttonShadow, shadowColor },
      style,
    ]}
    activeOpacity={0.8}
    onPress={onPress}
    accessible={true}
    accessibilityRole="button"
  >
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

// ==========================================
// Tela Principal
// ==========================================

export default function DetailsLibrary({ route }) {
  // Simulando dados que viriam por navegação (ex: React Navigation) ou API.
  // Se não vier nada, usa os dados do Urso Corajoso como "fallback" (padrão).
  const story = route?.params?.story || {
    title: "O Pequeno Urso Corajoso",
    imageUri:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    description:
      "Junte-se ao ursinho Pipo em uma grande aventura pela Floresta Encantada! Ele vai conhecer novos amigos, enfrentar pequenos desafios e descobrir que a verdadeira coragem vem do coração. 🐻✨",
    tags: [
      { id: "1", label: "Aventura", color: "#FFD93D" },
      { id: "2", label: "3-5 Anos", color: "#6BCB77" },
    ],
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Imagem de Capa */}
      <Image
        source={{ uri: story.imageUri }}
        style={styles.coverImage}
        accessibilityIgnoresInvertColors
      />

      <View style={styles.contentContainer}>
        {/* Título */}
        <Text style={styles.title}>{story.title}</Text>

        {/* Tags Dinâmicas */}
        <View style={styles.tagsContainer}>
          {story.tags.map((tag) => (
            <Tag key={tag.id} label={tag.label} color={tag.color} />
          ))}
        </View>

        {/* Descrição */}
        <Text style={styles.description}>{story.description}</Text>

        {/* Botões de Ação */}
        <ActionButton
          title="Ler Agora! 📖"
          color="#FF6B6B"
          shadowColor="#FF6B6B"
          style={styles.marginBottom12}
          onPress={() => console.log("Ação: Ler Agora")}
        />
      </View>
    </ScrollView>
  );
}

// ==========================================
// Estilos
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F6FF", // Fundo em tom pastel suave
  },
  coverImage: {
    width: "100%",
    height: 300,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  contentContainer: {
    padding: 24,
    marginTop: -20, // Sobrepõe levemente a imagem
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#4A4A4A",
    textAlign: "center",
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 10, // Funciona no React Native moderno para espaçamento flex
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    color: "#666666",
    textAlign: "center",
    marginBottom: 32,
  },
  // Estilos reaproveitados para os botões
  actionButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  buttonShadow: {
    elevation: 4, // Sombra para Android
    shadowOffset: { width: 0, height: 4 }, // Sombra para iOS
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  // Utilitários rápidos
  marginBottom12: {
    marginBottom: 12,
  },
});
