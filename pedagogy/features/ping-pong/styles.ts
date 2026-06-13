/**
 * styles.ts — Estilos compartilhados entre os painéis flutuantes.
 * (Cada componente mantém seus próprios estilos localmente; aqui ficam
 *  apenas primitivos reaproveitados por mais de um componente.)
 */

import { Platform, StyleSheet } from "react-native";

export const shared = StyleSheet.create({
  floatShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: {},
    }),
  },
});
