import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Stethoscope, Calendar, Pill } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { DateField } from "@/components/ui/DateField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { NeoOnboardHeader } from "@/components/ui/NeoOnboardHeader";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";

const FREQUENCIES = ["Every 3 months", "Every 6 months", "Yearly", "As needed"];

export default function VetCareStep() {
  const pet = useAppStore((s) => s.pet);
  const vetDraft = useAppStore((s) => s.vetDraft);
  const setVetDraft = useAppStore((s) => s.setVetDraft);

  const [nextDate, setNextDate] = useState("");
  const [nextNote, setNextNote] = useState("");
  const [onMeds, setOnMeds] = useState<"no" | "yes" | null>(null);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medSchedule, setMedSchedule] = useState("");

  function finish() {
    const appointments =
      nextDate.trim().length > 0
        ? [{ id: String(Date.now()), date: nextDate.trim(), note: nextNote.trim(), completed: false }]
        : [];
    const medications =
      onMeds === "yes" && medName.trim().length > 0
        ? [{ id: String(Date.now()), name: medName.trim(), dosage: medDosage.trim(), schedule: medSchedule.trim() }]
        : [];
    setVetDraft({ appointments, medications });
    router.push("/(onboarding)/food-plan");
  }

  return (
    <View style={styles.screen}>
      <NeoOnboardHeader step={7} total={8} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle title="Vet care" sub="This powers appointment and medication reminders — skip anything you don't know yet." />

        <View style={styles.rowLabel}>
          <Stethoscope size={15} color={colors.ink} />
          <Text style={styles.label}>How often do you visit the vet?</Text>
        </View>
        <View style={styles.wrap}>
          {FREQUENCIES.map((f) => (
            <Chip key={f} label={f} active={vetDraft.visitFrequency === f} onPress={() => setVetDraft({ visitFrequency: f })} />
          ))}
        </View>

        <View style={[styles.rowLabel, { marginTop: 22 }]}>
          <Calendar size={15} color={colors.ink} />
          <Text style={styles.label}>Upcoming appointment? (optional)</Text>
        </View>
        <DateField label="Date" value={nextDate} onChange={setNextDate} placeholder="Pick a date (optional)" />
        <TextField label="Note" placeholder="e.g. Annual checkup + booster" value={nextNote} onChangeText={setNextNote} />

        <View style={[styles.rowLabel, { marginTop: 4 }]}>
          <Pill size={15} color={colors.ink} />
          <Text style={styles.label}>Is {pet.name || "your pet"} on any medication?</Text>
        </View>
        <View style={styles.wrap}>
          <Chip label="No" active={onMeds === "no"} onPress={() => setOnMeds("no")} />
          <Chip label="Yes" active={onMeds === "yes"} onPress={() => setOnMeds("yes")} />
        </View>

        {onMeds === "yes" && (
          <View style={{ marginTop: 16 }}>
            <TextField label="Medication name" placeholder="e.g. Amoxicillin" value={medName} onChangeText={setMedName} />
            <TextField label="Dosage" placeholder="e.g. 50mg" value={medDosage} onChangeText={setMedDosage} />
            <TextField label="Schedule" placeholder="e.g. Twice daily with food" value={medSchedule} onChangeText={setMedSchedule} />
            <Text style={styles.hint}>You can add more medications later from the Vet tab.</Text>
          </View>
        )}

        <View style={styles.spacer} />
        <PrimaryButton label="Continue" icon={ChevronRight} onPress={finish} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, flexGrow: 1 },
  rowLabel: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  hint: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: -6 },
  spacer: { flex: 1, minHeight: 20 },
});
