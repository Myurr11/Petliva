import { View } from "react-native";
import { Redirect } from "expo-router";
import { useAppStore } from "@/store/useAppStore";

export default function Index() {
  const isAuthed = useAppStore((s) => s.isAuthed);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const isHydrating = useAppStore((s) => s.isHydrating);

  if (!isAuthed) return <Redirect href="/(auth)/sign-in" />;
  // A session exists but we're still pulling this account's pets from
  // Supabase — hold here instead of redirecting on the (possibly stale,
  // possibly empty) local `hasOnboarded` flag. Prevents a signed-in user
  // from being flashed into onboarding for a frame while their real data
  // is still loading.
  if (isHydrating) return <View style={{ flex: 1 }} />;
  if (!hasOnboarded) return <Redirect href="/(onboarding)/profile" />;
  return <Redirect href="/(app)/(tabs)/home" />;
}
