// features/farm-game/components/ShopModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import { fmtTime } from "../constants";
import { peculiarityOf } from "../data/peculiarities";
import type { ShopEntry, ShopSection } from "../data/shop";
import { SHOP_SECTIONS } from "../data/shop";
import { s } from "../styles";
import type { CropId, StructureId } from "../types";

// ─── Shop Modal ───────────────────────────────────────────────────────────────
// A loja agora é um ACCORDION orientado por dados (data/shop.ts → SHOP_SECTIONS).
// Não é mais só de sementes: cada seção é um painel recolhível — sementes
// agrupadas por raridade + Construções. Os itens e as seções vêm do catálogo,
// então a lista cresce sozinha conforme novos itens/níveis/tipos forem adicionados;
// este componente não precisa mudar.

// LayoutAnimation no Android precisa deste opt-in.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EXPAND = LayoutAnimation.create(
  180,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity,
);

interface RowCtx {
  gold: number;
  level: number;
  selectedCrop: CropId;
  structures: Record<StructureId, boolean>;
  onSelectCrop: (id: CropId) => void;
  onBuyStructure: (id: StructureId) => void;
  onOpenMarket: () => void;
  onClose: () => void;
}

// ─── Linha de semente ─────────────────────────────────────────────────────────

const CropRow: React.FC<{
  entry: Extract<ShopEntry, { kind: "crop" }>;
  ctx: RowCtx;
}> = ({ entry, ctx }) => {
  const { crop } = entry;
  const locked = ctx.level < crop.minLevel;
  const canAfford = ctx.gold >= crop.seedCost;
  const selected = ctx.selectedCrop === crop.id;
  const buyable = !locked && canAfford;
  const pec = peculiarityOf(crop);

  return (
    <TouchableOpacity
      style={[s.cropRow, selected && s.cropRowSel, !buyable && s.cropRowDim]}
      onPress={() => {
        if (locked) return;
        if (!canAfford) {
          ctx.onOpenMarket(); // sem moedas → manda pro mercado 💸
          return;
        }
        ctx.onSelectCrop(crop.id);
        ctx.onClose();
      }}
      disabled={locked}
      activeOpacity={0.75}
    >
      <Text style={s.cropEm}>{crop.emoji}</Text>
      <View style={{ flex: 1 }}>
        <View style={s.cropNameRow}>
          <Text style={s.cropName}>{crop.name}</Text>
          <View style={[s.lvlTag, locked && { backgroundColor: "#9CA3AF" }]}>
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
      <View style={[s.xpBadge, { backgroundColor: crop.color }]}>
        <Text style={s.xpBadgeTxt}>+{crop.xp}XP</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Linha de construção ──────────────────────────────────────────────────────

const StructureRow: React.FC<{
  entry: Extract<ShopEntry, { kind: "structure" }>;
  ctx: RowCtx;
}> = ({ entry, ctx }) => {
  const st = entry.structure;
  const owned = ctx.structures[st.id];
  const locked = ctx.level < st.minLevel;
  const canAfford = ctx.gold >= st.cost;
  const dim = !owned && (locked || !canAfford);

  return (
    <View style={[s.cropRow, dim && s.cropRowDim]}>
      <Text style={s.cropEm}>{st.emoji}</Text>
      <View style={{ flex: 1 }}>
        <View style={s.cropNameRow}>
          <Text style={s.cropName}>{st.name}</Text>
          <View style={[s.lvlTag, locked && { backgroundColor: "#9CA3AF" }]}>
            <Text style={s.lvlTagTxt}>Lv {st.minLevel}</Text>
          </View>
        </View>
        <Text style={s.cropDet}>
          {locked ? `🔒 Unlocks at level ${st.minLevel}` : st.desc}
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
            canAfford ? ctx.onBuyStructure(st.id) : ctx.onOpenMarket()
          }
        >
          <Text style={s.buyBtnTxt}>
            {canAfford ? "Buy" : "💰"} {st.cost.toLocaleString()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const renderEntry = (entry: ShopEntry, ctx: RowCtx) =>
  entry.kind === "crop" ? (
    <CropRow key={entry.id} entry={entry} ctx={ctx} />
  ) : (
    <StructureRow key={entry.id} entry={entry} ctx={ctx} />
  );

// ─── Cabeçalho do accordion (com resumo dinâmico de progresso) ────────────────

const SectionHeader: React.FC<{
  section: ShopSection;
  open: boolean;
  level: number;
  structures: Record<StructureId, boolean>;
  onToggle: () => void;
}> = ({ section, open, level, structures, onToggle }) => {
  const [lo, hi] = section.levelRange;
  const total = section.items.length;

  // Resumo à direita: sementes mostram desbloqueadas/total; construções, possuídas/total.
  const { badge, fullyLocked } = useMemo(() => {
    if (section.kind === "buildings") {
      const owned = section.items.filter(
        (it) => it.kind === "structure" && structures[it.structure.id],
      ).length;
      return { badge: `${owned}/${total}`, fullyLocked: lo > level };
    }
    const unlocked = section.items.filter((it) => level >= it.minLevel).length;
    return { badge: `${unlocked}/${total}`, fullyLocked: unlocked === 0 };
  }, [section, level, structures, total, lo]);

  return (
    <TouchableOpacity
      style={[s.accHeader, open && s.accHeaderOpen]}
      activeOpacity={0.7}
      onPress={onToggle}
    >
      <Text style={[s.accChevron, open && s.accChevronOpen]}>▸</Text>
      <Text style={s.accEmoji}>{section.emoji}</Text>
      <View style={[s.accDot, { backgroundColor: section.color }]} />
      <Text style={[s.accTitle, { color: section.color }]} numberOfLines={1}>
        {section.title}
      </Text>
      <Text style={s.accRange}>
        {lo === hi ? `Lv ${lo}` : `Lv ${lo}–${hi}`}
      </Text>
      <View style={{ flex: 1 }} />
      <View style={[s.accCount, fullyLocked && s.accCountLocked]}>
        <Text style={s.accCountTxt}>{fullyLocked ? `🔒 ${badge}` : badge}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

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
}> = (props) => {
  const {
    visible,
    gold,
    level,
    selectedCrop,
    structures,
    onSelectCrop,
    onBuyStructure,
    onOpenMarket,
    onClose,
  } = props;

  const slide = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [visible]);

  // Qual seção contém a semente selecionada (pra abrir por padrão).
  const sectionOfSelected = useMemo(
    () =>
      SHOP_SECTIONS.find((sec) =>
        sec.items.some(
          (it) => it.kind === "crop" && it.crop.id === selectedCrop,
        ),
      )?.id ?? SHOP_SECTIONS[0]?.id,
    [selectedCrop],
  );

  // Accordion: começa com a seção da semente atual aberta.
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(sectionOfSelected ? [sectionOfSelected] : []),
  );

  // Ao reabrir a loja, garante que a seção da semente atual esteja visível.
  useEffect(() => {
    if (visible && sectionOfSelected) {
      setOpen((prev) => new Set(prev).add(sectionOfSelected));
    }
  }, [visible, sectionOfSelected]);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(EXPAND);
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const ctx: RowCtx = {
    gold,
    level,
    selectedCrop,
    structures,
    onSelectCrop,
    onBuyStructure,
    onOpenMarket,
    onClose,
  };

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
                <Text style={s.shopTitle}>🛒 Shop</Text>
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
              {SHOP_SECTIONS.map((section) => {
                const isOpen = open.has(section.id);
                return (
                  <View key={section.id} style={s.accSection}>
                    <SectionHeader
                      section={section}
                      open={isOpen}
                      level={level}
                      structures={structures}
                      onToggle={() => toggle(section.id)}
                    />
                    {isOpen && (
                      <View style={s.accBody}>
                        {section.hint && (
                          <Text style={s.accHint}>{section.hint}</Text>
                        )}
                        {section.items.map((entry) => renderEntry(entry, ctx))}
                      </View>
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
