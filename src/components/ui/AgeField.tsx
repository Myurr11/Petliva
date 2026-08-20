import React, { useRef, useState } from "react";
import {
  View, Text, Pressable, Modal, StyleSheet, ScrollView,
  NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { PawPrint } from "@/components/icons";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, fonts } from "@/theme/tokens";
import { formatAge } from "@/lib/age";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PAD = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

const YEARS = Array.from({ length: 31 }, (_, i) => i); // 0-30
const MONTHS = Array.from({ length: 12 }, (_, i) => i); // 0-11

function clampIndex(i: number, max: number) {
  return Math.max(0, Math.min(max, i));
}

/** One scrollable, snap-to-item wheel column — the shared building block
 *  for the years/months pickers below. */
function Wheel({
  values, unitLabel, selected, onChange,
}: {
  values: number[]; unitLabel: string; selected: number; onChange: (v: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const didInit = useRef(false);

  function scrollToIndex(index: number, animated: boolean) {
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });
  }

  function onLayout() {
    if (didInit.current) return;
    didInit.current = true;
    // Jump to the initial value once the ScrollView has a real layout —
    // matches RulerWeightPicker's approach of deferring the initial
    // scrollTo rather than firing it immediately on mount.
    requestAnimationFrame(() => scrollToIndex(values.indexOf(selected), false));
  }

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = clampIndex(Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT), values.length - 1);
    onChange(values[index]);
  }

  return (
    <View style={styles.wheelOuter} onLayout={onLayout}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
      >
        {values.map((v) => (
          <View key={v} style={styles.wheelItem}>
            <Text style={[styles.wheelText, v === selected && styles.wheelTextActive]}>
              {v} <Text style={styles.wheelUnit}>{unitLabel}</Text>
            </Text>
          </View>
        ))}
      </ScrollView>
      {/* Fixed center highlight window */}
      <View pointerEvents="none" style={styles.wheelHighlight} />
    </View>
  );
}

interface Props {
  label: string;
  years: string; // "" or a whole number
  months: string; // "" or 0-11
  onChange: (years: string, months: string) => void;
}

/** A tappable field showing a chosen age, opening a modal with two wheel
 *  pickers (years + months) to set it — the same tap-to-open-a-picker
 *  pattern as DateField, so age selection matches the rest of onboarding
 *  instead of being a free-text number field. */
export function AgeField({ label, years, months, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draftYears, setDraftYears] = useState(Number(years) || 0);
  const [draftMonths, setDraftMonths] = useState(Number(months) || 0);

  function openPicker() {
    setDraftYears(Number(years) || 0);
    setDraftMonths(Number(months) || 0);
    setOpen(true);
  }

  function confirm() {
    onChange(String(draftYears), String(draftMonths));
    setOpen(false);
  }

  const hasValue = years.trim() !== "";

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={openPicker} style={styles.field}>
        <PawPrint size={17} color={colors.ink} />
        <Text style={[styles.fieldText, !hasValue && styles.fieldPlaceholder]}>
          {hasValue ? formatAge(years, months) : "Select age"}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <View style={styles.wheelsRow}>
              <Wheel values={YEARS} unitLabel="yr" selected={draftYears} onChange={setDraftYears} />
              <Wheel values={MONTHS} unitLabel="mo" selected={draftMonths} onChange={setDraftMonths} />
            </View>
            <View style={styles.actionsRow}>
              <Pressable onPress={() => setOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Done" onPress={confirm} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink, marginBottom: 8 },
  field: {
    flexDirection: "row", alignItems: "center", gap: 10, width: "100%",
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface,
  },
  fieldText: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  fieldPlaceholder: { color: colors.outlineVariant },
  overlay: { flex: 1, backgroundColor: "rgba(28,27,27,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.appBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
  sheetTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink, marginBottom: 8, textAlign: "center" },
  wheelsRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  wheelOuter: {
    width: 130, height: WHEEL_HEIGHT, borderRadius: 14, overflow: "hidden",
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink,
  },
  wheelItem: { height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center" },
  wheelText: { fontFamily: fonts.mono, fontSize: 16, color: colors.outlineVariant },
  wheelTextActive: { fontFamily: fonts.monoSemibold, fontSize: 19, color: colors.ink },
  wheelUnit: { fontFamily: fonts.body, fontSize: 12 },
  wheelHighlight: {
    position: "absolute", left: 0, right: 0, top: PAD, height: ITEM_HEIGHT,
    borderTopWidth: 2, borderBottomWidth: 2, borderColor: colors.accent, backgroundColor: "rgba(255,193,7,0.08)",
  },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  cancelBtn: { paddingVertical: 14, paddingHorizontal: 10 },
  cancelLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.inkSoft },
});
