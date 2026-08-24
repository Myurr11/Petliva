import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Cat, Dog, Plus, Check, Syringe, FileText, LogOut, User, ChevronLeft, Stethoscope } from "@/components/icons";
import { NeoBox } from "@/components/ui/NeoBox";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { supabase } from "@/lib/supabase";
import { cancelAllNotifications } from "@/lib/notifications";
import { safeBack } from "@/lib/navigation";

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
          await cancelAllNotifications();
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
        <View style={styles.topRow}>
          <Pressable onPress={() => safeBack("/(app)/(tabs)/home")} style={styles.backBtn}>
            <ChevronLeft size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.userCard}>
          <NeoBox depth={3} radius={12} style={styles.userAvatar}>
            <User size={20} color={colors.ink} />
          </NeoBox>
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
              <Pressable key={r.id} onPress={() => setActivePet(r.id)}>
                <NeoBox depth={isActive ? 3 : 0} radius={14} style={[styles.petRow, { backgroundColor: isActive ? colors.accent : colors.surface }]}>
                  <View style={styles.petIconWrap}>
                    <Icon size={18} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.petName}>{r.pet.name}</Text>
                    <Text style={styles.petMeta}>{r.pet.breed} · {r.pet.weightKg}kg</Text>
                  </View>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Check size={12} color={colors.ink} />
                    </View>
                  )}
                </NeoBox>
              </Pressable>
            );
          })}
          <Pressable onPress={goAddPet} style={styles.addPetRow}>
            <Plus size={16} color={colors.ink} />
            <Text style={styles.addPetLabel}>Add another pet</Text>
          </Pressable>
        </View>

        {active && (
          <>
            <Text style={styles.sectionLabel}>{active.pet.name.toUpperCase()}'S HEALTH</Text>
            <NeoBox depth={3} radius={16} style={styles.healthCard}>
              <View style={styles.healthRow}>
                <Syringe size={16} color={colors.ink} />
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
                <FileText size={16} color={colors.ink} />
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
              <Pressable onPress={() => router.push("/(app)/(tabs)/vet")} style={styles.vetLink}>
                <Stethoscope size={14} color={colors.accentDeep} />
                <Text style={styles.vetLinkText}>See vet visits & medications →</Text>
              </Pressable>
            </NeoBox>
          </>
        )}

        <Pressable onPress={confirmSignOut}>
          <NeoBox depth={3} radius={14} style={styles.signOutBtn}>
            <LogOut size={16} color={colors.rose} />
            <Text style={styles.signOutLabel}>Sign out</Text>
          </NeoBox>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  userCard: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  userAvatar: { width: 44, height: 44, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  userName: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.ink },
  userEmail: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 1 },
  sectionLabel: { fontFamily: fonts.labelBold, fontSize: 12.5, color: colors.ink, letterSpacing: 0.5, marginBottom: 10 },
  petRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  petIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  petName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  petMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 1 },
  activeBadge: { width: 22, height: 22, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  addPetRow: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 14,
    borderWidth: 2, borderColor: colors.ink, borderStyle: "dashed", justifyContent: "center",
  },
  addPetLabel: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  healthCard: { padding: 16, marginBottom: 24 },
  healthRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  healthLabel: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  healthEmpty: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 6 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  vaccineChip: {
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceAlt,
    borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1.5, borderColor: colors.ink,
  },
  vaccineChipText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.ink },
  medicalChip: { backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1.5, borderColor: colors.ink },
  medicalChipText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.ink },
  medicalNotes: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 10, lineHeight: 17 },
  vetLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  vetLinkText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.accentDeep },
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 15, backgroundColor: colors.roseBg,
  },
  signOutLabel: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.rose },
});
