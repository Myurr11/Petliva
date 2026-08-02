import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, fonts, radii } from "@/theme/tokens";
import type { IconComponent } from "@/components/icons";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconComponent;
  variant?: "ink" | "amber";
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, disabled, icon: Icon, variant = "ink", style }: Props) {
  const bg = disabled ? colors.track : variant === "amber" ? colors.amber : colors.ink;
  const fg = disabled ? colors.inkSoft : variant === "amber" ? colors.onAmber : colors.onInk;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.base, { backgroundColor: bg, opacity: pressed ? 0.9 : 1 }, style]}
    >
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
      {Icon ? <Icon size={17} color={fg} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: { fontFamily: fonts.bodySemibold, fontSize: 15 },
});
