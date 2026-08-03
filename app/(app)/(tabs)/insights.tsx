import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Line } from "react-native-svg";
import { Flame, TrendingUp } from "@/components/icons";
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
          <Text style={styles.emptyText}>No pet selected yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dailyGrams = Number(record.plan.dailyGrams) || 0;
  const chartMax = Math.max(dailyGrams, ...buckets.map((b) => b.grams), 1) * 1.15;
  const chartW = 320, chartH = 140, barGap = 10;
  const barW = (chartW - barGap * (DAYS_TO_SHOW - 1)) / DAYS_TO_SHOW;
  const targetY = chartH - (dailyGrams / chartMax) * chartH;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.sub}>{record.pet.name} · last {DAYS_TO_SHOW} days</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Flame size={20} color={colors.amberDeep} />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={20} color={colors.sage} />
            <Text style={styles.statValue}>{consistencyPct}%</Text>
            <Text style={styles.statLabel}>on-target days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { marginTop: 20 }]}>{avgGrams}g</Text>
            <Text style={styles.statLabel}>avg / day</Text>
          </View>
        </View>

        {!!record.plan.proteinPct && (
          <View style={styles.proteinCard}>
            <Text style={styles.proteinValue}>{Math.round((todayTotal * record.plan.proteinPct) / 100)}g</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.proteinLabel}>estimated protein fed today</Text>
              <Text style={styles.proteinSub}>
                Based on {record.plan.proteinPct}% protein in {record.plan.foodName} (from Open Pet Food Facts) × {todayTotal}g fed
              </Text>
            </View>
          </View>
        )}

        <View style={styles.chartCard}>
          <Text style={styles.chartLabel}>GRAMS FED PER DAY</Text>
          <Svg width={chartW} height={chartH + 24}>
            {dailyGrams > 0 && (
              <Line x1={0} y1={targetY} x2={chartW} y2={targetY} stroke={colors.amberDeep} strokeWidth={1} strokeDasharray="4,4" />
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
                  rx={4}
                  fill={hit ? colors.amber : colors.track}
                />
              );
            })}
          </Svg>
          <View style={styles.dayLabelsRow}>
            {buckets.map((b, i) => (
              <Text key={i} style={styles.dayLabel}>
                {b.date.toLocaleDateString([], { weekday: "narrow" })}
              </Text>
            ))}
          </View>
          {dailyGrams > 0 && (
            <Text style={styles.chartFootnote}>Dashed line = daily target ({dailyGrams}g). Amber bars = all planned meals logged.</Text>
          )}
        </View>

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
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 2 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 16, paddingVertical: 16, alignItems: "center", gap: 4 },
  statValue: { fontFamily: fonts.monoSemibold, fontSize: 20, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft, textAlign: "center" },
  proteinCard: {
    flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surfaceAlt,
    borderRadius: 16, padding: 14, marginBottom: 20,
  },
  proteinValue: { fontFamily: fonts.monoSemibold, fontSize: 26, color: colors.amberDeep },
  proteinLabel: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink },
  proteinSub: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft, marginTop: 2, lineHeight: 14 },
  chartCard: { backgroundColor: colors.surfaceAlt, borderRadius: 20, padding: 18, marginBottom: 20, alignItems: "center" },
  chartLabel: { alignSelf: "flex-start", fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.5, color: colors.inkSoft, marginBottom: 10 },
  dayLabelsRow: { flexDirection: "row", justifyContent: "space-between", width: 320, marginTop: 4 },
  dayLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, width: 320 / 7, textAlign: "center" },
  chartFootnote: { fontFamily: fonts.body, fontSize: 10.5, color: colors.inkSoft, marginTop: 10, textAlign: "center" },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 12.5, fontWeight: "600", color: colors.inkSoft, letterSpacing: 0.5, marginBottom: 10 },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink, flex: 1 },
  rowMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginRight: 12 },
  rowGrams: { fontFamily: fonts.monoSemibold, color: colors.ink, fontSize: 14 },
  emptyText: { color: colors.inkSoft, fontSize: 13.5, textAlign: "center", fontFamily: fonts.body },
});
