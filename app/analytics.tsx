import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import {
  getAnalyticsOverview,
  getAllSessionSummaries,
  getGradePyramid,
  getRecentSessionTrends,
  getRecentBoulderLogs,
  type AnalyticsOverview,
  type SessionSummary,
  type GradePyramidRow,
  type SessionTrendPoint,
  type RecentBoulderLog,
} from '../db/queries';
import { DonutChart, type DonutSegment } from '../components/analytics/DonutChart';
import { InteractiveGradePyramid } from '../components/analytics/InteractiveGradePyramid';
import { SessionTrendChart } from '../components/analytics/SessionTrendChart';
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
          borderColor: '#2C2C35',
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
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null);
  const [pyramid, setPyramid] = React.useState<GradePyramidRow[]>([]);
  const [trends, setTrends] = React.useState<SessionTrendPoint[]>([]);
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [recentLogs, setRecentLogs] = React.useState<RecentBoulderLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      try {
        setOverview(getAnalyticsOverview());
        setPyramid(getGradePyramid(null));
        setTrends(getRecentSessionTrends(7));
        setSessions(getAllSessionSummaries());
        setRecentLogs(getRecentBoulderLogs(6));
      } catch (e) {
        console.error('Failed to load progress data:', e);
      }
    }, [])
  );

  const hasClimbs = (overview?.totalClimbs ?? 0) > 0;

  // Donut chart segments: real SQLite breakdown or mockup defaults
  const donutSegments: DonutSegment[] =
    hasClimbs && overview
      ? [
          { label: 'Flash', value: overview.outcomeBreakdown.flashes, color: '#6EE756' },
          { label: 'Top', value: overview.outcomeBreakdown.sends, color: '#8E7CFF' },
          { label: 'Attempt', value: overview.outcomeBreakdown.attempts, color: '#E8DEB5' },
        ]
      : [
          { label: 'Flash', value: 42, color: '#6EE756' },
          { label: 'Top', value: 28, color: '#8E7CFF' },
          { label: 'Attempt', value: 18, color: '#E8DEB5' },
          { label: 'Fail', value: 12, color: '#484852' },
        ];

  const centerLabel = hasClimbs
    ? (overview?.hardestSend ?? (overview ? `V${Math.round(overview.sendRate / 10)}` : '—'))
    : '—';

  const centerSubLabel = hasClimbs
    ? `${overview?.totalClimbs ?? 0} total climbs`
    : 'No climbs logged yet';

  const HOLD_TYPE_LIST: HoldType[] = [
    'ripple-effect',
    'slab-rise',
    'kars-sloper',
    'poly-edge',
    'purple-sloper',
    'yellow-jug',
    'orange-facet',
  ];

  const displayRoutes: DisplayRoute[] = recentLogs.map((log, index) => {
    const d = new Date(log.timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${months[d.getMonth()]} ${d.getDate()}`;
    const holdType = HOLD_TYPE_LIST[index % HOLD_TYPE_LIST.length];
    return {
      id: log.id,
      title: `${log.gymName} • #${log.attempts} att`,
      grade: log.gradeRaw,
      holdType,
      outcome: log.outcome === 'flash' ? 'Flash' : 'Top',
      date: dateStr,
    };
  });

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
            centerLabel={centerLabel}
            centerSubLabel={centerSubLabel}
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
          {/* Card 1: VOLUME -> Routes (purple) -> totalClimbs */}
          <TrendCard
            label="VOLUME"
            sublabel="Routes"
            sublabelColor="#8E7CFF"
            value={String(overview?.totalClimbs ?? 0)}
          />

          {/* Card 2: FLASH EFFICIENCY -> Flashes (green) -> flashRate% */}
          <TrendCard
            label="FLASH EFFICIENCY"
            sublabel="Flashes"
            sublabelColor="#6EE756"
            value={`${overview?.flashRate ?? 0}%`}
            indicator={overview && overview.flashRate > 0 ? '↗' : undefined}
          />

          {/* Card 3: SEND RATE -> Send Rate (white) -> sendRate% */}
          <TrendCard
            label="SEND RATE"
            sublabel={overview && overview.sendRate > 50 ? 'Improving' : 'Baseline'}
            sublabelColor="#FFFFFF"
            value={`${overview?.sendRate ?? 0}%`}
            indicator={overview && overview.sendRate > 50 ? '↗' : undefined}
          />
        </View>

        {/* ── 5. Section Title: GRADE PYRAMID ────────────────── */}
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
            GRADE PYRAMID
          </Text>
        </View>

        {/* Grade Pyramid Card */}
        <View
          style={[
            FLOATING_CARD_STYLE,
            {
              borderRadius: 24,
              padding: 20,
              marginBottom: 8,
            },
          ]}
          className="mx-4"
        >
          <InteractiveGradePyramid pyramid={pyramid} />
        </View>

        {/* ── 6. Section Title: SESSION TRENDS ───────────────── */}
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
            SESSION TRENDS
          </Text>
        </View>

        {/* Session Trends Card */}
        <View
          style={[
            FLOATING_CARD_STYLE,
            {
              borderRadius: 24,
              padding: 20,
              marginBottom: 8,
            },
          ]}
          className="mx-4"
        >
          <SessionTrendChart trends={trends} />
        </View>

        {/* ── 7. Section Title: RECENT ROUTES SUMMARY ────────── */}
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
              paddingVertical: displayRoutes.length > 0 ? 6 : 24,
              marginBottom: 20,
              alignItems: displayRoutes.length > 0 ? 'stretch' : 'center',
            },
          ]}
          className="mx-4"
        >
          {displayRoutes.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>
                No routes logged yet
              </Text>
              <Text style={{ color: '#8A8A96', fontSize: 13, textAlign: 'center' }}>
                Completed boulders from your sessions will appear here.
              </Text>
            </View>
          ) : (
            displayRoutes.map((route, idx) => (
              <RecentRouteRow
                key={route.id}
                route={route}
                isLast={idx === displayRoutes.length - 1}
              />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
