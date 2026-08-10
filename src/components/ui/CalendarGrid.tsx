import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { colors, fonts } from "@/theme/tokens";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface Props {
  /** ISO date string (YYYY-MM-DD), or empty for no selection */
  value: string;
  onSelect: (isoDate: string) => void;
  /** Dates (ISO) to mark with a small dot, e.g. days with a vet appointment */
  markedDates?: string[];
}

/** A month-grid calendar, built with plain Views/Pressables — no native
 *  date-picker dependency. Used both as the reusable date-selection UI
 *  (inside DateField's modal) and as the basis for other calendar views. */
export function CalendarGrid({ value, onSelect, markedDates = [] }: Props) {
  const selected = value ? new Date(value + "T00:00:00") : null;
  const [viewDate, setViewDate] = useState(selected ?? new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const markedSet = new Set(markedDates);

  return (
    <View>
      <View style={styles.headerRow}>
        <Pressable onPress={() => setViewDate(new Date(year, month - 1, 1))} style={styles.navBtn}>
          <ChevronLeft size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
        <Pressable onPress={() => setViewDate(new Date(year, month + 1, 1))} style={styles.navBtn}>
          <ChevronRight size={18} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((w, i) => (
          <Text key={i} style={styles.weekdayLabel}>{w}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.cell} />;
          const iso = toISODate(date);
          const isSelected = selected && isSameDate(date, selected);
          const isToday = isSameDate(date, today);
          const isMarked = markedSet.has(iso);
          return (
            <Pressable key={i} onPress={() => onSelect(iso)} style={styles.cell}>
              <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected, !isSelected && isToday && styles.dayCircleToday]}>
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{date.getDate()}</Text>
              </View>
              {isMarked && <View style={[styles.dot, isSelected && { backgroundColor: colors.onAccent }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn: { width: 32, height: 32, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  monthLabel: { fontFamily: fonts.labelBold, fontSize: 15, color: colors.ink },
  weekdayRow: { flexDirection: "row", marginBottom: 4 },
  weekdayLabel: { width: CELL_SIZE, textAlign: "center", fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkSoft },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: "center", justifyContent: "center" },
  dayCircle: { width: 32, height: 32, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  dayCircleSelected: { backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.ink },
  dayCircleToday: { borderWidth: 1.5, borderColor: colors.ink },
  dayText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  dayTextSelected: { fontFamily: fonts.bodySemibold },
  dot: { position: "absolute", bottom: 2, width: 4, height: 4, borderRadius: 999, backgroundColor: colors.accentDeep },
});
