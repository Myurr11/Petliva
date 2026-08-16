import React from "react";
import { View, Image, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { TextField } from "@/components/ui/TextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { NeoOnboardHeader } from "@/components/ui/NeoOnboardHeader";
import { useAppStore } from "@/store/useAppStore";
import { colors } from "@/theme/tokens";

export default function PetAgeStep() {
  const pet = useAppStore((s) => s.pet);
  const setPet = useAppStore((s) => s.setPet);
  const age = Number(pet.ageYears);
  const validAge = pet.ageYears.trim() !== "" && Number.isFinite(age) && age >= 0;

  return (
    <View style={styles.screen}>
      <NeoOnboardHeader step={4} total={9} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Image
          source={require("../../assets/illustrations/age-birthday.png")}
          style={styles.heroIllustration}
          resizeMode="contain"
        />
        <ScreenTitle
          title={`How old is ${pet.name || "your pet"}?`}
          sub="Enter their age in years. Decimals are welcome for younger pets."
        />
        <TextField
          label="Age (years)"
          placeholder="e.g. 2 or 0.5"
          keyboardType="decimal-pad"
          value={pet.ageYears}
          onChangeText={(value) => setPet({ ageYears: value.replace(/[^0-9.]/g, "") })}
        />
        <View style={styles.spacer} />
        <PrimaryButton
          label="Continue"
          icon={ChevronRight}
          disabled={!validAge}
          onPress={() => router.push("/(onboarding)/pet-weight")}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, flexGrow: 1 },
  heroIllustration: { width: 150, height: 137, alignSelf: "center", marginBottom: 4 },
  spacer: { flex: 1, minHeight: 24 },
});
