import { Redirect } from "expo-router";
import { useAppStore } from "@/store/useAppStore";

export default function Index() {
  const isAuthed = useAppStore((s) => s.isAuthed);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  if (!isAuthed) return <Redirect href="/(auth)/sign-in" />;
  if (!hasOnboarded) return <Redirect href="/(onboarding)/profile" />;
  return <Redirect href="/(app)/home" />;
}
