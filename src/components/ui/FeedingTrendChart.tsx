import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { isSameDate } from "@/components/ui/CalendarGrid";
import { colors, fonts } from "@/theme/tokens";

export type DailyBucket = {
  date: Date;
  grams: number;
  dryGrams: number;
  wetGrams: number;
  meals: number;
};

export type TrendMode = "dry" | "wet" | "total";

interface Props {
  buckets: DailyBucket[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  dryTargetGrams: number;
  wetTargetGrams: number;
}

const MODES: { id: TrendMode; label: string }[] = [
  { id: "dry", label: "Dry" },
  { id: "wet", label: "Wet" },
  { id: "total", label: "Total" },
];

const BAR_GAP = 8;
const BAR_RADIUS = 6;
const Y_AXIS_WIDTH = 34;
const TOP_PADDING = 22;
const PLOT_HEIGHT = 118;
const DAY_LABEL_HEIGHT = 34;
const STROKE = 1.5;
const SELECTED_STROKE = 2.5;

function gramsToY(grams: number, chartMax: number, plotBottom: number) {
  if (!chartMax) return plotBottom;
  return plotBottom - (grams / chartMax) * PLOT_HEIGHT;
}

function formatTick(grams: number) {
  if (grams >= 1000) return `${Math.round(grams / 100) / 10}k`;
  return `${Math.round(grams)}g`;
}

function bucketGrams(bucket: DailyBucket, mode: TrendMode) {
  if (mode === "dry") return bucket.dryGrams;
  if (mode === "wet") return bucket.wetGrams;
  return bucket.grams;
}

function modeTarget(mode: TrendMode, dryTargetGrams: number, wetTargetGrams: number) {
  if (mode === "dry") return dryTargetGrams;
  if (mode === "wet") return wetTargetGrams;
  return dryTargetGrams + wetTargetGrams;
}

function modeBarColor(mode: TrendMode) {
  if (mode === "dry") return colors.accent;
  if (mode === "wet") return colors.sage;
  return colors.accent;
}

export function FeedingTrendChart({
  buckets,
  selectedDate,
  onSelectDate,
  dryTargetGrams,
  wetTargetGrams,
}: Props) {
  const [chartWidth, setChartWidth] = useState(0);
  const [mode, setMode] = useState<TrendMode>(() =>
    dryTargetGrams > 0 ? "dry" : wetTargetGrams > 0 ? "wet" : "total",
  );

  const dailyTargetGrams = modeTarget(mode, dryTargetGrams, wetTargetGrams);
  const plotLeft = Y_AXIS_WIDTH;
  const plotWidth = Math.max(chartWidth - plotLeft, 0);
  const plotBottom = TOP_PADDING + PLOT_HEIGHT;
  const svgHeight = plotBottom + DAY_LABEL_HEIGHT;
  const barCount = buckets.length || 1;
  const barWidth = plotWidth > 0 ? (plotWidth - BAR_GAP * (barCount - 1)) / barCount : 0;

  const maxLogged = Math.max(...buckets.map((b) => bucketGrams(b, mode)), 1);
  const chartMax = Math.max(dailyTargetGrams, maxLogged) * 1.2;
  const yTicks = Array.from(
    new Set([0, dailyTargetGrams > 0 ? dailyTargetGrams : null, chartMax].filter((v): v is number => v !== null && v >= 0)),
  ).sort((a, b) => a - b);

  function onLayout(event: LayoutChangeEvent) {
    setChartWidth(event.nativeEvent.layout.width);
  }

  function barX(index: number) {
    return plotLeft + index * (barWidth + BAR_GAP);
  }

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.modeRow}>
        {MODES.map((item) => {
          const active = mode === item.id;
          const target = modeTarget(item.id, dryTargetGrams, wetTargetGrams);
          return (
            <Pressable
              key={item.id}
              onPress={() => setMode(item.id)}
              style={[styles.modeChip, active && styles.modeChipActive]}
            >
              <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{item.label}</Text>
              {target > 0 && <Text style={styles.modeChipSub}>{target}g/day</Text>}
            </Pressable>
          );
        })}
      </View>

