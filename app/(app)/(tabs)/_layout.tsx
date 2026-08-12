import { Tabs } from "expo-router";
import { Platform, View, TouchableOpacity, Dimensions, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, BarChart, Package, Stethoscope } from "@/components/icons";
import { colors, fonts } from "@/theme/tokens";

const { width } = Dimensions.get("window");

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={{
        position: "absolute",
        bottom: Math.max(insets.bottom, 12) + 8,
        alignSelf: "center",
        backgroundColor: colors.ink,
        borderRadius: 999,
        flexDirection: "row",
        height: 64,
        paddingHorizontal: 8,
        paddingVertical: 8,
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
        width: width * 0.75,
        maxWidth: 400,
        minWidth: 280,
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const Icon = options.tabBarIcon;
        
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 4,
              borderRadius: 999,
            }}
            activeOpacity={0.7}
          >
            {Icon && (
              <Icon 
                color={isFocused ? colors.accent : "#8A8078"} 
                size={24} 
              />
            )}
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.bodyMedium,
                color: isFocused ? colors.accent : "#8A8078",
                marginTop: 2,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#8A8078",
        tabBarShowLabel: true,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ 
          title: "Home", 
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> 
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{ 
          title: "Insights", 
          tabBarIcon: ({ color, size }) => <BarChart color={color} size={size} /> 
        }}
      />
      <Tabs.Screen
        name="vet"
        options={{ 
          title: "Vet", 
          tabBarIcon: ({ color, size }) => <Stethoscope color={color} size={size} /> 
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{ 
          title: "Food", 
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> 
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ href: null }}
      />
    </Tabs>
  );
}