import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Package, Plus, AlertCircle } from "@/components/icons";
import { PetSwitcherHeader } from "@/components/ui/PetSwitcherHeader";
import { NeoBox } from "@/components/ui/NeoBox";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";

export default function Inventory() {
  const activePetId = useAppStore((s) => s.activePetId);
  const record = useAppStore((s) => (s.activePetId ? s.pets[s.activePetId] : undefined));
  const remaining = useAppStore((s) => s.stockRemaining());
  const daysLeft = useAppStore((s) => s.stockDaysLeft());

  if (!activePetId || !record) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.content}>
          <PetSwitcherHeader />
          <Text style={styles.emptyText}>No pet selected yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const low = daysLeft !== null && daysLeft <= 3;
  const restocks = [...record.restocks].sort((a, b) => +new Date(b.addedAt) - +new Date(a.addedAt));

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PetSwitcherHeader />
        <Text style={styles.title}>Food inventory</Text>
        <Text style={styles.sub}>{record.pet.name} · {record.plan.foodName || "no food set"}</Text>

        <NeoBox depth={4} radius={24} style={styles.card}>
          <Package size={28} color={low ? colors.rose : colors.ink} />
          <Text style={styles.remaining}>{remaining}g</Text>
          <Text style={styles.remainingLabel}>remaining in stock</Text>
          {daysLeft !== null ? (
            <View style={[styles.daysPill, low && { backgroundColor: colors.roseBg }]}>
              {low && <AlertCircle size={13} color={colors.rose} />}
              <Text style={[styles.daysText, low && { color: colors.rose }]}>
                {daysLeft <= 0 ? "Out of food" : `~${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
              </Text>
            </View>
          ) : (
            <Text style={styles.daysTextMuted}>Set a daily amount in the feeding plan to estimate days left</Text>
          )}
        </NeoBox>

        <Pressable onPress={() => router.push("/(app)/add-restock")}>
          <NeoBox depth={4} radius={999} style={styles.addBtn}>
            <Plus size={18} color={colors.onAccent} />
            <Text style={styles.addBtnLabel}>Log a restock</Text>
          </NeoBox>
        </Pressable>

        <Text style={styles.sectionLabel}>PURCHASE HISTORY</Text>
        {restocks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No restocks logged yet. Add one whenever you buy a new bag, and we'll estimate how long it'll last.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {restocks.map((r) => (
              <View key={r.id} style={styles.row}>
                <View>
                  <Text style={styles.rowLabel}>{r.note || "Restock"}</Text>
                  <Text style={styles.rowDate}>{new Date(r.addedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</Text>
                </View>
                <Text style={styles.rowGrams}>+{r.grams}g</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 2 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginBottom: 20 },
  card: { paddingVertical: 28, alignItems: "center", marginBottom: 20, gap: 4 },
  remaining: { fontFamily: fonts.monoSemibold, fontSize: 32, color: colors.ink, marginTop: 8 },
  remainingLabel: { fontFamily: fonts.body, fontSize: 12.5, color: colors.inkSoft, marginBottom: 10 },
  daysPill: {
    flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.sageBg,
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink,
  },
  daysText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.sage },
  daysTextMuted: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, textAlign: "center", paddingHorizontal: 20 },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.accent, paddingVertical: 16, marginBottom: 22,
  },
  addBtnLabel: { fontFamily: fonts.labelBold, color: colors.onAccent, fontSize: 15 },
  sectionLabel: { fontFamily: fonts.labelBold, fontSize: 12.5, color: colors.ink, letterSpacing: 0.5, marginBottom: 10 },
  empty: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 2, borderColor: colors.ink, padding: 18 },
  emptyText: { color: colors.inkSoft, fontSize: 13.5, textAlign: "center", fontFamily: fonts.body },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface,
  },
  rowLabel: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  rowDate: { fontSize: 11.5, color: colors.inkSoft, fontFamily: fonts.body, marginTop: 2 },
  rowGrams: { fontFamily: fonts.monoSemibold, color: colors.sage, fontSize: 15 },
});
