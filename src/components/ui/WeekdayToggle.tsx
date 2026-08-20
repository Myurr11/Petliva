import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme/tokens";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

interface Props {
  /** undefined (or all 7 days) means "every day". */
  value: number[] | undefined;
  onChange: (days: number[] | undefined) => void;
}

/** Seven tappable day-letter circles for picking which weekdays a food is
 *  given — not everyone feeds wet food daily, so this lets a food's
 *  schedule be a few days a week instead of forcing "every day". Selecting
 *  all 7 (or none) collapses back to `undefined`, which the rest of the
 *  app already treats as "every day". */
export function WeekdayToggle({ value, onChange }: Props) {
  const selected = value ?? ALL_DAYS;

  function toggle(day: number) {
    const next = selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day].sort();
    if (next.length === 0 || next.length === 7) {
      onChange(undefined);
    } else {
      onChange(next);
    }
  }

  const isEveryDay = selected.length === 7;

  return (
    <View>
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => {
          const active = selected.includes(i);
          return (
            <Pressable key={i} onPress={() => toggle(i)} hitSlop={4} style={styles.dayWrap}>
              <View style={[styles.dayCircle, active && styles.dayCircleActive]}>
                <Text style={[styles.dayText, active && styles.dayTextActive]}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.summary}>
        {isEveryDay ? "Every day" : `${selected.length} day${selected.length === 1 ? "" : "s"} a week`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  dayWrap: { alignItems: "center" },
  dayCircle: {
    width: 32, height: 32, borderRadius: 999, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface,
  },
  dayCircleActive: { backgroundColor: colors.sage, borderColor: colors.ink },
  dayText: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.inkSoft },
  dayTextActive: { color: "#fff" },
  summary: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 8 },
});
