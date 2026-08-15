import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NeoBox } from "@/components/ui/NeoBox";
import { FeedingGoalMeter } from "@/components/ui/FeedingGoalMeter";
import { colors, fonts } from "@/theme/tokens";
import type { FoodCategory } from "@/types";

interface PerFoodRow {
  id: string;
  name: string;
  category: FoodCategory;
  fedGrams: number;
  targetGrams: number;
}

interface Props {
  dateLabel: string;
  dryFedGrams: number;
  dryTargetGrams: number;
  wetFedGrams: number;
  wetTargetGrams: number;
  mealsLogged: number;
  mealsTarget: number;
  showDry: boolean;
  showWet: boolean;
  perFood?: PerFoodRow[];
}

export function DailyFeedingProgress({
  dateLabel,
  dryFedGrams,
  dryTargetGrams,
  wetFedGrams,
  wetTargetGrams,
  mealsLogged,
  mealsTarget,
  showDry,
  showWet,
  perFood = [],
}: Props) {
  const totalFed = dryFedGrams + wetFedGrams;
  const totalTarget = dryTargetGrams + wetTargetGrams;

  return (
    <NeoBox depth={4} radius={20} style={styles.card}>
      <Text style={styles.headerTitle}>DAILY PROGRESS · {dateLabel.toUpperCase()}</Text>

      <View style={styles.metersWrap}>
        {showDry && (
          <FeedingGoalMeter
            label="Dry food"
            fedGrams={dryFedGrams}
            targetGrams={dryTargetGrams}
            fillColor={colors.accent}
          />
        )}
        {showWet && (
          <FeedingGoalMeter
            label="Wet food"
            fedGrams={wetFedGrams}
            targetGrams={wetTargetGrams}
            fillColor={colors.sage}
            badgeBg={colors.sageBg}
          />
        )}
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalFed}g</Text>
          <Text style={styles.summaryLabel}>total fed</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalTarget || "—"}g</Text>
          <Text style={styles.summaryLabel}>combined target</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{mealsLogged}/{mealsTarget || "—"}</Text>
          <Text style={styles.summaryLabel}>meals logged</Text>
        </View>
      </View>

      {perFood.length > 1 && (
        <View style={styles.perFoodWrap}>
          {perFood.map((food) => (
            <View key={food.id} style={styles.perFoodRow}>
              <View style={[styles.perFoodDot, { backgroundColor: food.category === "dry" ? colors.accent : colors.sage }]} />
              <Text style={styles.perFoodLabel} numberOfLines={1}>{food.name}</Text>
              <Text style={styles.perFoodValue}>
                {food.fedGrams}g / {food.targetGrams || "—"}g
              </Text>
            </View>
          ))}
        </View>
      )}
    </NeoBox>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, marginBottom: 20 },
  headerTitle: { fontFamily: fonts.labelBold, fontSize: 11, letterSpacing: 0.5, color: colors.ink, marginBottom: 16 },
  metersWrap: { gap: 16 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1.5,
    borderTopColor: colors.track,
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryValue: { fontFamily: fonts.monoSemibold, fontSize: 15, color: colors.ink },
  summaryLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2, textAlign: "center" },
  perFoodWrap: { marginTop: 14, paddingTop: 12, borderTopWidth: 1.5, borderTopColor: colors.track, gap: 8 },
  perFoodRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  perFoodDot: { width: 8, height: 8, borderRadius: 999 },
  perFoodLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  perFoodValue: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.inkSoft },
});
