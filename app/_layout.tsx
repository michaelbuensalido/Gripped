import "react-native-get-random-values";
import React, { useEffect } from "react";
import {
  View,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  TrendingUp,
  Route,
  ChartNoAxesCombined,
  BookOpen,
  type LucideIcon,
} from "lucide-react-native";
import { initDatabase } from "../services/database";
import { ActiveSessionMiniBar } from "../components/session/ActiveSessionMiniBar";
import { useSessionStore } from "../store/sessionStore";
import { triggerHaptic } from "../utils/haptics";
import { notificationEngine } from "../services/notificationEngine";
import "../global.css";

function CustomTabBar({ state, descriptors, navigation }: any) {
  // STRICTLY limit the rendered tabs to the 4 core routes
  const coreRoutes = ["index", "routines", "analytics", "logbook"];
  const visibleRoutes = state.routes.filter((route: any) =>
    coreRoutes.includes(route.name),
  );

  const currentRouteName = state.routes[state.index]?.name;
  if (!coreRoutes.includes(currentRouteName)) {
    return null;
  }

  return (
    <View style={styles.tabBarContainer}>
      {visibleRoutes.map((route: any) => {
        const { options } = descriptors[route.key];
        const isFocused = state.routes[state.index].key === route.key;

        const onPress = () => {
          triggerHaptic("light");
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        let IconComponent: LucideIcon = TrendingUp;
        let label = options.title || route.name;

        if (route.name === "index") {
          IconComponent = TrendingUp;
          label = "Home";
        } else if (route.name === "routines" || route.name === "routes") {
          IconComponent = Route;
          label = "Routes";
        } else if (route.name === "analytics" || route.name === "progress") {
          IconComponent = ChartNoAxesCombined;
          label = "Progress";
        } else if (route.name === "logbook") {
          IconComponent = BookOpen;
          label = "Logbook";
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <View
              style={[
                styles.iconWrapper,
                isFocused && styles.iconWrapperActive,
              ]}
            >
              <IconComponent
                size={20}
                color={isFocused ? "#9D7BFF" : "#8A8A98"}
                strokeWidth={isFocused ? 2.2 : 2}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? "#9D7BFF" : "#8A8A98",
                  fontWeight: isFocused ? "700" : "500",
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TabLayout() {
  const activeSession = useSessionStore((s) => s.activeSession);
  const isSessionActive = activeSession !== null;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="routines" options={{ title: "Routes" }} />
      <Tabs.Screen name="analytics" options={{ title: "Progress" }} />
      <Tabs.Screen name="logbook" options={{ title: "Logbook" }} />

      {/* Explicitly hide all other screens so they don't become tabs */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="session/new" options={{ href: null }} />
      <Tabs.Screen name="session/active" options={{ href: null }} />
      <Tabs.Screen name="session/camera" options={{ href: null }} />
      <Tabs.Screen name="session/[id]" options={{ href: null }} />
      <Tabs.Screen name="session/detail/[id]" options={{ href: null }} />
      <Tabs.Screen name="routines/editor" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(28, 28, 34, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  iconWrapperActive: {
    backgroundColor: "rgba(157, 123, 255, 0.18)",
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
});

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = React.useState(false);
  useEffect(() => {
    try {
      initDatabase();
      setIsDbReady(true);
      // Initialize background notifications for rest timer
      notificationEngine.requestPermissions();
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#131316" }}>
      <ImageBackground
        source={require("../assets/speckled_mat_bg.jpg")}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.22 }}
        resizeMode="cover"
      />
      <SafeAreaProvider>
        <StatusBar style="light" />
        {isDbReady ? <TabLayout /> : null}
        {/* Global floating mini-bar */}
        <ActiveSessionMiniBar />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
