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
import { CROP_LIST, isLimited, RARITY_META } from "../data/crops";
import { s } from "../styles";
import type { Crop, CropId, Rarity } from "../types";

// ─── Shop Modal ───────────────────────────────────────────────────────────────

export const ShopModal: React.FC<{
  visible: boolean;
  gold: number;
  level: number;
  selectedCrop: CropId;
  dailyStock: Partial<Record<CropId, number>>;
  onSelectCrop: (id: CropId) => void;
  onOpenMarket: () => void;
  onClose: () => void;
}> = ({
  visible,
  gold,
  level,
  selectedCrop,
  dailyStock,
  onSelectCrop,
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
                      {rarity !== "common" && rarity !== "uncommon" && (
                        <Text style={s.rarityHint}>· daily rotation</Text>
                      )}
                    </View>

                    {crops.map((crop) => {
                      const limited = isLimited(crop);
                      const stock = limited
                        ? (dailyStock[crop.id] ?? 0)
                        : Infinity;
                      const inShopToday =
                        !limited || dailyStock[crop.id] !== undefined;
                      const locked = level < crop.minLevel;
                      const soldOut = limited && inShopToday && stock <= 0;
                      const canAfford = gold >= crop.seedCost;
                      const selected = selectedCrop === crop.id;
                      const buyable =
                        !locked && inShopToday && !soldOut && canAfford;

                      // Mystery slot: rare item not rolled today
                      if (limited && !inShopToday) {
                        return (
                          <View key={crop.id} style={[s.cropRow, s.mysteryRow]}>
                            <Text style={s.cropEm}>❔</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={s.mysteryName}>
                                Mystery {meta.label}
                              </Text>
                              <Text style={s.cropDet}>
                                Might appear tomorrow… check back daily! 🎲
                              </Text>
                            </View>
                          </View>
                        );
                      }

                      return (
                        <TouchableOpacity
                          key={crop.id}
                          style={[
                            s.cropRow,
                            selected && s.cropRowSel,
                            !buyable && s.cropRowDim,
                            limited && {
                              borderColor: selected
                                ? meta.color
                                : `${crop.color}55`,
                            },
                          ]}
                          onPress={() => {
                            if (!canAfford) {
                              // No coins → push to the market 💸
                              onOpenMarket();
                              return;
                            }
                            onSelectCrop(crop.id);
                            onClose();
                          }}
                          disabled={locked || soldOut}
                          activeOpacity={0.75}
                        >
                          <Text style={s.cropEm}>{crop.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <View style={s.cropNameRow}>
                              <Text style={s.cropName}>{crop.name}</Text>
                              {limited && !soldOut && (
                                <View
                                  style={[
                                    s.stockBadge,
                                    { backgroundColor: meta.color },
                                  ]}
                                >
                                  <Text style={s.stockBadgeTxt}>
                                    {stock} today
                                  </Text>
                                </View>
                              )}
                              {soldOut && (
                                <View style={[s.stockBadge, s.soldOutBadge]}>
                                  <Text style={s.stockBadgeTxt}>SOLD OUT</Text>
                                </View>
                              )}
                            </View>
                            <Text style={s.cropDet}>
                              {locked
                                ? `🔒 Unlocks at level ${crop.minLevel}`
                                : `⏱ ${fmtTime(crop.growTime)} · 🌾 Sell: ${crop.price.toLocaleString()} · 🌱 Seed: ${crop.seedCost.toLocaleString()}`}
                            </Text>
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
