import React from "react";
import { View, Image, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { AgeField } from "@/components/ui/AgeField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { NeoOnboardHeader } from "@/components/ui/NeoOnboardHeader";
import { useAppStore } from "@/store/useAppStore";
import { colors } from "@/theme/tokens";

export default function PetAgeStep() {
  const pet = useAppStore((s) => s.pet);
  const setPet = useAppStore((s) => s.setPet);
  const validAge = pet.ageYears.trim() !== "";

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
          sub="Roughly is fine — years and months, however close you can get."
        />
        <AgeField
          label="Age"
          years={pet.ageYears}
          months={pet.ageMonths}
          onChange={(years, months) => setPet({ ageYears: years, ageMonths: months })}
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
