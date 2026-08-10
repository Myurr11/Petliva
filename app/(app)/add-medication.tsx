import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { X } from "@/components/icons";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { insertMedication } from "@/lib/supabase";

const DOSAGE_PRESETS = ["1 tablet", "0.5 tablet", "5 ml", "10 mg", "Custom"];
const SCHEDULE_PRESETS = ["Once daily", "Twice daily", "Every 8 hours", "With food", "Custom"];

export default function AddMedication() {
  const activePetId = useAppStore((s) => s.activePetId);
  const addMedication = useAppStore((s) => s.addMedication);

  const [name, setName] = useState("");
  const [selectedDosagePreset, setSelectedDosagePreset] = useState<string>("1 tablet");
  const [customDosage, setCustomDosage] = useState("");
  const [selectedSchedulePreset, setSelectedSchedulePreset] = useState<string>("Once daily");
  const [customSchedule, setCustomSchedule] = useState("");
  const [saving, setSaving] = useState(false);

  const finalDosage = selectedDosagePreset === "Custom" ? customDosage.trim() : selectedDosagePreset;
  const finalSchedule = selectedSchedulePreset === "Custom" ? customSchedule.trim() : selectedSchedulePreset;

  async function save() {
    if (!activePetId || !name.trim()) return;
    setSaving(true);
    const entry = addMedication(activePetId, name.trim(), finalDosage, finalSchedule);
    try {
      await insertMedication(activePetId, entry);
    } catch {
      // offline-first fallback
    }
    setSaving(false);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.sheet}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Add medication</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={16} color={colors.ink} />
        </Pressable>
      </View>

      {/* MEDICINE NAME */}
      <Text style={styles.label}>Medication name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Amoxicillin"
        placeholderTextColor={colors.outlineVariant}
        style={styles.input}
      />

      {/* DOSAGE */}
      <Text style={styles.label}>Dosage</Text>
      <View style={styles.chipRow}>
        {DOSAGE_PRESETS.map((preset) => {
          const isSelected = selectedDosagePreset === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => setSelectedDosagePreset(preset)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{preset}</Text>
            </Pressable>
          );
        })}
      </View>
      {selectedDosagePreset === "Custom" && (
        <TextInput
          value={customDosage}
          onChangeText={setCustomDosage}
          placeholder="Enter custom dosage (e.g. 2.5 ml)"
          placeholderTextColor={colors.outlineVariant}
          style={styles.input}
        />
      )}

      {/* SCHEDULE */}
      <Text style={styles.label}>Schedule</Text>
      <View style={styles.chipRow}>
        {SCHEDULE_PRESETS.map((preset) => {
          const isSelected = selectedSchedulePreset === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => setSelectedSchedulePreset(preset)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{preset}</Text>
            </Pressable>
          );
        })}
      </View>
      {selectedSchedulePreset === "Custom" && (
        <TextInput
          value={customSchedule}
          onChangeText={setCustomSchedule}
          placeholder="Enter custom schedule (e.g. Morning & Night)"
          placeholderTextColor={colors.outlineVariant}
          style={styles.input}
        />
      )}

      <View style={{ height: 16 }} />
      <PrimaryButton label={saving ? "Saving…" : "Save medication"} disabled={!name.trim() || saving} onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  sheet: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
  closeBtn: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 2, borderColor: colors.ink, padding: 6 },
  label: { fontFamily: fonts.labelBold, fontSize: 13.5, color: colors.ink, marginBottom: 8, marginTop: 10 },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface,
    paddingVertical: 12, paddingHorizontal: 16, fontFamily: fonts.body, fontSize: 14.5, color: colors.ink, marginBottom: 8,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.ink },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.inkSoft },
  chipTextSelected: { fontFamily: fonts.bodySemibold, color: colors.ink },
});
