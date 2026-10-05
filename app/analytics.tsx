import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Menu, ChevronDown, Check } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ResultDonut } from '../components/ui/ResultDonut';
import { SessionRow } from '../components/ui/SessionRow';
import { GradePyramid } from '../components/ui/GradePyramid';
import { useProgressStats, useRecentSessions } from '../db/hooks';
import { useTheme } from '../theme/useTheme';
import { triggerHaptic } from '../utils/haptics';

import GradeProgressionTimeline from '../components/analytics/GradeProgressionTimeline';
import AscentPyramid from '../components/analytics/AscentPyramid';
import WallAngleRadar from '../components/analytics/WallAngleRadar';
import RootCauseFailureChart from '../components/analytics/RootCauseFailureChart';
import { ACWRWidget } from '../components/analytics/ACWRWidget';
import { calculateACWR } from '../services/loadCalculations';

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

function formatGrade(idx: number) {
  return `V${idx}`;
}

// Upward green sparkline vector
function SparklineGreen() {
  return (
    <Svg width={36} height={22} viewBox="0 0 38 24">
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

export default function ProgressScreen() {
  const router = useRouter();
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('30d');
  const [isPeriodSheetOpen, setPeriodSheetOpen] = useState(false);

  const stats = useProgressStats(period);
  const recentSessions = useRecentSessions().slice(0, 5);
  const acwrData = React.useMemo(() => {
    try {
      return calculateACWR();
    } catch (e) {
      return null;
    }
  }, []);

  const { resultCounts, avgGradeLast20, weeklyVolume, rates, hardestSend, gradePyramid } = stats;

  const weeklyVolVal = weeklyVolume.length > 0 ? weeklyVolume[weeklyVolume.length - 1].count : 0;
  const flashRateVal = rates?.flashRate ? `${rates.flashRate}%` : '0%';
  const avgGradeVal = avgGradeLast20 ? formatGrade(avgGradeLast20) : '-';
  const hardestSendVal = hardestSend.length > 0 ? formatGrade(hardestSend[hardestSend.length - 1].max_grade) : '-';

  // Map Data for deep dive components
  const progressionData = hardestSend.map(item => ({
    date: item.week.split('-').pop() ?? item.week,
    gradeNum: item.max_grade,
    gradeRaw: formatGrade(item.max_grade)
  }));

  const ascentPyramidData = gradePyramid.map(item => ({
    grade: formatGrade(item.grade),
    flashes: item.flashes,
    sends: item.sends,
    attempts: 0
  }));

  const failureReasonMap = new Map(stats.failureReasons.map(r => [r.reason, r.count]));
  const totalFailures = stats.failureReasons.reduce((sum, r) => sum + r.count, 0);
  const getPercentage = (count: number) => totalFailures > 0 ? Math.round((count / totalFailures) * 100) : 0;
  const failureSegments = [
    { reason: 'pump', count: failureReasonMap.get('pump') || 0, percentage: getPercentage(failureReasonMap.get('pump') || 0), color: colors.danger, label: 'Pump' },
    { reason: 'foot_slip', count: failureReasonMap.get('foot_slip') || 0, percentage: getPercentage(failureReasonMap.get('foot_slip') || 0), color: colors.top, label: 'Foot Slip' },
    { reason: 'power', count: failureReasonMap.get('power') || 0, percentage: getPercentage(failureReasonMap.get('power') || 0), color: colors.flash, label: 'Power' },
    { reason: 'beta_error', count: failureReasonMap.get('beta_error') || 0, percentage: getPercentage(failureReasonMap.get('beta_error') || 0), color: colors.attempt, label: 'Beta Error' },
    { reason: 'fear', count: failureReasonMap.get('fear') || 0, percentage: getPercentage(failureReasonMap.get('fear') || 0), color: colors.fail, label: 'Fear' },
  ];

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
            <Text style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '700', fontFamily: type.display.fontFamily, letterSpacing: -0.5 }}>
              Your Progress
            </Text>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => { triggerHaptic('light'); setPeriodSheetOpen(true); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}
            >
              <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '600', fontFamily: type.heading.fontFamily }}>
                {PERIOD_LABELS[period]}
              </Text>
              <ChevronDown size={16} color={colors.accent} strokeWidth={2.5} />
            </TouchableOpacity>
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

        {/* 3. Result Donut Hero Card */}
        <View
          style={{
            backgroundColor: 'rgba(22, 22, 30, 0.85)',
            borderRadius: 24,
            paddingVertical: 20,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.06)',
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
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push(`/analytics/stat-detail?stat=volume&period=${period}` as any)}
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
          </TouchableOpacity>

          {/* Tile 2: Flash Efficiency */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push(`/analytics/stat-detail?stat=flash&period=${period}` as any)}
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
              {parseFloat(flashRateVal) > 0 && <SparklineGreen />}
            </View>
          </TouchableOpacity>

          {/* Tile 3: Overhang / Hardest */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push(`/analytics/stat-detail?stat=hardest&period=${period}` as any)}
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
              {'HARDEST\nSEND'}
            </Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, fontWeight: '500', marginTop: 6 }}>
              Peak
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 2 }}>
              {hardestSendVal}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. Sends by Grade (Grade Pyramid) */}
        <SectionHeader title="Sends by Grade" />
        <Card style={{ marginBottom: 28, backgroundColor: 'rgba(22, 22, 30, 0.85)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <GradePyramid data={gradePyramid} formatGrade={formatGrade} />
        </Card>

        {/* 6. Deep Dive Telemetry Section */}
        <SectionHeader title="Deep Dive" />
        <View style={{ gap: 18, marginBottom: 28 }}>
          <GradeProgressionTimeline data={progressionData.length > 0 ? progressionData : undefined} />
          <AscentPyramid data={ascentPyramidData.length > 0 ? ascentPyramidData : undefined} />
          <WallAngleRadar data={stats.wallAngleRates} />
          <RootCauseFailureChart segments={totalFailures > 0 ? failureSegments : undefined} totalFailures={totalFailures} />
          {acwrData && <ACWRWidget data={acwrData} />}
        </View>

        {/* 7. Recent Sessions List */}
        <SectionHeader title="Recent Sessions" action={{ label: "See all", onPress: () => router.push('/profile') }} />
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 40, backgroundColor: 'rgba(22, 22, 30, 0.85)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          {recentSessions.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 14 }}>No recent sessions</Text>
            </View>
          ) : (
            recentSessions.map((s: any, i: number) => {
              const summary = require('../db/queries').getSessionSummary(s.id);
              return (
                <SessionRow
                  key={s.id}
                  id={s.id}
                  gymName={s.gymName}
                  startedAt={s.startTime}
                  durationMs={summary.duration}
                  climbs={summary.climbs}
                  sends={summary.sends}
                  hardestGrade={summary.hardestGradeRaw !== '–' ? summary.hardestGradeRaw : undefined}
                  isLast={i === recentSessions.length - 1}
                />
              );
            })
          )}
        </Card>
      </ScrollView>
          {/* Custom Spatial Action Sheet for Period Selection */}
      <Modal visible={isPeriodSheetOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setPeriodSheetOpen(false)} />
          <View style={{ 
            backgroundColor: 'rgba(22, 22, 30, 0.98)', 
            borderTopLeftRadius: radius.xl, 
            borderTopRightRadius: radius.xl, 
            borderWidth: 1, 
            borderColor: 'rgba(255,255,255,0.06)', 
            padding: space.xl, 
            paddingBottom: Math.max(insets.bottom, space.xl) 
          }}>
            {/* Drag Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center', marginBottom: space.xl }} />
            
            <Text style={[type.heading, { color: colors.textWhiteMuted, fontSize: 12, letterSpacing: 1.5, marginBottom: space.lg, textTransform: 'uppercase' }]}>
              Select Timeframe
            </Text>

            <View style={{ gap: space.xs }}>
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => {
                const isActive = period === p;
                return (
                  <TouchableOpacity
                    key={p}
                    activeOpacity={0.7}
                    onPress={() => {
                      triggerHaptic('selection');
                      setPeriod(p);
                      setPeriodSheetOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: space.md,
                      paddingHorizontal: space.sm,
                      backgroundColor: isActive ? 'rgba(154, 133, 255, 0.1)' : 'transparent',
                      borderRadius: radius.md,
                    }}
                  >
                    <Text style={[type.heading, { color: isActive ? colors.accent : colors.textWhitePrimary, fontSize: 16 }]}>
                      {PERIOD_LABELS[p]}
                    </Text>
                    {isActive && <Check size={20} color={colors.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}