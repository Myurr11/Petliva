import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Cat, Dog, Plus, User } from "@/components/icons";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";

/** Pet-switcher chip row + profile icon, shown at the top of every tab so
 *  each screen is always scoped to a specific pet and account access is
 *  never more than one tap away. */
export function PetSwitcherHeader() {
  const pets = useAppStore((s) => s.pets);
  const activePetId = useAppStore((s) => s.activePetId);
  const setActivePet = useAppStore((s) => s.setActivePet);
  const startAddPet = useAppStore((s) => s.startAddPet);

  const petList = Object.values(pets);

  function goAddPet() {
    startAddPet();
    router.push("/(onboarding)/pet-type");
  }

  return (
    <View style={styles.row}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}>
        {petList.map((r) => {
          const isActive = r.id === activePetId;
          const Icon = r.pet.type === "dog" ? Dog : Cat;
          return (
            <Pressable
              key={r.id}
              onPress={() => setActivePet(r.id)}
              style={[styles.chip, { backgroundColor: isActive ? colors.accent : colors.surface }]}
            >
              <Icon size={13} color={colors.ink} />
              <Text style={styles.chipLabel}>{r.pet.name}</Text>
            </Pressable>
          );
        })}
        <Pressable onPress={goAddPet} style={styles.chip}>
          <Plus size={13} color={colors.ink} />
        </Pressable>
      </ScrollView>
      <Pressable onPress={() => router.push("/(app)/profile")} style={styles.profileBtn}>
        <User size={18} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface,
  },
  chipLabel: { fontFamily: fonts.labelBold, fontSize: 12.5, color: colors.ink },
  profileBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center",
  },
});
