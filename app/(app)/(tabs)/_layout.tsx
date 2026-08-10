import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, BarChart, Package, Stethoscope } from "@/components/icons";
import { colors, fonts } from "@/theme/tokens";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#8A8078",
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          left: 20,
          right: 20,
          bottom: Math.max(insets.bottom, 12) + 8,
          height: 64,
          borderRadius: 999,
          backgroundColor: colors.ink,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          // Floating pill wants a real lifted look, unlike the flat-card
          // hard shadows elsewhere — a soft native shadow reads correctly
          // here since it's a system chrome element, not a content card.
          shadowColor: colors.ink,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarItemStyle: { borderRadius: 999 },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="insights"
        options={{ title: "Insights", tabBarIcon: ({ color, size }) => <BarChart color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="vet"
        options={{ title: "Vet", tabBarIcon: ({ color, size }) => <Stethoscope color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="inventory"
        options={{ title: "Food", tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }}
      />
    </Tabs>
  );
}
