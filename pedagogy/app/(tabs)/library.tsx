import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// URLs do Unsplash voltadas para o universo infantil
const IMAGES = {
  bannerAnimals: require("../../assets/images/dog-background.png"), // Certifique-se de que o caminho está correto no seu projeto

  nature:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=150&q=80",

  fantasy:
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=150&q=80",

  science:
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=150&q=80",

  fruit:
    "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=150&q=80",

  popular1:
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=200&q=80",

  popular2:
    "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=200&q=80",

  popular3:
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80",

  popular4:
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=200&q=80",

  reading1:
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=150&q=80",

  reading2:
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=150&q=80",
};

export default function LibraryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.greetingText}>
            Hi <Text style={styles.userName}>Champu</Text>
          </Text>
          <Text style={styles.subGreeting}>
            Let's learn something new today!
          </Text>
        </View>

        {/* HERO BANNER */}
        <BouncyCard style={styles.bannerContainer}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechBubbleText}>Hi{"\n"}Friend!</Text>
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Noyse Roise</Text>
            <Text style={styles.bannerSubtitle}>Burt Cross</Text>
            <TouchableOpacity style={styles.bannerButton} activeOpacity={0.7}>
              <Text style={styles.bannerButtonText}>Explore now</Text>
            </TouchableOpacity>
          </View>

          {/* Fallback caso a imagem local dê erro no teste (remover condicional depois) */}
          <Image
            source={
              typeof IMAGES.bannerAnimals === "number"
                ? IMAGES.bannerAnimals
                : {
                    uri: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=200&q=80",
                  }
            }
            style={styles.bannerImage}
          />
        </BouncyCard>

        {/* CATEGORY SECTION */}
        <SectionHeader title="Category" icon="✨" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          <CategoryItem title="Nature" img={IMAGES.nature} bgColor="#E8F8F5" />
          <CategoryItem
            title="Fantasy"
            img={IMAGES.fantasy}
            bgColor="#FDEDEC"
          />
          <CategoryItem
            title="Science"
            img={IMAGES.science}
            bgColor="#EBF5FB"
          />
          <CategoryItem title="Fruit" img={IMAGES.fruit} bgColor="#FEF9E7" />
        </ScrollView>

        {/* POPULAR NOW SECTION */}
        <SectionHeader title="Popular now" icon="🔥" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gridContainer}
        >
          <PopularCard
            title="Tairbrty"
            author="Burl"
            rating="5.4"
            img={IMAGES.popular1}
            bgColor="#FFF5B1"
            dotColor="#FFD32A"
          />
          <PopularCard
            title="Sthm sthap"
            author="sray bhar"
            rating="5.4"
            img={IMAGES.popular2}
            bgColor="#C8F7F5"
            dotColor="#00CEC9"
          />
          <PopularCard
            title="Katuion"
            author="Statoam"
            rating="5.4"
            img={IMAGES.popular3}
            bgColor="#D8D8FF"
            dotColor="#6C5CE7"
          />
          <PopularCard
            title="Struk ball"
            author="sray bhar"
            rating="5.4"
            img={IMAGES.popular4}
            bgColor="#C8FFD4"
            dotColor="#00B894"
          />
        </ScrollView>

        {/* CONTINUE READING SECTION */}
        <SectionHeader title="Continue reading" icon="📚" />
        <View style={styles.continueReadingContainer}>
          <ContinueReadingCard
            title="Kekkihy"
            subtitle="long established fact that a reader."
            rating="5.4"
            progress="68%"
            img={IMAGES.reading1}
          />
          <ContinueReadingCard
            title="Space Adventure"
            subtitle="Explore the stars and planets."
            rating="5.0"
            progress="100%" // Exemplo de gamificação ativada (100% vira troféu)
            img={IMAGES.reading2}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// COMPONENTES AUXILIARES ANIMADOS
// ==========================================

// Componente para o efeito de "Mola" (Bouncy) adorado por crianças
const BouncyCard = ({ children, onPress, style }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.93, // Encolhe um pouquinho
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1, // Volta ao normal pulando
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPressIn={animateIn} onPressOut={animateOut} onPress={onPress}>
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// ==========================================
// COMPONENTES DE UI
// ==========================================

const SectionHeader = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>
      {icon} {title}
    </Text>
    {/* hitSlop aumenta a área de toque invisível para dedinhos desajeitados */}
    <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
      <Text style={styles.viewAll}>View all</Text>
    </TouchableOpacity>
  </View>
);

const CategoryItem = ({ title, img, bgColor }) => (
  <BouncyCard style={styles.categoryContainer}>
    <View style={[styles.categoryCircle, { backgroundColor: bgColor }]}>
      <Image source={{ uri: img }} style={styles.categoryImage} />
    </View>
    <Text style={styles.categoryText}>{title}</Text>
  </BouncyCard>
);

const PopularCard = ({ title, author, rating, img, bgColor, dotColor }) => {
  const router = useRouter();

  return (
    <BouncyCard
      onPress={() => router.push("/(datails-library)")}
      style={[styles.popularCard, { backgroundColor: bgColor }]}
    >
      <View style={styles.heartIcon}>
        <Text style={{ fontSize: 16, color: "#A4B0BE" }}>♡</Text>
      </View>

      <View style={styles.popularImageWrapper}>
        <Image source={{ uri: img }} style={styles.popularImage} />
        <View style={styles.starBadge}>
          <Text style={{ fontSize: 12 }}>⭐</Text>
          <Text style={styles.starText}>{rating}</Text>
        </View>
      </View>

      <Text style={styles.popularCardTitle}>{title}</Text>
      <Text style={styles.popularCardAuthor}>{author}</Text>
      <View style={[styles.decorativeDot, { backgroundColor: dotColor }]} />
    </BouncyCard>
  );
};

