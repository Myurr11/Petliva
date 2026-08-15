import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { UtensilsCrossed, Calendar, Plus, Clock3, Pill } from "@/components/icons";
import { PetSwitcherHeader } from "@/components/ui/PetSwitcherHeader";
import { NeoBox } from "@/components/ui/NeoBox";
import { Ring } from "@/components/ui/Ring";
import { WeekStrip } from "@/components/ui/WeekStrip";
import { toISODate, isSameDate } from "@/components/ui/CalendarGrid";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { getMedicationStatus } from "@/lib/medicationStatus";
import type { FeedingLog } from "@/types";

const DAYS_TO_SHOW = 7;

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function buildDailyBreakdown(logs: FeedingLog[], days: number, foodCategories: Map<string, "dry" | "wet">) {
  const today = startOfDay(new Date());
  const buckets: { date: Date; grams: number; dryGrams: number; wetGrams: number; meals: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    buckets.push({ date, grams: 0, dryGrams: 0, wetGrams: 0, meals: 0 });
  }
  for (const log of logs) {
    const logDate = startOfDay(new Date(log.loggedAt));
    const bucket = buckets.find((b) => b.date.getTime() === logDate.getTime());
    if (bucket) {
      bucket.grams += log.grams;
      if (foodCategories.get(log.foodId) === "dry") bucket.dryGrams += log.grams;
      if (foodCategories.get(log.foodId) === "wet") bucket.wetGrams += log.grams;
      bucket.meals += 1;
    }
  }
  return buckets;
}

