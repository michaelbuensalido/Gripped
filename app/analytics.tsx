import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import {
  getAnalyticsOverview,
  getAllSessionSummaries,
  type SessionSummary,
} from '../db/queries';
import { DonutChart, type DonutSegment } from '../components/analytics/DonutChart';
import { THEME_COLORS, FLOATING_CARD_STYLE } from '../constants/theme';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { ClimbingHoldGraphic, type HoldType } from '../components/ui/ClimbingHoldGraphic';

interface DisplayRoute {
  id: string;
  title: string;
  grade: string;
  holdType: HoldType;
  outcome: 'Flash' | 'Top';
  date: string;
}

// ── Performance Trend Card ─────────────────────────────────────────────────
function TrendCard({
  label,
  sublabel,
  sublabelColor,
  value,
  indicator,
}: {
  label: string;
  sublabel: string;
  sublabelColor: string;
  value: string;
  indicator?: string;
}) {
  return (
    <View
      style={[
        FLOATING_CARD_STYLE,
        {
          padding: 14,
          minHeight: 112,
          justifyContent: 'space-between',
          borderRadius: 20,
        },
      ]}
      className="flex-1"
    >
      {/* Top Label: 11pt, uppercase, 600 weight, #8E8E9A */}
      <Text
        style={{
          color: '#8E8E9A',
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.8,
        }}
        className="uppercase"
      >
        {label}
      </Text>

      {/* Middle Colored Label: 13pt, 500 weight */}
      <Text
        style={{
          color: sublabelColor,
          fontSize: 13,
          fontWeight: '500',
          marginTop: 4,
          marginBottom: 6,
        }}
      >
        {sublabel}
      </Text>

      {/* Bottom Metric: 24pt, bold */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: '700',
          }}
        >
          {value}
        </Text>
        {indicator && (
          <Text
            style={{
              color: '#6EE756',
              fontSize: 18,
              fontWeight: '700',
              marginLeft: 3,
            }}
          >
            {indicator}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Recent Route Row Item ──────────────────────────────────────────────────
function RecentRouteRow({
  route,
  isLast,
}: {
  route: DisplayRoute;
  isLast: boolean;
}) {
  const isFlash = route.outcome === 'Flash';
  const badgeColor = isFlash ? '#6EE756' : '#8E7CFF';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Miniature thumbnail of 3D climbing hold */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: '#141416',
          borderColor: '#2D2D35',
          borderWidth: 1,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <ClimbingHoldGraphic type={route.holdType} size={48} borderRadius={14} />
      </View>

      {/* Title & Grade */}
      <View style={{ flex: 1, marginRight: 8 }}>
        {/* Route Name: 16pt, SemiBold, white */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
          }}
          numberOfLines={1}
        >
          {route.title}
        </Text>
        {/* Grade Subtext: 13pt, color: #8A8A96 */}
        <Text
          style={{
            fontSize: 13,
            color: '#8A8A96',
            marginTop: 2,
            fontWeight: '500',
          }}
        >
          {route.grade}
        </Text>
      </View>

      {/* Status Badges & Date */}
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        {/* Status Badge: 14pt, SemiBold */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: badgeColor,
          }}
        >
          {route.outcome}
        </Text>
        {/* Date stamp: clean muted text */}
        <Text
          style={{
            fontSize: 12,
            color: '#8A8A96',
            fontWeight: '400',
          }}
        >
          {route.date}
        </Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      try {
        setSessions(getAllSessionSummaries());
      } catch (e) {
        console.error('Failed to load progress data:', e);
      }
    }, [])
  );

  // 4 split segments matching reference mockup
  const donutSegments: DonutSegment[] = [
    { label: 'Flash', value: 42, color: '#6EE756' },
    { label: 'Top', value: 28, color: '#8E7CFF' },
    { label: 'Attempt', value: 18, color: '#E8DEB5' },
    { label: 'Fail', value: 12, color: '#484852' },
  ];

  // Recent routes matching reference mockup
  const displayRoutes: DisplayRoute[] = [
    {
      id: 'route-1',
      title: 'Ripple Effect',
      grade: 'V6',
      holdType: 'ripple-effect',
      outcome: 'Flash',
      date: 'Sep 10',
    },
    {
      id: 'route-2',
      title: 'Slab Rise',
      grade: 'V5',
      holdType: 'slab-rise',
      outcome: 'Top',
      date: 'Sep 9',
    },
    {
      id: 'route-3',
      title: 'Crimpy Corner',
      grade: 'V7',
      holdType: 'kars-sloper',
      outcome: 'Flash',
      date: 'Sep 9',
    },
    {
      id: 'route-4',
      title: 'Dyno Thunder',
      grade: 'V4',
      holdType: 'poly-edge',
      outcome: 'Top',
      date: 'Sep 8',
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top > 0 ? insets.top : 12,
          paddingBottom: insets.bottom + 100,
        }}
      >
        {/* ── 1. Cleaned Header Section ──────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 12,
            marginBottom: 20,
          }}
        >
          <View>
            {/* Title: 34pt, Bold/SemiBold */}
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 34,
                fontWeight: '700',
                letterSpacing: -0.5,
              }}
            >
              Your Progress
            </Text>
            {/* Subtitle: 14pt (text-sm), color: #9A9AA6 */}
            <Text
              style={{
                color: '#9A9AA6',
                fontSize: 14,
                marginTop: 4,
                fontWeight: '400',
              }}
            >
              This month's climbing overview
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: THEME_COLORS.cardSurface,
              borderColor: THEME_COLORS.cardBorder,
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SlidersHorizontal size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* ── 2. Hero Donut Chart Card ───────────────────────── */}
        <View
          style={[
            FLOATING_CARD_STYLE,
            {
              padding: 20,
              minHeight: 248,
              justifyContent: 'center',
              borderRadius: 24,
            },
          ]}
          className="mx-4"
        >
          <DonutChart
            segments={donutSegments}
            centerLabel="V7"
            centerSubLabel="Average of last 20 routes"
          />
        </View>

        {/* ── 3. Section Title: PERFORMANCE TRENDS ───────────── */}
        <View style={{ marginTop: 24, marginBottom: 12, paddingHorizontal: 16 }}>
          <Text
            style={{
              color: '#8A8A98',
              fontSize: 13,
              fontWeight: '700',
              letterSpacing: 1.2,
            }}
            className="uppercase"
          >
            PERFORMANCE TRENDS
          </Text>
        </View>

        {/* ── 4. Performance Trends Cards (3-Column Grid) ────── */}
        <View className="flex-row gap-2.5 px-4">
          {/* Card 1: WEEKLY VOLUME -> Routes (purple) -> 12 */}
          <TrendCard
            label="WEEKLY VOLUME"
            sublabel="Routes"
            sublabelColor="#8E7CFF"
            value="12"
          />

          {/* Card 2: FLASH EFFICIENCY -> Flashes (green) -> 32% ↗ */}
          <TrendCard
            label="FLASH EFFICIENCY"
            sublabel="Flashes"
            sublabelColor="#6EE756"
            value="32%"
            indicator="↗"
          />

          {/* Card 3: OVERHANG STRENGTH -> Improving (white) -> +8% */}
          <TrendCard
            label="OVERHANG STRENGTH"
            sublabel="Improving"
            sublabelColor="#FFFFFF"
            value="+8%"
          />
        </View>

        {/* ── 5. Section Title: RECENT ROUTES SUMMARY ────────── */}
        <View style={{ marginTop: 24, marginBottom: 12, paddingHorizontal: 16 }}>
          <Text
            style={{
              color: '#8A8A98',
              fontSize: 13,
              fontWeight: '700',
              letterSpacing: 1.2,
            }}
            className="uppercase"
          >
            RECENT ROUTES SUMMARY
          </Text>
        </View>

        {/* ── Recent Routes Summary List Card ────────────────── */}
        <View
          style={[
            FLOATING_CARD_STYLE,
            {
              borderRadius: 24,
              paddingHorizontal: 18,
              paddingVertical: 6,
              marginBottom: 20,
            },
          ]}
          className="mx-4"
        >
          {displayRoutes.map((route, idx) => (
            <RecentRouteRow
              key={route.id}
              route={route}
              isLast={idx === displayRoutes.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
