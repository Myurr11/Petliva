import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, fonts } from "@/theme/tokens";
import { NeoBox } from "@/components/ui/NeoBox";
import type { IconComponent } from "@/components/icons";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconComponent;
  variant?: "ink" | "accent";
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, disabled, icon: Icon, variant = "accent", style }: Props) {
  const bg = disabled ? colors.track : variant === "ink" ? colors.ink : colors.accent;
  const fg = disabled ? colors.inkSoft : variant === "ink" ? colors.onInk : colors.onAccent;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[{ width: "100%" }, style]}>
      <NeoBox depth={disabled ? 0 : 4} radius={999} style={[styles.base, { backgroundColor: bg }]}>
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
        {Icon ? <Icon size={17} color={fg} /> : null}
      </NeoBox>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: { fontFamily: fonts.labelBold, fontSize: 16 },
});
