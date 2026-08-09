import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, fonts, radii } from "@/theme/tokens";
import type { IconComponent } from "@/components/icons";

interface Props {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: IconComponent;
}

// Pill chip, neo-brutalist: white with thick black border when unselected,
// solid mustard fill (still black border) when selected — matches the
// reference's "Dog/Cat/Other" and marital-status style selectors.
export function Chip({ label, active, onPress, icon: Icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        { backgroundColor: active ? colors.accent : colors.surface },
      ]}
    >
      {Icon ? <Icon size={14} color={colors.ink} /> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink },
});
