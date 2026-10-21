import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, ChevronDown, Check } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ScalePressable } from '../components/ui/ScalePressable';
import { ResultDonut } from '../components/ui/ResultDonut';
import { SessionRow } from '../components/ui/SessionRow';
import { GradePyramid } from '../components/ui/GradePyramid';
import WallAngleRadar from '../components/analytics/WallAngleRadar';
import { useProgressStats, useRecentSessions } from '../db/hooks';
import { getSessionSummary } from '../db/queries';
import { useTheme } from '../theme/useTheme';
import { usePreferences } from '../utils/preferences';
import { triggerHaptic } from '../utils/haptics';

type Period = '7d' | '30d' | '90d' | '1y' | 'all';
const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 3 Months',
  '1y': 'Last Year',
  'all': 'All Time',
};
const PERIODS: { label: string; value: Period }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '3M', value: '90d' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'all' },
];

// Dynamic weekly sparkline vector driven by real SQLite data
function SparklineGreen({ values }: { values: number[] }) {
  const { colors } = useTheme();
  const d = useMemo(() => {
    if (!values || values.length < 2) {
      return 'M2 20 L12 16 L20 18 L28 8 L36 4';
    }
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);
    return values
      .map((v, idx) => {
        const x = 2 + (idx / (values.length - 1)) * 34;
        const y = 20 - ((v - min) / range) * 16;
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [values]);

  return (
    <Svg width={36} height={22} viewBox="0 0 38 24">
      <Path
        d={d}
        fill="none"
        stroke={colors.flash}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ProgressScreen() {
  const router = useRouter();
  const { colors, type, space, radius } = useTheme();
  const { formatGrade } = usePreferences();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('30d');
  const [isPeriodSheetOpen, setPeriodSheetOpen] = useState(false);

  const stats = useProgressStats(period);
  const recentSessions = useRecentSessions().slice(0, 5);
  const { resultCounts, avgGradeLast20, weeklyVolume, rates, hardestSendGrade, gradePyramid, sparklineTrends } = stats;

  const weeklyVolVal = weeklyVolume.length > 0 ? weeklyVolume[weeklyVolume.length - 1].count : 0;
  const flashRateVal = rates?.flashRate ? `${rates.flashRate}%` : '0%';
  const avgGradeVal = avgGradeLast20 ? formatGrade(avgGradeLast20) : '-';
  const hardestSendVal = hardestSendGrade != null ? formatGrade(hardestSendGrade) : '-';

  const recentSummaries = useMemo(
    () => recentSessions.map((s: any) => ({ session: s, summary: getSessionSummary(s.id) })),
    [recentSessions]
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 8,
          paddingBottom: 130, // Space for floating tab dock
          paddingHorizontal: 20,
        }}
      >
        {/* 1. Header Bar: Title on Left, Menu Icon Button on Right */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 34, fontWeight: '700', fontFamily: type.display.fontFamily, letterSpacing: -0.5 }}>
              Your Progress
            </Text>
            <ScalePressable
              haptic="light"
              activeScale={0.96}
              onPress={() => setPeriodSheetOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, minHeight: 44 }}
            >
              <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600', fontFamily: type.body.fontFamily }}>
                {PERIOD_LABELS[period]}
              </Text>
              <ChevronDown size={16} color={colors.accent} strokeWidth={2.5} />
            </ScalePressable>
          </View>
          <ScalePressable
            haptic="light"
            activeScale={0.92}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => router.push('/settings')}
          >
            <Settings size={20} color={colors.text} />
          </ScalePressable>
        </View>

        <View>
        {/* 3. Result Donut Hero Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            paddingVertical: 20,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
            alignItems: 'center',
          }}
        >
          <ResultDonut
            flashCount={resultCounts.flash || 0}
            topCount={resultCounts.top || 0}
            attemptCount={resultCounts.attempt || 0}
            failCount={0}
            centerGrade={avgGradeVal}
            centerLabel="Average of last 20 routes"
          />
        </View>

        {/* 4. PERFORMANCE TRENDS Section Header & 3 Bento Tiles */}
        <Text
          style={{
            color: colors.textMuted,
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
          <ScalePressable
            haptic="light"
            activeScale={0.96}
            onPress={() => router.push(`/analytics/stat-detail?stat=volume&period=${period}` as any)}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 9.5,
                fontWeight: '600',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                lineHeight: 13,
              }}
            >
              {'WEEKLY\nVOLUME'}
            </Text>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600', marginTop: 6 }}>
              Routes
            </Text>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 2 }}>
              {weeklyVolVal}
            </Text>
          </ScalePressable>

          {/* Tile 2: Flash Efficiency */}
          <ScalePressable
            haptic="light"
            activeScale={0.96}
            onPress={() => router.push(`/analytics/stat-detail?stat=flash&period=${period}` as any)}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 9.5,
                fontWeight: '600',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                lineHeight: 13,
              }}
            >
              {'FLASH\nEFFICIENCY'}
            </Text>
            <Text style={{ color: colors.flash, fontSize: 12, fontWeight: '600', marginTop: 6 }}>
              Flashes
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                {flashRateVal}
              </Text>
              {parseFloat(flashRateVal) > 0 && <SparklineGreen values={sparklineTrends?.flashRateSparkline ?? []} />}
            </View>
          </ScalePressable>

          {/* Tile 3: Overhang / Hardest */}
          <ScalePressable
            haptic="light"
            activeScale={0.96}
            onPress={() => router.push(`/analytics/stat-detail?stat=hardest&period=${period}` as any)}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 9.5,
                fontWeight: '600',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                lineHeight: 13,
              }}
            >
              {'HARDEST\nSEND'}
            </Text>
            <Text style={{ color: colors.textWhiteSecondary, fontSize: 12, fontWeight: '500', marginTop: 6 }}>
              Peak
            </Text>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 2 }}>
              {hardestSendVal}
            </Text>
          </ScalePressable>
        </View>

        {/* 5. Sends by Grade (Grade Pyramid) */}
        <SectionHeader title="Sends by Grade" />
        <Card style={{ marginBottom: 28, backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border }}>
          <GradePyramid
            data={gradePyramid}
            formatGrade={formatGrade}
            onPressGrade={(grade) => {
              router.push(`/analytics/stat-detail?stat=grade&grade=${grade}&period=${period}` as any);
            }}
          />
        </Card>

        {/* 6. Wall Angle Proficiency */}
        <SectionHeader title="Wall Angle Proficiency" />
        <View style={{ marginBottom: 28 }}>
          <WallAngleRadar data={stats.wallAngleRates} />
        </View>

        {/* 7. Recent Sessions List */}
        <SectionHeader title="Recent Sessions" action={{ label: "See all", onPress: () => router.push('/profile') }} />
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 40, backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border }}>
          {recentSummaries.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>No recent sessions</Text>
            </View>
          ) : (
            recentSummaries.map(({ session: s, summary }, i: number) => (
              <SessionRow
                key={s.id}
                id={s.id}
                gymName={s.gymName}
                startedAt={s.startTime}
                durationMs={summary.duration}
                climbs={summary.climbs}
                sends={summary.sends}
                hardestGrade={summary.hardestGradeRaw !== '–' ? summary.hardestGradeRaw : undefined}
                isLast={i === recentSummaries.length - 1}
              />
            ))
          )}
        </Card>
      </View></ScrollView>
          {/* Custom Spatial Action Sheet for Period Selection */}
      <Modal visible={isPeriodSheetOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim }}>
          <Pressable style={{ flex: 1 }} onPress={() => setPeriodSheetOpen(false)} />
          <View style={{ 
            backgroundColor: colors.materialBase, 
            borderTopLeftRadius: radius.xl, 
            borderTopRightRadius: radius.xl, 
            borderWidth: 1, 
            borderColor: colors.border, 
            padding: space.xl, 
            paddingBottom: Math.max(insets.bottom, space.xl) 
          }}>
            {/* Drag Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: space.xl }} />
            
            <Text style={[type.heading, { color: colors.textWhiteMuted, fontSize: 12, letterSpacing: 1.5, marginBottom: space.lg, textTransform: 'uppercase' }]}>
              Select Timeframe
            </Text>

            <View style={{ gap: space.xs }}>
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => {
                const isActive = period === p;
                return (
                  <ScalePressable
                    key={p}
                    haptic="selection"
                    activeScale={0.97}
                    onPress={() => {
                      setPeriod(p);
                      setPeriodSheetOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: space.md,
                      paddingHorizontal: space.sm,
                      backgroundColor: isActive ? colors.accentSoft : 'transparent',
                      borderRadius: radius.md,
                      minHeight: 48,
                    }}
                  >
                    <Text style={[type.heading, { color: isActive ? colors.accent : colors.textWhitePrimary, fontSize: 16, fontWeight: isActive ? '700' : '400' }]}>
                      {PERIOD_LABELS[p]}
                    </Text>
                    {isActive && <Check size={20} color={colors.accent} />}
                  </ScalePressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}