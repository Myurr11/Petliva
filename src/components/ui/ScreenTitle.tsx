import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme/tokens";

export function ScreenTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginTop: 16, marginBottom: 28 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.accentDeep,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: { fontFamily: fonts.headlineLg, fontSize: 26, color: colors.ink, textAlign: "center", lineHeight: 32 },
  sub: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 14.5, marginTop: 10, lineHeight: 21, textAlign: "center" },
});
