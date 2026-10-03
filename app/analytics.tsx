import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Menu, TrendingUp } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResultDonut } from '../components/ui/ResultDonut';
import { useProgressStats, useRecentSessions } from '../db/hooks';
import { useTheme } from '../theme/useTheme';
import { triggerHaptic } from '../utils/haptics';

import GradeProgressionTimeline from '../components/analytics/GradeProgressionTimeline';
import AscentPyramid from '../components/analytics/AscentPyramid';
import WallAngleRadar from '../components/analytics/WallAngleRadar';
import RootCauseFailureChart from '../components/analytics/RootCauseFailureChart';

// Upward green sparkline component
function SparklineGreen() {
  return (
    <Svg width={38} height={24} viewBox="0 0 38 24">
      <Path
        d="M2 20 L12 16 L20 18 L28 8 L36 4"
        fill="none"
        stroke="#72FF9B"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Recent Routes data with realistic 3D hold images
const RECENT_ROUTES = [
  {
    id: '1',
    title: 'Ripple Effect',
    grade: 'V6',
    result: 'Flash',
    resultColor: '#72FF9B',
    date: 'Feb 23',
    image: require('../assets/holds-images/teal_ripple_disc.png'),
  },
  {
    id: '2',
    title: 'Slab Rise',
    grade: 'V5',
    result: 'Top',
    resultColor: '#FFFFFF',
    date: 'Feb 21',
    image: require('../assets/holds-images/pink_pinch.png'),
  },
  {
    id: '3',
    title: 'Kars Sloper',
    grade: 'V7',
    result: 'Top',
    resultColor: '#FFFFFF',
    date: 'Feb 18',
    image: require('../assets/holds-images/v7-kars-sloper.png'),
  },
];

export default function ProgressScreen() {
  const router = useRouter();
  const { colors, type, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [showDeepDive, setShowDeepDive] = useState(false);

  const stats = useProgressStats('30d');
  const { resultCounts, avgGradeLast20, weeklyVolume, rates } = stats;

  const weeklyVolVal = weeklyVolume.length > 0 ? weeklyVolume[weeklyVolume.length - 1].count : 12;
  const flashRateVal = rates?.flashRate ? `${rates.flashRate}%` : '32%';
  const avgGradeVal = avgGradeLast20 ? `V${avgGradeLast20}` : 'V7';

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
        {/* 1. Header Bar: Title on Left, Menu Icon Button on Right */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '700', fontFamily: type.display.fontFamily, letterSpacing: -0.5 }}>
              Your Progress
            </Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: 14, fontFamily: type.body.fontFamily, marginTop: 4 }}>
              This month's climbing overview
            </Text>
          </View>

          {/* Menu Button Circle */}
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
            }}
          >
            <Menu size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* 2. Hero Donut Chart Section */}
        <View style={{ marginBottom: 28, alignItems: 'center' }}>
          <ResultDonut
            flashCount={resultCounts.flash || 10}
            topCount={resultCounts.top || 6}
            attemptCount={resultCounts.attempt || 3}
            failCount={1}
            centerGrade={avgGradeVal}
            centerLabel="Average of last 20 routes"
          />
        </View>

        {/* 3. PERFORMANCE TRENDS Section */}
        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.45)',
            fontSize: 10.5,
            fontWeight: '600',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          PERFORMANCE TRENDS
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
          {/* Tile 1: Weekly Volume */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(22, 22, 30, 0.85)',
              borderRadius: 20,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: 9.5,
                fontWeight: '600',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                lineHeight: 13,
              }}
            >
              {'WEEKLY\nVOLUME'}
            </Text>
            <Text style={{ color: '#9A85FF', fontSize: 12, fontWeight: '600', marginTop: 6 }}>
              Routes
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 2 }}>
              {weeklyVolVal}
            </Text>
          </View>

          {/* Tile 2: Flash Efficiency */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(22, 22, 30, 0.85)',
              borderRadius: 20,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: 9.5,
                fontWeight: '600',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                lineHeight: 13,
              }}
            >
              {'FLASH\nEFFICIENCY'}
            </Text>
            <Text style={{ color: '#72FF9B', fontSize: 12, fontWeight: '600', marginTop: 6 }}>
              Flashes
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {flashRateVal}
              </Text>
              <SparklineGreen />
            </View>
          </View>

          {/* Tile 3: Overhang Strength */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(22, 22, 30, 0.85)',
              borderRadius: 20,
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            <Text
              style={{
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: 9.5,
                fontWeight: '600',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                lineHeight: 13,
              }}
            >
              {'OVERHANG\nSTRENGTH'}
            </Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, fontWeight: '500', marginTop: 6 }}>
              Improving
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 2 }}>
              +8%
            </Text>
          </View>
        </View>

        {/* 4. RECENT ROUTES SUMMARY Section */}
        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.45)',
            fontSize: 10.5,
            fontWeight: '600',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          RECENT ROUTES SUMMARY
        </Text>

        <View style={{ gap: 12, marginBottom: 28 }}>
          {RECENT_ROUTES.map((route) => (
            <TouchableOpacity
              key={route.id}
              activeOpacity={0.8}
              onPress={() => router.push(`/project/${route.id}` as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(22, 22, 30, 0.85)',
                borderRadius: 20,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.06)',
                gap: 14,
              }}
            >
              {/* Hold Thumbnail */}
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Image
                  source={route.image}
                  style={{ width: 42, height: 42 }}
                  resizeMode="contain"
                />
              </View>

              {/* Title & Grade */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: type.heading.fontFamily }}>
                  {route.title}
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 13, marginTop: 2 }}>
                  {route.grade}
                </Text>
              </View>

              {/* Status Pill & Date */}
              <View style={{ alignItems: 'flex-end', gap: 3 }}>
                <Text style={{ color: route.resultColor, fontSize: 14, fontWeight: '700' }}>
                  {route.result}
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 12 }}>
                  {route.date}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. Deep Dive Telemetry Toggle */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setShowDeepDive(!showDeepDive);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: radius.pill,
            marginBottom: 20,
            gap: 8,
          }}
        >
          <TrendingUp size={16} color="#9A85FF" />
          <Text style={{ color: '#D4CCFF', fontSize: 13, fontWeight: '600' }}>
            {showDeepDive ? 'Hide Telemetry Charts' : 'Show Advanced Telemetry Charts'}
          </Text>
        </TouchableOpacity>

        {showDeepDive && (
          <View style={{ gap: 20, marginBottom: 20 }}>
            <GradeProgressionTimeline />
            <AscentPyramid />
            <WallAngleRadar />
            <RootCauseFailureChart />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
