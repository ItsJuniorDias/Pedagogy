import { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { fredoka, MIN_TOUCH, Shadow, Theme } from "@/constants/theme";

interface ParentalGateProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  /**
   * Quando `true`, renderiza como overlay absoluto (sem <Modal>), para uso
   * DENTRO de outro Modal — ex.: o Coin Market do jogo. Isso evita o bug de
   * "modal sobre modal" no iOS. Quando `false` (padrão), usa <Modal>, ideal
   * em telas normais como a paywall.
   */
  embedded?: boolean;
}

/**
 * Portão parental exigido pela Kids Category da App Store (Guideline 1.3).
 * Precisa ser exibido ANTES de qualquer link externo, compra ou interação
 * com anúncio.
 *
 * Usa uma multiplicação de dois dígitos baixos: trivial para um adulto,
 * mas fora do alcance típico de uma criança de 6-8 anos. A conta é
 * regenerada a cada erro para impedir acerto por tentativa e erro.
 *
 * O portão aparece justamente na frente de pais/responsáveis — por isso todo
 * o texto vem do i18n (antes era inglês fixo, num app traduzido em 7 idiomas).
 */
export function ParentalGate({
  visible,
  onSuccess,
  onCancel,
  embedded = false,
}: ParentalGateProps) {
  const { t } = useTranslation();
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);

  const generate = () => {
    setA(Math.floor(Math.random() * 6) + 4);
    setB(Math.floor(Math.random() * 6) + 4);
    setAnswer("");
    setWrong(false);
  };

  useEffect(() => {
    if (visible) generate();
  }, [visible]);

  const handleCheck = () => {
    if (parseInt(answer, 10) === a * b) {
      onSuccess();
    } else {
      setWrong(true);
      generate(); // troca a conta para evitar chute
    }
  };

  const card = (
    <View style={s.card}>
      <Text style={{ fontSize: 44, marginBottom: 4 }}>🔒</Text>

      <Text style={[fredoka(22, Theme.colors.ink), { textAlign: "center" }]}>
        {t("parentalGate.title")}
      </Text>

      <Text style={s.subtitle}>{t("parentalGate.subtitle")}</Text>

      <Text style={[fredoka(34, Theme.colors.primary), { marginVertical: 8 }]}>
        {a} × {b} = ?
      </Text>

      <TextInput
        value={answer}
        onChangeText={(txt) => setAnswer(txt.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        placeholder={t("parentalGate.placeholder")}
        placeholderTextColor={Theme.colors.textFaint}
        style={[s.input, wrong && { borderColor: Theme.colors.primary }]}
        maxLength={4}
        autoFocus
        accessibilityLabel={t("parentalGate.placeholder")}
      />

      {wrong && <Text style={s.error}>{t("parentalGate.wrong")}</Text>}

      <TouchableOpacity
        onPress={handleCheck}
        disabled={answer.length === 0}
        style={[s.primaryBtn, { opacity: answer.length === 0 ? 0.5 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={t("parentalGate.continue")}
      >
        <Text style={fredoka(18, Theme.colors.onAccent)}>
          {t("parentalGate.continue")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onCancel}
        style={s.cancelBtn}
        accessibilityRole="button"
        accessibilityLabel={t("parentalGate.cancel")}
      >
        <Text style={s.cancelText}>{t("parentalGate.cancel")}</Text>
      </TouchableOpacity>
    </View>
  );

  // Modo overlay: para ser renderizado DENTRO de outro Modal (ex.: o jogo).
  if (embedded) {
    if (!visible) return null;
    return <View style={[StyleSheet.absoluteFill, s.overlay]}>{card}</View>;
  }

  // Modo padrão: Modal próprio (telas normais, como a paywall).
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>{card}</View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Theme.colors.bg,
    borderRadius: Theme.radius.xxl,
    padding: 26,
    alignItems: "center",
    ...Shadow.raised,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  input: {
    width: "100%",
    height: 54,
    borderRadius: Theme.radius.md,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: Theme.colors.ink,
    marginTop: 4,
  },
  error: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },
  primaryBtn: {
    width: "100%",
    height: 54,
    borderRadius: 27,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    minHeight: MIN_TOUCH,
  },
  cancelBtn: { paddingVertical: 14, marginTop: 2, minHeight: MIN_TOUCH },
  cancelText: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
