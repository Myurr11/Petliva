import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { X, Plus, Minus } from "@/components/icons";
import { Chip } from "@/components/ui/Chip";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { NeoBox } from "@/components/ui/NeoBox";
import { useAppStore } from "@/store/useAppStore";
import { MEAL_LABELS } from "@/constants/data";
import { colors, fonts } from "@/theme/tokens";
import { insertFeedingLog } from "@/lib/supabase";

export default function LogMeal() {
  const activePetId = useAppStore((s) => s.activePetId);
  const plan = useAppStore((s) => (s.activePetId ? s.pets[s.activePetId]?.plan : undefined)) ?? { foodName: "", dailyGrams: "", mealsPerDay: 3 };
  const todayTotal = useAppStore((s) => s.todayTotal());
  const addLog = useAppStore((s) => s.addLog);

  const dailyGrams = Number(plan.dailyGrams) || 0;
  const perMealSuggestion = plan.mealsPerDay ? Math.round(dailyGrams / plan.mealsPerDay) : 0;
  const remaining = Math.max(0, dailyGrams - todayTotal);

  const [grams, setGrams] = useState(perMealSuggestion || 0);
  const [label, setLabel] = useState(MEAL_LABELS[0]);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!activePetId) return;
    setSaving(true);
    const entry = addLog(activePetId, grams, label);
    // Local log is the source of truth for the ring even if the network call
    // below fails — a flaky connection shouldn't block logging a feeding.
    try {
      await insertFeedingLog(activePetId, entry);
    } catch {
      // silently keep the local entry; could add a retry/sync queue later
    }
    setSaving(false);
    router.back();
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Log a feeding</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={16} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.chipRow}>
        {MEAL_LABELS.map((l) => (
          <Chip key={l} label={l} active={label === l} onPress={() => setLabel(l)} />
        ))}
      </View>

      <View style={styles.stepper}>
        <Pressable onPress={() => setGrams((g) => Math.max(0, g - 5))}>
          <NeoBox depth={2} radius={12} style={styles.stepBtn}>
            <Minus size={16} color={colors.ink} />
          </NeoBox>
        </Pressable>
        <Text style={styles.gramsText}>{grams}g</Text>
        <Pressable onPress={() => setGrams((g) => g + 5)}>
          <NeoBox depth={2} radius={12} style={styles.stepBtn}>
            <Plus size={16} color={colors.ink} />
          </NeoBox>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        {remaining}g remaining today · suggested {perMealSuggestion}g/meal
      </Text>

      <PrimaryButton
        label={
          saving
            ? "Saving…"
            : `Save feeding — logged at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        }
        disabled={grams <= 0 || saving}
        onPress={save}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.appBg, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  closeBtn: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 2, borderColor: colors.ink, padding: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 8 },
  stepBtn: { width: 40, height: 40, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  gramsText: { fontFamily: fonts.monoSemibold, fontSize: 40, color: colors.ink, minWidth: 110, textAlign: "center" },
  hint: { textAlign: "center", fontSize: 12, color: colors.inkSoft, marginBottom: 20, fontFamily: fonts.body },
});
