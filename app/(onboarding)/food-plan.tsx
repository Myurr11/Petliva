import React, { useState } from "react";
import { View, Text, TextInput, Image, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { ChevronRight, UtensilsCrossed, X, Plus } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { FoodSearchField } from "@/components/ui/FoodSearchField";
import { Chip } from "@/components/ui/Chip";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { NeoBox } from "@/components/ui/NeoBox";
import { NeoOnboardHeader } from "@/components/ui/NeoOnboardHeader";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { createPetAndFoods } from "@/lib/supabase";
import type { FoodCategory } from "@/types";

const DEFAULT_IDS_COUNT = 2; // the default dry + wet slots can't be removed, only left blank

export default function FoodPlanStep() {
  const pet = useAppStore((s) => s.pet);
  const foodsDraft = useAppStore((s) => s.foodsDraft);
  const vetDraft = useAppStore((s) => s.vetDraft);
  const updateFoodDraft = useAppStore((s) => s.updateFoodDraft);
  const addFoodDraft = useAppStore((s) => s.addFoodDraft);
  const removeFoodDraft = useAppStore((s) => s.removeFoodDraft);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [saving, setSaving] = useState(false);

  const usableCount = foodsDraft.filter((f) => f.foodName.trim() && f.dailyGrams.trim()).length;

  function addMore(category: FoodCategory) {
    addFoodDraft(category);
  }

  async function finish() {
    setSaving(true);
    try {
      const { petId, foodIdMap } = await createPetAndFoods(pet, foodsDraft, vetDraft);
      completeOnboarding(petId, foodIdMap);
      router.replace("/(app)/(tabs)/home");
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
    <View style={styles.screen}>
      <NeoOnboardHeader step={9} total={9} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle
          title={`What does ${pet.name || "your pet"} eat?`}
          sub="Most pets eat one dry food and one wet food — leave either blank if it doesn't apply, or add more below."
        />

        {foodsDraft.map((food, i) => (
          <NeoBox key={food.id} depth={3} radius={16} style={styles.foodCard}>
            <View style={styles.foodCardHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: food.category === "dry" ? colors.accent : colors.sageBg }]}>
                <Text style={styles.categoryBadgeText}>{food.category === "dry" ? "Dry food" : "Wet food"}</Text>
              </View>
              {i >= DEFAULT_IDS_COUNT && (
                <Pressable onPress={() => removeFoodDraft(food.id)} style={styles.removeBtn}>
                  <X size={14} color={colors.ink} />
                </Pressable>
              )}
            </View>

            <FoodSearchField food={food} onChange={(patch) => updateFoodDraft(food.id, patch)} />

            <Text style={styles.label}>Daily amount</Text>
            <View style={styles.amountCard}>
              <UtensilsCrossed size={18} color={colors.ink} />
              <TextInput
                value={food.dailyGrams}
                onChangeText={(v) => updateFoodDraft(food.id, { dailyGrams: v })}
                placeholder="e.g. 40"
                keyboardType="number-pad"
                placeholderTextColor={colors.outlineVariant}
                style={styles.amountInput}
              />
              <Text style={styles.amountUnit}>g / day</Text>
            </View>

            <Text style={styles.label}>Split across how many meals?</Text>
            <View style={styles.mealsRow}>
              {[1, 2, 3, 4].map((n) => (
                <Chip key={n} label={`${n}`} active={food.mealsPerDay === n} onPress={() => updateFoodDraft(food.id, { mealsPerDay: n })} />
              ))}
            </View>
          </NeoBox>
        ))}

        <View style={styles.addMoreRow}>
          <Pressable onPress={() => addMore("dry")} style={styles.addMoreBtn}>
            <Plus size={14} color={colors.ink} />
            <Text style={styles.addMoreLabel}>Add dry food</Text>
          </Pressable>
          <Pressable onPress={() => addMore("wet")} style={styles.addMoreBtn}>
            <Plus size={14} color={colors.ink} />
            <Text style={styles.addMoreLabel}>Add wet food</Text>
          </Pressable>
        </View>

        <View style={styles.spacer} />
        {saving && (
          <View style={styles.savingRow}>
            <Image
              source={require("../../assets/illustrations/loading-corgi.png")}
              style={styles.savingIllustration}
              resizeMode="contain"
            />
            <Text style={styles.savingText}>Setting up {pet.name || "your pet"}'s profile…</Text>
          </View>
        )}
        <PrimaryButton
          label={saving ? "Saving…" : "Finish setup"}
          icon={ChevronRight}
          disabled={usableCount === 0 || saving}
          onPress={finish}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, flexGrow: 1 },
  foodCard: { padding: 16, marginBottom: 16 },
  foodCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  categoryBadge: { borderRadius: 999, borderWidth: 2, borderColor: colors.ink, paddingVertical: 5, paddingHorizontal: 12 },
  categoryBadgeText: { fontFamily: fonts.labelBold, fontSize: 12, color: colors.ink },
  removeBtn: { width: 26, height: 26, borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: fonts.labelBold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  amountCard: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceAlt,
    borderRadius: 12, borderWidth: 2, borderColor: colors.ink, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16,
  },
  amountInput: { flex: 1, fontFamily: fonts.mono, fontSize: 20, color: colors.ink },
  amountUnit: { fontFamily: fonts.mono, fontSize: 13, color: colors.inkSoft },
  mealsRow: { flexDirection: "row", gap: 8 },
  addMoreRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  addMoreBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.ink, borderStyle: "dashed",
  },
  addMoreLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  spacer: { flex: 1, minHeight: 16 },
  savingRow: { alignItems: "center", marginBottom: 12 },
  savingIllustration: { width: 120, height: 100 },
  savingText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkSoft, marginTop: 4 },
});
