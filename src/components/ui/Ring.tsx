import React from "react";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/theme/tokens";

export function Ring({ pct, size = 180 }: { pct: number; size?: number }) {
  const r = 72;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <Svg width={size} height={size} viewBox="0 0 180 180">
      <Circle cx="90" cy="90" r={r} fill="none" stroke={colors.track} strokeWidth="14" />
      <Circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke={colors.accent}
        strokeWidth="14"
        strokeLinecap="butt"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c - (clamped / 100) * c}
        rotation="-90"
        origin="90, 90"
      />
      <Circle cx="90" cy="90" r={r + 7} fill="none" stroke={colors.ink} strokeWidth="2" />
      <Circle cx="90" cy="90" r={r - 7} fill="none" stroke={colors.ink} strokeWidth="2" />
    </Svg>
  );
}
