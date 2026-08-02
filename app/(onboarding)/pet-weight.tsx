import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Scale } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";

export default function PetWeightStep() {
  const pet = useAppStore((s) => s.pet);
  const setPet = useAppStore((s) => s.setPet);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgressDots step={4} total={7} />
      <ScreenTitle
        eyebrow="Step 4 of 7"
        title="Current weight"
        sub="Weight helps estimate a starting daily portion — you can fine-tune it in the next step."
      />
      <View style={styles.card}>
        <Scale size={22} color={colors.inkSoft} />
        <TextInput
          value={pet.weightKg}
          onChangeText={(v) => setPet({ weightKg: v })}
          placeholder="5.0"
          keyboardType="decimal-pad"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
        />
        <Text style={styles.unit}>kg</Text>
      </View>
      <View style={styles.spacer} />
      <PrimaryButton
        label="Continue"
        icon={ChevronRight}
        disabled={!pet.weightKg}
        onPress={() => router.push("/(onboarding)/vaccination")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1 },
  card: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16,
    backgroundColor: colors.surfaceAlt, borderRadius: 20, paddingVertical: 36, paddingHorizontal: 20, marginBottom: 24,
  },
  input: { width: 90, fontFamily: fonts.mono, fontSize: 34, color: colors.ink, textAlign: "center" },
  unit: { fontFamily: fonts.mono, fontSize: 18, color: colors.inkSoft },
  spacer: { flex: 1, minHeight: 12 },
});
