import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "@/components/icons";
import { colors } from "@/theme/tokens";

/** Shared header for onboarding screens: circular back button + step dots,
 *  matching the reference design exactly. Replaces the native stack header
 *  (set headerShown:false for any screen using this). */
export function NeoOnboardHeader({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <ChevronLeft size={20} color={colors.ink} />
      </Pressable>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.dot, i === step - 1 && styles.dotActive]} />
        ))}
      </View>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink,
  },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.track, borderWidth: 1.5, borderColor: colors.ink },
  dotActive: { backgroundColor: colors.accent, width: 16 },
});
