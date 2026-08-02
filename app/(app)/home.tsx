import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Cat, Dog, Plus, UtensilsCrossed, Clock3 } from "@/components/icons";
import { Ring } from "@/components/ui/Ring";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";

export default function Home() {
  const pet = useAppStore((s) => s.pet);
  const plan = useAppStore((s) => s.plan);
  const todayLogs = useAppStore((s) => s.todayLogs());
  const todayTotal = useAppStore((s) => s.todayTotal());

  const dailyGrams = Number(plan.dailyGrams) || 0;
  const pct = dailyGrams ? Math.min(100, Math.round((todayTotal / dailyGrams) * 100)) : 0;
  const remaining = Math.max(0, dailyGrams - todayTotal);
  const perMealSuggestion = plan.mealsPerDay ? Math.round(dailyGrams / plan.mealsPerDay) : 0;
  const PetIcon = pet.type === "dog" ? Dog : Cat;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <PetIcon size={22} color={colors.onInk} />
          </View>
          <View>
            <Text style={styles.petName}>{pet.name || "Your pet"}</Text>
            <Text style={styles.petSub}>{pet.breed} · {pet.weightKg}kg</Text>
          </View>
        </View>

        <View style={styles.ringCard}>
          <View style={styles.ringWrap}>
            <Ring pct={pct} />
            <View style={styles.ringCenter}>
              <Text style={styles.ringTotal}>{todayTotal}g</Text>
              <Text style={styles.ringTarget}>of {plan.dailyGrams || "—"}g</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <Stat value={`${remaining}g`} label="remaining" color={colors.sage} />
            <Stat value={`${todayLogs.length}/${plan.mealsPerDay}`} label="meals logged" />
            <Stat value={plan.foodName || "—"} label="food" />
          </View>
        </View>

        <Pressable style={styles.logBtn} onPress={() => router.push("/(app)/log-meal")}>
          <Plus size={18} color={colors.onInk} />
          <Text style={styles.logBtnLabel}>Log a feeding — suggested {perMealSuggestion}g</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>TODAY'S LOG</Text>
        {todayLogs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Nothing logged yet — feed {pet.name || "your pet"} and tap "Log a feeding" to start the count.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {todayLogs.map((l) => (
              <View key={l.id} style={styles.logRow}>
                <View style={styles.logLeft}>
                  <UtensilsCrossed size={16} color={colors.amberDeep} />
                  <View>
                    <Text style={styles.logLabel}>{l.label}</Text>
                    <View style={styles.logTimeRow}>
                      <Clock3 size={11} color={colors.inkSoft} />
                      <Text style={styles.logTime}>
                        {new Date(l.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · logged automatically
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.logGrams}>{l.grams}g</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label, color = colors.ink }: { value: string; label: string; color?: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  petName: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  petSub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  ringCard: { backgroundColor: colors.surfaceAlt, borderRadius: 24, paddingVertical: 24, paddingHorizontal: 20, alignItems: "center", marginBottom: 20 },
  ringWrap: { width: 180, height: 180 },
  ringCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ringTotal: { fontFamily: fonts.monoSemibold, fontSize: 28, color: colors.ink },
  ringTarget: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.inkSoft },
  statsRow: { flexDirection: "row", gap: 20, marginTop: 16 },
  statValue: { fontFamily: fonts.monoSemibold, fontSize: 15 },
  statLabel: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  logBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.ink, paddingVertical: 15, borderRadius: 16, marginBottom: 22,
  },
  logBtnLabel: { fontFamily: fonts.bodySemibold, color: colors.onInk, fontSize: 15 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 12.5, fontWeight: "600", color: colors.inkSoft, letterSpacing: 0.5, marginBottom: 10 },
  empty: { backgroundColor: colors.surfaceAlt, borderRadius: 14, padding: 18 },
  emptyText: { color: colors.inkSoft, fontSize: 13.5, textAlign: "center", fontFamily: fonts.body },
  logRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  logLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logLabel: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  logTimeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  logTime: { fontSize: 11.5, color: colors.inkSoft, fontFamily: fonts.body },
  logGrams: { fontFamily: fonts.monoSemibold, color: colors.ink, fontSize: 15 },
});
