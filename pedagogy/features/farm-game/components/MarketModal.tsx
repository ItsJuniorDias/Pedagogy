// features/farm-game/components/MarketModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { type StorePack } from "../../../hooks/UseCoinStore";
// 🔒 Portão parental (Kids Category — Guideline 1.3)
import { ParentalGate } from "../../../shared/ParentalGate";
import { s } from "../styles";

// ─── Coin Market Modal ────────────────────────────────────────────────────────
// Localized prices come from the store (pack.displayPrice). The real
// purchase is triggered by onBuy(sku) → useCoinStore → native store sheet.
//
// 🔒 Como o app está na Kids Category, TODA compra precisa passar por um portão
// parental antes (Guideline 1.3). Ao tocar num pacote guardamos o sku em
// `gateSku`; só depois que um adulto resolve a conta é que onBuy(sku) roda.

export const MarketModal: React.FC<{
  visible: boolean;
  gold: number;
  packs: StorePack[];
  connected: boolean;
  purchasingSku: string | null;
  storeError: string | null;
  onBuy: (sku: string) => void;
  onClose: () => void;
}> = ({
  visible,
  gold,
  packs,
  connected,
  purchasingSku,
  storeError,
  onBuy,
  onClose,
}) => {
  const slide = useRef(new Animated.Value(600)).current;

  // 🔒 sku aguardando liberação pelo portão parental (null = portão fechado)
  const [gateSku, setGateSku] = useState<string | null>(null);

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [visible]);

  // Se o mercado fechar, garante que o portão também fecha
  useEffect(() => {
    if (!visible) setGateSku(null);
  }, [visible]);

  const anySimulated = packs.some((p) => p.simulated && p.available);
  const loading = !connected && !anySimulated;

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
          <Pressable>
            <View style={s.shopHandle} />
            <Text style={s.shopTitle}>🏦 Coin Market</Text>
            <Text style={s.shopGold}>
              Current balance: 💰 {gold.toLocaleString()}
            </Text>
            <Text style={s.marketSub}>
              Out of coins for that rare seed? Grab a pack 👇
            </Text>

            {loading && (
              <Text style={s.storeStatus}>Connecting to the store… ⏳</Text>
            )}

            {!!storeError && <Text style={s.storeError}>⚠️ {storeError}</Text>}

            {packs.map((pack) => {
              const total = pack.coins + pack.bonus;
              const busy = purchasingSku === pack.sku;
              const disabled = !pack.available || !!purchasingSku;
              return (
                <TouchableOpacity
                  key={pack.sku}
                  style={[
                    s.packRow,
                    pack.tag && s.packRowHot,
                    !pack.available && s.packRowDim,
                  ]}
                  // 🔒 Em vez de comprar direto, abre o portão parental
                  onPress={() => setGateSku(pack.sku)}
                  activeOpacity={0.8}
                  disabled={disabled}
                >
                  {pack.tag && (
                    <View style={s.packTag}>
                      <Text style={s.packTagTxt}>{pack.tag}</Text>
                    </View>
                  )}
                  <Text style={s.packEm}>{pack.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.packCoins}>
                      {total.toLocaleString()} coins
                    </Text>
                    {pack.bonus > 0 && (
                      <Text style={s.packBonus}>
                        {pack.coins.toLocaleString()} +{" "}
                        {pack.bonus.toLocaleString()} bonus 🎁
                      </Text>
                    )}
                  </View>
                  <View style={[s.packPrice, busy && s.packPriceBusy]}>
                    <Text style={s.packPriceTxt}>
                      {busy ? "..." : pack.displayPrice}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {anySimulated && (
              <Text style={s.marketDisclaimer}>
                Dev mode: store unavailable (Expo Go?) — simulated purchase, no
                real money is charged.
              </Text>
            )}

            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeBtnTxt}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>

        {/* 🔒 Portão parental — overlay DENTRO deste Modal (modo embedded,
            evita bug de modal-sobre-modal no iOS). Só libera a compra do
            sku selecionado depois que um adulto resolve a conta. */}
        <ParentalGate
          embedded
          visible={!!gateSku}
          onSuccess={() => {
            const sku = gateSku;
            setGateSku(null);
            if (sku) onBuy(sku);
          }}
          onCancel={() => setGateSku(null)}
        />
      </Pressable>
    </Modal>
  );
};
