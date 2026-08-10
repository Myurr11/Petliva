import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { colors, fonts } from "@/theme/tokens";
import { toISODate, isSameDate } from "@/components/ui/CalendarGrid";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function startOfWeek(d: Date) {
  const c = new Date(d);
  c.setDate(c.getDate() - c.getDay());
  c.setHours(0, 0, 0, 0);
  return c;
}

interface Props {
  selected: Date;
  onSelect: (d: Date) => void;
  /** ISO dates to mark with a small dot, e.g. days with a vet appointment */
  markedDates?: string[];
}

/** Horizontal 7-day week strip with prev/next navigation — the "calendar
 *  date-type UI other apps have" for picking a day to view details for. */
export function WeekStrip({ selected, onSelect, markedDates = [] }: Props) {
  const weekStart = startOfWeek(selected);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const today = new Date();
  const markedSet = new Set(markedDates);

  function shiftWeek(delta: number) {
    const next = new Date(selected);
    next.setDate(next.getDate() + delta * 7);
    onSelect(next);
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.monthLabel}>{MONTH_NAMES[selected.getMonth()]} {selected.getFullYear()}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => shiftWeek(-1)} style={styles.navBtn}>
            <ChevronLeft size={16} color={colors.ink} />
          </Pressable>
          <Pressable onPress={() => shiftWeek(1)} style={styles.navBtn}>
            <ChevronRight size={16} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <View style={styles.row}>
        {days.map((d, i) => {
          const isSelected = isSameDate(d, selected);
          const isToday = isSameDate(d, today);
          const isMarked = markedSet.has(toISODate(d));
          return (
            <Pressable key={i} onPress={() => onSelect(d)} style={styles.dayWrap}>
              <Text style={styles.weekdayLabel}>{WEEKDAY_LABELS[i]}</Text>
              <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected, !isSelected && isToday && styles.dayCircleToday]}>
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{d.getDate()}</Text>
              </View>
              {isMarked && <View style={[styles.dot, isSelected && { backgroundColor: colors.accentDeep }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  monthLabel: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink },
  navBtn: { width: 28, height: 28, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  dayWrap: { alignItems: "center", gap: 6, width: 40 },
  weekdayLabel: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.inkSoft },
  dayCircle: { width: 32, height: 32, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  dayCircleSelected: { backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.ink },
  dayCircleToday: { borderWidth: 1.5, borderColor: colors.ink },
  dayText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  dayTextSelected: { fontFamily: fonts.bodySemibold },
  dot: { width: 4, height: 4, borderRadius: 999, backgroundColor: colors.accent },
});
