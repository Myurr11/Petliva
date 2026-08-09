import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { X } from "@/components/icons";
import { Chip } from "@/components/ui/Chip";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { insertRestock } from "@/lib/supabase";

const QUICK_SIZES = [
  { label: "1 kg", grams: 1000 },
  { label: "2 kg", grams: 2000 },
  { label: "3 kg", grams: 3000 },
  { label: "4 kg", grams: 4000 },
  { label: "10 kg", grams: 10000 },
  { label: "15 kg", grams: 15000 },
];

export default function AddRestock() {
  const activePetId = useAppStore((s) => s.activePetId);
  const addRestock = useAppStore((s) => s.addRestock);
  const [grams, setGrams] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!activePetId || !grams) return;
    setSaving(true);
    const entry = addRestock(activePetId, Number(grams), note);
    try {
      await insertRestock(activePetId, entry);
    } catch {
      // local entry still counts; same offline-first pattern as feeding logs
    }
    setSaving(false);
    router.back();
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Log a restock</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={16} color={colors.ink} />
        </Pressable>
      </View>

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
      <PrimaryButton label={saving ? "Saving…" : "Save restock"} disabled={!grams || saving} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.appBg, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  closeBtn: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 2, borderColor: colors.ink, padding: 6 },
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink, marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  input: {
    borderWidth: 2, borderColor: colors.ink, borderRadius: 8, backgroundColor: colors.surface,
    paddingVertical: 14, paddingHorizontal: 16, fontFamily: fonts.body, fontSize: 16, color: colors.ink, marginBottom: 16,
  },
});
