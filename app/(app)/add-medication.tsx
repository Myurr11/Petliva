import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "@/components/icons";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { DateField } from "@/components/ui/DateField";
import { toISODate } from "@/components/ui/CalendarGrid";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { insertMedication, updateMedication as updateRemoteMedication } from "@/lib/supabase";
import { safeBack } from "@/lib/navigation";

const DOSAGE_PRESETS = ["1 tablet", "0.5 tablet", "5 ml", "10 mg", "Custom"];
const SCHEDULE_PRESETS = ["Once daily", "Twice daily", "Every 8 hours", "With food", "Custom"];
const DURATION_PRESETS = ["3", "5", "7", "10", "14", "Custom"];

export default function AddMedication() {
  const params = useLocalSearchParams<{ medicationId?: string; appointmentId?: string }>();
  const activePetId = useAppStore((s) => s.activePetId);
  const medication = useAppStore((s) => activePetId && params.medicationId ? s.pets[activePetId]?.vet.medications.find((m) => m.id === params.medicationId) : undefined);
  const forAppointment = useAppStore((s) =>
    activePetId && params.appointmentId ? s.pets[activePetId]?.vet.appointments.find((a) => a.id === params.appointmentId) : undefined
  );
  const addMedication = useAppStore((s) => s.addMedication);
  const updateMedication = useAppStore((s) => s.updateMedication);
  const syncMedicationId = useAppStore((s) => s.syncMedicationId);

  const dosageIsPreset = DOSAGE_PRESETS.slice(0, -1).includes(medication?.dosage ?? "");
  const scheduleIsPreset = SCHEDULE_PRESETS.slice(0, -1).includes(medication?.schedule ?? "");
  const savedDuration = medication?.durationDays ? String(medication.durationDays) : "7";
  const durationIsPreset = DURATION_PRESETS.slice(0, -1).includes(savedDuration);
  const [name, setName] = useState(medication?.name ?? "");
  const [selectedDosagePreset, setSelectedDosagePreset] = useState<string>(dosageIsPreset ? medication!.dosage : "Custom");
  const [customDosage, setCustomDosage] = useState(dosageIsPreset ? "" : medication?.dosage ?? "");
  const [selectedSchedulePreset, setSelectedSchedulePreset] = useState<string>(scheduleIsPreset ? medication!.schedule : "Custom");
  const [customSchedule, setCustomSchedule] = useState(scheduleIsPreset ? "" : medication?.schedule ?? "");
  const [startDate, setStartDate] = useState(medication?.startDate ?? toISODate(new Date()));
  const [durationPreset, setDurationPreset] = useState<string>(durationIsPreset ? savedDuration : "Custom");
  const [customDuration, setCustomDuration] = useState(durationIsPreset ? "" : savedDuration);
  const [saving, setSaving] = useState(false);

  const finalDosage = selectedDosagePreset === "Custom" ? customDosage.trim() : selectedDosagePreset;
  const finalSchedule = selectedSchedulePreset === "Custom" ? customSchedule.trim() : selectedSchedulePreset;
  const finalDurationDays = durationPreset === "Custom" ? Number(customDuration) : Number(durationPreset);

  async function save() {
    if (!activePetId || !name.trim() || !startDate || !finalDurationDays) return;
    setSaving(true);
    if (medication) {
      const patch = { name: name.trim(), dosage: finalDosage, schedule: finalSchedule, startDate, durationDays: finalDurationDays };
      updateMedication(activePetId, medication.id, patch);
      try {
        await updateRemoteMedication({ ...medication, ...patch });
      } catch {
        // The local edit is retained while the device is offline.
      }
      setSaving(false);
      safeBack("/(app)/(tabs)/vet");
      return;
    }
    const entry = addMedication(activePetId, name.trim(), finalDosage, finalSchedule, startDate, finalDurationDays, params.appointmentId);
    try {
      const remoteId = await insertMedication(activePetId, entry);
      syncMedicationId(activePetId, entry.id, remoteId);
    } catch {
      // offline-first fallback — entry stays with its local id
    }
    setSaving(false);
    safeBack("/(app)/(tabs)/vet");
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.sheet}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{medication ? "Edit medication" : "Add medication"}</Text>
        <Pressable onPress={() => safeBack("/(app)/(tabs)/vet")} style={styles.closeBtn}>
          <X size={16} color={colors.ink} />
        </Pressable>
      </View>

      {!!forAppointment && (
        <Text style={styles.forAppointment}>
          Prescribed at the {new Date(forAppointment.date + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric" })} visit
          {forAppointment.hospitalName ? ` · ${forAppointment.hospitalName}` : ""}
        </Text>
      )}

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

      {/* DURATION */}
      <DateField label="Start date" value={startDate} onChange={setStartDate} />
      <Text style={styles.label}>For how many days?</Text>
      <View style={styles.chipRow}>
        {DURATION_PRESETS.map((preset) => {
          const isSelected = durationPreset === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => setDurationPreset(preset)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {preset === "Custom" ? "Custom" : `${preset} days`}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {durationPreset === "Custom" && (
        <TextInput
          value={customDuration}
          onChangeText={setCustomDuration}
          placeholder="Number of days (e.g. 4)"
          keyboardType="number-pad"
          placeholderTextColor={colors.outlineVariant}
          style={styles.input}
        />
      )}
      {startDate && finalDurationDays > 0 && (
        <Text style={styles.durationHint}>
          Runs {new Date(startDate + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric" })} through{" "}
          {(() => {
            const end = new Date(startDate + "T00:00:00");
            end.setDate(end.getDate() + finalDurationDays - 1);
            return end.toLocaleDateString([], { month: "short", day: "numeric" });
          })()}
        </Text>
      )}

      <View style={{ height: 16 }} />
      <PrimaryButton
        label={saving ? "Saving…" : medication ? "Save changes" : "Save medication"}
        disabled={!name.trim() || !startDate || !finalDurationDays || saving}
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
  forAppointment: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.accentDeep, marginBottom: 14, marginTop: -6 },
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
  durationHint: { fontFamily: fonts.body, fontSize: 12, color: colors.accentDeep, marginTop: -2, marginBottom: 8 },
});
