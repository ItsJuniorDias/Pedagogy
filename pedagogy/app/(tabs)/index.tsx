import React from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// URLs do Unsplash com temas infantis, brinquedos, cores vivas e trilhas de aprendizado
// IMAGENS INFANTIS — UNSPLASH
// Mantendo a mesma estrutura do seu projeto

const IMAGES = {
  profile:
    "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?q=80&w=400&auto=format&fit=crop",
  banner:
    "https://images.unsplash.com/photo-1610296669228-602fa827fc1f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8c3BhY2V8ZW58MHx8MHx8fDA%3D",
  nature:
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=600&auto=format&fit=crop",
  animals:
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=600&auto=format&fit=crop",
  science:
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=600&auto=format&fit=crop",
  castle:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop",
  puzzle:
    "https://plus.unsplash.com/premium_photo-1723662084148-2cd2357705ba?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHV6emxlfGVufDB8fDB8fHww",
  alphabet:
    "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=600&auto=format&fit=crop",
  school:
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop",
  astronaut:
    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=600&auto=format&fit=crop",
  space:
    "https://plus.unsplash.com/premium_photo-1690571200236-0f9098fc6ca9?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3BhY2V8ZW58MHx8MHx8fDA%3D",
};

const LEARNING_PATHS = [
  {
    id: 1,
    title: "Letters-1",
    progress: "6/6",
    img: IMAGES.alphabet,
    bgColor: "#FFF0A8",
    dotColor: "#FFD32A",
  },
  {
    id: 2,
    title: "School-1",
    progress: "6/6",
    img: IMAGES.school,
    bgColor: "#D4E157",
    dotColor: "#E056FD",
  },
  {
    id: 3,
    title: "Astronaut-1",
    progress: "4/6",
    img: IMAGES.astronaut,
    bgColor: "#FFCC80",
    dotColor: "#FFB142",
  },
  {
    id: 4,
    title: "Space-1",
    progress: "2/6",
    img: IMAGES.space,
    bgColor: "#A3CB38",
    dotColor: "#74B9FF",
  },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>
              Hi <Text style={styles.userName}>Champu!</Text>
            </Text>
            <Text style={styles.subGreeting}>
              Let's have some fun today! ✨
            </Text>
          </View>
          <Image
            resizeMode="cover"
            source={{ uri: IMAGES.profile }}
            style={styles.profileImage}
          />
        </View>

        {/* TOP ICONS NAVIGATION */}
        <View style={styles.topIconsRow}>
          {["🚀", "🎨", "🧸", "🦖"].map((icon, index) => (
            <TouchableOpacity key={index} style={styles.iconCircle}>
              <Text style={{ fontSize: 26 }}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PROMO BANNER */}
        <ImageBackground
          source={{ uri: IMAGES.banner }}
          style={styles.bannerContainer}
          imageStyle={{ borderRadius: 30 }}
          resizeMode="cover"
        >
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Magic World{"\n"}of Story</Text>

            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Explore Now!</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* CATEGORIES CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {["Drawing", "Space", "Animals", "Magic"].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryChip,
                index === 0 && styles.activeCategory,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  index === 0 && styles.activeCategoryText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SECTION: INTERESTS */}
        <SectionHeader title="Your Favorites 🌟" />
        <View style={styles.interestsRow}>
          <InterestCard title="Explore" color="#A3E4D7" img={IMAGES.nature} />
          <InterestCard title="Pets" color="#FDEBD0" img={IMAGES.animals} />
          <InterestCard title="Space" color="#D6EAF8" img={IMAGES.space} />
        </View>

        {/* SECTION: LEARNING PATH (NOVA SEÇÃO) */}
        <View style={styles.learningHeaderContainer}>
          <View style={styles.learningHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.sectionTitle}>Learning path</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAllRed}>View all</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.learningSubText}>
            long established fact that a reader will be
          </Text>
        </View>

        <View style={styles.learningGrid}>
          {LEARNING_PATHS.map((item) => (
            <LearningCard key={item.id} {...item} />
          ))}
        </View>

        {/* SECTION: POPULAR */}
        <SectionHeader title="Cool Stuff! 🎈" />
        <PopularItem
          title="Magic Block Castle"
          tag="Fun!"
          tagColor="#58D68D"
          img={IMAGES.castle}
        />
        <PopularItem
          title="Colorful Puzzle"
          tag="New"
          tagColor="#FF4757"
          img={IMAGES.puzzle}
        />
      </ScrollView>
    </View>
  );
}

// COMPONENTES AUXILIARES
const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity>
      <Text style={styles.viewAll}>See All</Text>
    </TouchableOpacity>
  </View>
);

const InterestCard = ({ title, color, img }) => (
  <View style={[styles.interestCard, { backgroundColor: color }]}>
    <Image source={{ uri: img }} style={styles.interestImage} />
    <Text style={styles.interestText}>{title}</Text>
  </View>
);

