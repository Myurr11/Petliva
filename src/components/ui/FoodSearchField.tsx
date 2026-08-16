import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors, fonts, radii } from "@/theme/tokens";
import type { FoodItem } from "@/types";

interface Props {
  food: FoodItem;
  onChange: (p: Partial<FoodItem>) => void;
}

/** Plain manual entry for the food's name/label — no external lookup. */
export function FoodSearchField({ food, onChange }: Props) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>Food name / label</Text>
      <TextInput
        value={food.foodName}
        onChangeText={(v) => onChange({ foodName: v })}
        placeholder="e.g. Royal Canin Fit 32"
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink, marginBottom: 8 },
  input: {
    width: "100%", paddingVertical: 14, paddingHorizontal: 16, borderRadius: radii.sm,
    borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, fontFamily: fonts.body,
    fontSize: 16, color: colors.ink,
  },
});
