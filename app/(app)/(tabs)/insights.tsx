import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Line } from "react-native-svg";
import { Flame, TrendingUp } from "@/components/icons";
import { PetSwitcherHeader } from "@/components/ui/PetSwitcherHeader";
import { NeoBox } from "@/components/ui/NeoBox";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import type { FeedingLog } from "@/types";

const DAYS_TO_SHOW = 7;

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function buildDailyBreakdown(logs: FeedingLog[], days: number) {
  const today = startOfDay(new Date());
  const buckets: { date: Date; grams: number; meals: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    buckets.push({ date, grams: 0, meals: 0 });
  }
  for (const log of logs) {
    const logDate = startOfDay(new Date(log.loggedAt));
    const bucket = buckets.find((b) => b.date.getTime() === logDate.getTime());
    if (bucket) {
      bucket.grams += log.grams;
      bucket.meals += 1;
    }
  }
  return buckets;
}

function computeStreak(buckets: { grams: number; meals: number }[], mealsPerDay: number) {
  let streak = 0;
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i].meals >= mealsPerDay && mealsPerDay > 0) streak++;
    else break;
  }
  return streak;
}

export default function Insights() {
  const record = useAppStore((s) => (s.activePetId ? s.pets[s.activePetId] : undefined));
  const todayTotal = useAppStore((s) => s.todayTotal());

  const { buckets, streak, consistencyPct, avgGrams } = useMemo(() => {
    if (!record) return { buckets: [], streak: 0, consistencyPct: 0, avgGrams: 0 };
    const b = buildDailyBreakdown(record.logs, DAYS_TO_SHOW);
    const mealsPerDay = record.plan.mealsPerDay || 0;
    const s = computeStreak(b, mealsPerDay);
    const daysHit = b.filter((d) => mealsPerDay > 0 && d.meals >= mealsPerDay).length;
    const pct = Math.round((daysHit / DAYS_TO_SHOW) * 100);
    const avg = b.length ? Math.round(b.reduce((sum, d) => sum + d.grams, 0) / b.length) : 0;
    return { buckets: b, streak: s, consistencyPct: pct, avgGrams: avg };
  }, [record]);

  if (!record) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.content}>
          <PetSwitcherHeader />
          <Text style={styles.emptyText}>No pet selected yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dailyGrams = Number(record.plan.dailyGrams) || 0;
  const chartMax = Math.max(dailyGrams, ...buckets.map((b) => b.grams), 1) * 1.15;
  const chartW = 300, chartH = 140, barGap = 10;
  const barW = (chartW - barGap * (DAYS_TO_SHOW - 1)) / DAYS_TO_SHOW;
  const targetY = chartH - (dailyGrams / chartMax) * chartH;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PetSwitcherHeader />
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.sub}>{record.pet.name} · last {DAYS_TO_SHOW} days</Text>

        <View style={styles.statsRow}>
          <NeoBox depth={3} radius={16} style={styles.statCard}>
            <Flame size={20} color={colors.ink} />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </NeoBox>
          <NeoBox depth={3} radius={16} style={styles.statCard}>
            <TrendingUp size={20} color={colors.ink} />
            <Text style={styles.statValue}>{consistencyPct}%</Text>
            <Text style={styles.statLabel}>on-target days</Text>
          </NeoBox>
          <NeoBox depth={3} radius={16} style={styles.statCard}>
            <Text style={[styles.statValue, { marginTop: 20 }]}>{avgGrams}g</Text>
            <Text style={styles.statLabel}>avg / day</Text>
          </NeoBox>
        </View>

        {!!record.plan.proteinPct && (
          <NeoBox depth={3} radius={16} style={styles.proteinCard}>
            <Text style={styles.proteinValue}>{Math.round((todayTotal * record.plan.proteinPct) / 100)}g</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.proteinLabel}>estimated protein fed today</Text>
              <Text style={styles.proteinSub}>
                Based on {record.plan.proteinPct}% protein in {record.plan.foodName} (from Open Pet Food Facts) × {todayTotal}g fed
              </Text>
            </View>
          </NeoBox>
        )}

        <NeoBox depth={4} radius={20} style={styles.chartCard}>
          <Text style={styles.chartLabel}>GRAMS FED PER DAY</Text>
          <Svg width={chartW} height={chartH + 24}>
            {dailyGrams > 0 && (
              <Line x1={0} y1={targetY} x2={chartW} y2={targetY} stroke={colors.accentDeep} strokeWidth={2} strokeDasharray="5,4" />
            )}
            {buckets.map((b, i) => {
              const h = chartMax ? (b.grams / chartMax) * chartH : 0;
              const x = i * (barW + barGap);
              const hit = record.plan.mealsPerDay > 0 && b.meals >= record.plan.mealsPerDay;
              return (
                <Rect
                  key={i}
                  x={x}
                  y={chartH - h}
                  width={barW}
                  height={h}
                  rx={3}
                  fill={hit ? colors.accent : colors.track}
                  stroke={colors.ink}
                  strokeWidth={1.5}
                />
              );
            })}
          </Svg>
          <View style={[styles.dayLabelsRow, { width: chartW }]}>
            {buckets.map((b, i) => (
              <Text key={i} style={[styles.dayLabel, { width: chartW / 7 }]}>
                {b.date.toLocaleDateString([], { weekday: "narrow" })}
              </Text>
            ))}
          </View>
          {dailyGrams > 0 && (
            <Text style={styles.chartFootnote}>Dashed line = daily target ({dailyGrams}g). Mustard bars = all planned meals logged.</Text>
          )}
        </NeoBox>

        <Text style={styles.sectionLabel}>DAY BY DAY</Text>
        <View style={{ gap: 10 }}>
          {[...buckets].reverse().map((b, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowLabel}>
                {b.date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
              </Text>
              <Text style={styles.rowMeta}>{b.meals} meal{b.meals === 1 ? "" : "s"}</Text>
              <Text style={styles.rowGrams}>{b.grams}g</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 2 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, paddingVertical: 16, alignItems: "center", gap: 4 },
  statValue: { fontFamily: fonts.monoSemibold, fontSize: 20, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft, textAlign: "center" },
  proteinCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, marginBottom: 20 },
  proteinValue: { fontFamily: fonts.monoSemibold, fontSize: 26, color: colors.accentDeep },
  proteinLabel: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink },
  proteinSub: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft, marginTop: 2, lineHeight: 14 },
  chartCard: { padding: 18, marginBottom: 20, alignItems: "center" },
  chartLabel: { alignSelf: "flex-start", fontFamily: fonts.labelBold, fontSize: 11, letterSpacing: 0.5, color: colors.ink, marginBottom: 10 },
  dayLabelsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  dayLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, textAlign: "center" },
  chartFootnote: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft, marginTop: 10, textAlign: "center" },
  sectionLabel: { fontFamily: fonts.labelBold, fontSize: 12.5, color: colors.ink, letterSpacing: 0.5, marginBottom: 10 },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface,
  },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink, flex: 1 },
  rowMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginRight: 12 },
  rowGrams: { fontFamily: fonts.monoSemibold, color: colors.ink, fontSize: 14 },
  emptyText: { color: colors.inkSoft, fontSize: 13.5, textAlign: "center", fontFamily: fonts.body },
});
