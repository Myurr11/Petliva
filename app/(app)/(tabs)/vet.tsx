import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Syringe, Check, Calendar, Pill, Plus, Dog, Cat, CalendarPlus } from "@/components/icons";
import { PetSwitcherHeader } from "@/components/ui/PetSwitcherHeader";
import { NeoBox } from "@/components/ui/NeoBox";
import { useAppStore } from "@/store/useAppStore";
import { CORE_VACCINES_CAT, CORE_VACCINES_DOG } from "@/constants/data";
import { colors, fonts } from "@/theme/tokens";

function isPast(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export default function Vet() {
  const record = useAppStore((s) => (s.activePetId ? s.pets[s.activePetId] : undefined));
  const activePetId = useAppStore((s) => s.activePetId);

  if (!record || !activePetId) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.content}>
          <PetSwitcherHeader />
          <Text style={styles.emptyText}>No pet selected yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const core = record.pet.type === "dog" ? CORE_VACCINES_DOG : CORE_VACCINES_CAT;
  const PetIcon = record.pet.type === "dog" ? Dog : Cat;
  const upcoming = record.vet.appointments
    .filter((a) => !a.completed && !isPast(a.date))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const past = record.vet.appointments
    .filter((a) => a.completed || isPast(a.date))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PetSwitcherHeader />

        {/* Pet card */}
        <NeoBox depth={4} radius={20} style={styles.petCard}>
          <View style={styles.petCardHeader}>
            <View style={styles.petAvatar}>
              <PetIcon size={26} color={colors.ink} />
            </View>
            <View>
              <Text style={styles.petName}>{record.pet.name}</Text>
              <Text style={styles.petType}>{record.pet.type === "dog" ? "Dog" : "Cat"}</Text>
            </View>
          </View>
          <View style={styles.petStatsRow}>
            <PetStat label="Breed" value={record.pet.breed || "—"} />
            <View style={styles.statDivider} />
            <PetStat label="Age" value={record.pet.ageYears ? `${record.pet.ageYears} yr` : "—"} />
            <View style={styles.statDivider} />
            <PetStat label="Weight" value={record.pet.weightKg ? `${record.pet.weightKg} kg` : "—"} />
          </View>
        </NeoBox>

        {/* Upcoming appointments */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>UPCOMING APPOINTMENTS</Text>
          <Pressable onPress={() => router.push("/(app)/add-appointment")} style={styles.addLink}>
            <Plus size={13} color={colors.accentDeep} />
            <Text style={styles.addLinkText}>Add</Text>
          </Pressable>
        </View>

        {upcoming.length === 0 ? (
          <Pressable onPress={() => router.push("/(app)/add-appointment")}>
            <View style={styles.noApptCard}>
              <View style={styles.noApptIconWrap}>
                <CalendarPlus size={22} color={colors.inkSoft} />
              </View>
              <Text style={styles.noApptTitle}>Nothing scheduled</Text>
              <Text style={styles.noApptSub}>Tap to add {record.pet.name}'s next vet visit</Text>
            </View>
          </Pressable>
        ) : (
          <View style={{ gap: 10, marginBottom: 20 }}>
            {upcoming.map((a) => (
              <NeoBox key={a.id} depth={3} radius={14} style={{ backgroundColor: colors.accent }}>
                <View style={styles.apptRowInner}>
                  <View style={styles.apptIconWrap}>
                    <Calendar size={16} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.apptDate}>
                      {new Date(a.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                      {a.time ? ` at ${a.time}` : ""}
                    </Text>
                    {(a.doctorName || a.hospitalName) && (
                      <Text style={styles.apptVetMeta}>
                        {[a.doctorName, a.hospitalName].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                    {!!a.phoneNo && <Text style={styles.apptPhone}>📞 {a.phoneNo}</Text>}
                    {!!a.note && <Text style={styles.apptNote}>{a.note}</Text>}
                  </View>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>Upcoming</Text>
                  </View>
                </View>
              </NeoBox>
            ))}
          </View>
        )}

        {past.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 10 }]}>PAST APPOINTMENTS</Text>
            <View style={{ gap: 10, marginBottom: 20 }}>
              {past.map((a) => (
                <View key={a.id} style={styles.apptRow}>
                  <View style={styles.apptIconWrap}>
                    <Calendar size={16} color={colors.inkSoft} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.apptDate}>
                      {new Date(a.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      {a.time ? ` at ${a.time}` : ""}
                    </Text>
                    {(a.doctorName || a.hospitalName) && (
                      <Text style={styles.apptVetMeta}>
                        {[a.doctorName, a.hospitalName].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                    {!!a.phoneNo && <Text style={styles.apptPhone}>📞 {a.phoneNo}</Text>}
                    {!!a.note && <Text style={styles.apptNote}>{a.note}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>MEDICATIONS</Text>
          <Pressable onPress={() => router.push("/(app)/add-medication")} style={styles.addLink}>
            <Plus size={13} color={colors.accentDeep} />
            <Text style={styles.addLinkText}>Add</Text>
          </Pressable>
        </View>

        {record.vet.medications.length === 0 ? (
          <Pressable onPress={() => router.push("/(app)/add-medication")}>
            <View style={styles.noApptCard}>
              <View style={styles.noApptIconWrap}>
                <Pill size={22} color={colors.inkSoft} />
              </View>
              <Text style={styles.noApptTitle}>No medications added</Text>
              <Text style={styles.noApptSub}>Tap to add medication reminders for {record.pet.name}</Text>
            </View>
          </Pressable>
        ) : (
          <View style={{ gap: 10, marginBottom: 20 }}>
            {record.vet.medications.map((m) => (
              <View key={m.id} style={styles.medRow}>
                <View style={styles.apptIconWrap}>
                  <Pill size={16} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.apptDate}>{m.name}</Text>
                  {!!(m.dosage || m.schedule) && (
                    <Text style={styles.apptNote}>{[m.dosage, m.schedule].filter(Boolean).join(" · ")}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>VACCINATIONS</Text>
        <NeoBox depth={3} radius={16} style={styles.vaccineCard}>
          {core.map((v) => {
            const done = !!record.pet.vaccinations[v];
            return (
              <View key={v} style={styles.vaccineRow}>
                <View style={styles.vaccineLeft}>
                  <Syringe size={14} color={colors.ink} />
                  <Text style={styles.vaccineLabel}>{v}</Text>
                </View>
                <View style={[styles.vaccineStatus, { backgroundColor: done ? colors.sageBg : colors.surfaceAlt }]}>
                  {done ? <Check size={12} color={colors.sage} /> : null}
                  <Text style={[styles.vaccineStatusText, { color: done ? colors.sage : colors.inkSoft }]}>
                    {done ? "Done" : "Not done"}
                  </Text>
                </View>
              </View>
            );
          })}
          <Text style={styles.vaccineHint}>Set from onboarding — update via the Profile tab if this changes.</Text>
        </NeoBox>
      </ScrollView>
    </SafeAreaView>
  );
}

function PetStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.petStatValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.petStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 },
  sectionLabel: { fontFamily: fonts.labelBold, fontSize: 12.5, color: colors.ink, letterSpacing: 0.5, marginBottom: 10 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  addLink: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 10 },
  addLinkText: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.accentDeep },

  petCard: { padding: 18, marginBottom: 24 },
  petCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  petAvatar: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: colors.accent,
    borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center",
  },
  petName: { fontFamily: fonts.headlineLg, fontSize: 20, color: colors.ink },
  petType: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 1 },
  petStatsRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 2, borderTopColor: colors.ink, paddingTop: 14 },
  statDivider: { width: 2, height: 32, backgroundColor: colors.ink, opacity: 0.15 },
  petStatValue: { fontFamily: fonts.monoSemibold, fontSize: 15, color: colors.ink },
  petStatLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft, marginTop: 3 },

  noApptCard: {
    alignItems: "center", justifyContent: "center", paddingVertical: 24, paddingHorizontal: 16, borderRadius: 16,
    borderWidth: 2, borderColor: colors.ink, borderStyle: "dashed", backgroundColor: colors.surfaceAlt, marginBottom: 20,
  },
  noApptIconWrap: {
    width: 44, height: 44, borderRadius: 999, backgroundColor: colors.surface,
    borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  noApptTitle: { fontFamily: fonts.bodySemibold, fontSize: 14.5, color: colors.ink },
  noApptSub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 3, textAlign: "center" },

  emptyText: { color: colors.inkSoft, fontSize: 13, textAlign: "center", fontFamily: fonts.body },
  apptRowInner: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  apptRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink,
  },
  medRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink,
  },
  apptIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  apptDate: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink },
  apptVetMeta: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.ink, marginTop: 2 },
  apptPhone: { fontFamily: fonts.mono, fontSize: 11, color: colors.accentDeep, marginTop: 1 },
  apptNote: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 2 },
  upcomingBadge: { backgroundColor: colors.ink, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  upcomingBadgeText: { fontFamily: fonts.bodySemibold, fontSize: 10.5, color: colors.onInk },
  vaccineCard: { padding: 16 },
  vaccineRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  vaccineLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  vaccineLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  vaccineStatus: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1.5, borderColor: colors.ink },
  vaccineStatusText: { fontFamily: fonts.bodySemibold, fontSize: 11 },
  vaccineHint: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft, marginTop: 10 },
});
