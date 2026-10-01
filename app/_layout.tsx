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
  Target,
  ChartNoAxesCombined,
  BookOpen,
  type LucideIcon,
} from "lucide-react-native";
import { initializeDatabase } from "../db/schema";
import { useSessionStore } from '../store/sessionStore';
import { useActiveSession } from '../db/hooks';
import { triggerHaptic } from "../utils/haptics";
import { notificationEngine } from "../services/notificationEngine";
import "../global.css";

import { FloatingTabBar } from "../components/ui/FloatingTabBar";
import { GlobalSessionBanner } from "../components/ui/GlobalSessionBanner";

function TabLayout() {
  const activeSession = useActiveSession();
  const isSessionActive = activeSession !== null;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"     options={{ title: "Home" }} />
      <Tabs.Screen name="projects"  options={{ title: "Projects" }} />
      <Tabs.Screen name="analytics" options={{ title: "Progress" }} />
      <Tabs.Screen name="profile"   options={{ title: "Profile" }} />
      <Tabs.Screen name="gallery"   options={{ title: "Gallery", href: null }} />

      {/* Hidden screens — no tab bar entry */}
      <Tabs.Screen name="settings"             options={{ href: null }} />
      <Tabs.Screen name="session/new"          options={{ href: null }} />
      <Tabs.Screen name="session/active"       options={{ href: null }} />
      <Tabs.Screen name="session/index"        options={{ href: null }} />
      <Tabs.Screen name="session/end"          options={{ href: null }} />
      <Tabs.Screen name="session/summary"      options={{ href: null }} />
      <Tabs.Screen name="session/detail/[id]"  options={{ href: null }} />
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
    (async () => {
      try {
        await initializeDatabase();
        // initActiveSession is removed
        setIsDbReady(true);
        notificationEngine.requestPermissions();
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#111113" }}>
      <ImageBackground
        source={require("../assets/speckled_mat_bg.jpg")}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.22 }}
        resizeMode="cover"
      />
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {isDbReady ? <TabLayout /> : null}
        {isDbReady && <GlobalSessionBanner />}
        {/* Global floating mini-bar */}
        
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
