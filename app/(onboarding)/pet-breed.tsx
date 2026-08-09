import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { NeoOnboardHeader } from "@/components/ui/NeoOnboardHeader";
import { useAppStore } from "@/store/useAppStore";
import { DOG_BREEDS, CAT_BREEDS } from "@/constants/data";
import { colors } from "@/theme/tokens";

export default function PetBreedStep() {
  const pet = useAppStore((s) => s.pet);
  const setPet = useAppStore((s) => s.setPet);
  const breeds = pet.type === "dog" ? DOG_BREEDS : CAT_BREEDS;

  return (
    <View style={styles.screen}>
      <NeoOnboardHeader step={3} total={8} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle
          title={`What breed is ${pet.name || "your pet"}?`}
          sub={`Common ${pet.type === "dog" ? "dog" : "cat"} breeds — pick the closest match.`}
        />
        <View style={styles.wrap}>
          {breeds.map((b) => (
            <Chip key={b} label={b} active={pet.breed === b} onPress={() => setPet({ breed: b })} />
          ))}
        </View>
        <View style={{ marginTop: 24 }}>
          <TextField
            label="Age (years, optional)"
            placeholder="e.g. 3"
            keyboardType="number-pad"
            value={pet.ageYears}
            onChangeText={(v) => setPet({ ageYears: v })}
          />
        </View>
        <View style={styles.spacer} />
        <PrimaryButton
          label="Continue"
          icon={ChevronRight}
          disabled={!pet.breed}
          onPress={() => router.push("/(onboarding)/pet-weight")}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, flexGrow: 1 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  spacer: { flex: 1, minHeight: 24 },
});
