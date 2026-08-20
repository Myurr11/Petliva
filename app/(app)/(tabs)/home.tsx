import React, { useRef, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView, Pressable, LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, UtensilsCrossed, Clock3, Calendar, Pill } from "@/components/icons";
import { Ring } from "@/components/ui/Ring";
import { NeoBox } from "@/components/ui/NeoBox";
import { PetSwitcherHeader } from "@/components/ui/PetSwitcherHeader";
import { MiniTag } from "@/components/ui/MiniTag";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { getMedicationStatus } from "@/lib/medicationStatus";
import { isFoodScheduledOn } from "@/lib/foodSchedule";
import type { FoodItem, FeedingLog, FoodCategory } from "@/types";

function isUpcoming(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

export default function Home() {
  const pets = useAppStore((s) => s.pets);
  const activePetId = useAppStore((s) => s.activePetId);
  const startAddPet = useAppStore((s) => s.startAddPet);
  const todayLogs = useAppStore((s) => s.todayLogs());

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

  const { pet, foods } = active;

  function foodLabel(foodId: string) {
    const f = foods.find((x) => x.id === foodId);
    return f ? f.foodName : "Food";
  }

  const upcomingAppointments = active.vet.appointments
    .filter((a) => !a.completed && isUpcoming(a.date))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .slice(0, 2);
  const medications = active.vet.medications.filter((m) => getMedicationStatus(m).state === "active");

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PetSwitcherHeader />

        <CategoryRingSwiper foods={foods} todayLogs={todayLogs} petName={pet.name} />

        <Pressable onPress={() => router.push("/(app)/log-meal")}>
          <NeoBox depth={4} radius={999} style={styles.logBtn}>
            <Plus size={18} color={colors.onAccent} />
            <Text style={styles.logBtnLabel}>Log a feeding</Text>
          </NeoBox>
        </Pressable>

        {/* UPCOMING APPOINTMENTS SECTION */}
        <Text style={styles.sectionLabel}>UPCOMING APPOINTMENTS</Text>
        {upcomingAppointments.length === 0 ? (
          <Pressable onPress={() => router.push("/(app)/add-appointment")} style={{ marginBottom: 20 }}>
            <View style={styles.emptyCardRow}>
              <View style={styles.emptyCardIconWrap}>
                <Calendar size={16} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyCardTitle}>No upcoming appointments</Text>
                <Text style={styles.emptyCardSub}>Tap to schedule next vet visit for {pet.name}</Text>
              </View>
              <Plus size={14} color={colors.accentDeep} />
            </View>
          </Pressable>
        ) : (
          <View style={{ gap: 10, marginBottom: 20 }}>
            {upcomingAppointments.map((a) => (
              <Pressable key={a.id} onPress={() => router.push("/(app)/(tabs)/vet")}>
                <NeoBox depth={3} radius={14} style={{ backgroundColor: colors.accent }}>
                  <View style={styles.apptRowInner}>
                    <View style={styles.apptIconWrap}>
                      <Calendar size={16} color={colors.ink} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.apptDate}>
                        {new Date(a.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                        {a.time ? ` at ${a.time}` : ""}
                      </Text>
                      {(a.doctorName || a.hospitalName) && (
                        <Text style={styles.apptVetMeta}>
                          {[a.doctorName, a.hospitalName].filter(Boolean).join(" · ")}
                        </Text>
                      )}
                      {!!a.phoneNo && <Text style={styles.apptPhone}>📞 {a.phoneNo}</Text>}
                      {!!a.note && <Text style={styles.apptNote}>{a.note}</Text>}
                    </View>
                    <View style={styles.upcomingBadge}>
                      <Text style={styles.upcomingBadgeText}>Upcoming</Text>
                    </View>
                  </View>
                </NeoBox>
              </Pressable>
            ))}
          </View>
        )}

        {/* MEDICATION REMINDERS SECTION */}
        <Text style={styles.sectionLabel}>MEDICATION REMINDERS</Text>
        {medications.length === 0 ? (
          <Pressable onPress={() => router.push("/(app)/add-medication")} style={{ marginBottom: 20 }}>
            <View style={styles.emptyCardRow}>
              <View style={styles.emptyCardIconWrap}>
                <Pill size={16} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyCardTitle}>
                  {active.vet.medications.length === 0 ? "No medication reminders set" : "Nothing due today"}
                </Text>
                <Text style={styles.emptyCardSub}>
                  {active.vet.medications.length === 0 ? "Tap to add medication schedule" : "See all courses in the Vet tab"}
                </Text>
              </View>
              <Plus size={14} color={colors.accentDeep} />
            </View>
          </Pressable>
        ) : (
          <View style={{ gap: 10, marginBottom: 20 }}>
            {medications.map((m) => {
              const status = getMedicationStatus(m);
              return (
                <Pressable key={m.id} onPress={() => router.push("/(app)/(tabs)/vet")}>
                  <View style={styles.medRow}>
                    <View style={styles.medIconWrap}>
                      <Pill size={14} color={colors.ink} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{m.name}</Text>
                      {!!(m.dosage || m.schedule) && (
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
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionLabel}>TODAY'S LOG</Text>
        {todayLogs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Nothing logged yet — feed {pet.name || "your pet"} and tap "Log a feeding" to start the count.
            </Text>
          </View>
        ) : (
          <NeoBox depth={3} radius={16} style={styles.logCard}>
            {todayLogs.map((l, i) => {
              const f = foods.find((x) => x.id === l.foodId);
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
                      {foods.length > 1 && <MiniTag label={foodLabel(l.foodId)} tone={isWet ? "sage" : "accent"} />}
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

const PAGES: { category: FoodCategory; title: string }[] = [
  { category: "dry", title: "Dry food" },
  { category: "wet", title: "Wet food" },
];

function CategoryRingSwiper({ foods, todayLogs, petName }: { foods: FoodItem[]; todayLogs: FeedingLog[]; petName: string }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function onLayout(e: LayoutChangeEvent) {
    if (containerWidth === 0) setContainerWidth(e.nativeEvent.layout.width);
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!containerWidth) return;
    const page = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
    setActivePage(page);
  }

  function goToPage(i: number) {
    scrollRef.current?.scrollTo({ x: i * containerWidth, animated: true });
    setActivePage(i);
  }

  return (
    <View style={{ marginBottom: 14 }}>
      <View onLayout={onLayout}>
        {containerWidth > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            scrollEventThrottle={16}
          >
            {PAGES.map(({ category, title }) => (
              <View key={category} style={{ width: containerWidth }}>
                <CategoryRingPage category={category} title={title} foods={foods} todayLogs={todayLogs} petName={petName} />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      <View style={styles.pageDotsRow}>
        {PAGES.map((p, i) => (
          <Pressable key={p.category} onPress={() => goToPage(i)} hitSlop={8}>
            <View style={[styles.pageDot, activePage === i && styles.pageDotActive]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CategoryRingPage({
  category, title, foods, todayLogs, petName,
}: {
  category: FoodCategory; title: string; foods: FoodItem[]; todayLogs: FeedingLog[]; petName: string;
}) {
  const today = new Date();
  const catFoods = foods.filter((f) => f.category === category);
  const catFoodIds = new Set(catFoods.map((f) => f.id));
  // Only foods actually scheduled for today count toward today's target —
  // a wet food given just 3 days a week shouldn't inflate the ring (or
  // sit un-fillable) on its off days.
  const scheduledTodayFoods = catFoods.filter((f) => isFoodScheduledOn(f, today));
  const dailyGrams = scheduledTodayFoods.reduce((sum, f) => sum + (Number(f.dailyGrams) || 0), 0);
  const catLogs = todayLogs.filter((l) => catFoodIds.has(l.foodId));
  const total = catLogs.reduce((sum, l) => sum + l.grams, 0);
  const pct = dailyGrams ? Math.min(100, Math.round((total / dailyGrams) * 100)) : 0;
  const remaining = Math.max(0, dailyGrams - total);
  const mealsPerDay = scheduledTodayFoods.reduce((sum, f) => sum + f.mealsPerDay, 0);

  return (
    <NeoBox depth={4} radius={24} style={styles.ringCard}>
      <Text style={styles.ringPageTitle}>{title}</Text>
      {catFoods.length === 0 ? (
        <View style={styles.noCategoryWrap}>
          <Image source={require("../../../assets/illustrations/no-data-box.png")} style={styles.noCategoryIllustration} resizeMode="contain" />
          <Text style={styles.noCategoryText}>No {category} food set up for {petName || "this pet"} yet.</Text>
        </View>
      ) : (
        <>
          {catFoods.length === 1 && (
            <View style={styles.foodNameTag}>
              <UtensilsCrossed size={12} color={colors.inkSoft} />
              <Text style={styles.foodNameTagText} numberOfLines={1}>{catFoods[0].foodName || "Unnamed food"}</Text>
            </View>
          )}
          {catFoods.length === 1 && !isFoodScheduledOn(catFoods[0], today) && (
            <Text style={styles.notScheduledHint}>Not scheduled for today — {catFoods[0].foodName || "this food"} is given on other days.</Text>
          )}
          <View style={styles.ringWrap}>
            <Ring pct={pct} />
            <View style={styles.ringCenter}>
              <Text style={styles.ringTotal}>{total}g</Text>
              <Text style={styles.ringTarget}>of {dailyGrams || "—"}g</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <Stat value={`${remaining}g`} label="remaining" color={colors.sage} />
            <Stat value={`${catLogs.length}/${mealsPerDay || "—"}`} label="meals logged" />
          </View>

          {catFoods.length > 1 && (
            <View style={styles.perFoodWrap}>
              {catFoods.map((f) => {
                const fTotal = todayLogs.filter((l) => l.foodId === f.id).reduce((s, l) => s + l.grams, 0);
                const fDaily = Number(f.dailyGrams) || 0;
                const scheduledToday = isFoodScheduledOn(f, today);
                return (
                  <View key={f.id} style={styles.perFoodRow}>
                    <Text style={styles.perFoodLabel} numberOfLines={1}>{f.foodName}</Text>
                    {scheduledToday ? (
                      <Text style={styles.perFoodValue}>{fTotal}g / {fDaily || "—"}g</Text>
                    ) : (
                      <Text style={styles.perFoodValueMuted}>not today</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </NeoBox>
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
  content: { paddingHorizontal: 20, paddingBottom: 90, paddingTop: 8 },
  emptyStateWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 20 },
  emptyStateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.accent,
    paddingVertical: 13, paddingHorizontal: 22,
  },
  emptyStateBtnLabel: { fontFamily: fonts.labelBold, color: colors.onAccent, fontSize: 14 },
  ringCard: { paddingVertical: 24, paddingHorizontal: 20, alignItems: "center" },
  ringPageTitle: { fontFamily: fonts.labelBold, fontSize: 13, color: colors.ink, letterSpacing: 0.5, marginBottom: 10 },
  foodNameTag: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center",
    backgroundColor: colors.surfaceAlt, borderRadius: 999, borderWidth: 1.5, borderColor: colors.ink,
    paddingVertical: 5, paddingHorizontal: 12, marginBottom: 16, maxWidth: 240,
  },
  foodNameTagText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink, flexShrink: 1 },
  ringWrap: { width: 180, height: 180 },
  ringCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ringTotal: { fontFamily: fonts.monoSemibold, fontSize: 28, color: colors.ink },
  ringTarget: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.inkSoft },
  statsRow: { flexDirection: "row", gap: 28, marginTop: 16 },
  statValue: { fontFamily: fonts.monoSemibold, fontSize: 15 },
  statLabel: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  noCategoryWrap: { paddingVertical: 24, paddingHorizontal: 10, alignItems: "center" },
  noCategoryIllustration: { width: 110, height: 92, marginBottom: 8 },
  noCategoryText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, textAlign: "center" },
  perFoodWrap: { width: "100%", marginTop: 18, borderTopWidth: 2, borderTopColor: colors.ink, paddingTop: 12, gap: 8 },
  perFoodRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  perFoodLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  perFoodValue: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.inkSoft },
  perFoodValueMuted: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.outlineVariant, fontStyle: "italic" },
  notScheduledHint: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, textAlign: "center", marginBottom: 12, paddingHorizontal: 10 },
  pageDotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  pageDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.track, borderWidth: 1.5, borderColor: colors.ink },
  pageDotActive: { backgroundColor: colors.accent, width: 18 },
  logBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.accent, paddingVertical: 16, marginBottom: 22,
  },
  logBtnLabel: { fontFamily: fonts.labelBold, color: colors.onAccent, fontSize: 15 },

  apptRowInner: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  apptIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  apptDate: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink },
  apptVetMeta: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.ink, marginTop: 2 },
  apptPhone: { fontFamily: fonts.mono, fontSize: 11, color: colors.accentDeep, marginTop: 1 },
  apptNote: { fontFamily: fonts.body, fontSize: 11.5, color: colors.ink, marginTop: 2, opacity: 0.85 },
  upcomingBadge: { backgroundColor: colors.ink, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  upcomingBadgeText: { fontFamily: fonts.bodySemibold, fontSize: 10.5, color: colors.onInk },

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


  sectionLabel: { fontFamily: fonts.labelBold, fontSize: 12.5, color: colors.ink, letterSpacing: 0.5, marginBottom: 10, marginTop: 6 },
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
