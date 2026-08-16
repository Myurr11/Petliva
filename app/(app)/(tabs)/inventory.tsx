import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Package, Plus, AlertCircle, MoreVertical } from "@/components/icons";
import { PetSwitcherHeader } from "@/components/ui/PetSwitcherHeader";
import { NeoBox } from "@/components/ui/NeoBox";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { deleteFood } from "@/lib/supabase";
import type { FoodItem, StockEntry } from "@/types";

export default function Inventory() {
  const activePetId = useAppStore((s) => s.activePetId);
  const record = useAppStore((s) => (s.activePetId ? s.pets[s.activePetId] : undefined));
  const removeFoodItem = useAppStore((s) => s.removeFoodItem);

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

  function confirmDeleteFood(food: FoodItem) {
    Alert.alert("Delete food?", food.foodName || "This food", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          removeFoodItem(activePetId!, food.id);
          try {
            await deleteFood(food.id);
          } catch {
            // local removal already happened; remote delete is best-effort
            // (local-only entries added before ID-sync may not exist
            // remotely, in which case there's nothing to delete anyway)
          }
        },
      },
    ]);
  }

  function showFoodMenu(food: FoodItem) {
    Alert.alert(food.foodName || "Food", undefined, [
      { text: "Edit", onPress: () => router.push({ pathname: "/(app)/add-food", params: { foodId: food.id } }) },
      { text: "Delete", style: "destructive", onPress: () => confirmDeleteFood(food) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PetSwitcherHeader />
        <Text style={styles.title}>Food inventory</Text>
        <Text style={styles.sub}>{record.pet.name}</Text>

        {record.foods.length === 0 ? (
          <Pressable onPress={() => router.push("/(app)/add-food")}>
            <View style={styles.empty}>
              <Image source={require("../../../assets/illustrations/no-data-box.png")} style={styles.emptyIllustration} resizeMode="contain" />
              <Text style={styles.emptyText}>No food set up yet for this pet.</Text>
              <Text style={styles.emptyTextSub}>Tap "Add a food" below to set one up.</Text>
            </View>
          </Pressable>
        ) : (
          record.foods.map((food) => (
            <FoodStockCard
              key={food.id}
              petId={activePetId}
              food={food}
              restocks={record.restocks.filter((r) => r.foodId === food.id)}
              onMenu={() => showFoodMenu(food)}
            />
          ))
        )}

        <Pressable onPress={() => router.push("/(app)/add-food")} style={styles.addFoodLink} hitSlop={8}>
          <Plus size={14} color={colors.accentDeep} />
          <Text style={styles.addFoodLinkLabel}>Add a food</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function FoodStockCard({
  petId,
  food,
  restocks,
  onMenu,
}: {
  petId: string;
  food: FoodItem;
  restocks: StockEntry[];
  onMenu: () => void;
}) {
  const remaining = useAppStore((s) => s.stockRemaining(petId, food.id));
  const daysLeft = useAppStore((s) => s.stockDaysLeft(petId, food.id));
  const low = daysLeft !== null && daysLeft <= 3;
  const sorted = [...restocks].sort((a, b) => +new Date(b.addedAt) - +new Date(a.addedAt));

  return (
    <View style={{ marginBottom: 28 }}>
      <View style={styles.foodHeaderRow}>
        <View style={[styles.categoryBadge, { backgroundColor: food.category === "dry" ? colors.accent : colors.sageBg }]}>
          <Text style={styles.categoryBadgeText}>{food.category === "dry" ? "Dry" : "Wet"}</Text>
        </View>
        <Text style={styles.foodTitle} numberOfLines={1}>{food.foodName}</Text>
        <Pressable onPress={onMenu} style={styles.menuBtn} hitSlop={8}>
          <MoreVertical size={16} color={colors.ink} />
        </Pressable>
      </View>

      <NeoBox depth={4} radius={24} style={styles.card}>
        <Package size={26} color={low ? colors.rose : colors.ink} />
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
          <Text style={styles.daysTextMuted}>Set a daily amount to estimate days left</Text>
        )}
      </NeoBox>

      <Pressable onPress={() => router.push({ pathname: "/(app)/add-restock", params: { foodId: food.id, foodName: food.foodName } })}>
        <NeoBox depth={3} radius={999} style={styles.addBtn}>
          <Plus size={16} color={colors.onAccent} />
          <Text style={styles.addBtnLabel}>Log a restock</Text>
        </NeoBox>
      </Pressable>

      {sorted.length > 0 && (
        <View style={{ gap: 8, marginTop: 14 }}>
          {sorted.map((r) => (
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 20, paddingBottom: 90, paddingTop: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 2 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginBottom: 20 },
  addFoodLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 14 },
  addFoodLinkLabel: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.accentDeep },
  foodHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  categoryBadge: { borderRadius: 999, borderWidth: 2, borderColor: colors.ink, paddingVertical: 4, paddingHorizontal: 10 },
  categoryBadgeText: { fontFamily: fonts.labelBold, fontSize: 11, color: colors.ink },
  foodTitle: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, flexShrink: 1, flex: 1 },
  menuBtn: {
    width: 28, height: 28, borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink,
    alignItems: "center", justifyContent: "center", backgroundColor: colors.surface,
  },
  card: { paddingVertical: 24, alignItems: "center", marginBottom: 14, gap: 4 },
  remaining: { fontFamily: fonts.monoSemibold, fontSize: 30, color: colors.ink, marginTop: 6 },
  remainingLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginBottom: 8 },
  daysPill: {
    flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.sageBg,
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink,
  },
  daysText: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.sage },
  daysTextMuted: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, textAlign: "center", paddingHorizontal: 20 },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.accent, paddingVertical: 13,
  },
  addBtnLabel: { fontFamily: fonts.labelBold, color: colors.onAccent, fontSize: 14 },
  empty: {
    backgroundColor: colors.surface, borderRadius: 14, borderWidth: 2, borderColor: colors.ink,
    borderStyle: "dashed", padding: 18, alignItems: "center",
  },
  emptyIllustration: { width: 140, height: 118, marginBottom: 10 },
  emptyText: { color: colors.inkSoft, fontSize: 13.5, textAlign: "center", fontFamily: fonts.body },
  emptyTextSub: { color: colors.inkSoft, fontSize: 11.5, textAlign: "center", fontFamily: fonts.body, marginTop: 4 },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface,
  },
  rowLabel: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  rowDate: { fontSize: 11.5, color: colors.inkSoft, fontFamily: fonts.body, marginTop: 2 },
  rowGrams: { fontFamily: fonts.monoSemibold, color: colors.sage, fontSize: 15 },
});
