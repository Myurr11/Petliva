import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, BarChart, Package, Stethoscope } from "@/components/icons";
import { colors, fonts } from "@/theme/tokens";

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const barWidth = Math.min(Math.max(screenWidth - 40, 280), 300);

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, bottom: Math.max(insets.bottom, 12) + 8, alignItems: "center" }}
    >
      <View
        style={{
          width: barWidth,
          height: 70,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 5,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: colors.ink,
          shadowColor: colors.ink,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 12,
        }}
      >
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options;
          const focused = state.index === index;
          const label = typeof options.tabBarLabel === "string" ? options.tabBarLabel : options.title ?? route.name;
          const icon = options.tabBarIcon?.({ focused, color: focused ? colors.accent : "#8A8078", size: 22 });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 2 }}
            >
              {icon}
              <Text style={{ marginTop: 1, fontFamily: fonts.bodyMedium, fontSize: 9.5, color: focused ? colors.accent : "#8A8078" }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="insights" options={{ title: "Insights", tabBarIcon: ({ color, size }) => <BarChart color={color} size={size} /> }} />
      <Tabs.Screen name="vet" options={{ title: "Vet", tabBarIcon: ({ color, size }) => <Stethoscope color={color} size={size} /> }} />
      <Tabs.Screen name="inventory" options={{ title: "Food", tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
