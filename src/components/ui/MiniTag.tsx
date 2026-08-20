import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, fonts } from "@/theme/tokens";

interface Props {
  label: string;
  tone?: "neutral" | "accent" | "sage";
  style?: ViewStyle;
}

const TONE_BG: Record<NonNullable<Props["tone"]>, string> = {
  neutral: colors.surfaceAlt,
  accent: colors.accent,
  sage: colors.sageBg,
};

/** A small bordered pill for one piece of metadata (a dosage, a schedule, a
 *  food name). Used in place of joining strings with a "·" character —
 *  that glyph sits tiny and low in the line and is easy to miss, whereas a
 *  bordered chip is unambiguous at a glance and matches the app's other
 *  badge-style tags. */
export function MiniTag({ label, tone = "neutral", style }: Props) {
  return (
    <View style={[styles.tag, { backgroundColor: TONE_BG[tone] }, style]}>
      <Text style={styles.text} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 6, borderWidth: 1.3, borderColor: colors.outlineVariant,
    paddingVertical: 2.5, paddingHorizontal: 7,
  },
  text: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.inkSoft },
});
