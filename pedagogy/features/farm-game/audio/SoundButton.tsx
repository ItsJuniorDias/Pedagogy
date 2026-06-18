// features/farm-game/audio/SoundButton.tsx
// Botão de mudo reutilizável, em primitivos React Native. Visual "glass"
// discreto, combinando com a HUD do jogo.

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { engine } from "./engine";

export interface SoundButtonProps {
  muted: boolean;
  onToggle: () => void;
  /** Estilo extra (posicionamento absoluto, por ex.). */
  style?: any;
  /** Tom do anel/realce — default neutro claro. */
  tint?: string;
  size?: number;
}

export const SoundButton: React.FC<SoundButtonProps> = ({
  muted,
  onToggle,
  style,
  tint = "rgba(255,255,255,0.22)",
  size = 38,
}) => {
  return (
    <TouchableOpacity
      onPress={() => {
        engine.unlock();
        onToggle();
      }}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={muted ? "Ligar som" : "Desligar som"}
      style={style}
    >
      <View
        style={[
          styles.glass,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: tint,
          },
        ]}
      >
        <Text style={[styles.icon, { fontSize: size * 0.46 }]}>
          {muted ? "🔇" : "🔊"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  glass: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,18,38,0.45)",
    borderWidth: 1,
  },
  icon: {
    color: "#fff",
    textAlign: "center",
  },
});
