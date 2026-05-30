import { FredokaOne_400Regular } from "@expo-google-fonts/fredoka-one";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Vibration,
  View,
} from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get("window");

const GRAVITY = 0.55;
const JUMP_FORCE = -11;
const PLAYER_X = 80;
const PLAYER_SIZE = 28;
const GROUND_Y = SH - 80;
const CEIL_Y = 60;
const SCROLL_SPEED_INIT = 4.5;
const SPEED_INC = 0.0012;
const OBS_WIDTH = 38;
const GAP_MIN = 180;
const GAP_MAX = 280;
const OBS_SPACING = 320;
const MAX_PARTICLES = 60;
const FPS_TARGET = 60;
const FRAME_MS = 1000 / FPS_TARGET;

// ─── Font helper ──────────────────────────────────────────────────────────────
const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#07080f",
  bgAlt: "#0b0d1a",
  floor: "#1a1d2e",
  floorLine: "#2a2d42",
  playerNorm: "#00e5ff",
  playerFlip: "#ff4081",
  playerGlow: "#00e5ff44",
  obs: "#ff6b35",
  obsAlt: "#ff9800",
  obsBorder: "#ff6b3566",
  trail: "#00e5ff",
  trailFlip: "#ff4081",
  star: "#ffffff",
  text: "#e8eaf6",
  textDim: "#5c6bc0",
  accent: "#00e5ff",
  accentFlip: "#ff4081",
  score: "#ffd740",
  combo: "#69ff47",
  danger: "#ff1744",
  safeZone: "#00e5ff11",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "MENU" | "PLAYING" | "DEAD";

interface Obstacle {
  id: number;
  x: number;
  topH: number;
  botH: number;
  passed: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
}

// ─── Procedural obstacle generator ───────────────────────────────────────────
let obsIdCounter = 0;

function genObstacle(x: number, score: number): Obstacle {
  const playArea = GROUND_Y - CEIL_Y;
  const gap = Math.max(GAP_MIN, GAP_MAX - score * 0.8);
  const maxTop = playArea - gap - 20;
  const topH = 20 + Math.random() * maxTop;
  const botH = playArea - topH - gap;
  return { id: obsIdCounter++, x, topH, botH, passed: false };
}

function genInitialObstacles(): Obstacle[] {
  const obs: Obstacle[] = [];
  for (let i = 0; i < 5; i++) {
    obs.push(genObstacle(SW + 100 + i * OBS_SPACING, 0));
  }
  return obs;
}

