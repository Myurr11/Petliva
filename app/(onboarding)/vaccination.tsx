import React, { useState } from "react";
import { View, Text, TextInput, Image, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Syringe, Check, Plus, X } from "@/components/icons";
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
  const [customName, setCustomName] = useState("");

  // Any vaccination key the user has recorded that isn't one of the preset
  // core ones — e.g. something their vet already gave that isn't in our
  // default list. Deriving this from `pet.vaccinations` (rather than local
  // state) means it survives navigating back to this step.
  const customVaccines = Object.keys(pet.vaccinations).filter((v) => !core.includes(v));

  const toggle = (name: string) =>
    setPet({ vaccinations: { ...pet.vaccinations, [name]: !pet.vaccinations[name] } });

  function addCustom() {
    const name = customName.trim();
    if (!name || pet.vaccinations[name] !== undefined) return;
    setPet({ vaccinations: { ...pet.vaccinations, [name]: true } });
    setCustomName("");
  }

  function removeCustom(name: string) {
    const rest = { ...pet.vaccinations };
    delete rest[name];
    setPet({ vaccinations: rest });
  }

  return (
    <View style={styles.screen}>
      <NeoOnboardHeader step={6} total={9} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Image
          source={require("../../assets/illustrations/vaccine-shield.png")}
          style={styles.heroIllustration}
          resizeMode="contain"
        />
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

          {customVaccines.map((v) => {
            const done = !!pet.vaccinations[v];
            return (
              <View key={v} style={[styles.item, { backgroundColor: done ? colors.sageBg : colors.surface }]}>
                <Pressable onPress={() => toggle(v)} style={styles.itemLeft}>
                  <Syringe size={16} color={colors.ink} />
                  <Text style={styles.itemLabel} numberOfLines={1}>{v}</Text>
                </Pressable>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Pressable onPress={() => toggle(v)} style={[styles.checkbox, { backgroundColor: done ? colors.sage : colors.surface }]}>
                    {done ? <Check size={14} color="#fff" /> : null}
                  </Pressable>
                  <Pressable onPress={() => removeCustom(v)} hitSlop={8}>
                    <X size={14} color={colors.inkSoft} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.addLabel}>Already given something else?</Text>
        <View style={styles.addRow}>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="e.g. Deworming, Chlamydia"
            placeholderTextColor={colors.outlineVariant}
            style={styles.addInput}
            onSubmitEditing={addCustom}
            returnKeyType="done"
          />
          <Pressable onPress={addCustom} disabled={!customName.trim()} style={[styles.addBtn, !customName.trim() && { opacity: 0.4 }]}>
            <Plus size={16} color={colors.ink} />
          </Pressable>
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
  heroIllustration: { width: 132, height: 110, alignSelf: "center", marginBottom: 4 },
  list: { gap: 10 },
  item: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderColor: colors.ink,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  itemLabel: { fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.ink, flexShrink: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.ink },
  addLabel: { fontFamily: fonts.labelBold, fontSize: 13, color: colors.ink, marginTop: 20, marginBottom: 8 },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface,
    fontFamily: fonts.body, fontSize: 14, color: colors.ink,
  },
  addBtn: {
    width: 44, alignItems: "center", justifyContent: "center", borderRadius: 10,
    borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.accent,
  },
  spacer: { flex: 1, minHeight: 20 },
});
