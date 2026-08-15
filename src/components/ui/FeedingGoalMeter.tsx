import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme/tokens";

interface Props {
  label: string;
  fedGrams: number;
  targetGrams: number;
  fillColor: string;
  badgeBg?: string;
}

export function FeedingGoalMeter({ label, fedGrams, targetGrams, fillColor, badgeBg }: Props) {
  const hasTarget = targetGrams > 0;
  const pct = hasTarget ? Math.min(100, (fedGrams / targetGrams) * 100) : 0;
  const met = hasTarget && fedGrams >= targetGrams;
  const remaining = hasTarget ? Math.max(0, targetGrams - fedGrams) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: badgeBg ?? fillColor }]}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
        <Text style={styles.valueText}>
          <Text style={[styles.fedValue, met && styles.fedValueMet]}>{fedGrams}g</Text>
          <Text style={styles.targetValue}> / {hasTarget ? `${targetGrams}g` : "—"}</Text>
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
      </View>

      <Text style={styles.hintText}>
        {hasTarget
          ? met
            ? "Daily target reached"
            : `${remaining}g remaining`
          : "No daily target set"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 6 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  badge: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  badgeText: { fontFamily: fonts.labelBold, fontSize: 10, color: colors.ink, letterSpacing: 0.3 },
  valueText: { fontFamily: fonts.mono, fontSize: 13, color: colors.inkSoft },
  fedValue: { fontFamily: fonts.monoSemibold, color: colors.ink },
  fedValueMet: { color: colors.accentDeep },
  targetValue: { color: colors.inkSoft },
  track: {
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.track,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRightWidth: 2, borderRightColor: colors.ink },
  hintText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
});
