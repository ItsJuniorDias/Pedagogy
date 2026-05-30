import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function Filters({ filters }: { filters: string[] }) {
  const [activeChip, setActiveChip] = useState(0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.filtersRow}
    >
      {filters.map((chip, i) => (
        <TouchableOpacity
          key={i}
          style={[s.chip, activeChip === i && s.chipActive]}
          onPress={() => setActiveChip(i)}
          activeOpacity={0.8}
        >
          <Text style={[s.chipText, activeChip === i && s.chipTextActive]}>
            {chip}
          </Text>
        </TouchableOpacity>
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
