import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Dog, Cat } from "@/components/icons";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts, radii } from "@/theme/tokens";
import { NeoBox } from "@/components/ui/NeoBox";
import type { PetType } from "@/types";

export default function PetTypeStep() {
  const pet = useAppStore((s) => s.pet);
  const setPet = useAppStore((s) => s.setPet);

  const select = (type: PetType) => setPet({ type, breed: "" });
  const canContinue = !!pet.name && !!pet.type;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.dots}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Who are we feeding?</Text>
          <Text style={styles.sub}>Tell us a bit about your companion so we can tailor their experience.</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Pet's Name</Text>
          <TextInput
            value={pet.name}
            onChangeText={(v) => setPet({ name: v })}
            placeholder="e.g., Fluffy"
            placeholderTextColor={colors.outlineVariant}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Pet Type</Text>
          <View style={styles.grid}>
            {[
              { v: "dog" as const, Icon: Dog, label: "Dog" },
              { v: "cat" as const, Icon: Cat, label: "Cat" },
            ].map(({ v, Icon, label }) => {
              const active = pet.type === v;
              return (
                <Pressable key={v} onPress={() => select(v)} style={styles.cardWrap}>
                  <NeoBox depth={active ? 2 : 4} style={[styles.card, active && { backgroundColor: colors.accent }]}>
                    <Icon size={32} color={colors.ink} />
                    <Text style={styles.cardLabel}>{label}</Text>
                  </NeoBox>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => canContinue && router.push("/(onboarding)/pet-breed")} disabled={!canContinue}>
          <NeoBox depth={4} radius={999} style={[styles.ctaBox, { backgroundColor: canContinue ? colors.accent : colors.track }]}>
            <Text style={styles.ctaLabel}>Continue</Text>
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
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  titleWrap: { alignItems: "center", marginBottom: 32 },
  title: { fontFamily: fonts.headlineLg, fontSize: 28, color: colors.ink, textAlign: "center", marginBottom: 10 },
  sub: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, textAlign: "center", lineHeight: 22 },
  field: { marginBottom: 28 },
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink, marginBottom: 10 },
  input: {
    width: "100%", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8,
    backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 16, color: colors.ink, borderWidth: 2, borderColor: colors.ink,
  },
  grid: { flexDirection: "row", gap: 16 },
  cardWrap: { flex: 1 },
  card: { alignItems: "center", justifyContent: "center", height: 96, gap: 8 },
  cardLabel: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink },
  footer: { paddingHorizontal: 20, paddingVertical: 20, backgroundColor: colors.appBg },
  ctaBox: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  ctaLabel: { fontFamily: fonts.headlineMd, fontSize: 18, color: colors.ink },
});
