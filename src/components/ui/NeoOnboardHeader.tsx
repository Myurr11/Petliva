import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "@/components/icons";
import { colors } from "@/theme/tokens";

/** Shared header for onboarding screens: circular back button + step dots,
 *  matching the reference design exactly. Replaces the native stack header
 *  (set headerShown:false for any screen using this).
 *
 *  These onboarding screens don't use SafeAreaView (their content usually
 *  scrolls edge-to-edge behind this header), so the header pads itself for
 *  the status bar / notch instead — otherwise it renders underneath it. */
export function NeoOnboardHeader({ step, total }: { step: number; total: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink,
  },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.track, borderWidth: 1.5, borderColor: colors.ink },
  dotActive: { backgroundColor: colors.accent, width: 16 },
});
