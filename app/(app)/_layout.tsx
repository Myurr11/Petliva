import { Stack } from "expo-router";
import { colors } from "@/theme/tokens";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.appBg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="appointment-detail" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="appointment-history" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="log-meal" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="add-restock" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="add-food" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="add-appointment" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="add-medication" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
    </Stack>
  );
}
