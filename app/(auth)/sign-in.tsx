import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Mail } from "@/components/icons";
import { TextField } from "@/components/ui/TextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { NeoBox } from "@/components/ui/NeoBox";
import { colors, fonts } from "@/theme/tokens";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";

const WELCOME_BACK_ILLUSTRATION = require("../../assets/illustrations/welcome-back.png");
const LETS_GET_STARTED_ILLUSTRATION = require("../../assets/illustrations/lets-get-started.png");

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signUp" | "signIn">("signUp");
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((s) => s.setUser);
  const setAuthed = useAppStore((s) => s.setAuthed);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  function afterAuth() {
    setAuthed(true);
    router.replace(hasOnboarded ? "/(app)/(tabs)/home" : "/(onboarding)/profile");
  }

  async function handleEmailContinue() {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (mode === "signUp") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          Alert.alert(
            "Check your email",
            "We sent a confirmation link to " + email + ". Click it, then come back and log in here."
          );
          setMode("signIn");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      setUser({ email });
      afterAuth();
    } catch (e: any) {
      Alert.alert("Couldn't sign in", e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL("auth-callback");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === "success" && result.url) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(result.url);
        if (exErr) throw exErr;
        afterAuth();
      }
    } catch (e: any) {
      Alert.alert("Google sign-in failed", e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Image
            source={mode === "signUp" ? LETS_GET_STARTED_ILLUSTRATION : WELCOME_BACK_ILLUSTRATION}
            style={styles.heroIllustration}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Bowlkeeper</Text>
          <Text style={styles.tagline}>Feed on schedule. Track every gram.</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Email"
            placeholder="you@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Password"
            placeholder="At least 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <PrimaryButton
            label={mode === "signUp" ? "Create account" : "Log in"}
            icon={loading ? undefined : Mail}
            onPress={handleEmailContinue}
            disabled={loading}
            style={{ marginBottom: 14 }}
          />
          {loading && <ActivityIndicator color={colors.ink} style={{ marginBottom: 14 }} />}

          <Pressable onPress={handleGoogle} disabled={loading}>
            <NeoBox depth={4} radius={999} style={styles.googleBox}>
              <Text style={styles.googleBtnLabel}>Continue with Google</Text>
            </NeoBox>
          </Pressable>

          <Pressable onPress={() => setMode(mode === "signUp" ? "signIn" : "signUp")} style={styles.switchModeBtn}>
            <Text style={styles.switchModeText}>
              {mode === "signUp" ? "Already have an account? Log in" : "New here? Create an account"}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.terms}>By continuing you agree to the Terms & Privacy Policy.</Text>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.appBg },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  hero: { alignItems: "center", marginBottom: 32 },
  heroIllustration: { width: 168, height: 148, marginBottom: 6 },
  appName: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  tagline: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 8 },
  form: { width: "100%" },
  googleBox: {
    width: "100%", paddingVertical: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface,
  },
  googleBtnLabel: { fontFamily: fonts.labelBold, fontSize: 16, color: colors.ink },
  switchModeBtn: { marginTop: 18, alignItems: "center" },
  switchModeText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.accentDeep },
  terms: { textAlign: "center", fontSize: 11.5, color: colors.inkSoft, marginTop: 20 },
});
