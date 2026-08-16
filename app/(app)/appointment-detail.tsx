import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Alert, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft, Edit3, Trash2, Calendar, Clock3, Stethoscope, FileText,
  Pill, Plus, X, Check, MoreVertical,
} from "@/components/icons";
import { NeoBox } from "@/components/ui/NeoBox";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { isAppointmentPast } from "@/lib/appointmentTime";
import { safeBack } from "@/lib/navigation";
import {
  deleteAppointment, updateAppointment as updateRemoteAppointment,
  updateMedicalTags, deleteMedication,
} from "@/lib/supabase";
import type { VetAppointment } from "@/types";

export default function AppointmentDetail() {
  const params = useLocalSearchParams<{ appointmentId: string }>();
  const activePetId = useAppStore((s) => s.activePetId);
  const petName = useAppStore((s) => (s.activePetId ? s.pets[s.activePetId]?.pet.name : undefined));
  const appointment = useAppStore((s) =>
    activePetId ? s.pets[activePetId]?.vet.appointments.find((a) => a.id === params.appointmentId) : undefined
  );
  const medications = useAppStore((s) =>
    activePetId ? s.pets[activePetId]?.vet.medications.filter((m) => m.appointmentId === params.appointmentId) ?? [] : []
  );
  const updateAppointment = useAppStore((s) => s.updateAppointment);
  const removeAppointment = useAppStore((s) => s.removeAppointment);
  const removeMedication = useAppStore((s) => s.removeMedication);
  const addMedicalTags = useAppStore((s) => s.addMedicalTags);

  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [notes, setNotes] = useState(appointment?.diagnosticNotes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);

  if (!activePetId || !appointment) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.content}>
          <Text style={styles.emptyText}>This appointment couldn't be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const past = isAppointmentPast(appointment.date, appointment.time);
  const statusLabel = appointment.completed ? "Completed" : past ? "Past" : "Upcoming";
  const diagnosis = appointment.diagnosis ?? [];

  async function persistAppointment(patch: Partial<Omit<VetAppointment, "id">>) {
    updateAppointment(activePetId!, appointment!.id, patch);
    try {
      await updateRemoteAppointment({ ...appointment!, ...patch });
    } catch {
      // local edit is retained while offline
    }
  }

  function addDiagnosisTag() {
    const tag = diagnosisInput.trim();
    if (!tag) return;
    const next = Array.from(new Set([...diagnosis, tag]));
    persistAppointment({ diagnosis: next });
    // Sync into the pet's overall profile so it shows up outside this visit too.
    addMedicalTags(activePetId!, [tag]);
    const mergedTags = useAppStore.getState().pets[activePetId!]?.pet.medicalTags ?? [];
    updateMedicalTags(activePetId!, mergedTags).catch(() => {
      // local tag is retained while offline
    });
    setDiagnosisInput("");
  }

  function removeDiagnosisTag(tag: string) {
    persistAppointment({ diagnosis: diagnosis.filter((t) => t !== tag) });
  }

  function saveNotes() {
    if (notes === (appointment!.diagnosticNotes ?? "")) return;
    persistAppointment({ diagnosticNotes: notes });
    setNotesDirty(false);
  }

  function toggleCompleted() {
    persistAppointment({ completed: !appointment!.completed });
  }

  function confirmDelete() {
    Alert.alert("Delete appointment?", "This removes the visit and its notes. Prescribed medications stay in your medication list.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          removeAppointment(activePetId!, appointment!.id);
          try {
            await deleteAppointment(appointment!.id);
          } catch {
            // best-effort remote delete, same pattern as elsewhere in the app
          }
          router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)/vet");
        },
      },
    ]);
  }

  function confirmDeleteMedication(id: string, name: string) {
    Alert.alert("Delete medication?", name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          removeMedication(activePetId!, id);
          try {
            await deleteMedication(id);
          } catch {
            // best-effort remote delete
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => safeBack("/(app)/(tabs)/vet")} style={styles.iconBtn}>
            <ChevronLeft size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>{petName ? `${petName}'s visit` : "Visit"}</Text>
          <Pressable
            onPress={() => router.push({ pathname: "/(app)/add-appointment", params: { appointmentId: appointment.id } })}
            style={styles.iconBtn}
          >
            <Edit3 size={17} color={colors.ink} />
          </Pressable>
        </View>

        <NeoBox depth={4} radius={20} style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <View style={styles.dateIconWrap}>
              <Calendar size={18} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryDate}>
                {new Date(appointment.date + "T00:00:00").toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
              </Text>
              {!!appointment.time && (
                <View style={styles.timeRow}>
                  <Clock3 size={12} color={colors.inkSoft} />
                  <Text style={styles.summaryTime}>{appointment.time}</Text>
                </View>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                appointment.completed && { backgroundColor: colors.sageBg },
                !appointment.completed && past && { backgroundColor: colors.track },
                !appointment.completed && !past && { backgroundColor: colors.accent },
              ]}
            >
              <Text style={styles.statusBadgeText}>{statusLabel}</Text>
            </View>
          </View>

          {(!!appointment.hospitalName || !!appointment.doctorName) && (
            <View style={styles.summaryRow}>
              <Stethoscope size={14} color={colors.inkSoft} />
              <Text style={styles.summaryMeta}>{[appointment.doctorName, appointment.hospitalName].filter(Boolean).join(" · ")}</Text>
            </View>
          )}

          {!!appointment.phoneNo && (
            <Pressable onPress={() => Linking.openURL(`tel:${appointment.phoneNo}`)} style={styles.summaryRow}>
              <Text style={styles.phoneLink}>📞 {appointment.phoneNo}</Text>
            </Pressable>
          )}

          {!!appointment.note && <Text style={styles.summaryNote}>{appointment.note}</Text>}

          <Pressable onPress={toggleCompleted} style={styles.completeToggle}>
            <View style={[styles.checkbox, appointment.completed && styles.checkboxDone]}>
              {appointment.completed && <Check size={12} color={colors.onAccent} />}
            </View>
            <Text style={styles.completeToggleLabel}>
              {appointment.completed ? "Marked as completed" : "Mark visit as completed"}
            </Text>
          </Pressable>
        </NeoBox>

        {/* DIAGNOSIS / CONDITIONS FOUND AT THIS VISIT */}
        <Text style={styles.sectionLabel}>DIAGNOSIS & CONDITIONS</Text>
        <NeoBox depth={3} radius={16} style={styles.sectionCard}>
          {diagnosis.length > 0 && (
            <View style={styles.tagWrap}>
              {diagnosis.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <Pressable onPress={() => removeDiagnosisTag(tag)} hitSlop={6}>
                    <X size={11} color={colors.inkSoft} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <View style={styles.inlineAddRow}>
            <TextInput
              value={diagnosisInput}
              onChangeText={setDiagnosisInput}
              placeholder="e.g. Ear infection"
              placeholderTextColor={colors.outlineVariant}
              style={styles.inlineInput}
              onSubmitEditing={addDiagnosisTag}
              returnKeyType="done"
            />
            <Pressable onPress={addDiagnosisTag} style={styles.inlineAddBtn}>
              <Plus size={16} color={colors.onAccent} />
            </Pressable>
          </View>
          <Text style={styles.sectionHint}>Added conditions also show on {petName || "your pet"}'s profile.</Text>
        </NeoBox>

        {/* DIAGNOSTIC NOTES / REPORT FINDINGS */}
        <Text style={styles.sectionLabel}>DIAGNOSTIC REPORT / NOTES</Text>
        <NeoBox depth={3} radius={16} style={styles.sectionCard}>
          <View style={styles.notesRow}>
            <FileText size={14} color={colors.inkSoft} />
            <Text style={styles.sectionHintInline}>Lab results, X-ray findings, vet's observations…</Text>
          </View>
          <TextInput
            value={notes}
            onChangeText={(v) => { setNotes(v); setNotesDirty(true); }}
            onBlur={saveNotes}
            placeholder="Type what the vet found or recommended…"
            placeholderTextColor={colors.outlineVariant}
            style={styles.notesInput}
            multiline
          />
          {notesDirty && (
            <Pressable onPress={saveNotes} style={styles.saveNotesBtn}>
              <Text style={styles.saveNotesLabel}>Save notes</Text>
            </Pressable>
          )}
        </NeoBox>

        {/* MEDICATIONS PRESCRIBED AT THIS VISIT */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>MEDICATIONS PRESCRIBED</Text>
          <Pressable
            onPress={() => router.push({ pathname: "/(app)/add-medication", params: { appointmentId: appointment.id } })}
            style={styles.addLink}
          >
            <Plus size={13} color={colors.accentDeep} />
            <Text style={styles.addLinkText}>Add</Text>
          </Pressable>
        </View>
        {medications.length === 0 ? (
          <View style={styles.noMedsCard}>
            <Text style={styles.noMedsText}>No medications logged for this visit yet.</Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginBottom: 8 }}>
            {medications.map((m) => (
              <View key={m.id} style={styles.medRow}>
                <View style={styles.medIconWrap}>
                  <Pill size={15} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{m.name}</Text>
                  {!!(m.dosage || m.schedule) && (
                    <Text style={styles.medDetail}>{[m.dosage, m.schedule].filter(Boolean).join(" · ")}</Text>
                  )}
                </View>
                <Pressable
                  onPress={() =>
                    Alert.alert(m.name, undefined, [
                      { text: "Edit", onPress: () => router.push({ pathname: "/(app)/add-medication", params: { medicationId: m.id } }) },
                      { text: "Delete", style: "destructive", onPress: () => confirmDeleteMedication(m.id, m.name) },
                      { text: "Cancel", style: "cancel" },
                    ])
                  }
                  style={styles.menuBtn}
                  hitSlop={8}
                >
                  <MoreVertical size={18} color={colors.inkSoft} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={confirmDelete} style={styles.deleteRow}>
          <Trash2 size={15} color={colors.rose} />
          <Text style={styles.deleteLabel}>Delete this appointment</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 8 },
  emptyText: { color: colors.inkSoft, fontSize: 13.5, textAlign: "center", fontFamily: fonts.body, marginTop: 40 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.ink, flex: 1, textAlign: "center", marginHorizontal: 8 },
  summaryCard: { padding: 18, marginBottom: 22 },
  summaryHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  dateIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceAlt, borderWidth: 1.5, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  summaryDate: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  summaryTime: { fontFamily: fonts.mono, fontSize: 12, color: colors.inkSoft },
  statusBadge: { borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink, paddingVertical: 4, paddingHorizontal: 10 },
  statusBadgeText: { fontFamily: fonts.labelBold, fontSize: 10.5, color: colors.ink },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  summaryMeta: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink, flexShrink: 1 },
  phoneLink: { fontFamily: fonts.mono, fontSize: 13, color: colors.accentDeep },
  summaryNote: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 10, lineHeight: 18 },
  completeToggle: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, paddingTop: 14, borderTopWidth: 1.5, borderTopColor: colors.track },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.ink, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  checkboxDone: { backgroundColor: colors.sage, borderColor: colors.ink },
  completeToggleLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  sectionLabel: { fontFamily: fonts.labelBold, fontSize: 12.5, color: colors.ink, letterSpacing: 0.5, marginBottom: 10 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  addLink: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 10 },
  addLinkText: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.accentDeep },
  sectionCard: { padding: 16, marginBottom: 22 },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.roseBg,
    borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink, paddingVertical: 5, paddingHorizontal: 10,
  },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  inlineAddRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  inlineInput: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surfaceAlt,
    paddingVertical: 10, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 13.5, color: colors.ink,
  },
  inlineAddBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.accent, borderWidth: 1.5, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  sectionHint: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft, marginTop: 10 },
  sectionHintInline: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, flexShrink: 1 },
  notesRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  notesInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surfaceAlt,
    paddingVertical: 10, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 13, color: colors.ink,
    minHeight: 90, textAlignVertical: "top",
  },
  saveNotesBtn: { alignSelf: "flex-end", marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.accent, borderWidth: 1.5, borderColor: colors.ink },
  saveNotesLabel: { fontFamily: fonts.labelBold, fontSize: 12, color: colors.onAccent },
  noMedsCard: {
    borderRadius: 14, borderWidth: 2, borderColor: colors.ink, borderStyle: "dashed",
    backgroundColor: colors.surfaceAlt, padding: 16, marginBottom: 22, alignItems: "center",
  },
  noMedsText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, textAlign: "center" },
  medRow: {
    flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink,
  },
  medIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  medName: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink },
  medDetail: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 1 },
  menuBtn: { padding: 4, marginRight: -4 },
  deleteRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, paddingVertical: 14 },
  deleteLabel: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.rose },
});
