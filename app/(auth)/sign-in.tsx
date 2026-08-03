import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { PawPrint, Mail } from "@/components/icons";
import { TextField } from "@/components/ui/TextField";
import { colors, fonts } from "@/theme/tokens";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";

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
          // "Confirm email" is on in the Supabase project — the account
          // exists but there's no active session until the link is clicked.
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoBox}>
            <PawPrint color={colors.onInk} size={32} />
          </View>
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
          <Pressable style={styles.amberBtn} onPress={handleEmailContinue} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Mail size={17} color="#fff" />
                <Text style={styles.amberBtnLabel}>{mode === "signUp" ? "Create account" : "Log in"}</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.googleBtn} onPress={handleGoogle} disabled={loading}>
            <Text style={styles.googleBtnLabel}>Continue with Google</Text>
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
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  hero: { alignItems: "center", marginBottom: 44 },
  logoBox: {
    width: 68, height: 68, borderRadius: 20, backgroundColor: colors.ink,
    alignItems: "center", justifyContent: "center", marginBottom: 18,
  },
  appName: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  tagline: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 8 },
  form: { width: "100%" },
  amberBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.amber, paddingVertical: 14, borderRadius: 14, marginBottom: 12, minHeight: 48,
  },
  amberBtnLabel: { fontFamily: fonts.bodySemibold, color: "#fff", fontSize: 15 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: 14, borderRadius: 14,
  },
  googleBtnLabel: { fontFamily: fonts.bodySemibold, color: colors.ink, fontSize: 15 },
  switchModeBtn: { marginTop: 16, alignItems: "center" },
  switchModeText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.amberDeep },
  terms: { textAlign: "center", fontSize: 11.5, color: colors.inkSoft, marginTop: 20 },
});
