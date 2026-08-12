import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { ChevronRight, FileText } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { Chip } from "@/components/ui/Chip";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { NeoOnboardHeader } from "@/components/ui/NeoOnboardHeader";
import { useAppStore } from "@/store/useAppStore";
import { MEDICAL_TAGS } from "@/constants/data";
import { colors, fonts } from "@/theme/tokens";

export default function MedicalStep() {
  const pet = useAppStore((s) => s.pet);
  const setPet = useAppStore((s) => s.setPet);

  const toggleTag = (t: string) =>
    setPet({
      medicalTags: pet.medicalTags.includes(t)
        ? pet.medicalTags.filter((x) => x !== t)
        : [...pet.medicalTags, t],
    });

  return (
    <View style={styles.screen}>
      <NeoOnboardHeader step={6} total={8} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle title="Any medical history?" sub="Optional — skip this if nothing applies. You can always add it later." />
        <View style={styles.wrap}>
          {MEDICAL_TAGS.map((t) => (
            <Chip key={t} label={t} icon={FileText} active={pet.medicalTags.includes(t)} onPress={() => toggleTag(t)} />
          ))}
        </View>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          multiline
          numberOfLines={3}
          placeholder="e.g. sensitive stomach, avoid chicken-based food"
          placeholderTextColor={colors.outlineVariant}
          value={pet.medicalNotes}
          onChangeText={(v) => setPet({ medicalNotes: v })}
          style={styles.textarea}
        />
        <View style={styles.spacer} />
        <PrimaryButton label="Continue" icon={ChevronRight} onPress={() => router.push("/(onboarding)/vet-care")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg, paddingTop: 38 },
  content: { paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink, marginBottom: 8 },
  textarea: {
    borderWidth: 2, borderColor: colors.ink, borderRadius: 8, backgroundColor: colors.surface,
    padding: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink, textAlignVertical: "top", minHeight: 84,
  },
  spacer: { flex: 1, minHeight: 20 },
});
