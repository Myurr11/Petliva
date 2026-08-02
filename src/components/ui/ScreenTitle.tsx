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
  wrap: { marginTop: 28, marginBottom: 24 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.amberDeep,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, lineHeight: 32 },
  sub: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 14, marginTop: 8, lineHeight: 20 },
});