      {chartWidth > 0 && (
        <>
          <View style={{ width: chartWidth, height: svgHeight }}>
            <Svg width={chartWidth} height={svgHeight}>
              {yTicks.map((tick) => {
                const y = gramsToY(tick, chartMax, plotBottom);
                return (
                  <React.Fragment key={tick}>
                    <Line
                      x1={plotLeft}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke={tick === dailyTargetGrams && dailyTargetGrams > 0 ? colors.accentDeep : colors.track}
                      strokeWidth={tick === 0 ? STROKE : 1}
                      strokeDasharray={tick === dailyTargetGrams && dailyTargetGrams > 0 ? "6,4" : undefined}
                    />
                    <SvgText
                      x={Y_AXIS_WIDTH - 6}
                      y={y + 4}
                      textAnchor="end"
                      fontSize={9.5}
                      fontFamily={fonts.mono}
                      fill={tick === dailyTargetGrams && dailyTargetGrams > 0 ? colors.accentDeep : colors.inkSoft}
                    >
                      {formatTick(tick)}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {buckets.map((bucket, index) => {
                const x = barX(index);
                const centerX = x + barWidth / 2;
                const isSelected = isSameDate(bucket.date, selectedDate);
                const grams = bucketGrams(bucket, mode);
                const hasData = grams > 0;

                if (mode === "total" && bucket.grams > 0) {
                  const dryH = chartMax ? (bucket.dryGrams / chartMax) * PLOT_HEIGHT : 0;
                  const wetH = chartMax ? (bucket.wetGrams / chartMax) * PLOT_HEIGHT : 0;
                  const totalH = dryH + wetH;
                  const wetY = plotBottom - wetH;
                  const dryY = wetY - dryH;
                  const stackTop = plotBottom - totalH;

                  return (
                    <React.Fragment key={index}>
                      {isSelected && totalH > 0 && (
                        <Rect
                          x={x - 1.5}
                          y={stackTop - 1.5}
                          width={barWidth + 3}
                          height={totalH + 1.5}
                          rx={BAR_RADIUS + 1}
                          fill="none"
                          stroke={colors.accentDeep}
                          strokeWidth={SELECTED_STROKE}
                        />
                      )}
                      {bucket.wetGrams > 0 && (
                        <Rect
                          x={x}
                          y={wetY}
                          width={barWidth}
                          height={wetH}
                          rx={bucket.dryGrams > 0 ? 0 : BAR_RADIUS}
                          fill={colors.sage}
                          stroke={colors.ink}
                          strokeWidth={STROKE}
                        />
                      )}
                      {bucket.dryGrams > 0 && (
                        <Rect
                          x={x}
                          y={dryY}
                          width={barWidth}
                          height={dryH}
                          rx={BAR_RADIUS}
                          fill={colors.accent}
                          stroke={colors.ink}
                          strokeWidth={STROKE}
                        />
                      )}
                      <SvgText
                        x={centerX}
                        y={Math.max(stackTop - 6, TOP_PADDING + 10)}
                        textAnchor="middle"
                        fontSize={10.5}
                        fontFamily={fonts.monoSemibold}
                        fill={isSelected ? colors.accentDeep : colors.ink}
                      >
                        {`${bucket.grams}g`}
                      </SvgText>
                      {renderDayLabels(centerX, plotBottom, bucket.date, isSelected)}
                    </React.Fragment>
                  );
                }

                const barH = chartMax ? (grams / chartMax) * PLOT_HEIGHT : 0;
                const barY = plotBottom - barH;
                const fill = modeBarColor(mode);

                return (
                  <React.Fragment key={index}>
                    {hasData ? (
                      <>
                        {isSelected && (
                          <Rect
                            x={x - 1.5}
                            y={barY - 1.5}
                            width={barWidth + 3}
                            height={barH + 1.5}
                            rx={BAR_RADIUS + 1}
                            fill="none"
                            stroke={colors.accentDeep}
                            strokeWidth={SELECTED_STROKE}
                          />
                        )}
                        <Rect
                          x={x}
                          y={barY}
                          width={barWidth}
                          height={barH}
                          rx={BAR_RADIUS}
                          fill={fill}
                          stroke={colors.ink}
                          strokeWidth={STROKE}
                        />
                        <SvgText
                          x={centerX}
                          y={Math.max(barY - 6, TOP_PADDING + 10)}
                          textAnchor="middle"
                          fontSize={10.5}
                          fontFamily={fonts.monoSemibold}
                          fill={isSelected ? colors.accentDeep : colors.ink}
                        >
                          {`${grams}g`}
                        </SvgText>
                      </>
                    ) : (
                      <>
                        <Rect
                          x={x}
                          y={plotBottom - (isSelected ? 5 : 2)}
                          width={barWidth}
                          height={isSelected ? 5 : 2}
                          rx={2}
                          fill={isSelected ? fill : colors.track}
                          stroke={isSelected ? colors.ink : "none"}
                          strokeWidth={isSelected ? STROKE : 0}
                        />
                        {isSelected && (
                          <SvgText
                            x={centerX}
                            y={plotBottom - 10}
                            textAnchor="middle"
                            fontSize={10.5}
                            fontFamily={fonts.monoSemibold}
                            fill={colors.accentDeep}
                          >
                            0g
                          </SvgText>
                        )}
                      </>
                    )}
                    {renderDayLabels(centerX, plotBottom, bucket.date, isSelected)}
                  </React.Fragment>
                );
              })}
            </Svg>

            <View style={[StyleSheet.absoluteFill, styles.touchLayer]} pointerEvents="box-none">
              {buckets.map((bucket, index) => (
                <Pressable
                  key={index}
                  onPress={() => onSelectDate(bucket.date)}
                  style={{
                    position: "absolute",
                    left: barX(index),
                    top: TOP_PADDING,
                    width: barWidth,
                    height: PLOT_HEIGHT + DAY_LABEL_HEIGHT,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${bucket.date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}, ${bucketGrams(bucket, mode)} grams`}
                />
              ))}
            </View>
          </View>

          <View style={styles.legendRow}>
            {mode === "total" ? (
              <>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.legendText}>Dry</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.sage }]} />
                  <Text style={styles.legendText}>Wet</Text>
                </View>
              </>
            ) : (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: modeBarColor(mode) }]} />
                <Text style={styles.legendText}>{mode === "dry" ? "Dry fed" : "Wet fed"}</Text>
              </View>
            )}
            {dailyTargetGrams > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { borderColor: colors.accentDeep }]} />
                <Text style={styles.legendText}>Daily target</Text>
              </View>
            )}
            <Text style={styles.legendHint}>Tap a bar to select day</Text>
          </View>
        </>
      )}
    </View>
  );
}

function renderDayLabels(centerX: number, plotBottom: number, date: Date, isSelected: boolean) {
  return (
    <>
      <SvgText
        x={centerX}
        y={plotBottom + 14}
        textAnchor="middle"
        fontSize={10.5}
        fontFamily={isSelected ? fonts.labelBold : fonts.bodyMedium}
        fill={isSelected ? colors.accentDeep : colors.inkSoft}
      >
        {date.toLocaleDateString([], { weekday: "narrow" })}
      </SvgText>
      <SvgText
        x={centerX}
        y={plotBottom + 27}
        textAnchor="middle"
        fontSize={9.5}
        fontFamily={isSelected ? fonts.monoSemibold : fonts.mono}
        fill={isSelected ? colors.accentDeep : colors.inkSoft}
      >
        {date.getDate()}
      </SvgText>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 14, width: "100%" },
  modeChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    gap: 1,
  },
  modeChipActive: { backgroundColor: colors.accent },
  modeChipText: { fontFamily: fonts.labelBold, fontSize: 12, color: colors.ink },
  modeChipTextActive: { color: colors.ink },
  modeChipSub: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.inkSoft },
  touchLayer: { zIndex: 2 },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    borderTopWidth: 1.5,
    borderTopColor: colors.track,
    paddingTop: 10,
    width: "100%",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.ink },
  legendLine: { width: 14, height: 0, borderBottomWidth: 2, borderStyle: "dashed" },
  legendText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft },
  legendHint: { marginLeft: "auto", fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.accentDeep },
});
