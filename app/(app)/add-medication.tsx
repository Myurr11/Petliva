import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { X } from "@/components/icons";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { insertMedication } from "@/lib/supabase";

export default function AddMedication() {
  const activePetId = useAppStore((s) => s.activePetId);
  const addMedication = useAppStore((s) => s.addMedication);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [schedule, setSchedule] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!activePetId || !name.trim()) return;
    setSaving(true);
    const entry = addMedication(activePetId, name.trim(), dosage.trim(), schedule.trim());
    try {
      await insertMedication(activePetId, entry);
    } catch {
      // local entry still shows; same offline-first pattern as feeding logs
    }
    setSaving(false);
    router.back();
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Add medication</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={16} color={colors.ink} />
        </Pressable>
      </View>

      <Text style={styles.label}>Medication name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="e.g. Amoxicillin" placeholderTextColor={colors.outlineVariant} style={styles.input} />

      <Text style={styles.label}>Dosage</Text>
      <TextInput value={dosage} onChangeText={setDosage} placeholder="e.g. 50mg" placeholderTextColor={colors.outlineVariant} style={styles.input} />

      <Text style={styles.label}>Schedule</Text>
      <TextInput value={schedule} onChangeText={setSchedule} placeholder="e.g. Twice daily with food" placeholderTextColor={colors.outlineVariant} style={styles.input} />

      <View style={{ flex: 1, minHeight: 20 }} />
      <PrimaryButton label={saving ? "Saving…" : "Save medication"} disabled={!name.trim() || saving} onPress={save} />
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
