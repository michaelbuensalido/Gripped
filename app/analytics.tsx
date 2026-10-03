import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { ResultDonut } from '../components/ui/ResultDonut';
import { TrendTile } from '../components/ui/TrendTile';
import { SessionRow } from '../components/ui/SessionRow';
import { PrimaryButton } from '../components/ui/PrimaryButton';
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

export default function ProgressScreen() {
  const router = useRouter();
  const { colors, type, space, radius } = useTheme();
  const [period, setPeriod] = useState<Period>('30d');

  const stats = useProgressStats(period);
  const recentSessions = useRecentSessions().slice(0, 5);
  const acwrData = React.useMemo(() => {
    try {
      return calculateACWR();
    } catch (e) {
      return null;
    }
  }, []);

  const hasData = stats.resultCounts.top > 0 || stats.resultCounts.attempt > 0 || stats.resultCounts.flash > 0;

  if (!hasData && period === 'all') {
    return (
      <Screen title="Progress">
        <EmptyState
          title="No data yet"
          body="Log some climbs to see your stats and progression over time."
          cta={<PrimaryButton
            label="START SESSION"
            onPress={() => router.push('/')}
          />}
        />
      </Screen>
    );
  }

  const { resultCounts, avgGradeLast20, weeklyVolume, rates, hardestSend, gradePyramid } = stats;

  return (
    <Screen title="Progress" scroll>
      {/* Period Selector — 52px touch targets for chalky hands */}
      <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.xl }}>
        {PERIODS.map((p) => {
          const active = period === p.value;
          return (
            <TouchableOpacity
              key={p.value}
              onPress={() => { triggerHaptic('light'); setPeriod(p.value); }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={{
                flex: 1,
                minHeight: 52,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.accentSoft : colors.card,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
              }}
            >
              <Text
                style={[
                  type.heading,
                  {
                    color: active ? colors.accentText : colors.textMuted,
                    fontSize: 13,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!hasData ? (
         <View style={{ alignItems: 'center', paddingVertical: space.xxl }}>
           <Text style={[type.body, { color: colors.textMuted }]}>No activity in this period.</Text>
         </View>
      ) : (
        <>
          {/* Result Donut Hero Card */}
          <Card style={{ marginBottom: space.lg, paddingVertical: space.xl, alignItems: 'center' }}>
            <ResultDonut
              flashCount={resultCounts.flash}
              topCount={resultCounts.top}
              attemptCount={resultCounts.attempt}
              centerGrade={formatGrade(avgGradeLast20)}
              centerLabel="AVG LAST 20"
            />
          </Card>

          {/* Trend Tiles Bento Row */}
          <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.xl }}>
            <TrendTile
              flex
              label="Weekly Vol"
              value={weeklyVolume.length > 0 ? weeklyVolume[weeklyVolume.length - 1].count : 0}
              data={weeklyVolume.map((v: any) => v.count)}
              onPress={() => router.push(`/analytics/stat-detail?stat=volume&period=${period}`)}
            />
            <TrendTile
              flex
              label="Flash Rate"
              value={`${rates.flashRate}%`}
              data={[rates.flashRate, rates.flashRate]}
              onPress={() => router.push(`/analytics/stat-detail?stat=flash&period=${period}`)}
            />
            <TrendTile
              flex
              label="Hardest"
              value={hardestSend.length > 0 ? formatGrade(hardestSend[hardestSend.length - 1].max_grade) : '–'}
              data={hardestSend.map((v: any) => v.max_grade)}
              onPress={() => router.push(`/analytics/stat-detail?stat=hardest&period=${period}`)}
            />
          </View>

          {/* Grade Pyramid */}
          <SectionHeader title="Sends by Grade" />
          <Card style={{ marginBottom: space.xl }}>
            <GradePyramid data={gradePyramid} formatGrade={formatGrade} />
          </Card>

          {/* Deep Dive Section */}
          <SectionHeader title="Deep Dive" />
          <View style={{ gap: space.lg, marginBottom: space.xl }}>
            <GradeProgressionTimeline />
            <AscentPyramid />
            <WallAngleRadar />
            <RootCauseFailureChart />
            {acwrData && <ACWRWidget data={acwrData} />}
          </View>

          {/* Recent Sessions */}
          <SectionHeader title="Recent Sessions" action={{ label: "See all", onPress: () => router.push('/profile') }} />
          <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 40 }}>
            {recentSessions.map((s: any, i: number) => {
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
            })}
          </Card>
        </>
      )}
    </Screen>
  );
}
