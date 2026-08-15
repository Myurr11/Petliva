import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
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
  const foods = useAppStore((s) => (s.activePetId ? s.pets[s.activePetId]?.foods : undefined)) ?? [];
  const addLog = useAppStore((s) => s.addLog);

  const [foodId, setFoodId] = useState(foods[0]?.id ?? "");
  const food = foods.find((f) => f.id === foodId);

  const todayTotalForFood = useAppStore((s) => (activePetId && foodId ? s.todayTotalForFood(activePetId, foodId) : 0));

  const dailyGrams = Number(food?.dailyGrams) || 0;
  const perMealSuggestion = food?.mealsPerDay ? Math.round(dailyGrams / food.mealsPerDay) : 0;
  const remaining = Math.max(0, dailyGrams - todayTotalForFood);

  // Kept as a string, not a number, so the field can be freely typed into
  // (e.g. "26") without fighting a numeric stepper that only landed on
  // multiples of 5 — that was the actual bug: 26g out of a 35g meal simply
  // wasn't reachable before.
  const [gramsText, setGramsText] = useState(String(perMealSuggestion || 0));
  const grams = Math.max(0, Math.round(Number(gramsText) || 0));
  const [label, setLabel] = useState(MEAL_LABELS[0]);
  const [saving, setSaving] = useState(false);

  function selectFood(id: string) {
    setFoodId(id);
    const f = foods.find((x) => x.id === id);
    const suggestion = f?.mealsPerDay ? Math.round((Number(f.dailyGrams) || 0) / f.mealsPerDay) : 0;
    setGramsText(String(suggestion || 0));
  }

  function nudge(delta: number) {
    setGramsText((prev) => String(Math.max(0, (Math.round(Number(prev) || 0)) + delta)));
  }

  async function save() {
    if (!activePetId || !foodId) return;
    setSaving(true);
    const entry = addLog(activePetId, foodId, grams, label);
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

  if (foods.length === 0) {
    return (
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Log a feeding</Text>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <X size={16} color={colors.ink} />
          </Pressable>
        </View>
        <Text style={styles.hint}>No food set up yet for this pet — add one from the Food tab first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Log a feeding</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={16} color={colors.ink} />
        </Pressable>
      </View>

      {foods.length > 1 && (
        <>
          <Text style={styles.label}>Which food?</Text>
          <View style={styles.chipRow}>
            {foods.map((f) => (
              <Chip
                key={f.id}
                label={`${f.category === "dry" ? "Dry" : "Wet"} · ${f.foodName || "Unnamed"}`}
                active={foodId === f.id}
                onPress={() => selectFood(f.id)}
              />
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Meal</Text>
      <View style={styles.chipRow}>
        {MEAL_LABELS.map((l) => (
          <Chip key={l} label={l} active={label === l} onPress={() => setLabel(l)} />
        ))}
      </View>

      <View style={styles.stepper}>
        <Pressable onPress={() => nudge(-5)}>
          <NeoBox depth={2} radius={12} style={styles.stepBtn}>
            <Minus size={16} color={colors.ink} />
          </NeoBox>
        </Pressable>
        <View style={styles.gramsInputWrap}>
          <TextInput
            value={gramsText}
            onChangeText={(v) => setGramsText(v.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            selectTextOnFocus
            style={styles.gramsText}
            maxLength={4}
          />
          <Text style={styles.gramsUnit}>g</Text>
        </View>
        <Pressable onPress={() => nudge(5)}>
          <NeoBox depth={2} radius={12} style={styles.stepBtn}>
            <Plus size={16} color={colors.ink} />
          </NeoBox>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        Tap the number to type an exact amount · {remaining}g remaining today · suggested {perMealSuggestion}g/meal
      </Text>

      <PrimaryButton
        label={
          saving
            ? "Saving…"
            : `Save feeding — logged at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        }
        disabled={grams <= 0 || saving || !foodId}
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
  label: { fontFamily: fonts.labelBold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 8 },
  stepBtn: { width: 40, height: 40, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  gramsInputWrap: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", minWidth: 110 },
  gramsText: {
    fontFamily: fonts.monoSemibold, fontSize: 40, color: colors.ink, textAlign: "center",
    minWidth: 70, padding: 0,
  },
  gramsUnit: { fontFamily: fonts.monoSemibold, fontSize: 22, color: colors.inkSoft, marginLeft: 2 },
  hint: { textAlign: "center", fontSize: 12, color: colors.inkSoft, marginBottom: 20, fontFamily: fonts.body },
});
