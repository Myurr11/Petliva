import React from "react";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/theme/tokens";

export interface RingSegment {
  /** Portion of the full ring occupied by this segment (0–100). */
  pct: number;
  color: string;
}

export function Ring({ pct, size = 180, segments }: { pct: number; size?: number; segments?: RingSegment[] }) {
  const r = 72;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const visibleSegments = segments ?? [{ pct: clamped, color: colors.accent }];
  let offset = 0;
  return (
    <Svg width={size} height={size} viewBox="0 0 180 180">
      <Circle cx="90" cy="90" r={r} fill="none" stroke={colors.track} strokeWidth="14" />
      {visibleSegments.map((segment, index) => {
        const length = (Math.max(0, Math.min(100, segment.pct)) / 100) * c;
        const start = offset;
        offset += length;
        if (length === 0) return null;
        return (
          <Circle
            key={index}
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke={segment.color}
            strokeWidth="14"
            strokeLinecap="butt"
            strokeDasharray={`${length} ${c - length}`}
            strokeDashoffset={-start}
            rotation="-90"
            origin="90, 90"
          />
        );
      })}
      <Circle cx="90" cy="90" r={r + 7} fill="none" stroke={colors.ink} strokeWidth="2" />
      <Circle cx="90" cy="90" r={r - 7} fill="none" stroke={colors.ink} strokeWidth="2" />
    </Svg>
  );
}
