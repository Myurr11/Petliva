import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Cat, Dog, Plus, UtensilsCrossed, Clock3 } from "@/components/icons";
import { Ring } from "@/components/ui/Ring";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";

export default function Home() {
  const pets = useAppStore((s) => s.pets);
  const activePetId = useAppStore((s) => s.activePetId);
  const setActivePet = useAppStore((s) => s.setActivePet);
  const startAddPet = useAppStore((s) => s.startAddPet);
  const todayLogs = useAppStore((s) => s.todayLogs());
  const todayTotal = useAppStore((s) => s.todayTotal());
  const [ingredientsOpen, setIngredientsOpen] = useState(false);

  const petList = Object.values(pets);
  const active = activePetId ? pets[activePetId] : undefined;

  if (!active) {
    // Shouldn't normally happen post-onboarding, but guards against a stale
    // activePetId (e.g. after a pet is somehow removed).
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.content}>
          <Text style={styles.emptyText}>No pet selected yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { pet, plan } = active;
  const dailyGrams = Number(plan.dailyGrams) || 0;
  const pct = dailyGrams ? Math.min(100, Math.round((todayTotal / dailyGrams) * 100)) : 0;
  const remaining = Math.max(0, dailyGrams - todayTotal);
  const perMealSuggestion = plan.mealsPerDay ? Math.round(dailyGrams / plan.mealsPerDay) : 0;

  function goAddPet() {
    startAddPet();
    router.push("/(onboarding)/pet-type");
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {petList.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.switcherRow} contentContainerStyle={{ gap: 8 }}>
            {petList.map((r) => {
              const isActive = r.id === activePetId;
              const Icon = r.pet.type === "dog" ? Dog : Cat;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setActivePet(r.id)}
                  style={[styles.switcherChip, { borderColor: isActive ? colors.amber : colors.border, backgroundColor: isActive ? "#F5E6CE" : colors.surface }]}
                >
                  <Icon size={14} color={isActive ? colors.amberDeep : colors.inkSoft} />
                  <Text style={[styles.switcherLabel, { color: isActive ? colors.amberDeep : colors.ink }]}>{r.pet.name}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={goAddPet} style={styles.switcherChip}>
              <Plus size={14} color={colors.inkSoft} />
              <Text style={styles.switcherLabel}>Add pet</Text>
            </Pressable>
          </ScrollView>
        )}

        <View style={styles.header}>
          <View style={styles.avatar}>
            {pet.type === "dog" ? <Dog size={22} color={colors.onInk} /> : <Cat size={22} color={colors.onInk} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.petName}>{pet.name || "Your pet"}</Text>
            <Text style={styles.petSub}>{pet.breed} · {pet.weightKg}kg</Text>
          </View>
          {petList.length === 1 && (
            <Pressable onPress={goAddPet} style={styles.addPetBtn}>
              <Plus size={16} color={colors.inkSoft} />
            </Pressable>
          )}
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

        {(plan.foodBrand || plan.foodImageUrl || plan.proteinPct) && (
          <Pressable
            style={styles.foodCard}
            onPress={() => plan.foodIngredientsText && setIngredientsOpen((v) => !v)}
          >
            {plan.foodImageUrl ? (
              <Image source={{ uri: plan.foodImageUrl }} style={styles.foodImage} />
            ) : (
              <View style={[styles.foodImage, styles.foodImageFallback]}>
                <UtensilsCrossed size={18} color={colors.inkSoft} />
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
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  switcherRow: { marginBottom: 14, maxHeight: 40 },
  switcherChip: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  switcherLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  addPetBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
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
  foodCard: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surfaceAlt,
    borderRadius: 16, padding: 12, marginBottom: 20,
  },
  foodImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.surface },
  foodImageFallback: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  foodName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  foodBrand: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 1 },
  macroRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  macroBadge: { backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1, borderColor: colors.border },
  macroBadgeText: { fontFamily: fonts.mono, fontSize: 10, color: colors.amberDeep },
  ingredientsToggle: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.amberDeep, marginTop: 6 },
  ingredientsText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 4, lineHeight: 15 },
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
