import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Cat, Dog, Plus, Check, Syringe, FileText, LogOut, User } from "@/components/icons";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const user = useAppStore((s) => s.user);
  const pets = useAppStore((s) => s.pets);
  const activePetId = useAppStore((s) => s.activePetId);
  const setActivePet = useAppStore((s) => s.setActivePet);
  const startAddPet = useAppStore((s) => s.startAddPet);
  const resetAll = useAppStore((s) => s.resetAll);

  const petList = Object.values(pets);
  const active = activePetId ? pets[activePetId] : undefined;

  function goAddPet() {
    startAddPet();
    router.push("/(onboarding)/pet-type");
  }

  function confirmSignOut() {
    Alert.alert("Sign out?", "You can always log back in — nothing is deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          resetAll();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  }

  const vaccineEntries = active ? Object.entries(active.pet.vaccinations).filter(([, done]) => done) : [];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <User size={20} color={colors.onInk} />
          </View>
          <View>
            <Text style={styles.userName}>{user.name || "You"}</Text>
            {!!user.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>
        </View>

        <Text style={styles.sectionLabel}>YOUR PETS</Text>
        <View style={{ gap: 10, marginBottom: 20 }}>
          {petList.map((r) => {
            const isActive = r.id === activePetId;
            const Icon = r.pet.type === "dog" ? Dog : Cat;
            return (
              <Pressable
                key={r.id}
                onPress={() => setActivePet(r.id)}
                style={[styles.petRow, isActive && { borderColor: colors.amber, backgroundColor: "#F5E6CE" }]}
              >
                <View style={styles.petIconWrap}>
                  <Icon size={18} color={colors.inkSoft} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.petName}>{r.pet.name}</Text>
                  <Text style={styles.petMeta}>{r.pet.breed} · {r.pet.weightKg}kg</Text>
                </View>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Check size={12} color={colors.sage} />
                  </View>
                )}
              </Pressable>
            );
          })}
          <Pressable onPress={goAddPet} style={styles.addPetRow}>
            <Plus size={16} color={colors.inkSoft} />
            <Text style={styles.addPetLabel}>Add another pet</Text>
          </Pressable>
        </View>

        {active && (
          <>
            <Text style={styles.sectionLabel}>{active.pet.name.toUpperCase()}'S HEALTH</Text>
            <View style={styles.healthCard}>
              <View style={styles.healthRow}>
                <Syringe size={16} color={colors.inkSoft} />
                <Text style={styles.healthLabel}>Vaccinations</Text>
              </View>
              {vaccineEntries.length > 0 ? (
                <View style={styles.chipWrap}>
                  {vaccineEntries.map(([name]) => (
                    <View key={name} style={styles.vaccineChip}>
                      <Check size={11} color={colors.sage} />
                      <Text style={styles.vaccineChipText}>{name}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.healthEmpty}>None marked complete yet</Text>
              )}

              <View style={[styles.healthRow, { marginTop: 16 }]}>
                <FileText size={16} color={colors.inkSoft} />
                <Text style={styles.healthLabel}>Medical history</Text>
              </View>
              {active.pet.medicalTags.length > 0 ? (
                <View style={styles.chipWrap}>
                  {active.pet.medicalTags.map((t) => (
                    <View key={t} style={styles.medicalChip}>
                      <Text style={styles.medicalChipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.healthEmpty}>Nothing on file</Text>
              )}
              {!!active.pet.medicalNotes && <Text style={styles.medicalNotes}>{active.pet.medicalNotes}</Text>}
            </View>
          </>
        )}

        <Pressable style={styles.signOutBtn} onPress={confirmSignOut}>
          <LogOut size={16} color={colors.rose} />
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 20 },
  userCard: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  userAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  userName: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.ink },
  userEmail: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 1 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 12.5, fontWeight: "600", color: colors.inkSoft, letterSpacing: 0.5, marginBottom: 10 },
  petRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  petIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  petName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  petMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 1 },
  activeBadge: { width: 22, height: 22, borderRadius: 999, backgroundColor: "#EAF0E9", alignItems: "center", justifyContent: "center" },
  addPetRow: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.border, borderStyle: "dashed", justifyContent: "center",
  },
  addPetLabel: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.inkSoft },
  healthCard: { backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: 16, marginBottom: 24 },
  healthRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  healthLabel: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  healthEmpty: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 6 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  vaccineChip: {
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surface,
    borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border,
  },
  vaccineChipText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.ink },
  medicalChip: { backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border },
  medicalChipText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.ink },
  medicalNotes: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 10, lineHeight: 17 },
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#F0DAD6",
  },
  signOutLabel: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.rose },
});
