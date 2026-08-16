import React, { useRef, useState } from "react";
import { View, Text, ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme/tokens";

const KG_PER_LB = 0.45359237;
const PX_PER_UNIT = 40;

type Unit = "kg" | "lb";

interface Range {
  min: number;
  max: number;
}

const RANGE: Record<Unit, Range> = {
  kg: { min: 1, max: 50 },
  lb: { min: 2, max: 110 },
};

function kgToLb(kg: number) {
  return kg / KG_PER_LB;
}
function lbToKg(lb: number) {
  return lb * KG_PER_LB;
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

interface Props {
  valueKg: number;
  onChangeKg: (kg: number) => void;
}

export function RulerWeightPicker({ valueKg, onChangeKg }: Props) {
  const [unit, setUnit] = useState<Unit>("kg");
  const [display, setDisplay] = useState(valueKg);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const didInit = useRef(false);
  // A scroll we still need to perform once the ScrollView's native content
  // size is actually committed. Calling scrollTo() right after onLayout (via
  // requestAnimationFrame) is not reliable — the outer container being
  // measured doesn't guarantee the ScrollView's own content view has been
  // created yet, so an early scrollTo can silently land short of its target.
  // onContentSizeChange fires exactly when that content is ready, so queuing
  // the scroll here and firing it there is the correct, race-free pattern.
  const pendingScroll = useRef<number | null>(null);

  const range = RANGE[unit];
  const halfVisible = containerWidth / 2;
  const totalSteps = range.max - range.min;
  const totalWidth = totalSteps * PX_PER_UNIT;

  const currentInUnit = unit === "kg" ? valueKg : kgToLb(valueKg);

  function scrollToValue(v: number, animated: boolean) {
    const x = (clamp(v, range.min, range.max) - range.min) * PX_PER_UNIT;
    scrollRef.current?.scrollTo({ x, animated });
  }

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
    if (!didInit.current) {
      didInit.current = true;
      setDisplay(currentInUnit);
      pendingScroll.current = currentInUnit;
    }
  }

  function onContentSizeChange() {
    if (pendingScroll.current !== null) {
      const target = pendingScroll.current;
      pendingScroll.current = null;
      // Content is now guaranteed measured — safe to jump immediately.
      scrollToValue(target, false);
    }
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    const raw = range.min + x / PX_PER_UNIT;
    setDisplay(Math.round(clamp(raw, range.min, range.max) * 10) / 10);
  }

  function commit() {
    const kg = unit === "kg" ? display : lbToKg(display);
    onChangeKg(Math.round(kg * 10) / 10);
  }

  function switchUnit(next: Unit) {
    if (next === unit) return;
    const kg = unit === "kg" ? display : lbToKg(display);
    const nextDisplay = Math.round((next === "kg" ? kg : kgToLb(kg)) * 10) / 10;
    setUnit(next);
    setDisplay(nextDisplay);
    // Changing `unit` changes the tick range/totalWidth, so the ScrollView's
    // content size changes too — that re-fires onContentSizeChange, which
    // performs this scroll once the new content is actually ready.
    pendingScroll.current = nextDisplay;
  }

  const ticks = Array.from({ length: totalSteps + 1 }, (_, i) => range.min + i);

  return (
    <View>
      {/* Big number readout */}
      <View style={styles.readoutRow}>
        <Text style={styles.readoutValue}>{display.toFixed(1)}</Text>
        <Text style={styles.readoutUnit}>{unit}</Text>
      </View>

      {/* Unit toggle */}
      <View style={styles.toggleWrap}>
        <View style={styles.toggle}>
          {(["kg", "lb"] as Unit[]).map((u) => (
            <Text
              key={u}
              onPress={() => switchUnit(u)}
              style={[styles.toggleLabel, unit === u && styles.toggleLabelActive]}
            >
              {u}
            </Text>
          ))}
        </View>
      </View>

      {/* Ruler */}
      <View style={styles.rulerOuter} onLayout={onLayout}>
        {containerWidth > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: halfVisible }}
            onContentSizeChange={onContentSizeChange}
            onScroll={handleScroll}
            onScrollEndDrag={commit}
            onMomentumScrollEnd={commit}
            scrollEventThrottle={16}
            decelerationRate="fast"
          >
            <View style={{ width: totalWidth, height: 70 }}>
              {ticks.map((v) => {
                const isMajor = v % 5 === 0;
                const i = v - range.min;
                return (
                  <View key={v} style={[styles.tickWrap, { left: i * PX_PER_UNIT }]}>
                    <View style={[styles.tick, isMajor ? styles.tickMajor : styles.tickMinor]} />
                    {isMajor && <Text style={styles.tickLabel}>{v}</Text>}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
        {/* Fixed center pointer */}
        <View pointerEvents="none" style={styles.pointerWrap}>
          <View style={styles.pointerTriangle} />
          <View style={styles.pointerLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readoutRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", marginBottom: 20 },
  readoutValue: { fontFamily: fonts.headlineXl, fontSize: 72, color: colors.ink, lineHeight: 76 },
  readoutUnit: { fontFamily: fonts.headlineMd, fontSize: 22, color: colors.inkSoft, marginLeft: 8 },
  toggleWrap: { alignItems: "center", marginBottom: 28 },
  toggle: {
    flexDirection: "row", backgroundColor: colors.surface, borderRadius: 999, padding: 4,
    borderWidth: 2, borderColor: colors.ink,
  },
  toggleLabel: {
    fontFamily: fonts.labelBold, fontSize: 14, color: colors.inkSoft,
    paddingVertical: 8, paddingHorizontal: 20, borderRadius: 999, overflow: "hidden",
  },
  toggleLabelActive: { backgroundColor: colors.accent, color: colors.ink },
  rulerOuter: {
    height: 130, borderTopWidth: 2, borderBottomWidth: 2, borderColor: colors.ink,
    backgroundColor: colors.surface, justifyContent: "center", overflow: "hidden",
  },
  tickWrap: { position: "absolute", top: 10, alignItems: "center", width: 1 },
  tick: { backgroundColor: colors.ink, borderRadius: 1 },
  tickMajor: { width: 3, height: 40 },
  tickMinor: { width: 2, height: 20 },
  tickLabel: {
    position: "absolute", top: 46, width: 30, marginLeft: -1, textAlign: "center",
    fontFamily: fonts.headlineMd, fontSize: 13, color: colors.ink,
  },
  pointerWrap: { position: "absolute", left: "50%", top: 0, width: 18, marginLeft: -9, alignItems: "center" },
  pointerTriangle: {
    width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 12,
    borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: colors.accent,
  },
  pointerLine: { width: 3, height: 118, backgroundColor: colors.accent },
});