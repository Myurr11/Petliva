import { Stack } from "expo-router";
import { colors } from "@/theme/tokens";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        contentStyle: { backgroundColor: colors.surface },
      }}
    />
  );
}
