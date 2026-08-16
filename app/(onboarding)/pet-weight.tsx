import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { RulerWeightPicker } from "@/components/ui/RulerWeightPicker";
import { NeoBox } from "@/components/ui/NeoBox";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts, radii } from "@/theme/tokens";

export default function PetWeightStep() {
  const pet = useAppStore((s) => s.pet);
  const setPet = useAppStore((s) => s.setPet);
  const [weightKg, setWeightKg] = useState(Number(pet.weightKg) || 5);
  const canGoBack = router.canGoBack();

  function handleChange(kg: number) {
    setWeightKg(kg);
    setPet({ weightKg: String(kg) });
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        {canGoBack ? (
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={20} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.dots}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={[styles.dot, i === 4 && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Image
          source={require("../../assets/illustrations/weight-scale.png")}
          style={styles.heroIllustration}
          resizeMode="contain"
        />
        <View style={styles.titleWrap}>
          <Text style={styles.title}>What's their current weight?</Text>
          <Text style={styles.sub}>This helps us calculate the perfect portion size.</Text>
        </View>

        <View style={styles.pickerWrap}>
          <RulerWeightPicker valueKg={weightKg} onChangeKg={handleChange} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={() => router.push("/(onboarding)/vaccination")}>
          <NeoBox depth={4} radius={999} style={{ ...styles.ctaBox, backgroundColor: colors.accent }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.ctaLabel}>Continue</Text>
              <ChevronRight size={18} color={colors.ink} />
            </View>
          </NeoBox>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.appBg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.ink,
  },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.track, borderWidth: 1.5, borderColor: colors.ink },
  dotActive: { backgroundColor: colors.accent, width: 16 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  heroIllustration: { width: 136, height: 112, alignSelf: "center", marginBottom: 4 },
  titleWrap: { alignItems: "center", marginBottom: 36 },
  title: { fontFamily: fonts.headlineLg, fontSize: 24, color: colors.ink, textAlign: "center", marginBottom: 8 },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, textAlign: "center" },
  pickerWrap: {},
  footer: { paddingHorizontal: 20, paddingVertical: 20, backgroundColor: colors.appBg },
  ctaBox: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  ctaLabel: { fontFamily: fonts.headlineMd, fontSize: 18, color: colors.ink },
});