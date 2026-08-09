import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Syringe, Check } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { NeoOnboardHeader } from "@/components/ui/NeoOnboardHeader";
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
    <View style={styles.screen}>
      <NeoOnboardHeader step={5} total={8} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle title="Vaccination status" sub="Mark what's completed. You can add dates and boosters later from the Vet tab." />
        <View style={styles.list}>
          {core.map((v) => {
            const done = !!pet.vaccinations[v];
            return (
              <Pressable
                key={v}
                onPress={() => toggle(v)}
                style={[styles.item, { backgroundColor: done ? colors.sageBg : colors.surface }]}
              >
                <View style={styles.itemLeft}>
                  <Syringe size={16} color={colors.ink} />
                  <Text style={styles.itemLabel}>{v}</Text>
                </View>
                <View style={[styles.checkbox, { backgroundColor: done ? colors.sage : colors.surface }]}>
                  {done ? <Check size={14} color="#fff" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.spacer} />
        <PrimaryButton label="Continue" icon={ChevronRight} onPress={() => router.push("/(onboarding)/medical")} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, flexGrow: 1 },
  list: { gap: 10 },
  item: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderColor: colors.ink,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemLabel: { fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.ink },
  checkbox: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.ink },
  spacer: { flex: 1, minHeight: 20 },
});
