import React, { useState } from "react";
import { View, Text, TextInput, Image, StyleSheet, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "@/components/icons";
import { Chip } from "@/components/ui/Chip";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { insertRestock } from "@/lib/supabase";
import { safeBack } from "@/lib/navigation";

const QUICK_SIZES = [
  { label: "1 kg", grams: 1000 },
  { label: "2 kg", grams: 2000 },
  { label: "3 kg", grams: 3000 },
  { label: "4 kg", grams: 4000 },
  { label: "10 kg", grams: 10000 },
  { label: "15 kg", grams: 15000 },
];

export default function AddRestock() {
  const params = useLocalSearchParams<{ foodId?: string; foodName?: string }>();
  const activePetId = useAppStore((s) => s.activePetId);
  const foods = useAppStore((s) => (s.activePetId ? s.pets[s.activePetId]?.foods : undefined)) ?? [];
  const addRestock = useAppStore((s) => s.addRestock);
  const foodId = params.foodId ?? foods[0]?.id ?? "";
  const foodName = params.foodName ?? foods.find((f) => f.id === foodId)?.foodName ?? "";

  const [grams, setGrams] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!activePetId || !foodId || !grams) return;
    setSaving(true);
    const entry = addRestock(activePetId, foodId, Number(grams), note);
    try {
      await insertRestock(activePetId, entry);
    } catch {
      // local entry still counts; same offline-first pattern as feeding logs
    }
    setSaving(false);
    safeBack("/(app)/(tabs)/inventory");
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Log a restock</Text>
        <Pressable onPress={() => safeBack("/(app)/(tabs)/inventory")} style={styles.closeBtn}>
          <X size={16} color={colors.ink} />
        </Pressable>
      </View>

      {!!foodName && (
        <View style={styles.forFoodPill}>
          <Text style={styles.forFoodPillText}>For {foodName}</Text>
        </View>
      )}

      <Image
        source={require("../../assets/illustrations/food-restock.png")}
        style={styles.heroIllustration}
        resizeMode="contain"
      />

      <Text style={styles.label}>Quick sizes</Text>
      <View style={styles.chipRow}>
        {QUICK_SIZES.map((s) => (
          <Chip key={s.grams} label={s.label} active={grams === String(s.grams)} onPress={() => setGrams(String(s.grams))} />
        ))}
      </View>

      <Text style={styles.label}>Total grams added</Text>
      <TextInput
        value={grams}
        onChangeText={setGrams}
        placeholder="e.g. 3000"
        keyboardType="number-pad"
        placeholderTextColor={colors.outlineVariant}
        style={styles.input}
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Royal Canin Fit 32, 2 bags"
        placeholderTextColor={colors.outlineVariant}
        style={styles.input}
      />

      <View style={{ flex: 1, minHeight: 20 }} />
      <PrimaryButton label={saving ? "Saving…" : "Save restock"} disabled={!grams || !foodId || saving} onPress={save} />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  sheet: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  closeBtn: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 2, borderColor: colors.ink, padding: 6 },
  forFoodPill: {
    alignSelf: "center", backgroundColor: colors.accent, borderRadius: 999,
    borderWidth: 2, borderColor: colors.ink, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 4,
  },
  forFoodPillText: { fontFamily: fonts.labelBold, fontSize: 12, color: colors.ink },
  heroIllustration: { width: 170, height: 170, alignSelf: "center", marginTop: 4, marginBottom: 16 },
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink, marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  input: {
    borderWidth: 2, borderColor: colors.ink, borderRadius: 8, backgroundColor: colors.surface,
    paddingVertical: 14, paddingHorizontal: 16, fontFamily: fonts.body, fontSize: 16, color: colors.ink, marginBottom: 16,
  },
});