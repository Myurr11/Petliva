import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { X } from "@/components/icons";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { insertAppointment } from "@/lib/supabase";

export default function AddAppointment() {
  const activePetId = useAppStore((s) => s.activePetId);
  const addAppointment = useAppStore((s) => s.addAppointment);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!activePetId || !date.trim()) return;
    setSaving(true);
    const entry = addAppointment(activePetId, date.trim(), note.trim());
    try {
      await insertAppointment(activePetId, entry);
    } catch {
      // local entry still shows; same offline-first pattern as feeding logs
    }
    setSaving(false);
    router.back();
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Add appointment</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={16} color={colors.ink} />
        </Pressable>
      </View>

      <Text style={styles.label}>Date</Text>
      <TextInput value={date} onChangeText={setDate} placeholder="e.g. 2026-09-15" placeholderTextColor={colors.outlineVariant} style={styles.input} />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput value={note} onChangeText={setNote} placeholder="e.g. Annual checkup + booster" placeholderTextColor={colors.outlineVariant} style={styles.input} />

      <View style={{ flex: 1, minHeight: 20 }} />
      <PrimaryButton label={saving ? "Saving…" : "Save appointment"} disabled={!date.trim() || saving} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.appBg, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  closeBtn: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 2, borderColor: colors.ink, padding: 6 },
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink, marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, backgroundColor: colors.surface,
    paddingVertical: 13, paddingHorizontal: 16, fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginBottom: 16,
  },
});
