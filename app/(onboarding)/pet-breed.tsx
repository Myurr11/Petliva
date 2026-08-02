import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { Chip } from "@/components/ui/Chip";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { useAppStore } from "@/store/useAppStore";
import { DOG_BREEDS, CAT_BREEDS } from "@/constants/data";
import { colors } from "@/theme/tokens";

export default function PetBreedStep() {
  const pet = useAppStore((s) => s.pet);
  const setPet = useAppStore((s) => s.setPet);
  const breeds = pet.type === "dog" ? DOG_BREEDS : CAT_BREEDS;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgressDots step={3} total={7} />
      <ScreenTitle
        eyebrow="Step 3 of 7"
        title={`What breed is ${pet.name || "your pet"}?`}
        sub={`Common ${pet.type === "dog" ? "dog" : "cat"} breeds — pick the closest match.`}
      />
      <View style={styles.wrap}>
        {breeds.map((b) => (
          <Chip key={b} label={b} active={pet.breed === b} onPress={() => setPet({ breed: b })} />
        ))}
      </View>
      <View style={styles.spacer} />
      <PrimaryButton
        label="Continue"
        icon={ChevronRight}
        disabled={!pet.breed}
        onPress={() => router.push("/(onboarding)/pet-weight")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  spacer: { flex: 1, minHeight: 24 },
});