const PopularItem = ({ title, tag, tagColor, img }) => (
  <View style={styles.popularCard}>
    <Image source={{ uri: img }} style={styles.popularThumb} />
    <View style={{ flex: 1, marginLeft: 15 }}>
      <Text style={styles.popularTitle}>{title}</Text>
      <Text style={styles.popularSub}>
        Play, build, and learn with colorful blocks!
      </Text>
    </View>
    <View style={[styles.tag, { backgroundColor: tagColor }]}>
      <Text style={styles.tagText}>{tag}</Text>
    </View>
  </View>
);

const LearningCard = ({ title, progress, img, bgColor, dotColor }) => (
  <TouchableOpacity style={styles.learningCard}>
    <View style={[styles.learningImageContainer, { backgroundColor: bgColor }]}>
      <Image source={{ uri: img }} style={styles.learningImage} />
    </View>
    <View style={styles.learningContent}>
      <Text style={styles.learningCardTitle}>{title}</Text>
      <Text style={styles.learningCardProgress}>{progress}</Text>
      <View style={[styles.decorativeDot, { backgroundColor: dotColor }]} />
    </View>
  </TouchableOpacity>
);

// ESTILOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FBFF", // Azul bem clarinho e alegre
    paddingTop: 45,
  },
  scrollContent: { padding: 20, paddingBottom: 100 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  userName: { fontWeight: "900", color: "#FF4757", fontSize: 26 }, // Rosa forte / Melancia
  greetingText: { fontSize: 24, color: "#2F3542", fontWeight: "bold" },
  subGreeting: {
    fontSize: 15,
    color: "#747D8C",
    marginTop: 4,
    fontWeight: "600",
  },
  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 4,
    borderColor: "#FFD32A", // Amarelo vibrante na borda
  },

  topIconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  iconCircle: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#1E90FF",
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },

  bannerContainer: { height: 170, marginBottom: 30, justifyContent: "center" },
  bannerOverlay: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.4)", // Fundo esbranquiçado sobre a imagem
    height: "100%",
    borderRadius: 30, // Mais arredondado
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2F3542",
    lineHeight: 30,
  },
  bannerButton: {
    backgroundColor: "#FFA502", // Laranja vibrante
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 15,
    alignSelf: "flex-start",
    elevation: 3,
  },
  bannerButtonText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 15,
    textTransform: "uppercase",
  },

  categoriesScroll: { marginBottom: 30 },
  categoryChip: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: "#FFF",
    marginRight: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  activeCategory: { backgroundColor: "#FF4757" }, // Rosa forte
  categoryText: { color: "#747D8C", fontWeight: "800", fontSize: 15 },
  activeCategoryText: { color: "#FFF" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 10,
  },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: "#2F3542" },
  viewAll: { color: "#1E90FF", fontSize: 16, fontWeight: "bold" },

  interestsRow: { flexDirection: "row", justifyContent: "space-between" },
  interestCard: {
    width: (width - 60) / 3,
    borderRadius: 25,
    padding: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  interestImage: {
    width: "100%",
    height: 70,
    borderRadius: 18,
    marginBottom: 10,
  },
  interestText: { fontWeight: "900", fontSize: 14, color: "#2F3542" },

  popularCard: {
    backgroundColor: "#FFF",
    borderRadius: 25,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    elevation: 4,
    shadowColor: "#1E90FF",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  popularThumb: { width: 65, height: 65, borderRadius: 20 },
  popularTitle: { fontWeight: "900", color: "#2F3542", fontSize: 17 },
  popularSub: {
    fontSize: 13,
    color: "#A4B0BE",
    marginTop: 4,
    fontWeight: "500",
  },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 15 },
  tagText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  // --- LEARNING PATH STYLES ---
  learningHeaderContainer: {
    marginTop: 20,
    marginBottom: 15,
  },
  learningHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newBadge: {
    backgroundColor: "#FF4757",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 10,
  },
  newBadgeText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  viewAllRed: {
    color: "#FF4757",
    fontSize: 16,
    fontWeight: "bold",
  },
  learningSubText: {
    color: "#A4B0BE",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "500",
  },
  learningGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  learningCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 25,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  learningImageContainer: {
    height: 110,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  learningImage: {
    width: "100%",
    height: "100%",
  },
  learningContent: {
    paddingVertical: 15,
    alignItems: "center",
    position: "relative",
  },
  learningCardTitle: {
    fontWeight: "900",
    color: "#2F3542",
    fontSize: 16,
  },
  learningCardProgress: {
    fontSize: 14,
    color: "#A4B0BE",
    marginTop: 4,
    fontWeight: "600",
  },
  decorativeDot: {
    position: "absolute",
    right: 15,
    bottom: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
