import { useEffect, useMemo, useRef } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from "@expo-google-fonts/ibm-plex-mono";
import { PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans";
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from "@expo-google-fonts/be-vietnam-pro";
import { colors } from "@/theme/tokens";
import { supabase, fetchUserPetRecords } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import { syncAllNotifications } from "@/lib/notifications";
import type { Session } from "@supabase/supabase-js";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setAuthed = useAppStore((s) => s.setAuthed);
  const setHydrating = useAppStore((s) => s.setHydrating);
  const hydrateFromServer = useAppStore((s) => s.hydrateFromServer);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Feeding, appointment, and medication reminders are fully derived from
  // the pet data (meals/day, wet-food days, appointment date+time,
  // medication schedule/duration — plus any custom reminder overrides the
  // user sets) rather than being configured separately, so the simplest
  // correct place to keep them in sync is here: whenever the relevant
  // slice of pet data changes, cancel and reschedule. The signature only
  // includes fields that actually affect what gets scheduled, so editing
  // something unrelated (e.g. a diagnosis note) doesn't trigger a
  // pointless reschedule.
  const pets = useAppStore((s) => s.pets);
  const notifSignature = useMemo(
    () =>
      JSON.stringify(
        Object.values(pets).map((r) => ({
          id: r.id,
          name: r.pet.name,
          foods: r.foods.map((f) => ({ n: f.foodName, m: f.mealsPerDay, d: f.daysOfWeek, rt: f.reminderTimes })),
          appts: r.vet.appointments.map((a) => ({ id: a.id, date: a.date, time: a.time, h: a.hospitalName, c: a.completed, ro: a.reminderOffsetsMinutes })),
          meds: r.vet.medications.map((m) => ({ id: m.id, s: m.schedule, sd: m.startDate, dd: m.durationDays, rt: m.reminderTimes })),
        }))
      ),
    [pets]
  );
  const lastSyncedSignature = useRef<string | null>(null);
  useEffect(() => {
    if (lastSyncedSignature.current === notifSignature) return;
    lastSyncedSignature.current = notifSignature;
    syncAllNotifications(pets).catch((e) => console.warn("Failed to sync notifications:", e));
  }, [notifSignature]);

  // Local `isAuthed` (persisted via AsyncStorage) can drift from the real
  // Supabase session — e.g. signing up while "Confirm email" is on leaves
  // no active session until the confirmation link is clicked. Always trust
  // the live session as truth, in both directions.
  //
  // The local `pets` cache can drift too — most notably, sign-out wipes it
  // on purpose (see profile.tsx). So whenever a session is present, we
  // re-fetch the user's pets from Supabase and rebuild local state from
  // that, rather than trusting whatever AsyncStorage still has lying
  // around. This is what lets someone sign back into an account that has
  // already completed onboarding without being sent through it again.
  useEffect(() => {
    let cancelled = false;

    async function syncSession(session: Session | null) {
      setAuthed(!!session);
      if (!session) return;
      setHydrating(true);
      try {
        const pets = await fetchUserPetRecords();
        if (!cancelled) hydrateFromServer(pets);
      } catch (e) {
        console.warn("Failed to load pets from Supabase:", e);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => syncSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.appBg },
        }}
      />
    </SafeAreaProvider>
  );
}
