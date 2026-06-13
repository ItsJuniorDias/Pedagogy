// features/farm-game/components/ShopModal.tsx
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { fmtTime } from "../constants";
import { CROP_LIST, RARITY_META } from "../data/crops";
import { peculiarityOf } from "../data/peculiarities";
import { STRUCTURE_LIST } from "../data/structures";
import { s } from "../styles";
import type { Crop, CropId, Rarity, StructureId } from "../types";

// ─── Shop Modal ───────────────────────────────────────────────────────────────
// Sem rotação diária: a loja lista TODAS as sementes, ordenadas por nível.
// O que está acima do seu nível aparece bloqueado ("destrava no nível N").
// Abaixo das sementes vem a seção de Construções (decorações de fim de jogo).

export const ShopModal: React.FC<{
  visible: boolean;
  gold: number;
  level: number;
  selectedCrop: CropId;
  structures: Record<StructureId, boolean>;
  onSelectCrop: (id: CropId) => void;
  onBuyStructure: (id: StructureId) => void;
  onOpenMarket: () => void;
  onClose: () => void;
}> = ({
  visible,
  gold,
  level,
  selectedCrop,
  structures,
  onSelectCrop,
  onBuyStructure,
  onOpenMarket,
  onClose,
}) => {
  const slide = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [visible]);

  // Group by rarity to render sections
  const sections = useMemo(() => {
    const map = new Map<Rarity, Crop[]>();
    CROP_LIST.forEach((c) => {
      const arr = map.get(c.rarity) ?? [];
      arr.push(c);
      map.set(c.rarity, arr);
    });
    return [...map.entries()];
  }, []);

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Animated.View
          style={[s.shopPanel, { transform: [{ translateY: slide }] }]}
        >
          <Pressable style={{ flexShrink: 1 }}>
            <View style={s.shopHandle} />
            <View style={s.shopHeader}>
              <View>
                <Text style={s.shopTitle}>🌿 Seed Shop</Text>
                <Text style={s.shopGold}>💰 {gold.toLocaleString()} coins</Text>
              </View>
              <TouchableOpacity
                style={s.getCoinsBtn}
                onPress={onOpenMarket}
                activeOpacity={0.85}
              >
                <Text style={s.getCoinsTxt}>+ Coins</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexGrow: 0 }}
              showsVerticalScrollIndicator={false}
            >
              {sections.map(([rarity, crops]) => {
                const meta = RARITY_META[rarity];
                return (
                  <View key={rarity}>
                    <View style={s.raritySection}>
                      <View
                        style={[s.rarityDot, { backgroundColor: meta.color }]}
                      />
                      <Text style={[s.rarityTitle, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                      {rarity !== "common" && (
                        <Text style={s.rarityHint}>· slower · pays more</Text>
                      )}
                    </View>

                    {crops.map((crop) => {
                      const locked = level < crop.minLevel;
                      const canAfford = gold >= crop.seedCost;
                      const selected = selectedCrop === crop.id;
                      const buyable = !locked && canAfford;
                      const pec = peculiarityOf(crop);

                      return (
                        <TouchableOpacity
                          key={crop.id}
                          style={[
                            s.cropRow,
                            selected && s.cropRowSel,
                            !buyable && s.cropRowDim,
                          ]}
                          onPress={() => {
                            if (locked) return;
                            if (!canAfford) {
                              // No coins → push to the market 💸
                              onOpenMarket();
                              return;
                            }
                            onSelectCrop(crop.id);
                            onClose();
                          }}
                          disabled={locked}
                          activeOpacity={0.75}
                        >
                          <Text style={s.cropEm}>{crop.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <View style={s.cropNameRow}>
                              <Text style={s.cropName}>{crop.name}</Text>
                              <View
                                style={[
                                  s.lvlTag,
                                  locked && { backgroundColor: "#9CA3AF" },
                                ]}
                              >
                                <Text style={s.lvlTagTxt}>Lv {crop.minLevel}</Text>
                              </View>
                            </View>
                            <Text style={s.cropDet}>
                              {locked
                                ? `🔒 Unlocks at level ${crop.minLevel}`
                                : `⏱ ${fmtTime(crop.growTime)} · 🌾 Sell: ${crop.price.toLocaleString()} · 🌱 Seed: ${crop.seedCost.toLocaleString()}`}
                            </Text>
                            {!locked && (
                              <Text style={s.pecLine} numberOfLines={1}>
                                {pec.emoji} {pec.label} — {pec.desc}
                              </Text>
                            )}
                          </View>
                          <View
                            style={[s.xpBadge, { backgroundColor: crop.color }]}
                          >
                            <Text style={s.xpBadgeTxt}>+{crop.xp}XP</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}

              {/* Buildings — purchasable scenery, gated to high levels.
                  Drag the field to look toward each one. */}
              <View style={s.raritySection}>
                <View style={[s.rarityDot, { backgroundColor: "#8B5CF6" }]} />
                <Text style={[s.rarityTitle, { color: "#8B5CF6" }]}>
                  Buildings
                </Text>
                <Text style={s.rarityHint}>· décor · drag to visit</Text>
              </View>

              {STRUCTURE_LIST.map((st) => {
                const owned = structures[st.id];
                const locked = level < st.minLevel;
                const canAfford = gold >= st.cost;
                const dim = !owned && (locked || !canAfford);
                return (
                  <View key={st.id} style={[s.cropRow, dim && s.cropRowDim]}>
                    <Text style={s.cropEm}>{st.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={s.cropNameRow}>
                        <Text style={s.cropName}>{st.name}</Text>
                        <View
                          style={[
                            s.lvlTag,
                            locked && { backgroundColor: "#9CA3AF" },
                          ]}
                        >
                          <Text style={s.lvlTagTxt}>Lv {st.minLevel}</Text>
                        </View>
                      </View>
                      <Text style={s.cropDet}>
                        {locked
                          ? `🔒 Unlocks at level ${st.minLevel}`
                          : st.desc}
                      </Text>
                      <Text style={s.pecLine} numberOfLines={1}>
                        {st.hint}
                      </Text>
                    </View>
                    {owned ? (
                      <View style={[s.buyBtn, s.buyBtnOwned]}>
                        <Text style={s.buyBtnOwnedTxt}>Owned ✓</Text>
                      </View>
                    ) : locked ? (
                      <View style={[s.buyBtn, s.buyBtnLocked]}>
                        <Text style={s.buyBtnLockedTxt}>🔒</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={s.buyBtn}
                        activeOpacity={0.8}
                        onPress={() =>
                          canAfford ? onBuyStructure(st.id) : onOpenMarket()
                        }
                      >
                        <Text style={s.buyBtnTxt}>
                          {canAfford ? "Buy" : "💰"} {st.cost.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeBtnTxt}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
