import { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const fredoka = (size: number, color?: string) => ({
  fontFamily: "FredokaOne_400Regular" as const,
  fontSize: size,
  ...(color ? { color } : {}),
});

interface ParentalGateProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Portão parental exigido pela Kids Category da App Store (Guideline 1.3).
 * Precisa ser exibido ANTES de qualquer link que saia do app.
 *
 * Usa uma multiplicação de dois dígitos baixos: trivial para um adulto,
 * mas fora do alcance típico de uma criança de 6-8 anos. A conta é
 * regenerada a cada erro para impedir acerto por tentativa e erro.
 */
export function ParentalGate({
  visible,
  onSuccess,
  onCancel,
}: ParentalGateProps) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);

  const generate = () => {
    // números de 4 a 9 -> produtos exigem multiplicação "de verdade"
    setA(Math.floor(Math.random() * 6) + 4);
    setB(Math.floor(Math.random() * 6) + 4);
    setAnswer("");
    setWrong(false);
  };

  // gera uma nova conta sempre que o modal abre
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={{ fontSize: 44, marginBottom: 4 }}>🔒</Text>

          <Text style={[fredoka(22, "#2D2D2D"), { textAlign: "center" }]}>
            Ask a grown-up
          </Text>

          <Text style={s.subtitle}>
            To continue, please solve this so we know an adult is here:
          </Text>

          <Text style={[fredoka(34, "#FF5B8D"), { marginVertical: 8 }]}>
            {a} × {b} = ?
          </Text>

          <TextInput
            value={answer}
            onChangeText={(t) => setAnswer(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="Type the answer"
            placeholderTextColor="#CCC"
            style={[s.input, wrong && { borderColor: "#FF5B8D" }]}
            maxLength={4}
            autoFocus
          />

          {wrong && (
            <Text style={s.error}>That's not right — try the new one.</Text>
          )}

          <TouchableOpacity
            onPress={handleCheck}
            disabled={answer.length === 0}
            style={[s.primaryBtn, { opacity: answer.length === 0 ? 0.5 : 1 }]}
          >
            <Text style={fredoka(18, "#fff")}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} style={s.cancelBtn}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFF9F0",
    borderRadius: 28,
    padding: 26,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  input: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#2D2D2D",
    marginTop: 4,
  },
  error: {
    color: "#FF5B8D",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },
  primaryBtn: {
    width: "100%",
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FF5B8D",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  cancelBtn: { paddingVertical: 14, marginTop: 2 },
  cancelText: {
    fontSize: 14,
    color: "#AAA",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
