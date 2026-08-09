import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";

interface Props {
  children: React.ReactNode;
  depth?: number; // shadow offset in px — 4 for resting, 2 for "pressed"
  radius?: number;
  style?: ViewStyle;
}

const MARGIN_KEYS = [
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
  "marginHorizontal", "marginVertical", "marginStart", "marginEnd", "alignSelf",
];

/** Splits a style object into margin/positioning props (belong on the outer
 *  spacing wrapper) vs. everything else (belongs on the inner bordered box).
 *  Without this, a caller passing e.g. `marginBottom: 20` for normal sibling
 *  spacing would land on the inner box, which inflates the shadow rectangle
 *  behind it into a huge black gap instead of a crisp few-px offset — the
 *  shadow is sized to the *outer* wrapper's bounds, so anything that makes
 *  the outer wrapper taller/wider without also moving the inner box shows
 *  up as oversized shadow, not as spacing. */
function splitStyle(style?: ViewStyle) {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const key of Object.keys(flat)) {
    (MARGIN_KEYS.includes(key) ? outer : inner)[key] = flat[key];
  }
  return { outer, inner };
}

/**
 * Renders a flat, hard-edged offset "neo-brutalist" shadow — two solid
 * black/ink rectangles offset diagonally, not a blurred native shadow.
 * Native shadow props render as a soft blur on Android (via `elevation`)
 * rather than the crisp offset rectangle the reference design uses, so
 * this is built from stacked Views instead, which renders identically on
 * both platforms.
 */
export function NeoBox({ children, depth = 4, radius = 12, style }: Props) {
  const { outer, inner } = splitStyle(style);
  return (
    <View style={[{ paddingRight: depth, paddingBottom: depth }, outer]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { top: depth, left: depth, backgroundColor: colors.ink, borderRadius: radius },
        ]}
      />
      <View
        style={[
          { borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, borderRadius: radius },
          inner,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
