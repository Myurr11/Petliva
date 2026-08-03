import { Stack } from "expo-router";
import { colors } from "@/theme/tokens";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="log-meal" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="add-restock" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
    </Stack>
  );
}
