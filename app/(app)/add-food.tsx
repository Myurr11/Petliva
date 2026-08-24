import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, UtensilsCrossed } from "@/components/icons";
import { FoodSearchField } from "@/components/ui/FoodSearchField";
import { Chip } from "@/components/ui/Chip";
import { WeekdayToggle } from "@/components/ui/WeekdayToggle";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { insertFood, updateFood as updateRemoteFood } from "@/lib/supabase";
import { safeBack } from "@/lib/navigation";
import { defaultTimesPreview } from "@/lib/notifications";
import type { FoodCategory, FoodItem } from "@/types";

export default function AddFood() {
  const params = useLocalSearchParams<{ foodId?: string; category?: FoodCategory }>();
  const activePetId = useAppStore((s) => s.activePetId);
  const existing = useAppStore((s) =>
    activePetId && params.foodId ? s.pets[activePetId]?.foods.find((f) => f.id === params.foodId) : undefined
  );
  const addFoodToPet = useAppStore((s) => s.addFoodToPet);
  const updateFoodItem = useAppStore((s) => s.updateFoodItem);
  const syncFoodId = useAppStore((s) => s.syncFoodId);

  const [draft, setDraft] = useState<FoodItem>(
    existing ?? {
      id: `local-food-${Date.now()}`,
      category: params.category === "wet" ? "wet" : "dry",
      foodName: "",
      dailyGrams: "",
      mealsPerDay: 2,
    }
  );
  const [saving, setSaving] = useState(false);
  const [useCustomReminders, setUseCustomReminders] = useState(!!existing?.reminderTimes?.length);
  const [reminderInputs, setReminderInputs] = useState<string[]>(
    existing?.reminderTimes?.length ? existing.reminderTimes : defaultTimesPreview(existing?.mealsPerDay ?? 2)
  );

  function patch(p: Partial<FoodItem>) {
    setDraft((d) => {
      const next = { ...d, ...p };
      // Keep the custom-reminder inputs in step with meal count so there's
      // always exactly one time field per meal.
      if (p.mealsPerDay !== undefined && p.mealsPerDay !== d.mealsPerDay) {
        setReminderInputs((inputs) => {
          const defaults = defaultTimesPreview(p.mealsPerDay!);
          return defaults.map((def, i) => inputs[i] ?? def);
        });
      }
      return next;
    });
  }

  async function save() {
    if (!activePetId || !draft.foodName.trim() || !draft.dailyGrams.trim()) return;
    setSaving(true);
    const finalReminderTimes = useCustomReminders ? reminderInputs.map((t) => t.trim()).filter(Boolean) : undefined;
    const toSave: FoodItem = { ...draft, reminderTimes: finalReminderTimes };
    if (existing) {
      updateFoodItem(activePetId, existing.id, toSave);
      try {
        await updateRemoteFood(toSave);
      } catch {
        // local edit is retained while offline
      }
      setSaving(false);
      safeBack("/(app)/(tabs)/inventory");
      return;
    }
    const entry = addFoodToPet(activePetId, toSave.category);
    const finalized: FoodItem = { ...toSave, id: entry.id };
    updateFoodItem(activePetId, entry.id, finalized);
    try {
      const remoteId = await insertFood(activePetId, finalized);
      syncFoodId(activePetId, entry.id, remoteId);
    } catch {
      // offline-first fallback — entry stays with its local id
    }
    setSaving(false);
    safeBack("/(app)/(tabs)/inventory");
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{existing ? "Edit food" : "Add food"}</Text>
          <Pressable onPress={() => safeBack("/(app)/(tabs)/inventory")} style={styles.closeBtn}>
            <X size={16} color={colors.ink} />
          </Pressable>
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {(["dry", "wet"] as FoodCategory[]).map((c) => (
            <Chip key={c} label={c === "dry" ? "Dry" : "Wet"} active={draft.category === c} onPress={() => patch({ category: c })} />
          ))}
        </View>

        <FoodSearchField food={draft} onChange={patch} />

        <Text style={styles.label}>Daily amount</Text>
        <View style={styles.amountCard}>
          <UtensilsCrossed size={18} color={colors.ink} />
          <TextInput
            value={draft.dailyGrams}
            onChangeText={(v) => patch({ dailyGrams: v })}
            placeholder="e.g. 40"
            keyboardType="number-pad"
            placeholderTextColor={colors.outlineVariant}
            style={styles.amountInput}
          />
          <Text style={styles.amountUnit}>g / day</Text>
        </View>

        <Text style={styles.label}>Split across how many meals?</Text>
        <View style={styles.chipRow}>
          {[1, 2, 3, 4].map((n) => (
            <Chip key={n} label={`${n}`} active={draft.mealsPerDay === n} onPress={() => patch({ mealsPerDay: n })} />
          ))}
        </View>

        {draft.category === "wet" && (
          <>
            <Text style={styles.label}>Which days a week?</Text>
            <Text style={styles.sublabel}>Not everyone gives wet food daily — mark the days it applies.</Text>
            <WeekdayToggle value={draft.daysOfWeek} onChange={(days) => patch({ daysOfWeek: days })} />
          </>
        )}

        <Text style={styles.label}>Feeding reminders</Text>
        <View style={styles.chipRow}>
          <Chip label="Auto" active={!useCustomReminders} onPress={() => setUseCustomReminders(false)} />
          <Chip label="Custom times" active={useCustomReminders} onPress={() => setUseCustomReminders(true)} />
        </View>
        {!useCustomReminders ? (
          <Text style={styles.sublabel}>
            We'll remind you at {defaultTimesPreview(draft.mealsPerDay).join(", ")} — spread evenly across the day.
          </Text>
        ) : (
          <View style={{ marginBottom: 4 }}>
            {reminderInputs.slice(0, draft.mealsPerDay).map((t, i) => (
              <TextInput
                key={i}
                value={t}
                onChangeText={(v) =>
                  setReminderInputs((inputs) => inputs.map((x, idx) => (idx === i ? v : x)))
                }
                placeholder={`Meal ${i + 1} time (e.g. 8:00 AM)`}
                placeholderTextColor={colors.outlineVariant}
                style={styles.input}
              />
            ))}
          </View>
        )}

        <View style={{ height: 16 }} />
        <PrimaryButton
          label={saving ? "Saving…" : existing ? "Save changes" : "Add food"}
          disabled={!draft.foodName.trim() || !draft.dailyGrams.trim() || saving}
          onPress={save}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  sheet: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  closeBtn: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 2, borderColor: colors.ink, padding: 6 },
  label: { fontFamily: fonts.labelBold, fontSize: 13.5, color: colors.ink, marginBottom: 8, marginTop: 10 },
  sublabel: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: -6, marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  amountCard: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceAlt,
    borderRadius: 12, borderWidth: 2, borderColor: colors.ink, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 4,
  },
  amountInput: { flex: 1, fontFamily: fonts.mono, fontSize: 20, color: colors.ink },
  amountUnit: { fontFamily: fonts.mono, fontSize: 13, color: colors.inkSoft },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface,
    paddingVertical: 12, paddingHorizontal: 16, fontFamily: fonts.body, fontSize: 14.5, color: colors.ink, marginBottom: 8,
  },
});
