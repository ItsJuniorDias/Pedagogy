import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Dimensions, Image, StatusBar, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import icon from "../../assets/images/pedagogy_owl_full.png";

const { width, height } = Dimensions.get("window");

/* ---------- ajustes rápidos ---------- */
const BG = "#4B3FE4"; // cor de fundo
const TITLE = "Pedagogy"; // texto do título
const TAGLINE = "Learning through play"; // subtítulo
const TOTAL_MS = 3200; // tempo total antes de chamar onFinish
/* ------------------------------------- */

type SplashProps = {
  /** Chamado quando a animação termina — use para navegar / esconder a splash nativa */
  onFinish?: () => void;
};

export default function Splash({ onFinish }: SplashProps) {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const router = useRouter();

  // entrada do ícone
  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const iconFloat = useSharedValue(0);
  const iconRotate = useSharedValue(-0.25); // ~ -14°, começa girado p/ o wobble

  // tagline
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(16);

  useEffect(() => {
    if (!fontsLoaded) return;

    // ícone: fade rápido + pop com overshoot + wobble que assenta
    iconOpacity.value = withTiming(1, { duration: 350 });

    // duplo spring => "estoura" passando de 1 e volta com bounce
    iconScale.value = withSequence(
      withSpring(1.12, { damping: 6, stiffness: 140, mass: 0.7 }),
      withSpring(1, { damping: 7, stiffness: 180, mass: 0.6 }),
    );

    // damping baixo => oscila um pouco antes de centralizar (wobble)
    iconRotate.value = withDelay(
      120,
      withSpring(0, { damping: 5, stiffness: 110, mass: 0.8 }),
    );

    // idle só entra depois da entrada terminar
    iconFloat.value = withDelay(
      900,
      withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );

    // tagline entra depois do título
    taglineOpacity.value = withDelay(1300, withTiming(1, { duration: 500 }));
    taglineY.value = withDelay(1300, withSpring(0, { damping: 14 }));

    // ao fim da splash: dispara o callback (se houver) e vai pra onboarding
    const t = setTimeout(() => {
      onFinish?.();
      router.replace("/(onboarding)"); // ajuste o path conforme sua rota
    }, TOTAL_MS);

    return () => clearTimeout(t);
  }, [fontsLoaded]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [
      { scale: iconScale.value },
      { translateY: interpolate(iconFloat.value, [0, 1], [-9, 9]) },
      {
        rotate: `${
          iconRotate.value + interpolate(iconFloat.value, [0, 1], [-0.04, 0.04])
        }rad`,
      },
    ],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  if (!fontsLoaded) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* bolhas decorativas flutuando ao fundo */}
      <Bubble size={170} top={-40} left={-50} delay={0} duration={5200} />
      <Bubble
        size={90}
        top={height * 0.18}
        left={width - 70}
        delay={600}
        duration={4200}
      />
      <Bubble
        size={120}
        top={height * 0.7}
        left={-40}
        delay={300}
        duration={6000}
      />
      <Bubble
        size={60}
        top={height * 0.82}
        left={width * 0.7}
        delay={900}
        duration={3800}
      />

      <Animated.View style={iconStyle}>
        <Image source={icon} style={styles.icon} resizeMode="contain" />
      </Animated.View>

      {/* título animado letra a letra */}
      <View style={styles.titleRow}>
        {TITLE.split("").map((char, i) => (
          <Letter
            key={`${char}-${i}`}
            char={char}
            index={i}
            ready={fontsLoaded}
          />
        ))}
      </View>

      <Animated.Text style={[styles.tagline, taglineStyle]}>
        {TAGLINE}
      </Animated.Text>

      {/* pontinhos de loading */}
      <View style={styles.dotsRow}>
        <Dot delay={0} />
        <Dot delay={160} />
        <Dot delay={320} />
      </View>
    </View>
  );
}

/* ---------- letra individual do título ---------- */
function Letter({
  char,
  index,
  ready,
}: {
  char: string;
  index: number;
  ready: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(22);

  useEffect(() => {
    if (!ready) return;
    const delay = 650 + index * 70;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 11, stiffness: 130 }),
    );
  }, [ready]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.Text style={[styles.title, style]}>{char}</Animated.Text>;
}

/* ---------- ponto de loading pulsante ---------- */
function Dot({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      1600 + delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.3, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -7]) },
      { scale: interpolate(progress.value, [0, 1], [0.85, 1.15]) },
    ],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

/* ---------- bolha decorativa de fundo ---------- */
function Bubble({
  size,
  top,
  left,
  delay,
  duration,
}: {
  size: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [0, -28]) },
      { translateX: interpolate(t.value, [0, 1], [0, 14]) },
      { scale: interpolate(t.value, [0, 1], [1, 1.12]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2, top, left },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  icon: {
    width: 130,
    height: 130,
    marginBottom: 28,
  },
  titleRow: {
    flexDirection: "row",
  },
  title: {
    fontFamily: "FredokaOne_400Regular",
    fontSize: 44,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: "FredokaOne_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    marginTop: 10,
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 10,
    position: "absolute",
    bottom: 80,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  bubble: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
