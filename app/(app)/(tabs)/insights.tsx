import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { UtensilsCrossed, Calendar, Plus, Clock3, Pill } from "@/components/icons";
import { PetSwitcherHeader } from "@/components/ui/PetSwitcherHeader";
import { NeoBox } from "@/components/ui/NeoBox";
import { MiniTag } from "@/components/ui/MiniTag";
import { DailyFeedingProgress } from "@/components/ui/DailyFeedingProgress";
import { FeedingTrendChart } from "@/components/ui/FeedingTrendChart";
import { WeekStrip } from "@/components/ui/WeekStrip";
import { toISODate, isSameDate } from "@/components/ui/CalendarGrid";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { getMedicationStatus } from "@/lib/medicationStatus";
import { isFoodScheduledOn } from "@/lib/foodSchedule";
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

  const totalMealsPerDay = record.foods.filter((f) => isFoodScheduledOn(f, selectedDate)).reduce((sum, f) => sum + f.mealsPerDay, 0);

  const appointmentDates = record.vet.appointments.map((a) => a.date);
  const selectedIso = toISODate(selectedDate);
  const dayLogs = record.logs
    .filter((l) => isSameDate(new Date(l.loggedAt), selectedDate))
    .sort((a, b) => +new Date(a.loggedAt) - +new Date(b.loggedAt));
  const dryDailyGrams = record.foods.filter((f) => f.category === "dry" && isFoodScheduledOn(f, selectedDate)).reduce((sum, f) => sum + (Number(f.dailyGrams) || 0), 0);
  const wetDailyGrams = record.foods.filter((f) => f.category === "wet" && isFoodScheduledOn(f, selectedDate)).reduce((sum, f) => sum + (Number(f.dailyGrams) || 0), 0);
  const hasDryFood = record.foods.some((f) => f.category === "dry");
  const hasWetFood = record.foods.some((f) => f.category === "wet");
  const dryDayTotal = dayLogs.filter((log) => foodFor(log.foodId)?.category === "dry").reduce((sum, log) => sum + log.grams, 0);
  const wetDayTotal = dayLogs.filter((log) => foodFor(log.foodId)?.category === "wet").reduce((sum, log) => sum + log.grams, 0);
  const dayAppointment = record.vet.appointments.find((a) => a.date === selectedIso);
  const dayMedications = record.vet.medications
    .map((m) => ({ m, status: getMedicationStatus(m, selectedDate) }))
    .filter(({ status }) => status.state === "active");

  function foodFor(foodId: string) {
    return record!.foods.find((f) => f.id === foodId);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PetSwitcherHeader />
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.sub}>{record.pet.name} · last {DAYS_TO_SHOW} days overview</Text>

        <NeoBox depth={4} radius={20} style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartLabel}>LAST {DAYS_TO_SHOW} DAYS</Text>
          </View>

          <FeedingTrendChart
            buckets={buckets}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            dryTargetGrams={dryDailyGrams}
            wetTargetGrams={wetDailyGrams}
          />
        </NeoBox>

        {/* BROWSE BY DAY - WEEK STRIP CALENDAR */}
        <Text style={styles.sectionLabel}>BROWSE BY DAY</Text>
        <NeoBox depth={3} radius={20} style={styles.calendarCard}>
          <WeekStrip selected={selectedDate} onSelect={setSelectedDate} markedDates={appointmentDates} />
        </NeoBox>

        <DailyFeedingProgress
          dateLabel={selectedDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
          dryFedGrams={dryDayTotal}
          dryTargetGrams={dryDailyGrams}
          wetFedGrams={wetDayTotal}
          wetTargetGrams={wetDailyGrams}
          mealsLogged={dayLogs.length}
          mealsTarget={totalMealsPerDay}
          showDry={hasDryFood}
          showWet={hasWetFood}
          perFood={record.foods.map((f) => ({
            id: f.id,
            name: f.foodName,
            category: f.category,
            fedGrams: dayLogs.filter((l) => l.foodId === f.id).reduce((s, l) => s + l.grams, 0),
            targetGrams: isFoodScheduledOn(f, selectedDate) ? Number(f.dailyGrams) || 0 : 0,
          }))}
        />

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
                    <View style={styles.medMetaRow}>
                      {!!m.dosage && <MiniTag label={m.dosage} />}
                      {!!m.schedule && <MiniTag label={m.schedule} />}
                    </View>
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
          <NeoBox depth={3} radius={16} style={styles.logCard}>
            {dayLogs.map((l, i) => {
              const f = foodFor(l.foodId);
              const isWet = f?.category === "wet";
              return (
                <View key={l.id} style={[styles.logRow, i > 0 && styles.logRowDivider]}>
                  <View style={[styles.logIconWrap, { backgroundColor: isWet ? colors.sageBg : colors.accent }]}>
                    <UtensilsCrossed size={15} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logLabel}>{l.label}</Text>
                    <View style={styles.logMetaRow}>
                      <Clock3 size={11} color={colors.inkSoft} />
                      <Text style={styles.logTime}>
                        {new Date(l.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                      {f && <MiniTag label={f.category === "dry" ? "Dry" : "Wet"} tone={isWet ? "sage" : "accent"} />}
                    </View>
                  </View>
                  <Text style={styles.logGrams}>{l.grams}<Text style={styles.logGramsUnit}>g</Text></Text>
                </View>
              );
            })}
          </NeoBox>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: 20, paddingBottom: 90, paddingTop: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 2 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginBottom: 20 },
  chartCard: { padding: 18, marginBottom: 20 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 4 },
  chartLabel: { fontFamily: fonts.labelBold, fontSize: 11, letterSpacing: 0.5, color: colors.ink },
  sectionLabel: { fontFamily: fonts.labelBold, fontSize: 12.5, color: colors.ink, letterSpacing: 0.5, marginBottom: 10, marginTop: 6 },
  calendarCard: { padding: 16, marginBottom: 18 },
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
  medMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
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
  logCard: { paddingHorizontal: 14 },
  logRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  logRowDivider: { borderTopWidth: 1.5, borderTopColor: colors.track },
  logIconWrap: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: colors.ink,
    alignItems: "center", justifyContent: "center",
  },
  logLabel: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  logMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" },
  logTime: { fontSize: 11.5, color: colors.inkSoft, fontFamily: fonts.body, marginRight: 2 },
  logGrams: { fontFamily: fonts.monoSemibold, color: colors.ink, fontSize: 17 },
  logGramsUnit: { fontFamily: fonts.mono, color: colors.inkSoft, fontSize: 12 },
});