const ContinueReadingCard = ({ title, subtitle, rating, progress, img }) => {
  const isCompleted = progress === "100%";

  return (
    <BouncyCard style={styles.readingCard}>
      <View style={styles.readingImageContainer}>
        <Image
          source={{ uri: typeof img === "string" ? img : undefined }}
          style={styles.readingImage}
        />
        <View style={styles.readingStar}>
          <Text style={{ fontSize: 10 }}>⭐ {rating}</Text>
        </View>
      </View>

      <View style={styles.readingContent}>
        <Text style={styles.readingTitle}>{title}</Text>
        <Text style={styles.readingSubtitle}>{subtitle}</Text>
      </View>

      {/* Gamificação: Troféu se estiver 100% concluído */}
      <View style={styles.progressCircleContainer}>
        <View
          style={[
            styles.progressCircleTrack,
            isCompleted && {
              borderColor: "#FFD32A",
              borderWidth: 2,
              backgroundColor: "#FFF5B1",
            },
          ]}
        >
          {!isCompleted && <View style={styles.progressCircleFill} />}
          <View
            style={[
              styles.progressInnerCenter,
              isCompleted && { backgroundColor: "transparent" },
            ]}
          >
            <Text
              style={[styles.progressText, isCompleted && { fontSize: 18 }]}
            >
              {isCompleted ? "🏆" : progress}
            </Text>
          </View>
        </View>
      </View>
    </BouncyCard>
  );
};

// ==========================================
// ESTILOS
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F2",
    paddingTop: 45,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // HEADER
  header: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 24, // Levemente maior para crianças
    color: "#2F3542",
    fontWeight: "900", // Substitua por fontFamily: 'SuaFonteArredondada' se tiver
  },
  userName: {
    color: "#FF4757",
    fontWeight: "900",
  },
  subGreeting: {
    fontSize: 15,
    color: "#A4B0BE",
    marginTop: 4,
    fontWeight: "700",
  },

  // BANNER HERO
  bannerContainer: {
    backgroundColor: "#3E2723",
    borderRadius: 25,
    height: 160,
    flexDirection: "row",
    overflow: "visible",
    marginBottom: 30,
    marginTop: 15,
    position: "relative",
  },
  speechBubble: {
    position: "absolute",
    top: -20,
    left: "45%",
    backgroundColor: "#FFD32A",
    borderRadius: 18, // Mais arredondado
    borderBottomLeftRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  speechBubbleText: {
    fontSize: 12, // Aumentado para melhor legibilidade
    fontWeight: "900",
    color: "#3E2723",
    textAlign: "center",
  },
  bannerContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  bannerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "900",
  },
  bannerSubtitle: {
    color: "#D7CCC8",
    fontSize: 13,
    marginBottom: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  bannerButton: {
    backgroundColor: "#A73A66",
    paddingVertical: 10, // Aumentado a área de toque (Touch Target)
    paddingHorizontal: 18,
    borderRadius: 25, // Mais gordinho
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 14,
  },
  bannerImage: {
    width: 140,
    height: "110%",
    position: "absolute",
    right: 10,
    bottom: 0,
    resizeMode: "contain",
  },

  // SECTION HEADERS
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#2F3542",
  },
  viewAll: {
    color: "#FF6B81",
    fontSize: 15,
    fontWeight: "bold",
  },

  // CATEGORIES
  categoriesScroll: {
    marginBottom: 25,
  },
  categoryContainer: {
    alignItems: "center",
    marginRight: 20,
  },
  categoryCircle: {
    width: 76, // Levemente maior
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 3, // Borda mais grossa lúdica
    borderColor: "#FFF",
    elevation: 2, // Sombra suave
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2F3542",
  },
  // POPULAR GRID
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  popularCard: {
    borderRadius: 25,
    padding: 16,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    marginRight: 8,
  },
  heartIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.5)", // Fundo para o coração
    borderRadius: 15,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  popularImageWrapper: {
    position: "relative",
    marginBottom: 12,
    marginTop: 15,
  },
  popularImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  starBadge: {
    position: "absolute",
    bottom: -10,
    right: -10,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  starText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2F3542",
    marginLeft: 2,
  },
  popularCardTitle: {
    fontWeight: "900",
    fontSize: 16,
    color: "#2F3542",
    textAlign: "center",
  },
  popularCardAuthor: {
    fontSize: 12,
    color: "#747D8C",
    marginTop: 4,
    fontWeight: "600",
  },
  decorativeDot: {
    position: "absolute",
    bottom: 15,
    left: 15, // Mudei para a esquerda para equilibrar o design
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // CONTINUE READING LIST
  continueReadingContainer: {
    paddingBottom: 10,
  },
  readingCard: {
    backgroundColor: "#FFF",
    borderRadius: 25, // Mais redondo
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  readingImageContainer: {
    position: "relative",
  },
  readingImage: {
    width: 70,
    height: 70,
    borderRadius: 20,
  },
  readingStar: {
    position: "absolute",
    bottom: -10,
    alignSelf: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F2F6",
  },
  readingContent: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  readingTitle: {
    fontWeight: "900",
    fontSize: 16,
    color: "#2F3542",
  },
  readingSubtitle: {
    fontSize: 13,
    color: "#A4B0BE",
    marginTop: 4,
    lineHeight: 18,
    fontWeight: "600",
  },

  // PROGRESS CIRCLE SIMPLES
  progressCircleContainer: {
    width: 54,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  progressCircleTrack: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F1F2F6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  progressCircleFill: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 5,
    borderColor: "#4CD137", // Mudei para verde (sucesso)
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
    transform: [{ rotate: "45deg" }],
  },
  progressInnerCenter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2F3542",
  },
});
