import { Tabs } from "expo-router";
import { Home, BarChart, Package, Stethoscope } from "@/components/icons";
import { colors, fonts } from "@/theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#8A8078",
        tabBarStyle: { backgroundColor: colors.ink, borderTopWidth: 0, height: 64, paddingBottom: 10, paddingTop: 8 },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 10.5 },
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