export default function Insights() {
  const record = useAppStore((s) => (s.activePetId ? s.pets[s.activePetId] : undefined));
  const [selectedDate, setSelectedDate] = useState(new Date());

  const buckets = useMemo(() => {
    if (!record) return [];
    return buildDailyBreakdown(record.logs, DAYS_TO_SHOW, new Map(record.foods.map((food) => [food.id, food.category])));
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

  const dailyGrams = record.foods.reduce((sum, f) => sum + (Number(f.dailyGrams) || 0), 0);
  const totalMealsPerDay = record.foods.reduce((sum, f) => sum + f.mealsPerDay, 0);

  // Graph Layout Math
  const chartW = 310;
  const chartH = 130;
  const topPadding = 28;
  const barGap = 10;
  const barW = (chartW - barGap * (DAYS_TO_SHOW - 1)) / DAYS_TO_SHOW;
  const maxLogged = Math.max(...buckets.map((b) => b.grams), 1);
  const chartMax = Math.max(dailyGrams, maxLogged) * 1.25;
  const targetY = topPadding + chartH - (dailyGrams / chartMax) * chartH;

  const appointmentDates = record.vet.appointments.map((a) => a.date);
  const selectedIso = toISODate(selectedDate);
  const dayLogs = record.logs
    .filter((l) => isSameDate(new Date(l.loggedAt), selectedDate))
    .sort((a, b) => +new Date(a.loggedAt) - +new Date(b.loggedAt));
  const dayTotal = dayLogs.reduce((sum, l) => sum + l.grams, 0);
  const dryDailyGrams = record.foods.filter((f) => f.category === "dry").reduce((sum, f) => sum + (Number(f.dailyGrams) || 0), 0);
  const wetDailyGrams = record.foods.filter((f) => f.category === "wet").reduce((sum, f) => sum + (Number(f.dailyGrams) || 0), 0);
  const dryDayTotal = dayLogs.filter((log) => foodFor(log.foodId)?.category === "dry").reduce((sum, log) => sum + log.grams, 0);
  const wetDayTotal = dayLogs.filter((log) => foodFor(log.foodId)?.category === "wet").reduce((sum, log) => sum + log.grams, 0);
  const dayAppointment = record.vet.appointments.find((a) => a.date === selectedIso);
  const dayMedications = record.vet.medications
    .map((m) => ({ m, status: getMedicationStatus(m, selectedDate) }))
    .filter(({ status }) => status.state === "active");

  function foodFor(foodId: string) {
    return record!.foods.find((f) => f.id === foodId);
  }

  const feedingTimes = (category: "dry" | "wet") => dayLogs
    .filter((log) => foodFor(log.foodId)?.category === category)
    .map((log) => new Date(log.loggedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }))
    .join(", ") || "—";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PetSwitcherHeader />
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.sub}>{record.pet.name} · last {DAYS_TO_SHOW} days overview</Text>

        {/* FEEDING HISTORY GRAPH */}
        <NeoBox depth={4} radius={20} style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartLabel}>GRAMS FED PER DAY</Text>
            {dailyGrams > 0 && (
              <View style={styles.targetBadge}>
                <Text style={styles.targetBadgeText}>Target: {dailyGrams}g/day</Text>
              </View>
            )}
          </View>

          <Svg width={chartW} height={chartH + topPadding + 6}>
            {/* Grid Baseline */}
            <Line
              x1={0}
              y1={topPadding + chartH}
              x2={chartW}
              y2={topPadding + chartH}
              stroke={colors.ink}
              strokeWidth={1.5}
            />

            {/* Target Line */}
            {dailyGrams > 0 && (
              <Line
                x1={0}
                y1={targetY}
                x2={chartW}
                y2={targetY}
                stroke={colors.accentDeep}
                strokeWidth={2}
                strokeDasharray="6,4"
              />
            )}

            {/* Bars */}
            {buckets.map((b, i) => {
              const dryH = chartMax ? (b.dryGrams / chartMax) * chartH : 0;
              const wetH = chartMax ? (b.wetGrams / chartMax) * chartH : 0;
              const x = i * (barW + barGap);
              const barCenter = x + barW / 2;
              const wetY = topPadding + chartH - wetH;
              const dryY = wetY - dryH;
              const isSelected = isSameDate(b.date, selectedDate);
              const hasData = b.grams > 0;

              return (
                <React.Fragment key={i}>
                  {hasData ? (
                    <>
                      {b.wetGrams > 0 && <Rect x={x} y={wetY} width={barW} height={Math.max(wetH, 4)} rx={b.dryGrams ? 0 : 6} fill={colors.sage} stroke={colors.ink} strokeWidth={1.5} onPress={() => setSelectedDate(b.date)} />}
                      {b.dryGrams > 0 && <Rect x={x} y={dryY} width={barW} height={Math.max(dryH, 4)} rx={6} fill={colors.accent} stroke={isSelected ? colors.accentDeep : colors.ink} strokeWidth={isSelected ? 3 : 1.5} onPress={() => setSelectedDate(b.date)} />}
                    </>
                  ) : (
                    /* Clean baseline indicator for 0g days without bulky black capsule */
                    <Rect
                      x={x}
                      y={topPadding + chartH - (isSelected ? 5 : 2)}
                      width={barW}
                      height={isSelected ? 5 : 2}
                      rx={2}
                      fill={isSelected ? colors.accent : colors.track}
                      stroke={isSelected ? colors.ink : "none"}
                      strokeWidth={isSelected ? 1.5 : 0}
                      onPress={() => setSelectedDate(b.date)}
                    />
                  )}

                  {/* Show value text ONLY when bar has data OR is selected */}
                  {(hasData || isSelected) && (
                    <SvgText
                      x={barCenter}
                      y={hasData ? dryY - 6 : topPadding + chartH - 10}
                      textAnchor="middle"
                      fontSize={11}
                      fontFamily={fonts.monoSemibold}
                      fill={isSelected ? colors.accentDeep : colors.ink}
                    >
                      {`${b.grams}g`}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Day Labels Row - Aligned with Bar Center */}
          <View style={[styles.dayLabelsRow, { width: chartW }]}>
            {buckets.map((b, i) => {
              const isSelected = isSameDate(b.date, selectedDate);
              return (
                <Pressable
                  key={i}
                  onPress={() => setSelectedDate(b.date)}
                  style={[styles.dayLabelCell, { width: barW, marginRight: i < DAYS_TO_SHOW - 1 ? barGap : 0 }]}
                >
                  <Text style={[styles.dayLabelText, isSelected && styles.dayLabelTextSelected]}>
                    {b.date.toLocaleDateString([], { weekday: "narrow" })}
                  </Text>
                  <Text style={[styles.dateSubText, isSelected && styles.dateSubTextSelected]}>
                    {b.date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={styles.legendText}>Dry</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.sage }]} />
              <Text style={styles.legendText}>Wet</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { borderColor: colors.accentDeep }]} />
              <Text style={styles.legendText}>Daily Target</Text>
            </View>
            <Text style={styles.legendHint}>Tap any bar to view date</Text>
          </View>
          <View style={styles.feedingTimesRow}>
            <Text style={styles.feedingTimesLabel}>FED AT</Text>
            <Text style={styles.feedingTimesText}>Dry: {feedingTimes("dry")}</Text>
            <Text style={styles.feedingTimesText}>Wet: {feedingTimes("wet")}</Text>
          </View>
        </NeoBox>

        {/* BROWSE BY DAY - WEEK STRIP CALENDAR */}
        <Text style={styles.sectionLabel}>BROWSE BY DAY</Text>
        <NeoBox depth={3} radius={20} style={styles.calendarCard}>
          <WeekStrip selected={selectedDate} onSelect={setSelectedDate} markedDates={appointmentDates} />
        </NeoBox>

        {/* CIRCULAR PROGRESS RING (FROM HOME SCREEN) */}
        <NeoBox depth={4} radius={24} style={styles.ringCard}>
          <Text style={styles.ringHeaderTitle}>
            PROGRESS · {selectedDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
          </Text>
          <View style={styles.ringWrap}>
            <Ring
              pct={0}
              segments={[
                { pct: dailyGrams ? (Math.min(dryDayTotal, dryDailyGrams) / dailyGrams) * 100 : 0, color: colors.accent },
                { pct: dailyGrams ? (Math.min(wetDayTotal, wetDailyGrams) / dailyGrams) * 100 : 0, color: colors.sage },
              ]}
            />
            <View style={styles.ringCenter}>
              <Text style={styles.ringTotal}>{dayTotal}g</Text>
              <Text style={styles.ringTarget}>of {dailyGrams || "—"}g</Text>
            </View>
          </View>
          <View style={styles.ringStatsRow}>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.ringStatValue, { color: colors.accentDeep }]}>{dryDayTotal}g</Text>
              <Text style={styles.ringStatLabel}>dry of {dryDailyGrams}g</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.ringStatValue, { color: colors.sage }]}>{wetDayTotal}g</Text>
              <Text style={styles.ringStatLabel}>wet of {wetDailyGrams}g</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.ringStatValue}>{dayLogs.length}/{totalMealsPerDay}</Text>
              <Text style={styles.ringStatLabel}>meals logged</Text>
            </View>
          </View>

          {record.foods.length > 1 && (
            <View style={styles.perFoodWrap}>
              {record.foods.map((f) => {
                const fTotal = dayLogs.filter((l) => l.foodId === f.id).reduce((s, l) => s + l.grams, 0);
                const fDaily = Number(f.dailyGrams) || 0;
                return (
                  <View key={f.id} style={styles.perFoodRow}>
                    <View style={[styles.perFoodDot, { backgroundColor: f.category === "dry" ? colors.accent : colors.sage }]} />
                    <Text style={styles.perFoodLabel} numberOfLines={1}>{f.foodName}</Text>
                    <Text style={styles.perFoodValue}>{fTotal}g / {fDaily || "—"}g</Text>
                  </View>
                );
              })}
            </View>
          )}
        </NeoBox>

        {/* SEPARATE SECTION 1: VET APPOINTMENTS */}
        <Text style={styles.sectionLabel}>VET APPOINTMENTS</Text>
        {dayAppointment ? (
          <NeoBox depth={3} radius={14} style={{ backgroundColor: colors.accent, marginBottom: 20 }}>
            <View style={styles.apptRow}>
              <Calendar size={16} color={colors.ink} />
              <View style={{ flex: 1 }}>
                <Text style={styles.apptTitle}>
                  Vet appointment{dayAppointment.time ? ` at ${dayAppointment.time}` : ""}
                </Text>
                {(dayAppointment.doctorName || dayAppointment.hospitalName) && (
                  <Text style={styles.apptVetMeta}>
                    {[dayAppointment.doctorName, dayAppointment.hospitalName].filter(Boolean).join(" · ")}
                  </Text>
                )}
                {!!dayAppointment.phoneNo && <Text style={styles.apptPhone}>📞 {dayAppointment.phoneNo}</Text>}
                {!!dayAppointment.note && <Text style={styles.apptNote}>{dayAppointment.note}</Text>}
              </View>
            </View>
          </NeoBox>
        ) : (
          <Pressable
            onPress={() => router.push({ pathname: "/(app)/add-appointment", params: { date: selectedIso } })}
            style={{ marginBottom: 20 }}
          >
            <View style={styles.emptyCardRow}>
              <View style={styles.emptyCardIconWrap}>
                <Calendar size={16} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyCardTitle}>No vet appointment on this day</Text>
                <Text style={styles.emptyCardSub}>Tap to schedule a vet visit</Text>
              </View>
              <Plus size={14} color={colors.accentDeep} />
            </View>
          </Pressable>
        )}

        {/* SEPARATE SECTION 2: MEDICATION REMINDERS */}
        <Text style={styles.sectionLabel}>MEDICATION REMINDERS</Text>
        {dayMedications.length > 0 ? (
          <View style={{ marginBottom: 20, gap: 8 }}>
            {dayMedications.map(({ m, status }) => (
              <View key={m.id} style={styles.medRow}>
                <View style={styles.medIconWrap}>
                  <Pill size={14} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{m.name}</Text>
                  {(m.dosage || m.schedule) && (
                    <Text style={styles.medDetail}>{[m.dosage, m.schedule].filter(Boolean).join(" · ")}</Text>
                  )}
                </View>
                <View style={styles.medDayBadge}>
                  <Text style={styles.medDayBadgeText}>Day {status.dayOfCourse}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Pressable onPress={() => router.push("/(app)/add-medication")} style={{ marginBottom: 20 }}>
            <View style={styles.emptyCardRow}>
              <View style={styles.emptyCardIconWrap}>
                <Pill size={16} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyCardTitle}>
                  {record.vet.medications.length === 0 ? "No medication reminders set" : "None due this day"}
                </Text>
                <Text style={styles.emptyCardSub}>
                  {record.vet.medications.length === 0 ? "Tap to add a medication reminder" : "Add another course if needed"}
                </Text>
              </View>
              <Plus size={14} color={colors.accentDeep} />
            </View>
          </Pressable>
        )}

        {/* FEEDING LOG FOR SELECTED DAY */}
        <Text style={styles.sectionLabel}>FEEDING LOG</Text>
        {dayLogs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No feedings logged this day.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {dayLogs.map((l) => {
              const f = foodFor(l.foodId);
              return (
                <View key={l.id} style={styles.logRow}>
                  <View style={styles.logLeft}>
                    <UtensilsCrossed size={16} color={colors.ink} />
                    <View>
                      <Text style={styles.logLabel}>
                        {l.label}{f ? ` · ${f.category === "dry" ? "Dry" : "Wet"}` : ""}
                      </Text>
                      <View style={styles.logTimeRow}>
                        <Clock3 size={11} color={colors.inkSoft} />
                        <Text style={styles.logTime}>
                          {new Date(l.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.logGrams}>{l.grams}g</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 2 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginBottom: 20 },
  chartCard: { padding: 18, marginBottom: 20, alignItems: "center" },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 12 },
  chartLabel: { fontFamily: fonts.labelBold, fontSize: 11, letterSpacing: 0.5, color: colors.ink },
  targetBadge: { backgroundColor: colors.surfaceAlt, borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink, paddingVertical: 2, paddingHorizontal: 8 },
  targetBadgeText: { fontFamily: fonts.monoSemibold, fontSize: 10, color: colors.accentDeep },
  dayLabelsRow: { flexDirection: "row", marginTop: 8 },
  dayLabelCell: { alignItems: "center" },
  dayLabelText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkSoft },
  dayLabelTextSelected: { fontFamily: fonts.labelBold, color: colors.accentDeep },
  dateSubText: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft, marginTop: 1 },
  dateSubTextSelected: { fontFamily: fonts.monoSemibold, color: colors.accentDeep },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 14, borderTopWidth: 1.5, borderTopColor: colors.track, paddingTop: 10, width: "100%" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.ink },
  legendLine: { width: 14, height: 0, borderBottomWidth: 2, borderStyle: "dashed" },
  legendText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  legendHint: { marginLeft: "auto", fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.accentDeep },
  feedingTimesRow: { width: "100%", marginTop: 10, paddingTop: 10, borderTopWidth: 1.5, borderTopColor: colors.track, gap: 3 },
  feedingTimesLabel: { fontFamily: fonts.labelBold, fontSize: 10, color: colors.inkSoft, letterSpacing: 0.5 },
  feedingTimesText: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.ink },
  sectionLabel: { fontFamily: fonts.labelBold, fontSize: 12.5, color: colors.ink, letterSpacing: 0.5, marginBottom: 10, marginTop: 6 },
  calendarCard: { padding: 16, marginBottom: 18 },
  ringCard: { paddingVertical: 20, paddingHorizontal: 18, alignItems: "center", marginBottom: 20 },
  ringHeaderTitle: { alignSelf: "flex-start", fontFamily: fonts.labelBold, fontSize: 11, letterSpacing: 0.5, color: colors.ink, marginBottom: 14 },
  ringWrap: { width: 180, height: 180 },
  ringCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ringTotal: { fontFamily: fonts.monoSemibold, fontSize: 28, color: colors.ink },
  ringTarget: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.inkSoft },
  ringStatsRow: { flexDirection: "row", gap: 20, marginTop: 16 },
  ringStatValue: { fontFamily: fonts.monoSemibold, fontSize: 15, color: colors.ink },
  ringStatLabel: { fontSize: 11, color: colors.inkSoft, marginTop: 2, fontFamily: fonts.body },
  perFoodWrap: { width: "100%", marginTop: 16, borderTopWidth: 1.5, borderTopColor: colors.track, paddingTop: 12, gap: 8 },
  perFoodRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  perFoodDot: { width: 8, height: 8, borderRadius: 999 },
  perFoodLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  perFoodValue: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.inkSoft },
  apptRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  apptTitle: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink },
  apptVetMeta: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.ink, marginTop: 2 },
  apptPhone: { fontFamily: fonts.mono, fontSize: 11, color: colors.accentDeep, marginTop: 1 },
  apptNote: { fontFamily: fonts.body, fontSize: 11.5, color: colors.ink, marginTop: 1, opacity: 0.8 },
  medRow: {
    flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14,
    borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface,
  },
  medIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.surfaceAlt, borderWidth: 1.5, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  medName: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink },
  medDetail: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 1 },
  medDayBadge: { backgroundColor: colors.sageBg, borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink, paddingVertical: 4, paddingHorizontal: 9 },
  medDayBadgeText: { fontFamily: fonts.labelBold, fontSize: 10, color: colors.ink },
  emptyCardRow: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 14, borderWidth: 2, borderColor: colors.ink, borderStyle: "dashed", backgroundColor: colors.surface,
  },
  emptyCardIconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surfaceAlt, borderWidth: 1.5, borderColor: colors.ink,
    alignItems: "center", justifyContent: "center",
  },
  emptyCardTitle: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink },
  emptyCardSub: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 1 },
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
