import { Stack } from "expo-router";
import { colors } from "@/theme/tokens";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
      <Stack.Screen name="home" />
      <Stack.Screen
        name="log-meal"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}
