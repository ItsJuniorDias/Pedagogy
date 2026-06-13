/**
 * ─── MOTION KIT (Reanimated v3 API) ──────────────────────────────────────────
 * Kit de animações reutilizáveis do app, 100% na UI thread.
 *
 * Entradas (entering):   enterUp, enterRise, enterPop, enterLeft, enterRight
 * Loops ambiente:        <FloatY> <Swing> <Breathe> <Wiggle> <Twinkle> <Spin>
 * Especiais:             <DealIn> (carta sendo "dada" na mesa)
 *                        <GrowBar> (barra de progresso que cresce)
 *                        <PressBounce> (pressable com mola)
 *
 * Todos os loops respeitam "reduzir movimento" do sistema (acessibilidade)
 * via useReducedMotion / ReduceMotion.System.
 */
import React, { useEffect } from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  ReduceMotion,
  SlideInLeft,
  SlideInRight,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

// ─── ENTRANCE PRESETS ────────────────────────────────────────────────────────
// Use direto na prop `entering`: <Animated.View entering={enterUp(120)}>

const RM = ReduceMotion.System;

/** Sobe + fade, com mola (padrão do app) */
export const enterUp = (delay = 0) =>
  FadeInDown.delay(delay).springify().damping(14).stiffness(160).reduceMotion(RM);

/** Surge de baixo, como um broto crescendo 🌱 */
export const enterRise = (delay = 0) =>
  FadeInUp.delay(delay).springify().damping(13).stiffness(140).reduceMotion(RM);

/** Pop com overshoot, como uma bolha 🫧 */
export const enterPop = (delay = 0) =>
  ZoomIn.delay(delay).springify().damping(11).stiffness(180).reduceMotion(RM);

/** Desliza da esquerda */
export const enterLeft = (delay = 0) =>
  SlideInLeft.delay(delay).springify().damping(15).stiffness(150).reduceMotion(RM);

/** Desliza da direita (efeito "esteira") */
export const enterRight = (delay = 0) =>
  SlideInRight.delay(delay).springify().damping(15).stiffness(150).reduceMotion(RM);

// ─── TYPES ───────────────────────────────────────────────────────────────────
type LoopProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

/** Loop 0 → 1 → 0 infinito com easing senoidal */
const useLoop = (duration: number, delay: number, enabled: boolean) => {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!enabled) {
      v.value = 0;
      return;
    }
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      v.value = 0;
    };
  }, [enabled, delay, duration, v]);
  return v;
};

// ─── LOOPS AMBIENTE ──────────────────────────────────────────────────────────

