// components/LanguageSheet.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Bottom sheet de seleção de idioma. Lista os idiomas suportados (cada um no
// próprio idioma), destaca o ativo e troca em tempo real ao tocar.
//
// Visual alinhado ao app: fundo creme/branco, acento rosa (#FF5B8D), títulos
// em FredokaOne, cartões bem arredondados. A animação de entrada usa a API
// Animated nativa (translateY + fade), que funciona de forma confiável dentro
// de <Modal> — evitando quirks de entering-animations do reanimated em modais.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  changeAppLanguage,
  getCurrentLanguage,
  LANGUAGES,
  type SupportedLanguage,
} from "@/lib/i18n";

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

export interface LanguageSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageSheet({ visible, onClose }: LanguageSheetProps) {
  // i18n vem do hook para forçar re-render (e reavaliar o idioma ativo) quando
  // o idioma muda.
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const current = getCurrentLanguage();

  // ── Animação de entrada do painel ──
  const translateY = useRef(new Animated.Value(60)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(60);
      backdrop.setValue(0);
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 180,
          mass: 0.7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdrop]);

  const handleSelect = async (code: SupportedLanguage) => {
    if (code !== current) {
      await changeAppLanguage(code);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop escurecido — toque fecha o sheet */}
      <Animated.View style={[s.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Painel */}
      <View style={s.sheetWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            s.sheet,
            { paddingBottom: insets.bottom + 12, transform: [{ translateY }] },
          ]}
        >
          <View style={s.grabber} />

          <Text style={[fredoka(20, "#2D2D2D"), s.title]}>
            {t("language.sheetTitle")}
          </Text>
          <Text style={s.subtitle}>{t("language.subtitle")}</Text>

          <ScrollView
            style={s.list}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {LANGUAGES.map((lang) => {
              const active = lang.code === current;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => handleSelect(lang.code as SupportedLanguage)}
                  style={({ pressed }) => [
                    s.row,
                    active && s.rowActive,
                    pressed && s.rowPressed,
                  ]}
                >
                  <View style={s.flagTile}>
                    <Text style={s.flag}>{lang.flag}</Text>
                  </View>

                  <View style={s.rowText}>
                    <Text style={fredoka(16, active ? "#FF5B8D" : "#2D2D2D")}>
                      {lang.nativeName}
                    </Text>
                    <Text style={s.rowSub}>{lang.name}</Text>
                  </View>

                  <View style={[s.radio, active && s.radioActive]}>
                    {active && <Text style={s.check}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 18, 40, 0.45)",
  },
  sheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFDF9",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: "82%",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E8E4DC",
    marginBottom: 14,
  },
  title: { textAlign: "center" },
  subtitle: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#A7A7B4",
    marginTop: 4,
    marginBottom: 12,
  },
  list: { marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#F1EEE8",
  },
  rowActive: {
    backgroundColor: "#FFF0F5",
    borderColor: "#FF5B8D",
  },
  rowPressed: { opacity: 0.75 },
  flagTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F7F4EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  flag: { fontSize: 26 },
  rowText: { flex: 1 },
  rowSub: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B4B4C0",
    marginTop: 2,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#E2DED6",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    backgroundColor: "#FF5B8D",
    borderColor: "#FF5B8D",
  },
  check: { color: "#fff", fontSize: 15, fontWeight: "900", lineHeight: 18 },
});
