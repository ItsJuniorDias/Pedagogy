// features/farm-game/FarmGameScreen.tsx
import {
  FredokaOne_400Regular,
  useFonts,
} from "@expo-google-fonts/fredoka-one";
import { GLView } from "expo-gl";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useCoinStore } from "../../hooks/UseCoinStore";
import { DayModal } from "./components/DayModal";
import { FloatLabel } from "./components/FloatLabel";
import { Glass } from "./components/Glass";
import { GoldCounter } from "./components/GoldCounter";
import { MarketModal } from "./components/MarketModal";
import { ShopModal } from "./components/ShopModal";
import { XPBar } from "./components/XPBar";
import { TILE_H } from "./constants";
import { CROPS, RARITY_META } from "./data/crops";
import { peculiarityOf } from "./data/peculiarities";
import { TOOLS } from "./data/tools";
import { computeHarvest } from "./state/rewards";
import { useFarmGame } from "./state/useFarmGame";
import { tileWorldPos } from "./three/geometry";
import {
  createSceneRefs,
  useFarmScene,
  type SceneRefs,
} from "./three/useFarmScene";
import { s } from "./styles";
import type { FloatingLabel, ToolId } from "./types";

// ─── Main Component ───────────────────────────────────────────────────────────

function FarmGameInner() {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const insets = useSafeAreaInsets();

  // ── Game state (reducer + persistence + tick) ───────────────────────────────
  const { state, dispatch, stateRef, hydrated } = useFarmGame();

  const [shopVisible, setShopVisible] = useState(false);
  const [marketVisible, setMarketVisible] = useState(false);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [floatLabels, setFloatLabels] = useState<FloatingLabel[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // ── IAP: coin store (expo-iap) ──────────────────────────────────────────────
  // onCoinsGranted only fires after a completed purchase + dedupe (and, in
  // production, after receipt validation inside useCoinStore).

  const coinStore = useCoinStore({
    onCoinsGranted: (coins) => {
      dispatch({ type: "BUY_COINS", amount: coins });
      Vibration.vibrate([0, 30, 40, 30]);
      setMarketVisible(false);
    },
  });

  // GL drawing buffer size (PHYSICAL pixels)
  const glSize = useRef({ w: 1, h: 1 });
  // GLView layout size (LOGICAL points — same unit as touch locationX/Y)
  const viewSize = useRef({ w: 1, h: 1 });
  // Three.js scene refs (owned here, filled by useFarmScene)
  const sceneRefs = useRef<SceneRefs>(createSceneRefs());

  // ── HUD animations ──────────────────────────────────────────────────────────

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
      ]),
    ).start();
  }, []);
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const prevLevel = useRef(state.level);
  const lvlAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (hydrated && state.level > prevLevel.current) {
      setShowLevelUp(true);
      lvlAnim.setValue(0);
      Animated.sequence([
        Animated.spring(lvlAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
        }),
        Animated.delay(1000),
        Animated.timing(lvlAnim, {
          toValue: 2,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => setShowLevelUp(false));
      Vibration.vibrate([0, 40, 60, 40]);
    }
    prevLevel.current = state.level;
  }, [state.level, hydrated]);
  const lvlScale = lvlAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.3, 1, 1.15],
  });
  const lvlOpacity = lvlAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 1, 0],
  });

  // ── Floating label spawn ────────────────────────────────────────────────────

  const spawnLabel = useCallback(
    (tileId: number, text: string, color: string) => {
      const r = sceneRefs.current;
      const { w, h } = viewSize.current;
      let x = w / 2;
      let y = h / 2;

      if (r.camera) {
        const p = tileWorldPos(tileId).clone();
        p.y += TILE_H / 2 + 0.4;
        p.project(r.camera);
        x = ((p.x + 1) / 2) * w;
        y = ((1 - p.y) / 2) * h;
      }

      const anim = new Animated.Value(0);
      const id = `${tileId}_${Date.now()}`;
      setFloatLabels((prev) => [...prev, { id, x, y, text, color, anim }]);
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start(() => {
        setFloatLabels((prev) => prev.filter((l) => l.id !== id));
      });
    },
    [],
  );

  // ── Game logic: tile interaction ────────────────────────────────────────────

  const handleTilePress = useCallback(
    (tileId: number) => {
      const st = stateRef.current;
      const tile = st.tiles[tileId];
      const tool = st.selectedTool;

      if (tool === "till") {
        if (tile.state !== "empty") return;
        dispatch({ type: "TILL", id: tileId });
        Vibration.vibrate(30);
        return;
      }
      if (tool === "seed") {
        if (tile.state !== "tilled") return;
        const crop = CROPS[st.selectedCrop];
        if (st.level < crop.minLevel) {
          spawnLabel(tileId, `🔒 Reach level ${crop.minLevel}`, "#EF4444");
          return;
        }
        if (st.gold < crop.seedCost) {
          spawnLabel(tileId, "❌ No coins!", "#EF4444");
          setMarketVisible(true); // 💸 out of coins → show the market
          return;
        }
        dispatch({ type: "PLANT", id: tileId });
        spawnLabel(tileId, `-${crop.seedCost}💰`, "#F97316");
        Vibration.vibrate(20);
        return;
      }
      if (tool === "water") {
        if (tile.state !== "planted" && tile.state !== "growing") return;
        if (tile.watered) {
          spawnLabel(tileId, "Already watered!", "#94A3B8");
          return;
        }
        dispatch({ type: "WATER", id: tileId });
        spawnLabel(tileId, "💧 Watered!", "#3B82F6");
        Vibration.vibrate(15);
        return;
      }
      if (tool === "harvest") {
        if (tile.state !== "ready" || !tile.cropId) return;
        const crop = CROPS[tile.cropId];
        const { gold, xp, doubled } = computeHarvest(crop, tile);
        dispatch({
          type: "HARVEST",
          id: tileId,
          gold,
          xp,
        });
        spawnLabel(tileId, `+${gold}💰`, "#22C55E");
        if (doubled) {
          setTimeout(() => spawnLabel(tileId, "✨ Double harvest!", "#FBBF24"), 110);
        }
        setTimeout(() => spawnLabel(tileId, `+${xp}XP`, "#A78BFA"), 220);
        Vibration.vibrate([0, 30, 50, 30]);
      }
    },
    [spawnLabel],
  );

  // ── Three.js scene (context, render loop, picking, touch) ───────────────────

  const {
    onContextCreate,
    onCanvasLayout,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    recenter,
  } = useFarmScene({
    tiles: state.tiles,
    structures: state.structures,
    stateRef,
    refs: sceneRefs,
    viewSize,
    glSize,
    onTilePress: handleTilePress,
  });

  // ── Derived ──────────────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const c: Record<ToolId, number> = {
      till: 0,
      seed: 0,
      water: 0,
      harvest: 0,
    };
    state.tiles.forEach((t) => {
      if (t.state === "empty") c.till++;
      else if (t.state === "tilled") c.seed++;
      else if ((t.state === "planted" || t.state === "growing") && !t.watered)
        c.water++;
      else if (t.state === "ready") c.harvest++;
    });
    return c;
  }, [state.tiles]);

  const readyCount = counts.harvest;

  const HINT: Record<ToolId, string> = {
    till: "Tap empty tiles to till the soil",
    seed: `Planting ${CROPS[state.selectedCrop].name} — tap tilled tiles`,
    water: "Tap crops to water · faster + 20% bonus",
    harvest: "Tap glowing crops to harvest",
  };

  const activeTool = TOOLS.find((t) => t.id === state.selectedTool)!;
  const crop = CROPS[state.selectedCrop];
  const cropRarity = RARITY_META[crop.rarity];

  if (!fontsLoaded || !hydrated) return null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      {/* Translucent status bar — the header green shows through behind it */}
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Header (paddingTop = inset → green covers the status bar) ── */}
      <View style={[s.headerWrap, { paddingTop: insets.top + 6 }]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.lvlBadge}>
              <Text style={s.lvlNum}>{state.level}</Text>
              <Text style={s.lvlLbl}>LVL</Text>
            </View>
            <View>
              <Text style={s.title}>Happy Farm</Text>
              <View style={s.dayPill}>
                <Text style={s.dayPillTxt}>☀️ Day {state.day}</Text>
              </View>
            </View>
          </View>

          <View style={s.chips}>
            <GoldCounter
              gold={state.gold}
              onPress={() => setMarketVisible(true)}
            />
            {readyCount > 0 && (
              <Animated.View
                style={[s.readyChip, { transform: [{ scale: pulseScale }] }]}
              >
                <Text style={s.readyChipTxt}>🧺 {readyCount}</Text>
              </Animated.View>
            )}
          </View>
        </View>

        <XPBar xp={state.xp} level={state.level} />
      </View>

      {/* ── 3D Canvas — extends to the bottom of the screen; HUD floats on top ── */}
      <View style={s.canvasWrap} onLayout={onCanvasLayout}>
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={onContextCreate}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />

        {/* Contextual hint — floating glass chip */}
        <Glass style={s.hintChip} intensity={35}>
          <View style={[s.hintDot, { backgroundColor: activeTool.color }]} />
          <Text style={s.hintTxt}>
            {activeTool.emoji} {HINT[state.selectedTool]}
          </Text>
        </Glass>

        {/* Recenter camera — drag the field to look at the house/barn/beehive */}
        <TouchableOpacity
          style={s.recenterBtn}
          onPress={recenter}
          activeOpacity={0.8}
        >
          <Glass style={s.recenterGlass} intensity={45}>
            <Text style={s.recenterTxt}>🎯</Text>
          </Glass>
        </TouchableOpacity>

        {/* Floating labels overlay */}
        {floatLabels.map((lbl) => (
          <View
            key={lbl.id}
            style={[s.floatWrap, { left: lbl.x - 40, top: lbl.y - 20 }]}
            pointerEvents="none"
          >
            <FloatLabel label={lbl} />
          </View>
        ))}

        {/* LEVEL UP banner */}
        {showLevelUp && (
          <Animated.View
            style={[
              s.lvlUpBanner,
              { opacity: lvlOpacity, transform: [{ scale: lvlScale }] },
            ]}
            pointerEvents="none"
          >
            <Text style={s.lvlUpStar}>⭐</Text>
            <Text style={s.lvlUpTxt}>LEVEL {state.level}!</Text>
          </Animated.View>
        )}

        {/* ── Floating liquid-glass footer ── */}
        <View
          style={[s.floatFooter, { bottom: insets.bottom + 14 }]}
          pointerEvents="box-none"
        >
          {/* FAB row + selected seed chip */}
          <View style={s.fabRow} pointerEvents="box-none">
            <TouchableOpacity
              onPress={() => setShopVisible(true)}
              activeOpacity={0.8}
              style={s.floatShadow}
            >
              <Glass style={s.fab}>
                <Text style={s.fabEm}>🌿</Text>
                <Text style={s.fabLbl}>Seeds</Text>
              </Glass>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShopVisible(true)}
              activeOpacity={0.85}
              style={s.floatShadow}
            >
              <Glass style={s.cropChip}>
                <Text style={s.cropChipEm}>{crop.emoji}</Text>
                <View>
                  <View style={s.cropChipTop}>
                    <Text style={s.cropChipName}>{crop.name}</Text>
                    <View
                      style={[
                        s.cropChipRarity,
                        { backgroundColor: cropRarity.color },
                      ]}
                    >
                      <Text style={s.cropChipRarityTxt}>
                        {cropRarity.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.cropChipCost}>
                    🌱 {crop.seedCost.toLocaleString()} coins
                  </Text>
                  <Text style={s.cropChipPec} numberOfLines={1}>
                    {peculiarityOf(crop).emoji} {peculiarityOf(crop).label}
                  </Text>
                </View>
              </Glass>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDayModalVisible(true)}
              activeOpacity={0.8}
              style={s.floatShadow}
            >
              <Glass style={s.fab}>
                <Text style={s.fabEm}>🌅</Text>
                <Text style={s.fabLbl}>Day</Text>
              </Glass>
            </TouchableOpacity>
          </View>

          {/* Glass tool dock */}
          <View style={s.floatShadow}>
            <Glass style={s.toolDock} intensity={55}>
              {TOOLS.map((tool) => {
                const active = state.selectedTool === tool.id;
                const count = counts[tool.id];
                return (
                  <TouchableOpacity
                    key={tool.id}
                    style={[
                      s.toolBtn,
                      active && { backgroundColor: tool.color },
                    ]}
                    onPress={() =>
                      dispatch({ type: "SELECT_TOOL", tool: tool.id })
                    }
                    activeOpacity={0.8}
                  >
                    {count > 0 && (
                      <View
                        style={[s.toolCount, { backgroundColor: tool.color }]}
                      >
                        <Text style={s.toolCountTxt}>{count}</Text>
                      </View>
                    )}
                    <Text style={s.toolEm}>{tool.emoji}</Text>
                    <Text style={[s.toolLbl, active && s.toolLblActive]}>
                      {tool.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Glass>
          </View>
        </View>
      </View>

      {/* ── Modals ── */}
      <ShopModal
        visible={shopVisible}
        gold={state.gold}
        level={state.level}
        selectedCrop={state.selectedCrop}
        structures={state.structures}
        onSelectCrop={(c) => dispatch({ type: "SELECT_CROP", crop: c })}
        onBuyStructure={(id) => {
          dispatch({ type: "BUY_STRUCTURE", id });
          Vibration.vibrate([0, 30, 40, 30]);
        }}
        onOpenMarket={() => {
          setShopVisible(false);
          setMarketVisible(true);
        }}
        onClose={() => setShopVisible(false)}
      />
      <MarketModal
        visible={marketVisible}
        gold={state.gold}
        packs={coinStore.packs}
        connected={coinStore.connected}
        purchasingSku={coinStore.purchasingSku}
        storeError={coinStore.storeError}
        onBuy={coinStore.buy}
        onClose={() => {
          coinStore.clearError();
          setMarketVisible(false);
        }}
      />
      <DayModal
        visible={dayModalVisible}
        day={state.day}
        gold={state.gold}
        totalHarvested={state.totalHarvested}
        onClose={() => {
          dispatch({ type: "NEXT_DAY" });
          setDayModalVisible(false);
        }}
      />
    </View>
  );
}

export default function FarmGame3D() {
  return (
    <SafeAreaProvider>
      <FarmGameInner />
    </SafeAreaProvider>
  );
}
