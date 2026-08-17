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
import { supabase, fetchUserPetRecords } from "@/lib/supabase";

const WELCOME_BACK_ILLUSTRATION = require("../../assets/illustrations/welcome-back.png");
const LETS_GET_STARTED_ILLUSTRATION = require("../../assets/illustrations/lets-get-started.png");

// Where Supabase sends people after they click the email-confirmation link.
// Without this, Supabase falls back to the dashboard's "Site URL" (often
// left as the localhost default), which is why the link was landing on a
// browser "can't connect" page even though the email itself *did* get
// confirmed. Point it at a small hosted success page instead — see
// docs/email-confirmed.html and the Supabase setup note in the README.
const EMAIL_REDIRECT_TO = process.env.EXPO_PUBLIC_EMAIL_CONFIRM_URL;

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signUp" | "signIn">("signIn");
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((s) => s.setUser);
  const setAuthed = useAppStore((s) => s.setAuthed);
  const setHydrating = useAppStore((s) => s.setHydrating);
  const hydrateFromServer = useAppStore((s) => s.hydrateFromServer);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  // Pulls this account's actual pets from Supabase before deciding where to
  // route. Without this, a fresh sign-in after a sign-out (which wipes the
  // local cache) would fall back to the stale local `hasOnboarded` flag and
  // send an existing user through onboarding again even though their pets
  // are still safely stored server-side.
  async function afterAuth() {
    setAuthed(true);
    setHydrating(true);
    try {
      const pets = await fetchUserPetRecords();
      hydrateFromServer(pets);
      router.replace(Object.keys(pets).length > 0 ? "/(app)/(tabs)/home" : "/(onboarding)/profile");
    } catch (e: any) {
      Alert.alert(
        "Signed in, but couldn't load your data",
        "Check your connection and pull to refresh once you're in."
      );
      router.replace(hasOnboarded ? "/(app)/(tabs)/home" : "/(onboarding)/profile");
    } finally {
      setHydrating(false);
    }
  }

  async function handleEmailContinue() {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (mode === "signUp") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: EMAIL_REDIRECT_TO ? { emailRedirectTo: EMAIL_REDIRECT_TO } : undefined,
        });
        if (error) throw error;

        // Supabase's signUp() deliberately looks identical (no error) whether
        // the email is brand new or already belongs to a confirmed account —
        // that's an anti-enumeration measure, not a bug. The one reliable
        // signal it gives us is `identities`: an empty array means "this
        // email is already registered," even though no error was thrown.
        // Without this check, someone with an existing account gets told
        // "check your email" every time they accidentally hit Create Account
        // instead of Log in — which is exactly what was happening here.
        const alreadyRegistered = (data.user?.identities?.length ?? 0) === 0;
        if (alreadyRegistered) {
          Alert.alert(
            "You already have an account",
            `${email} is already registered. Log in instead.`
          );
          setMode("signIn");
          return;
        }

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
      await afterAuth();
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
        await afterAuth();
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
