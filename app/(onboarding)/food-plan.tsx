import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { ChevronRight, UtensilsCrossed } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { TextField } from "@/components/ui/TextField";
import { Chip } from "@/components/ui/Chip";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { createPetAndPlan } from "@/lib/supabase";

export default function FoodPlanStep() {
  const pet = useAppStore((s) => s.pet);
  const plan = useAppStore((s) => s.plan);
  const setPlan = useAppStore((s) => s.setPlan);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [saving, setSaving] = useState(false);

  const perMeal =
    plan.dailyGrams && plan.mealsPerDay ? Math.round(Number(plan.dailyGrams) / plan.mealsPerDay) : null;

  async function finish() {
    setSaving(true);
    try {
      const petId = await createPetAndPlan(pet, plan);
      completeOnboarding(petId);
      router.replace("/(app)/home");
    } catch (e: any) {
      Alert.alert(
        "Couldn't save to your account",
        e.message ?? "Check your connection and try again. Your answers are still saved on this device."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgressDots step={7} total={7} />
      <ScreenTitle
        eyebrow="Step 7 of 7"
        title={`Set ${pet.name || "their"} feeding plan`}
        sub="Check the feeding-guide label on the pack for the daily amount by weight."
      />
      <TextField
        label="Food name / label"
        placeholder="e.g. Royal Canin Fit 32"
        value={plan.foodName}
        onChangeText={(v) => setPlan({ foodName: v })}
      />
      <Text style={styles.label}>Daily amount</Text>
      <View style={styles.amountCard}>
        <UtensilsCrossed size={18} color={colors.inkSoft} />
        <TextInput
          value={plan.dailyGrams}
          onChangeText={(v) => setPlan({ dailyGrams: v })}
          placeholder="63"
          keyboardType="number-pad"
          placeholderTextColor={colors.inkSoft}
          style={styles.amountInput}
        />
        <Text style={styles.amountUnit}>g / day</Text>
      </View>

      <Text style={styles.label}>Split across how many meals?</Text>
      <View style={styles.mealsRow}>
        {[2, 3, 4].map((n) => (
          <Chip key={n} label={`${n} meals`} active={plan.mealsPerDay === n} onPress={() => setPlan({ mealsPerDay: n })} />
        ))}
      </View>
      {perMeal ? (
        <Text style={styles.hint}>≈ {perMeal}g per meal, {plan.mealsPerDay}×/day</Text>
      ) : null}

      <View style={styles.spacer} />
      <PrimaryButton
        label={saving ? "Saving…" : "Finish setup"}
        icon={ChevronRight}
        disabled={!plan.dailyGrams || !plan.foodName || saving}
        onPress={finish}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.inkSoft, marginBottom: 8 },
  amountCard: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceAlt,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 18,
  },
  amountInput: { width: 70, fontFamily: fonts.mono, fontSize: 22, color: colors.ink },
  amountUnit: { fontFamily: fonts.mono, fontSize: 14, color: colors.inkSoft },
  mealsRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  hint: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.amberDeep, marginBottom: 20 },
  spacer: { flex: 1, minHeight: 16 },
});
