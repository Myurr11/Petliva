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

export function Chip({ label, active, onPress, icon: Icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        { borderColor: active ? colors.amber : colors.border, backgroundColor: active ? "#F5E6CE" : colors.surface },
      ]}
    >
      {Icon ? <Icon size={14} color={active ? colors.amberDeep : colors.ink} /> : null}
      <Text style={[styles.label, { color: active ? colors.amberDeep : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13.5 },
});
