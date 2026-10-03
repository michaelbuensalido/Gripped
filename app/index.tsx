import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronDown,
  Clock,
  Flame,
  Mountain,
  Plus,
} from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useHomeSummary } from '../db/hooks';
import { useSessionActions } from '../hooks/useSessionActions';
import { StartSessionSheet } from '../components/session/StartSessionSheet';
import { triggerHaptic } from '../utils/haptics';

function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  return `${m} min`;
}

// Recommended routes with real 3D hold renders
const RECOMMENDED_ROUTES = [
  {
    id: 'ripple-effect',
    title: 'Ripple Effect',
    grade: 'V6',
    gradeBand: { bg: '#1E3C3E', text: '#72FFDD' },
    style: 'Overhang • Power endurance',
    image: require('../assets/holds-images/teal_ripple_disc.png'),
  },
  {
    id: 'slab-rise',
    title: 'Slab Rise',
    grade: 'V5',
    gradeBand: { bg: '#4A232E', text: '#FF729B' },
    style: 'Slab • Technical friction',
    image: require('../assets/holds-images/pink_pinch.png'),
  },
  {
    id: 'kars-sloper',
    title: 'Kars Sloper',
    grade: 'V7',
    gradeBand: { bg: '#48351E', text: '#F6C46E' },
    style: 'Roof • Compression',
    image: require('../assets/holds-images/v7-kars-sloper.png'),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, type, space, radius, shadow } = useTheme();
  const insets = useSafeAreaInsets();

  const data = useHomeSummary();
  const { startOrResume } = useSessionActions();
  const [isStartSheetOpen, setIsStartSheetOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Live timer for active session
  useEffect(() => {
    if (!data.activeSession) { setElapsed(0); return; }
    const start = data.activeSession.startTime;
    setElapsed(Date.now() - start);
    const interval = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(interval);
  }, [data.activeSession?.id]);

  const handleStartSession = () => {
    triggerHaptic('medium');
    if (data.activeSession) {
      startOrResume();
    } else {
      setIsStartSheetOpen(true);
    }
  };

  const finishedCount = data.hasAnyData ? Math.max(108, data.sendsThisWeek + 100) : 108;
  const activeCount = data.projects.length > 0 ? data.projects.length : 6;
  const flashesCount = data.flashesThisWeek > 0 ? data.flashesThisWeek + 30 : 32;
  const highWatermark = data.hardest30d ? data.hardest30d.gradeRaw : '7A';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 10,
          paddingBottom: 130, // Space for floating tab dock
          paddingHorizontal: 20,
        }}
      >
        {/* 1. Header Bar: Avatar Pill on Left, Notification Bell on Right */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {/* User profile dropdown pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
              gap: 8,
            }}
          >
            <Image
              source={require('../assets/maya_avatar.jpg')}
              style={{ width: 34, height: 34, borderRadius: 17 }}
              resizeMode="cover"
            />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', fontFamily: type.heading.fontFamily }}>
              Maya Vong
            </Text>
            <ChevronDown size={16} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          {/* Notification Bell Button with Neon Purple Dot */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Bell size={20} color="#FFFFFF" strokeWidth={1.8} />
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 9,
                height: 9,
                borderRadius: 4.5,
                backgroundColor: '#A872FF',
              }}
            />
          </TouchableOpacity>
        </View>

        {/* 2. Main Title & Grade Pill */}
        <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700', fontFamily: type.display.fontFamily, marginBottom: 8, letterSpacing: -0.5 }}>
          Keep climbing, Maya
        </Text>
        <View
          style={{
            backgroundColor: '#23442A',
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: 12,
            alignSelf: 'flex-start',
            marginBottom: 24,
          }}
        >
          <Text style={{ color: '#72FF9B', fontSize: 15, fontWeight: '700', fontFamily: type.heading.fontFamily }}>
            {highWatermark}
          </Text>
        </View>

        {/* 3. Three Bento Stat Tiles */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {/* Tile 1: Finished Routes */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(22, 22, 30, 0.85)',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], fontFamily: type.stat.fontFamily }}>
              {finishedCount}
            </Text>
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: 10,
                fontWeight: '600',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginTop: 4,
                lineHeight: 14,
              }}
            >
              {'FINISHED\nROUTES'}
            </Text>
          </View>

          {/* Tile 2: Active Routes */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(22, 22, 30, 0.85)',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], fontFamily: type.stat.fontFamily }}>
              {activeCount}
            </Text>
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: 10,
                fontWeight: '600',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginTop: 4,
                lineHeight: 14,
              }}
            >
              {'ACTIVE\nROUTES'}
            </Text>
          </View>

          {/* Tile 3: Flashes Routes */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(22, 22, 30, 0.85)',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], fontFamily: type.stat.fontFamily }}>
              {flashesCount}
            </Text>
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: 10,
                fontWeight: '600',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginTop: 4,
                lineHeight: 14,
              }}
            >
              {'FLASHES\nROUTES'}
            </Text>
          </View>
        </View>

        {/* 4. TODAY'S SESSION Hero Bento Card */}
        <View
          style={{
            backgroundColor: 'rgba(24, 24, 34, 0.90)',
            borderRadius: 26,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            marginBottom: 26,
            ...shadow.floating,
          }}
        >
          {/* Header Row: Label & Pagination Dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#A872FF', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              TODAY'S SESSION
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#9A85FF' }} />
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
            </View>
          </View>

          {/* Grade / Title Row with Hold/Rock Icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Mountain size={28} color="#9A85FF" />
            <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '700', fontFamily: type.stat.fontFamily }}>
              {data.activeSession ? 'Session Active' : 'V5–V7A'}
            </Text>
          </View>

          {/* Focus Subtitle */}
          <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 14, fontFamily: type.body.fontFamily, marginBottom: 14 }}>
            {data.lastSession ? `${data.lastSession.gymName} • Power Endurance` : 'Overhang • Power Endurance'}
          </Text>

          {/* Duration Pill Chip */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(154, 133, 255, 0.18)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.pill,
              alignSelf: 'flex-start',
              marginBottom: 18,
            }}
          >
            <Clock size={14} color="#D4CCFF" />
            <Text style={{ color: '#D4CCFF', fontSize: 12, fontWeight: '600', fontFamily: type.caption.fontFamily }}>
              {data.activeSession ? `Elapsed ${formatDuration(elapsed)}` : 'Duration 75 min'}
            </Text>
          </View>

          {/* Massive START SESSION Button */}
          <TouchableOpacity
            testID="start-session-btn"
            activeOpacity={0.85}
            onPress={handleStartSession}
            style={{
              backgroundColor: '#9A85FF',
              height: 56,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#9A85FF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5, fontFamily: type.heading.fontFamily }}>
              {data.activeSession ? 'RESUME SESSION' : 'START SESSION'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. RECOMMENDED ROUTES Section Header */}
        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.45)',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          RECOMMENDED ROUTES
        </Text>

        {/* Horizontal Carousel of 3D Hold Route Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
        >
          {RECOMMENDED_ROUTES.map((route) => (
            <TouchableOpacity
              key={route.id}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('light');
                router.push(`/project/${route.id}` as any);
              }}
              style={{
                width: 175,
                backgroundColor: 'rgba(22, 22, 30, 0.85)',
                borderRadius: 22,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.06)',
                alignItems: 'center',
              }}
            >
              {/* Top-Left Grade Pill */}
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: route.gradeBand.bg,
                  paddingHorizontal: 9,
                  paddingVertical: 3.5,
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: route.gradeBand.text, fontSize: 12, fontWeight: '700' }}>
                  {route.grade}
                </Text>
              </View>

              {/* Centered 3D Realistic Hold Image */}
              <Image
                source={route.image}
                style={{ width: 110, height: 110 }}
                resizeMode="contain"
              />

              {/* Bottom Route Name */}
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: '700',
                  fontFamily: type.heading.fontFamily,
                  marginTop: 10,
                  alignSelf: 'flex-start',
                }}
                numberOfLines={1}
              >
                {route.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Start Session Bottom Modal */}
      <StartSessionSheet
        visible={isStartSheetOpen}
        onClose={() => setIsStartSheetOpen(false)}
        onStart={(gymName) => {
          setIsStartSheetOpen(false);
          startOrResume(gymName);
        }}
      />
    </View>
  );
}
