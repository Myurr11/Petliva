import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { ChevronRight, FileText } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { Chip } from "@/components/ui/Chip";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgressDots step={6} total={7} />
      <ScreenTitle
        eyebrow="Step 6 of 7 · Optional"
        title="Any medical history?"
        sub="Skip this if nothing applies — you can always add it later."
      />
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
        placeholderTextColor={colors.inkSoft}
        value={pet.medicalNotes}
        onChangeText={(v) => setPet({ medicalNotes: v })}
        style={styles.textarea}
      />
      <View style={styles.spacer} />
      <PrimaryButton label="Continue" icon={ChevronRight} onPress={() => router.push("/(onboarding)/food-plan")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.inkSoft, marginBottom: 6 },
  textarea: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface,
    padding: 14, fontFamily: fonts.body, fontSize: 14, color: colors.ink, textAlignVertical: "top", minHeight: 84,
  },
  spacer: { flex: 1, minHeight: 20 },
});
