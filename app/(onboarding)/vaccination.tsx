import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Syringe, Check } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { useAppStore } from "@/store/useAppStore";
import { CORE_VACCINES_CAT, CORE_VACCINES_DOG } from "@/constants/data";
import { colors, fonts } from "@/theme/tokens";

export default function VaccinationStep() {
  const pet = useAppStore((s) => s.pet);
  const setPet = useAppStore((s) => s.setPet);
  const core = pet.type === "dog" ? CORE_VACCINES_DOG : CORE_VACCINES_CAT;

  const toggle = (name: string) =>
    setPet({ vaccinations: { ...pet.vaccinations, [name]: !pet.vaccinations[name] } });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgressDots step={5} total={7} />
      <ScreenTitle
        eyebrow="Step 5 of 7"
        title="Vaccination status"
        sub="Mark what's completed. You can add dates and boosters later from the pet profile."
      />
      <View style={styles.list}>
        {core.map((v) => {
          const done = !!pet.vaccinations[v];
          return (
            <Pressable
              key={v}
              onPress={() => toggle(v)}
              style={[styles.item, { borderColor: done ? colors.sage : colors.border, backgroundColor: done ? "#EAF0E9" : colors.surface }]}
            >
              <View style={styles.itemLeft}>
                <Syringe size={16} color={colors.inkSoft} />
                <Text style={styles.itemLabel}>{v}</Text>
              </View>
              <View style={[styles.checkbox, { backgroundColor: done ? colors.sage : colors.track }]}>
                {done ? <Check size={14} color="#fff" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.spacer} />
      <PrimaryButton label="Continue" icon={ChevronRight} onPress={() => router.push("/(onboarding)/medical")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1 },
  list: { gap: 10 },
  item: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemLabel: { fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.ink },
  checkbox: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  spacer: { flex: 1, minHeight: 20 },
});
