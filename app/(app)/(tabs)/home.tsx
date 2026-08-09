import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dog, Plus, UtensilsCrossed, Clock3 } from "@/components/icons";
import { Ring } from "@/components/ui/Ring";
import { NeoBox } from "@/components/ui/NeoBox";
import { PetSwitcherHeader } from "@/components/ui/PetSwitcherHeader";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";

export default function Home() {
  const pets = useAppStore((s) => s.pets);
  const activePetId = useAppStore((s) => s.activePetId);
  const startAddPet = useAppStore((s) => s.startAddPet);
  const todayLogs = useAppStore((s) => s.todayLogs());
  const todayTotal = useAppStore((s) => s.todayTotal());
  const [ingredientsOpen, setIngredientsOpen] = useState(false);

  const active = activePetId ? pets[activePetId] : undefined;

  function goAddPet() {
    startAddPet();
    router.push("/(onboarding)/pet-type");
  }

  if (!active) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.content}>
          <PetSwitcherHeader />
        </View>
        <View style={styles.emptyStateWrap}>
          <Text style={styles.emptyText}>No pet set up yet.</Text>
          <Pressable onPress={goAddPet}>
            <NeoBox depth={4} radius={999} style={styles.emptyStateBtn}>
              <Plus size={16} color={colors.onAccent} />
              <Text style={styles.emptyStateBtnLabel}>Add your pet</Text>
            </NeoBox>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { pet, plan } = active;
  const dailyGrams = Number(plan.dailyGrams) || 0;
  const pct = dailyGrams ? Math.min(100, Math.round((todayTotal / dailyGrams) * 100)) : 0;
  const remaining = Math.max(0, dailyGrams - todayTotal);
  const perMealSuggestion = plan.mealsPerDay ? Math.round(dailyGrams / plan.mealsPerDay) : 0;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PetSwitcherHeader />

        <NeoBox depth={4} radius={24} style={styles.ringCard}>
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
        </NeoBox>

        <Pressable onPress={() => router.push("/(app)/log-meal")}>
          <NeoBox depth={4} radius={999} style={styles.logBtn}>
            <Plus size={18} color={colors.onAccent} />
            <Text style={styles.logBtnLabel}>Log a feeding — suggested {perMealSuggestion}g</Text>
          </NeoBox>
        </Pressable>

        {(plan.foodBrand || plan.foodImageUrl || plan.proteinPct) && (
          <Pressable onPress={() => plan.foodIngredientsText && setIngredientsOpen((v) => !v)}>
            <NeoBox depth={3} radius={16} style={styles.foodCard}>
              {plan.foodImageUrl ? (
                <Image source={{ uri: plan.foodImageUrl }} style={styles.foodImage} />
              ) : (
                <View style={[styles.foodImage, styles.foodImageFallback]}>
                  <UtensilsCrossed size={18} color={colors.ink} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName} numberOfLines={1}>{plan.foodName}</Text>
                {!!plan.foodBrand && <Text style={styles.foodBrand}>{plan.foodBrand}</Text>}
                {(plan.proteinPct || plan.fatPct || plan.fiberPct) && (
                  <View style={styles.macroRow}>
                    {plan.proteinPct ? <MacroBadge label="protein" value={plan.proteinPct} /> : null}
                    {plan.fatPct ? <MacroBadge label="fat" value={plan.fatPct} /> : null}
                    {plan.fiberPct ? <MacroBadge label="fiber" value={plan.fiberPct} /> : null}
                  </View>
                )}
                {!!plan.foodIngredientsText && (
                  <Text style={styles.ingredientsToggle}>{ingredientsOpen ? "Hide ingredients ▲" : "Show ingredients ▼"}</Text>
                )}
                {ingredientsOpen && !!plan.foodIngredientsText && (
                  <Text style={styles.ingredientsText}>{plan.foodIngredientsText}</Text>
                )}
              </View>
            </NeoBox>
          </Pressable>
        )}

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
                  <UtensilsCrossed size={16} color={colors.ink} />
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

function MacroBadge({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.macroBadge}>
      <Text style={styles.macroBadgeText}>{value}% {label}</Text>
    </View>
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
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  emptyStateWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 20 },
  emptyStateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.accent,
    paddingVertical: 13, paddingHorizontal: 22,
  },
  emptyStateBtnLabel: { fontFamily: fonts.labelBold, color: colors.onAccent, fontSize: 14 },
  ringCard: { paddingVertical: 24, paddingHorizontal: 20, alignItems: "center", marginBottom: 20 },
  ringWrap: { width: 180, height: 180 },
  ringCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ringTotal: { fontFamily: fonts.monoSemibold, fontSize: 28, color: colors.ink },
  ringTarget: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.inkSoft },
  statsRow: { flexDirection: "row", gap: 20, marginTop: 16 },
  statValue: { fontFamily: fonts.monoSemibold, fontSize: 15 },
  statLabel: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  logBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.accent, paddingVertical: 16, marginBottom: 22,
  },
  logBtnLabel: { fontFamily: fonts.labelBold, color: colors.onAccent, fontSize: 15 },
  foodCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, marginBottom: 20 },
  foodImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  foodImageFallback: { alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.ink },
  foodName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  foodBrand: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 1 },
  macroRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  macroBadge: { backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1.5, borderColor: colors.ink },
  macroBadgeText: { fontFamily: fonts.mono, fontSize: 10, color: colors.accentDeep },
  ingredientsToggle: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.accentDeep, marginTop: 6 },
  ingredientsText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 4, lineHeight: 15 },
  sectionLabel: { fontFamily: fonts.labelBold, fontSize: 12.5, color: colors.ink, letterSpacing: 0.5, marginBottom: 10 },
  empty: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 2, borderColor: colors.ink, padding: 18 },
  emptyText: { color: colors.inkSoft, fontSize: 13.5, textAlign: "center", fontFamily: fonts.body },
  logRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface,
  },
  logLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logLabel: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  logTimeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  logTime: { fontSize: 11.5, color: colors.inkSoft, fontFamily: fonts.body },
  logGrams: { fontFamily: fonts.monoSemibold, color: colors.ink, fontSize: 15 },
});