/** 🎈 FloatY — boia para cima e para baixo */
export const FloatY = ({
  children,
  delay = 0,
  duration = 2400,
  distance = 6,
  style,
}: LoopProps & { distance?: number }) => {
  const reduce = useReducedMotion();
  const v = useLoop(duration, delay, !reduce);
  const a = useAnimatedStyle(() => ({
    transform: [{ translateY: -v.value * distance }],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
};

/** 🌬️ Swing — pêndulo suave (gira de -angle a +angle) */
export const Swing = ({
  children,
  delay = 0,
  duration = 2800,
  angle = 4,
  style,
}: LoopProps & { angle?: number }) => {
  const reduce = useReducedMotion();
  const v = useLoop(duration, delay, !reduce);
  const a = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-angle + v.value * angle * 2}deg` }],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
};

/** 💗 Breathe — "respira", crescendo e encolhendo */
export const Breathe = ({
  children,
  delay = 0,
  duration = 2000,
  scaleTo = 1.06,
  style,
}: LoopProps & { scaleTo?: number }) => {
  const reduce = useReducedMotion();
  const v = useLoop(duration, delay, !reduce);
  const a = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + v.value * (scaleTo - 1) }],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
};

/** ✨ Twinkle — opacidade piscando (estrelinhas, brilhos) */
export const Twinkle = ({
  children,
  delay = 0,
  duration = 1400,
  min = 0.35,
  style,
}: LoopProps & { min?: number }) => {
  const reduce = useReducedMotion();
  const v = useLoop(duration, delay, !reduce);
  const a = useAnimatedStyle(() => ({
    opacity: min + v.value * (1 - min),
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
};

/** 🪐 Spin — rotação contínua e lenta */
export const Spin = ({
  children,
  duration = 9000,
  style,
}: Omit<LoopProps, "delay">) => {
  const reduce = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    v.value = withRepeat(
      withTiming(360, { duration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      v.value = 0;
    };
  }, [reduce, duration, v]);
  const a = useAnimatedStyle(() => ({
    transform: [{ rotate: `${v.value}deg` }],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
};

/** 🕹️ Wiggle — sacode rapidinho, pausa, sacode de novo (joystick feliz) */
export const Wiggle = ({
  children,
  delay = 0,
  angle = 8,
  pause = 2200,
  style,
}: LoopProps & { angle?: number; pause?: number }) => {
  const reduce = useReducedMotion();
  const rot = useSharedValue(0);
  useEffect(() => {
    if (reduce) {
      rot.value = 0;
      return;
    }
    rot.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-angle, { duration: 120 }),
          withTiming(angle, { duration: 140 }),
          withTiming(-angle * 0.6, { duration: 120 }),
          withTiming(angle * 0.6, { duration: 120 }),
          withTiming(0, { duration: 120 }),
          withDelay(pause, withTiming(0, { duration: 1 })),
        ),
        -1,
        false,
      ),
    );
    return () => {
      rot.value = 0;
    };
  }, [reduce, delay, angle, pause, rot]);
  const a = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
};

// ─── ESPECIAIS ───────────────────────────────────────────────────────────────

/**
 * 🃏 DealIn — entra como uma carta sendo dada na mesa:
 * sobe, gira de ±rotateFrom até 0 e assenta com mola.
 * Alterne o sinal da rotação pelo index para o efeito zigue-zague.
 */
export const DealIn = ({
  children,
  index = 0,
  stagger = 110,
  rotateFrom = 7,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  stagger?: number;
  rotateFrom?: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const reduce = useReducedMotion();
  const p = useSharedValue(reduce ? 1 : 0);
  const dir = index % 2 === 0 ? -1 : 1;

  useEffect(() => {
    if (reduce) {
      p.value = 1;
      return;
    }
    p.value = withDelay(
      index * stagger,
      withSpring(1, { damping: 13, stiffness: 130, mass: 0.7 }),
    );
  }, [reduce, index, stagger, p]);

  const a = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [
      { translateY: (1 - p.value) * 46 },
      { rotate: `${(1 - p.value) * rotateFrom * dir}deg` },
      { scale: 0.82 + p.value * 0.18 },
    ],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
};

/** 📊 GrowBar — barra de progresso que cresce de 0 até pct% */
export const GrowBar = ({
  pct,
  color,
  delay = 0,
  duration = 900,
  style,
}: {
  pct: number;
  color: string;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const reduce = useReducedMotion();
  const w = useSharedValue(reduce ? pct : 0);
  useEffect(() => {
    w.value = reduce
      ? pct
      : withDelay(
          delay,
          withTiming(pct, { duration, easing: Easing.out(Easing.cubic) }),
        );
  }, [pct, reduce, delay, duration, w]);
  const a = useAnimatedStyle(() => ({
    width: `${w.value}%`,
    backgroundColor: color,
  }));
  return <Animated.View style={[style, a]} />;
};

/** 🫳 PressBounce — Pressable com mola no toque (substitui o BouncyCard) */
export const PressBounce = ({
  children,
  onPress,
  scaleTo = 0.94,
  style,
  entering,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  entering?: any;
  disabled?: boolean;
}) => {
  const scale = useSharedValue(1);
  const a = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 9, stiffness: 220 });
      }}
      onPress={onPress}
    >
      <Animated.View entering={entering} style={[style, a]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
