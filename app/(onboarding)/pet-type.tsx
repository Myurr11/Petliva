import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Cat, Dog } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { TextField } from "@/components/ui/TextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import type { PetType } from "@/types";

export default function PetTypeStep() {
  const pet = useAppStore((s) => s.pet);
  const setPet = useAppStore((s) => s.setPet);

  const select = (type: PetType) => setPet({ type, breed: "" });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgressDots step={2} total={7} />
      <ScreenTitle
        eyebrow="Step 2 of 7"
        title="Who are we feeding?"
        sub="We'll tailor breed lists, vaccines and portion guidance to the species."
      />
      <TextField
        label="Pet's name"
        placeholder="e.g. Shreya"
        value={pet.name}
        onChangeText={(v) => setPet({ name: v })}
      />
      <View style={styles.row}>
        {[
          { v: "cat" as const, Icon: Cat, label: "Cat" },
          { v: "dog" as const, Icon: Dog, label: "Dog" },
        ].map(({ v, Icon, label }) => {
          const active = pet.type === v;
          return (
            <Pressable
              key={v}
              onPress={() => select(v)}
              style={[styles.typeCard, { borderColor: active ? colors.amber : colors.border, backgroundColor: active ? "#F5E6CE" : colors.surface }]}
            >
              <Icon size={28} color={active ? colors.amberDeep : colors.inkSoft} />
              <Text style={styles.typeLabel}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.spacer} />
      <PrimaryButton
        label="Continue"
        icon={ChevronRight}
        disabled={!pet.name || !pet.type}
        onPress={() => router.push("/(onboarding)/pet-breed")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1 },
  row: { flexDirection: "row", gap: 12, marginBottom: 24 },
  typeCard: {
    flex: 1, paddingVertical: 22, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1.5,
    alignItems: "center", gap: 8,
  },
  typeLabel: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  spacer: { flex: 1, minHeight: 12 },
});
