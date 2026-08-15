import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { X } from "@/components/icons";
import { DateField } from "@/components/ui/DateField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { insertAppointment, updateAppointment as updateRemoteAppointment } from "@/lib/supabase";

const TIME_PRESETS = ["09:00 AM", "10:30 AM", "02:00 PM", "04:30 PM", "Custom"];

export default function AddAppointment() {
  const params = useLocalSearchParams<{ date?: string; appointmentId?: string }>();
  const activePetId = useAppStore((s) => s.activePetId);
  const appointment = useAppStore((s) => activePetId && params.appointmentId ? s.pets[activePetId]?.vet.appointments.find((a) => a.id === params.appointmentId) : undefined);
  const addAppointment = useAppStore((s) => s.addAppointment);
  const updateAppointment = useAppStore((s) => s.updateAppointment);
  const syncAppointmentId = useAppStore((s) => s.syncAppointmentId);

  const savedTime = appointment?.time ?? "10:30 AM";
  const timeIsPreset = TIME_PRESETS.slice(0, -1).includes(savedTime);
  const [date, setDate] = useState(appointment?.date ?? params.date ?? "");
  const [selectedTimePreset, setSelectedTimePreset] = useState<string>(timeIsPreset ? savedTime : "Custom");
  const [customTime, setCustomTime] = useState(timeIsPreset ? "" : savedTime);
  const [hospitalName, setHospitalName] = useState(appointment?.hospitalName ?? "");
  const [doctorName, setDoctorName] = useState(appointment?.doctorName ?? "");
  const [phoneNo, setPhoneNo] = useState(appointment?.phoneNo ?? "");
  const [note, setNote] = useState(appointment?.note ?? "");
  const [saving, setSaving] = useState(false);

  const finalTime = selectedTimePreset === "Custom" ? customTime.trim() : selectedTimePreset;

  async function save() {
    if (!activePetId || !date.trim()) return;
    setSaving(true);
    if (appointment) {
      const patch = { date: date.trim(), note: note.trim(), time: finalTime, hospitalName: hospitalName.trim(), doctorName: doctorName.trim(), phoneNo: phoneNo.trim() };
      updateAppointment(activePetId, appointment.id, patch);
      try {
        await updateRemoteAppointment({ ...appointment, ...patch });
      } catch {
        // The local edit is retained while the device is offline.
      }
      setSaving(false);
      router.back();
      return;
    }
    const entry = addAppointment(activePetId, date.trim(), note.trim(), finalTime, hospitalName.trim(), doctorName.trim(), phoneNo.trim());
    try {
      const remoteId = await insertAppointment(activePetId, entry);
      // Swap the local temp id for the real one so a future delete can
      // actually find and remove this row in Supabase.
      syncAppointmentId(activePetId, entry.id, remoteId);
    } catch {
      // offline-first fallback — entry stays with its local id; it'll just
      // never sync to Supabase until the app supports a retry queue
    }
    setSaving(false);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.sheet}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{appointment ? "Edit vet appointment" : "Add vet appointment"}</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={16} color={colors.ink} />
        </Pressable>
      </View>

      <DateField label="Date" value={date} onChange={setDate} />

      {/* TIME SELECTION */}
      <Text style={styles.label}>Appointment Time</Text>
      <View style={styles.chipRow}>
        {TIME_PRESETS.map((preset) => {
          const isSelected = selectedTimePreset === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => setSelectedTimePreset(preset)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{preset}</Text>
            </Pressable>
          );
        })}
      </View>
      {selectedTimePreset === "Custom" && (
        <TextInput
          value={customTime}
          onChangeText={setCustomTime}
          placeholder="Enter time (e.g. 11:15 AM)"
          placeholderTextColor={colors.outlineVariant}
          style={styles.input}
        />
      )}

      {/* VET / HOSPITAL DETAILS */}
      <Text style={styles.label}>Hospital / Clinic Name</Text>
      <TextInput
        value={hospitalName}
        onChangeText={setHospitalName}
        placeholder="e.g. Valley Pet Hospital"
        placeholderTextColor={colors.outlineVariant}
        style={styles.input}
      />

      <Text style={styles.label}>Doctor / Vet Name</Text>
      <TextInput
        value={doctorName}
        onChangeText={setDoctorName}
        placeholder="e.g. Dr. Sarah Smith"
        placeholderTextColor={colors.outlineVariant}
        style={styles.input}
      />

      <Text style={styles.label}>Vet Phone Number (optional)</Text>
      <TextInput
        value={phoneNo}
        onChangeText={setPhoneNo}
        placeholder="e.g. +1 555-0192"
        placeholderTextColor={colors.outlineVariant}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Annual checkup + vaccinations"
        placeholderTextColor={colors.outlineVariant}
        style={styles.input}
      />

      <View style={{ height: 16 }} />
      <PrimaryButton
        label={saving ? "Saving…" : appointment ? "Save changes" : "Save appointment"}
        disabled={!date.trim() || saving}
        onPress={save}
      />
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
