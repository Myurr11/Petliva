import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { TextField } from "@/components/ui/TextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { useAppStore } from "@/store/useAppStore";
import { colors } from "@/theme/tokens";

export default function ProfileStep() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgressDots step={1} total={7} />
      <ScreenTitle
        eyebrow="Step 1 of 7"
        title="Tell us about you"
        sub="This helps us personalize reminders and vet-visit notes."
      />
      <TextField
        label="Your name"
        placeholder="Mayur Joshi"
        value={user.name}
        onChangeText={(v) => setUser({ name: v })}
      />
      <TextField label="Phone (optional)" placeholder="+91 " keyboardType="phone-pad" />
      <View style={styles.spacer} />
      <PrimaryButton
        label="Continue"
        icon={ChevronRight}
        disabled={!user.name}
        onPress={() => router.push("/(onboarding)/pet-type")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1 },
  spacer: { flex: 1, minHeight: 12 },
});
