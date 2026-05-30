import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

const GROUND_Y = SH * 0.72;
const PLAYER_SIZE = 36;
const PLAYER_LEFT = SW * 0.18;
const OBSTACLE_W = 28;
const OBSTACLE_H = 44;
const GRAVITY = 1800;
const JUMP_VY = -620;
const GAME_SPEED_INITIAL = 280;
const SPEED_INCREMENT = 12;
const TICK = 16;
const HIT_MARGIN = 6;

const PALETTE = {
  sky: "#0D0D1A",
  ground: "#1A1A2E",
  groundTop: "#6C63FF",
  player: "#A29BFE",
  playerDark: "#6C63FF",
  obstacle: "#FF6B6B",
  obstacleDark: "#C0392B",
  star: "#FFF",
  score: "#A29BFE",
  hitFlash: "rgba(255, 60, 60, 0.55)",
};

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

type ObstacleData = {
  id: number;
  animX: Animated.Value;
  posX: { current: number };
};

function generateStars(n: number) {
  return Array.from({ length: n }, () => ({
    x: Math.random() * SW,
    y: Math.random() * GROUND_Y * 0.9,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.7 + 0.3,
  }));
}
const STARS = generateStars(60);

export default function GameScreen() {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });

  const [phase, setPhase] = useState<"idle" | "playing" | "dead">("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [showHit, setShowHit] = useState(false);
  const [obstacleList, setObstacleList] = useState<ObstacleData[]>([]);

  const playerY = useRef(new Animated.Value(GROUND_Y - PLAYER_SIZE)).current;
  const playerRotate = useRef(new Animated.Value(0)).current;
  const playerSquish = useRef(new Animated.Value(1)).current;
  const groundX = useRef(new Animated.Value(0)).current;

  const velY = useRef(0);
  const posY = useRef(GROUND_Y - PLAYER_SIZE);
  const onGround = useRef(true);
  const dead = useRef(false);
  const gameSpeed = useRef(GAME_SPEED_INITIAL);
  const frameCount = useRef(0);
  const nextId = useRef(0);
  const obstaclesRef = useRef<ObstacleData[]>([]);

  const gameLoop = useRef<ReturnType<typeof setInterval> | null>(null);
  const obstacleLoop = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreLoop = useRef<ReturnType<typeof setInterval> | null>(null);
  const groundAnim = useRef<Animated.CompositeAnimation | null>(null);

  const stopLoops = useCallback(() => {
    if (gameLoop.current) {
      clearInterval(gameLoop.current);
      gameLoop.current = null;
    }
    if (obstacleLoop.current) {
      clearInterval(obstacleLoop.current);
      obstacleLoop.current = null;
    }
    if (scoreLoop.current) {
      clearInterval(scoreLoop.current);
      scoreLoop.current = null;
    }
    if (groundAnim.current) {
      groundAnim.current.stop();
      groundAnim.current = null;
    }
  }, []);

  const die = useCallback(() => {
    if (dead.current) return;
    dead.current = true;
    stopLoops();

    setShowHit(true);
    setTimeout(() => setShowHit(false), 600);

    Animated.sequence([
      Animated.timing(playerSquish, {
        toValue: 1.7,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(playerSquish, {
        toValue: 0.3,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(playerSquish, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    setScore((s) => {
      setBest((b) => Math.max(b, s));
      return s;
    });

    setTimeout(() => setPhase("dead"), 400);
  }, [stopLoops, playerSquish]);

  const jump = useCallback(() => {
    if (!onGround.current || dead.current) return;
    velY.current = JUMP_VY;
    onGround.current = false;
    Animated.sequence([
      Animated.timing(playerSquish, {
        toValue: 0.65,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(playerSquish, {
        toValue: 1.2,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(playerSquish, {
        toValue: 1,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [playerSquish]);

  const spawnObstacle = useCallback(() => {
    if (dead.current) return;
    const id = nextId.current++;
    const animX = new Animated.Value(SW + 40);
    const posX = { current: SW + 40 };

    const obs: ObstacleData = { id, animX, posX };
    obstaclesRef.current.push(obs);
    setObstacleList((prev) => [...prev, obs]);

    const duration = ((SW + 120) / gameSpeed.current) * 1000;

    animX.addListener(({ value }) => {
      posX.current = value;
    });

    Animated.timing(animX, {
      toValue: -120,
      duration,
      useNativeDriver: true,
    }).start(() => {
      animX.removeAllListeners();
      obstaclesRef.current = obstaclesRef.current.filter((o) => o.id !== id);
      setObstacleList((prev) => prev.filter((o) => o.id !== id));
    });
  }, []);

  const startGame = useCallback(() => {
    stopLoops();

    velY.current = 0;
    posY.current = GROUND_Y - PLAYER_SIZE;
    onGround.current = true;
    dead.current = false;
    gameSpeed.current = GAME_SPEED_INITIAL;
    frameCount.current = 0;
    obstaclesRef.current = [];
    setObstacleList([]);
    setShowHit(false);
    setScore(0);
    setPhase("playing");

    playerY.setValue(GROUND_Y - PLAYER_SIZE);
    playerRotate.setValue(0);
    playerSquish.setValue(1);
    groundX.setValue(0);

    const anim = Animated.loop(
      Animated.timing(groundX, {
        toValue: -SW,
        duration: 700,
        useNativeDriver: true,
      }),
    );
    groundAnim.current = anim;
    anim.start();

    gameLoop.current = setInterval(() => {
      if (dead.current) return;
      frameCount.current++;
      const dt = TICK / 1000;

      if (frameCount.current % 200 === 0) {
        gameSpeed.current = Math.min(gameSpeed.current + SPEED_INCREMENT, 620);
      }

      velY.current += GRAVITY * dt;
      posY.current += velY.current * dt;

      if (posY.current >= GROUND_Y - PLAYER_SIZE) {
        posY.current = GROUND_Y - PLAYER_SIZE;
        if (!onGround.current) {
          onGround.current = true;
          velY.current = 0;
          Animated.sequence([
            Animated.timing(playerSquish, {
              toValue: 1.35,
              duration: 55,
              useNativeDriver: true,
            }),
            Animated.timing(playerSquish, {
              toValue: 1,
              duration: 75,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          velY.current = 0;
        }
      }

      playerY.setValue(posY.current);
      playerRotate.setValue(onGround.current ? 0 : (-velY.current / 1200) * 18);

      const px1 = PLAYER_LEFT + HIT_MARGIN;
      const px2 = PLAYER_LEFT + PLAYER_SIZE - HIT_MARGIN;
      const py1 = posY.current + HIT_MARGIN;
      const py2 = posY.current + PLAYER_SIZE - HIT_MARGIN;

      for (const obs of obstaclesRef.current) {
        const ox1 = obs.posX.current + HIT_MARGIN;
        const ox2 = obs.posX.current + OBSTACLE_W - HIT_MARGIN;
        const oy1 = GROUND_Y - OBSTACLE_H + HIT_MARGIN;
        const oy2 = GROUND_Y - HIT_MARGIN;

        if (px2 > ox1 && px1 < ox2 && py2 > oy1 && py1 < oy2) {
          die();
          return;
        }
      }
    }, TICK);

    const scheduleNext = () => {
      if (dead.current) return;
      const delay = 1200 + Math.random() * 800;
      obstacleLoop.current = setTimeout(() => {
        spawnObstacle();
        scheduleNext();
      }, delay) as unknown as ReturnType<typeof setInterval>;
    };
    scheduleNext();

    scoreLoop.current = setInterval(() => {
      if (!dead.current) setScore((s) => s + 1);
    }, 100);
  }, [
    stopLoops,
    playerY,
    playerRotate,
    playerSquish,
    groundX,
    die,
    spawnObstacle,
  ]);

  const handleTap = useCallback(() => {
    if (phase === "idle" || phase === "dead") startGame();
    else jump();
  }, [phase, startGame, jump]);

  useEffect(() => () => stopLoops(), [stopLoops]);

  const rot = playerRotate.interpolate({
    inputRange: [-18, 18],
    outputRange: ["-18deg", "18deg"],
  });

  if (!fontsLoaded) return null;

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.root}>
        <StatusBar hidden />

        {/* Stars */}
        <View style={StyleSheet.absoluteFill}>
          {STARS.map((s, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: s.x,
                top: s.y,
                width: s.size,
                height: s.size,
                borderRadius: s.size,
                backgroundColor: PALETTE.star,
                opacity: s.opacity,
              }}
            />
          ))}
        </View>

        {/* Score */}
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreLabel, fredoka(11, PALETTE.score)]}>
            SCORE
          </Text>
          <Text style={[styles.scoreVal, fredoka(22, PALETTE.score)]}>
            {String(score).padStart(5, "0")}
          </Text>
          <Text
            style={[
              styles.scoreLabel,
              fredoka(11, PALETTE.score),
              { marginLeft: 24 },
            ]}
          >
            BEST
          </Text>
          <Text style={[styles.scoreVal, fredoka(22, PALETTE.score)]}>
            {String(best).padStart(5, "0")}
          </Text>
        </View>

        {/* Obstacles */}
        {obstacleList.map((obs) => (
          <Animated.View
            key={obs.id}
            style={[
              styles.obstacleWrap,
              { transform: [{ translateX: obs.animX }] },
            ]}
          >
            <View style={styles.obstacleTop} />
            <View style={styles.obstacleBody}>
              {[0, 1, 2].map((r) => (
                <View
                  key={r}
                  style={[styles.obstacleStripe, { top: r * 11 }]}
                />
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Player */}
        <Animated.View
          style={[
            styles.player,
            {
              transform: [
                { translateY: playerY },
                { rotate: rot },
                { scaleY: playerSquish },
              ],
            },
          ]}
        >
          <View style={styles.playerBody}>
            <View style={styles.eye}>
              <View style={styles.pupil} />
            </View>
            <View
              style={[styles.mouth, phase === "dead" && styles.mouthDead]}
            />
          </View>
          <View style={styles.playerShadow} />
        </Animated.View>

        {/* Ground */}
        <View style={styles.groundContainer}>
          <View style={styles.groundLine} />
          <Animated.View
            style={[
              styles.groundTiles,
              { transform: [{ translateX: groundX }] },
            ]}
          >
            {Array.from({ length: Math.ceil(SW / 40) * 3 }).map((_, i) => (
              <View key={i} style={styles.tile} />
            ))}
          </Animated.View>
          <View style={styles.groundFill} />
        </View>

        {/* Hit flash */}
        {showHit && <View style={styles.hitFlash} pointerEvents="none" />}

        {/* Overlay idle / dead */}
        {phase !== "playing" && (
          <View style={styles.overlay}>
            <View style={styles.overlayCard}>
              {phase === "idle" ? (
                <>
                  <Text
                    style={[styles.overlayTitle, fredoka(32, PALETTE.player)]}
                  >
                    PIXEL RUN
                  </Text>
                  <Text
                    style={[
                      styles.overlayHint,
                      fredoka(13, "rgba(255,255,255,0.4)"),
                    ]}
                  >
                    press to start
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[styles.overlayTitle, fredoka(32, PALETTE.obstacle)]}
                  >
                    GAME OVER
                  </Text>
                  <Text style={[styles.overlayScore, fredoka(20, "#FFF")]}>
                    {score} pts
                  </Text>
                  <Text
                    style={[
                      styles.overlayHint,
                      fredoka(13, "rgba(255,255,255,0.4)"),
                    ]}
                  >
                    press to play again
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.sky, overflow: "hidden" },
  scoreRow: {
    position: "absolute",
    top: 48,
    right: 24,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  scoreLabel: {
    opacity: 0.6,
    letterSpacing: 2,
  },
  scoreVal: {
    fontWeight: "700",
    letterSpacing: 3,
  },
  player: {
    position: "absolute",
    left: PLAYER_LEFT,
    top: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  },
  playerBody: {
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    backgroundColor: PALETTE.player,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: PALETTE.playerDark,
  },
  eye: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    backgroundColor: "#FFF",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  pupil: {
    width: 5,
    height: 5,
    backgroundColor: "#0D0D1A",
    borderRadius: 3,
    marginTop: 1,
    marginLeft: 1,
  },
  mouth: {
    position: "absolute",
    bottom: 8,
    right: 7,
    width: 10,
    height: 4,
    backgroundColor: PALETTE.playerDark,
    borderRadius: 2,
  },
  mouthDead: {
    bottom: 9,
    transform: [{ rotate: "15deg" }],
  },
  playerShadow: {
    position: "absolute",
    bottom: -4,
    left: 4,
    right: 4,
    height: 4,
    backgroundColor: PALETTE.playerDark,
    borderRadius: 2,
    opacity: 0.35,
  },
  obstacleWrap: {
    position: "absolute",
    bottom: SH - GROUND_Y,
    left: 0,
    width: OBSTACLE_W,
    height: OBSTACLE_H,
  },
  obstacleTop: {
    width: OBSTACLE_W,
    height: 10,
    backgroundColor: "#FF8E8E",
    borderRadius: 3,
    borderWidth: 2,
    borderColor: PALETTE.obstacleDark,
  },
  obstacleBody: {
    flex: 1,
    backgroundColor: PALETTE.obstacle,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: PALETTE.obstacleDark,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    overflow: "hidden",
  },
  obstacleStripe: {
    position: "absolute",
    left: 3,
    right: 3,
    height: 2,
    backgroundColor: PALETTE.obstacleDark,
    opacity: 0.35,
  },
  groundContainer: {
    position: "absolute",
    top: GROUND_Y,
    left: 0,
    right: 0,
    bottom: 0,
  },
  groundLine: { height: 3, backgroundColor: PALETTE.groundTop },
  groundTiles: { flexDirection: "row", height: 20, backgroundColor: "#16213E" },
  tile: {
    width: 40,
    height: 20,
    borderRightWidth: 1,
    borderColor: "rgba(108,99,255,0.25)",
  },
  groundFill: { flex: 1, backgroundColor: PALETTE.ground },
  hitFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PALETTE.hitFlash,
    zIndex: 50,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  overlayCard: {
    backgroundColor: "rgba(13,13,26,0.9)",
    borderWidth: 1,
    borderColor: "rgba(162,155,254,0.3)",
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  overlayTitle: {
    letterSpacing: 6,
  },
  overlayScore: {
    letterSpacing: 2,
  },
  overlayHint: {
    letterSpacing: 2,
    marginTop: 4,
  },
});