// ─── Stars background ─────────────────────────────────────────────────────────
function genStars(): Star[] {
  return Array.from({ length: 60 }, () => ({
    x: Math.random() * SW,
    y: Math.random() * SH,
    r: Math.random() * 1.5 + 0.3,
    speed: Math.random() * 0.8 + 0.2,
    opacity: Math.random() * 0.6 + 0.2,
  }));
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GravityFlip() {
  const [phase, setPhase] = useState<Phase>("MENU");
  const [, forceUpdate] = useState(0);

  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  if (!fontsLoaded) return <AppLoading />;

  const playerY = useRef(SH / 2);
  const playerVY = useRef(0);
  const flipped = useRef(false);
  const obstacles = useRef<Obstacle[]>([]);
  const particles = useRef<Particle[]>([]);
  const stars = useRef<Star[]>(genStars());
  const scrollSpeed = useRef(SCROLL_SPEED_INIT);
  const score = useRef(0);
  const best = useRef(0);
  const combo = useRef(0);
  const frameId = useRef<any>(null);
  const lastTime = useRef(0);
  const particleId = useRef(0);
  const dead = useRef(false);
  const phaseRef = useRef<Phase>("MENU");

  const flipAnim = useRef(new Animated.Value(0)).current;
  const flipScale = useRef(new Animated.Value(1)).current;
  const screenFlash = useRef(new Animated.Value(0)).current;

  // ─── Spawn particles ──────────────────────────────────────────────────────
  const spawnParticles = useCallback(
    (x: number, y: number, count: number, color: string) => {
      const newP: Particle[] = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        return {
          id: particleId.current++,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color,
          size: Math.random() * 5 + 2,
        };
      });
      particles.current = [...particles.current, ...newP].slice(-MAX_PARTICLES);
    },
    [],
  );

  // ─── Do flip ──────────────────────────────────────────────────────────────
  const doFlip = useCallback(() => {
    if (dead.current || phaseRef.current !== "PLAYING") return;

    flipped.current = !flipped.current;
    playerVY.current = flipped.current ? 9 : -9;

    Vibration.vibrate(20);

    Animated.sequence([
      Animated.timing(flipScale, {
        toValue: 1.4,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(flipScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start();

    Animated.timing(flipAnim, {
      toValue: flipped.current ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5)),
    }).start();

    Animated.sequence([
      Animated.timing(screenFlash, {
        toValue: 0.18,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(screenFlash, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();

    spawnParticles(
      PLAYER_X + PLAYER_SIZE / 2,
      playerY.current + PLAYER_SIZE / 2,
      12,
      flipped.current ? C.accentFlip : C.accent,
    );
  }, [spawnParticles]);

  // ─── Game loop ────────────────────────────────────────────────────────────
  const gameLoop = useCallback(
    (now: number) => {
      if (dead.current) return;
      const dt = now - lastTime.current;
      if (dt < FRAME_MS * 0.8) {
        frameId.current = requestAnimationFrame(gameLoop);
        return;
      }
      lastTime.current = now;

      const grav = flipped.current ? -GRAVITY : GRAVITY;
      playerVY.current += grav;
      playerVY.current = Math.max(-14, Math.min(14, playerVY.current));
      playerY.current += playerVY.current;

      // Colisão chão/teto
      if (playerY.current >= GROUND_Y - PLAYER_SIZE) {
        playerY.current = GROUND_Y - PLAYER_SIZE;
        if (!flipped.current) {
          playerVY.current = 0;
        } else {
          killPlayer();
          return;
        }
      }
      if (playerY.current <= CEIL_Y) {
        playerY.current = CEIL_Y;
        if (flipped.current) {
          playerVY.current = 0;
        } else {
          killPlayer();
          return;
        }
      }

      scrollSpeed.current = Math.min(
        12,
        SCROLL_SPEED_INIT + score.current * SPEED_INC,
      );

      const obs = obstacles.current.map((o) => ({
        ...o,
        x: o.x - scrollSpeed.current,
      }));

      const last = obs.reduce((m, o) => Math.max(m, o.x), 0);
      const filtered = obs.filter((o) => o.x > -OBS_WIDTH - 20);
      while (filtered.length < 6) {
        const nx =
          Math.max(last, filtered[filtered.length - 1]?.x ?? SW) +
          OBS_SPACING +
          Math.random() * 80;
        filtered.push(genObstacle(nx, score.current));
      }

      const px1 = PLAYER_X + 4;
      const px2 = PLAYER_X + PLAYER_SIZE - 4;
      const py1 = playerY.current + 4;
      const py2 = playerY.current + PLAYER_SIZE - 4;

      for (const o of filtered) {
        const ox1 = o.x;
        const ox2 = o.x + OBS_WIDTH;

        if (px2 > ox1 && px1 < ox2) {
          const topBot = CEIL_Y + o.topH;
          if (py1 < topBot) {
            killPlayer();
            return;
          }

          const botTop = GROUND_Y - o.botH;
          if (py2 > botTop) {
            killPlayer();
            return;
          }

          if (!o.passed && px1 > ox2 - scrollSpeed.current) {
            o.passed = true;
            score.current += 1;
            combo.current += 1;
            spawnParticles(o.x + OBS_WIDTH / 2, SH / 2, 6, C.score);
          }
        } else if (o.x + OBS_WIDTH < px1 && !o.passed) {
          o.passed = true;
          score.current += 1;
          combo.current += 1;
        }
      }

      obstacles.current = filtered;

      particles.current = particles.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          life: p.life - 0.04,
          size: p.size * 0.97,
        }))
        .filter((p) => p.life > 0);

      stars.current = stars.current.map((s) => ({
        ...s,
        x: s.x - s.speed * (scrollSpeed.current / SCROLL_SPEED_INIT),
        ...(s.x < -2 ? { x: SW + 2, y: Math.random() * SH } : {}),
      }));

      if (Math.random() < 0.4) {
        spawnParticles(
          PLAYER_X,
          playerY.current + PLAYER_SIZE / 2,
          1,
          flipped.current ? C.trailFlip : C.trail,
        );
      }

      forceUpdate((n) => n + 1);
      frameId.current = requestAnimationFrame(gameLoop);
    },
    [spawnParticles],
  );

  // ─── Kill player ──────────────────────────────────────────────────────────
  const killPlayer = useCallback(() => {
    if (dead.current) return;
    dead.current = true;
    Vibration.vibrate([0, 60, 40, 80, 40, 120]);
    spawnParticles(
      PLAYER_X + PLAYER_SIZE / 2,
      playerY.current + PLAYER_SIZE / 2,
      30,
      C.danger,
    );
    if (score.current > best.current) best.current = score.current;
    setTimeout(() => {
      setPhase("DEAD");
      phaseRef.current = "DEAD";
    }, 600);
  }, [spawnParticles]);

  // ─── Start game ───────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (frameId.current) cancelAnimationFrame(frameId.current);
    playerY.current = SH / 2;
    playerVY.current = 0;
    flipped.current = false;
    obstacles.current = genInitialObstacles();
    particles.current = [];
    stars.current = genStars();
    scrollSpeed.current = SCROLL_SPEED_INIT;
    score.current = 0;
    combo.current = 0;
    dead.current = false;
    lastTime.current = performance.now();

    flipAnim.setValue(0);
    flipScale.setValue(1);
    screenFlash.setValue(0);

    phaseRef.current = "PLAYING";
    setPhase("PLAYING");
    frameId.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, []);

  // ─── Derived anim values ──────────────────────────────────────────────────
  const playerColor = flipped.current ? C.playerFlip : C.playerNorm;
  const rotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // ─── MENU ─────────────────────────────────────────────────────────────────
  if (phase === "MENU") {
    return (
      <View style={s.root}>
        <StatusBar hidden />
        <View style={s.menuBg}>
          {stars.current.map((st, i) => (
            <View
              key={i}
              style={[
                s.star,
                {
                  left: st.x,
                  top: st.y,
                  width: st.r * 2,
                  height: st.r * 2,
                  opacity: st.opacity,
                },
              ]}
            />
          ))}
        </View>

        <View style={s.menuContent}>
          <Text style={[s.menuSub, fredoka(11, C.textDim)]}>
            TAP TO FLIP GRAVITY
          </Text>
          <Text style={[s.menuTitle, fredoka(62, C.accent)]}>GRAVITY</Text>
          <Text
            style={[s.menuTitle, fredoka(62, C.accentFlip), { marginTop: -18 }]}
          >
            FLIP
          </Text>

          <View style={s.menuCard}>
            <MenuRow icon="▲▼" text="Tap to flip gravity" />
            <MenuRow icon="⬛" text="Dodge procedural obstacles" />
            <MenuRow icon="✦" text="Chain obstacles to build combo" />
            <MenuRow icon="⚡" text="Speed increases with your score" />
          </View>

          <TouchableWithoutFeedback onPress={startGame}>
            <View style={s.btnPlay}>
              <Text style={[s.btnPlayText, fredoka(16, "#000")]}>PLAY</Text>
            </View>
          </TouchableWithoutFeedback>

          {best.current > 0 && (
            <Text style={[s.menuBest, fredoka(13, C.textDim)]}>
              Best: {best.current}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ─── DEAD ─────────────────────────────────────────────────────────────────
  if (phase === "DEAD") {
    const isRecord = score.current >= best.current && score.current > 0;
    return (
      <View style={s.root}>
        <StatusBar hidden />
        <View style={s.menuBg}>
          {stars.current.map((st, i) => (
            <View
              key={i}
              style={[
                s.star,
                {
                  left: st.x,
                  top: st.y,
                  width: st.r * 2,
                  height: st.r * 2,
                  opacity: st.opacity,
                },
              ]}
            />
          ))}
        </View>

        {particles.current.map((p) => (
          <View
            key={p.id}
            style={[
              s.particle,
              {
                left: p.x - p.size / 2,
                top: p.y - p.size / 2,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                opacity: p.life,
                borderRadius: p.size / 2,
              },
            ]}
          />
        ))}

        <View style={s.menuContent}>
          <Text style={[s.menuTitle, fredoka(52, C.danger)]}>GAME</Text>
          <Text
            style={[s.menuTitle, fredoka(52, C.danger), { marginTop: -14 }]}
          >
            OVER
          </Text>

          <View style={s.scoreBox}>
            <Text style={[s.scoreLabel, fredoka(10, C.textDim)]}>SCORE</Text>
            <Text style={[s.scoreValue, fredoka(52, C.text)]}>
              {score.current}
            </Text>
            {isRecord && (
              <Text style={[s.recordBadge, fredoka(12, C.score)]}>
                NEW RECORD!
              </Text>
            )}
            <View style={s.scoreDivider} />
            <Text style={[s.scoreLabel, fredoka(10, C.textDim)]}>BEST</Text>
            <Text style={[s.scoreValue, fredoka(28, C.score)]}>
              {best.current}
            </Text>
          </View>

          <TouchableWithoutFeedback onPress={startGame}>
            <View style={s.btnPlay}>
              <Text style={[s.btnPlayText, fredoka(16, "#000")]}>
                TRY AGAIN
              </Text>
            </View>
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback
            onPress={() => {
              phaseRef.current = "MENU";
              setPhase("MENU");
            }}
          >
            <View style={s.btnSecondary}>
              <Text style={[s.btnSecText, fredoka(14, C.textDim)]}>MENU</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    );
  }

  // ─── PLAYING ──────────────────────────────────────────────────────────────
  return (
    <TouchableWithoutFeedback onPress={doFlip}>
      <View style={s.root}>
        <StatusBar hidden />

        {stars.current.map((st, i) => (
          <View
            key={i}
            style={[
              s.star,
              {
                left: st.x,
                top: st.y,
                width: st.r * 2,
                height: st.r * 2,
                opacity: st.opacity,
              },
            ]}
          />
        ))}

        <Animated.View
          style={[
            s.screenFlash,
            {
              opacity: screenFlash,
              backgroundColor: flipped.current
                ? C.accentFlip + "55"
                : C.accent + "55",
            },
          ]}
          pointerEvents="none"
        />

        <View style={[s.floor, { top: GROUND_Y, height: SH - GROUND_Y }]} />
        <View style={[s.floorLine, { top: GROUND_Y }]} />
        <View style={[s.floor, { top: 0, height: CEIL_Y }]} />
        <View style={[s.floorLine, { top: CEIL_Y }]} />

        <View
          style={[
            s.safeZone,
            {
              top: CEIL_Y,
              height: GROUND_Y - CEIL_Y,
              width: PLAYER_X + PLAYER_SIZE + 30,
            },
          ]}
        />

        {obstacles.current.map((o) => (
          <React.Fragment key={o.id}>
            <View
              style={[
                s.obstacle,
                { left: o.x, top: CEIL_Y, width: OBS_WIDTH, height: o.topH },
              ]}
            />
            <View
              style={[
                s.obstacle,
                {
                  left: o.x,
                  top: GROUND_Y - o.botH,
                  width: OBS_WIDTH,
                  height: o.botH,
                },
              ]}
            />
            <View
              style={[
                s.obsGapLine,
                {
                  left: o.x - 1,
                  top: CEIL_Y + o.topH,
                  height: GROUND_Y - o.botH - CEIL_Y - o.topH,
                },
              ]}
            />
            <View
              style={[
                s.obsGapLine,
                {
                  left: o.x + OBS_WIDTH,
                  top: CEIL_Y + o.topH,
                  height: GROUND_Y - o.botH - CEIL_Y - o.topH,
                },
              ]}
            />
          </React.Fragment>
        ))}

        {particles.current.map((p) => (
          <View
            key={p.id}
            style={{
              position: "absolute",
              left: p.x - p.size / 2,
              top: p.y - p.size / 2,
              width: Math.max(1, p.size),
              height: Math.max(1, p.size),
              backgroundColor: p.color,
              opacity: Math.max(0, p.life),
              borderRadius: p.size / 2,
            }}
          />
        ))}

        <Animated.View
          style={[
            s.player,
            {
              left: PLAYER_X,
              top: playerY.current,
              backgroundColor: playerColor,
              transform: [{ rotate }, { scale: flipScale }],
            },
          ]}
        >
          <View style={[s.playerEye, flipped.current && { top: 6 }]} />
        </Animated.View>

        <View
          style={[
            s.playerGlow,
            {
              left: PLAYER_X - 10,
              top: playerY.current - 10,
              backgroundColor: flipped.current
                ? C.accentFlip + "33"
                : C.playerGlow,
            },
          ]}
        />

        {/* HUD */}
        <View style={s.hud} pointerEvents="none">
          <View style={s.hudLeft}>
            <Text style={[s.hudScore, fredoka(38, C.text)]}>
              {score.current}
            </Text>
            {combo.current >= 3 && (
              <View style={s.comboBadge}>
                <Text style={[s.comboText, fredoka(11, C.combo)]}>
                  x{combo.current} COMBO
                </Text>
              </View>
            )}
          </View>
          <View style={s.hudRight}>
            <Text style={[s.hudBest, fredoka(12, C.textDim)]}>
              BEST {best.current}
            </Text>
            <Text style={[s.hudSpeed, fredoka(15, C.score)]}>
              {((scrollSpeed.current / SCROLL_SPEED_INIT) * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Gravity indicator */}
        <View
          style={[
            s.gravIndicator,
            { borderColor: flipped.current ? C.accentFlip : C.accent },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              s.gravArrow,
              fredoka(16, flipped.current ? C.accentFlip : C.accent),
              { transform: [{ rotate: flipped.current ? "180deg" : "0deg" }] },
            ]}
          >
            ▼
          </Text>
        </View>

        <Text style={[s.tapHint, fredoka(10, C.textDim)]} pointerEvents="none">
          TAP
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─── Menu helper ──────────────────────────────────────────────────────────────
function MenuRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.menuRow}>
      <Text style={[s.menuRowIcon, { color: C.accent }]}>{icon}</Text>
      <Text
        style={[
          s.menuRowText,
          { fontFamily: "FredokaOne_400Regular", fontSize: 13, color: C.text },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    overflow: "hidden",
  },
  menuBg: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: "absolute",
    backgroundColor: C.star,
    borderRadius: 99,
  },
  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  floor: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: C.floor,
  },
  floorLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: C.floorLine,
  },
  safeZone: {
    position: "absolute",
    left: 0,
    backgroundColor: C.safeZone,
  },
  obstacle: {
    position: "absolute",
    backgroundColor: C.obs,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.obsBorder,
  },
  obsGapLine: {
    position: "absolute",
    width: 2,
    backgroundColor: C.obsAlt + "44",
  },

  player: {
    position: "absolute",
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  playerEye: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.bg,
    position: "absolute",
    top: 7,
    right: 6,
  },
  playerGlow: {
    position: "absolute",
    width: PLAYER_SIZE + 20,
    height: PLAYER_SIZE + 20,
    borderRadius: 99,
  },
  particle: {
    position: "absolute",
  },

  hud: {
    position: "absolute",
    top: CEIL_Y + 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  hudLeft: {},
  hudRight: {
    alignItems: "flex-end",
  },
  hudScore: {
    lineHeight: 42,
  },
  hudBest: {
    letterSpacing: 2,
  },
  hudSpeed: {
    letterSpacing: 1,
  },
  comboBadge: {
    backgroundColor: C.combo + "22",
    borderWidth: 1,
    borderColor: C.combo + "66",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  comboText: {
    letterSpacing: 2,
  },
  gravIndicator: {
    position: "absolute",
    right: 16,
    bottom: SH - GROUND_Y + 16,
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  gravArrow: {},
  tapHint: {
    position: "absolute",
    bottom: SH - GROUND_Y + 56,
    right: 18,
    letterSpacing: 3,
  },

  menuContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  menuSub: {
    letterSpacing: 4,
    marginBottom: 8,
  },
  menuTitle: {
    letterSpacing: 6,
    lineHeight: 66,
  },
  menuCard: {
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: C.accent + "33",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    backgroundColor: C.accent + "08",
    gap: 10,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuRowIcon: {
    fontSize: 16,
    width: 24,
    textAlign: "center",
  },
  menuRowText: {
    flex: 1,
  },
  btnPlay: {
    backgroundColor: C.accent,
    paddingHorizontal: 48,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  btnPlayText: {
    letterSpacing: 4,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: C.accent + "55",
    paddingHorizontal: 48,
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnSecText: {
    letterSpacing: 4,
  },
  menuBest: {
    marginTop: 14,
    letterSpacing: 1,
  },

  scoreBox: {
    marginTop: 20,
    marginBottom: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.danger + "44",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    backgroundColor: C.danger + "08",
  },
  scoreLabel: {
    letterSpacing: 3,
  },
  scoreValue: {
    lineHeight: 58,
  },
  recordBadge: {
    letterSpacing: 3,
    marginBottom: 4,
  },
  scoreDivider: {
    width: "60%",
    height: 1,
    backgroundColor: C.danger + "33",
    marginVertical: 12,
  },
});
