import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";

export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === step - 1 && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.track, borderWidth: 1.5, borderColor: colors.ink },
  dotActive: { backgroundColor: colors.accent, width: 16 },
});
