import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "@/components/icons";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { TextField } from "@/components/ui/TextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { useAppStore } from "@/store/useAppStore";
import { colors, fonts } from "@/theme/tokens";
import { supabase } from "@/lib/supabase";

export default function ProfileStep() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const resetAll = useAppStore((s) => s.resetAll);

  async function signOut() {
    await supabase.auth.signOut();
    resetAll();
    router.replace("/(auth)/sign-in");
  }

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
      <Pressable onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Not you? Sign out</Text>
      </Pressable>
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
  signOut: { alignSelf: "flex-start", marginTop: 4 },
  signOutText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkSoft, textDecorationLine: "underline" },
  spacer: { flex: 1, minHeight: 12 },
});
