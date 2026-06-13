import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { enterPop, PressBounce } from "../../shared/motion";

export default function Filters({ filters }: { filters: string[] }) {
  const [activeChip, setActiveChip] = useState(0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.filtersRow}
    >
      {/* Chips estouram em cascata e respondem ao toque com mola */}
      {filters.map((chip, i) => (
        <PressBounce
          key={chip}
          entering={enterPop(80 + i * 70)}
          scaleTo={0.88}
          style={[s.chip, activeChip === i && s.chipActive]}
          onPress={() => setActiveChip(i)}
        >
          <Text style={[s.chipText, activeChip === i && s.chipTextActive]}>
            {chip}
          </Text>
        </PressBounce>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  filtersRow: {
    height: 40,
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 4, // ← breathing room sem espaço excessivo
    gap: 10,
    marginBottom: 32, // ← reduzido
  },

  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#EDEDED",
    alignSelf: "center",
  },
  chipActive: {
    backgroundColor: "#FF5B8D",
    borderColor: "#FF5B8D",
  },
  chipText: {
    height: 16,
    fontSize: 13,
    fontWeight: "800",
    color: "#999",
    textAlign: "center",
  },
  chipTextActive: { color: "#fff" },
});
