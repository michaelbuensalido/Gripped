import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Dumbbell, BarChart2, BookOpen, Settings as SettingsIcon, type LucideIcon } from 'lucide-react-native';
import { initializeDatabase } from '../db/schema';
import { FLOATING_ISLAND_STYLE, THEME_COLORS } from '../constants/theme';
import { ActiveSessionMiniBar } from '../components/session/ActiveSessionMiniBar';
import { useSessionStore } from '../store/sessionStore';
import '../global.css';

function TabIcon({
  Icon,
  color,
  size,
  focused,
}: {
  Icon: LucideIcon;
  color: any;
  size: number;
  focused: boolean;
}) {
  return (
    <View
      style={
        focused
          ? {
              backgroundColor: 'rgba(142, 124, 255, 0.18)',
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderRadius: 14,
            }
          : {
              paddingHorizontal: 16,
              paddingVertical: 4,
            }
      }
    >
      <Icon size={size} color={color} />
    </View>
  );
}

function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomMargin = Math.max(insets.bottom, 16);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomMargin,
          left: 18,
          right: 18,
          height: 64,
          borderRadius: 32,
          paddingBottom: 8,
          paddingTop: 6,
          ...FLOATING_ISLAND_STYLE,
        },
        tabBarActiveTintColor: THEME_COLORS.lavender,
        tabBarInactiveTintColor: THEME_COLORS.sublabelGray,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={Home} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={Dumbbell} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={BarChart2} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="logbook"
        options={{
          title: 'Logbook',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon Icon={BookOpen} size={size} color={color} focused={focused} />
          ),
        }}
      />

      {/* Hidden screens — no tab entries, full-screen layout */}
      <Tabs.Screen name="settings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="history" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="session/new" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="session/camera" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="session/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="session/detail/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="routines/editor" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

export default function RootLayout() {
  useEffect(() => {
    initializeDatabase()
      .then(() => {
        useSessionStore.getState().initActiveSession();
      })
      .catch(console.error);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#131316' }}>
      <ImageBackground
        source={require('../assets/speckled_mat_bg.jpg')}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.22 }}
        resizeMode="cover"
      />
      <SafeAreaProvider>
        <StatusBar style="light" />
        <TabLayout />
        {/* Global floating mini-bar — shows on all tabs when a session is active */}
        <ActiveSessionMiniBar />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
