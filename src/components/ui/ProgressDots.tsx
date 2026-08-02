import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";

export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: i < step ? colors.amber : colors.track }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, marginTop: 10, marginBottom: 4 },
  dot: { flex: 1, height: 4, borderRadius: 4 },
});
