import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
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

  const hasData = stats.resultCounts.top > 0 || stats.resultCounts.attempt > 0 || stats.resultCounts.flash > 0;

  if (!hasData && period === 'all') {
    return (
      <Screen title="Progress">
        <EmptyState
          title="No data yet"
          body="Log some climbs to see your stats and progression over time."
          cta={<PrimaryButton
            label="START SESSION"
            onPress={() => router.push('/session/new')}
          />}
        />
      </Screen>
    );
  }

  const { resultCounts, avgGradeLast20, weeklyVolume, rates, hardestSend, gradePyramid } = stats;

  return (
    <Screen title="Progress" scroll>
      {/* Period Selector */}
      <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.xl }}>
        {PERIODS.map((p) => {
          const active = period === p.value;
          return (
            <TouchableOpacity
              key={p.value}
              onPress={() => { triggerHaptic('light'); setPeriod(p.value); }}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                backgroundColor: active ? colors.accentSoft : colors.card,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
              }}
            >
              <Text style={[type.caption, { color: active ? colors.accentText : colors.textMuted, fontWeight: active ? '700' : '400' }]}>
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
          {/* Result Donut */}
          <Card style={{ marginBottom: space.lg, paddingVertical: space.xl }}>
            <ResultDonut
              flashCount={resultCounts.flash}
              topCount={resultCounts.top}
              attemptCount={resultCounts.attempt}
              centerGrade={formatGrade(avgGradeLast20)}
              centerLabel="AVG LAST 20"
            />
          </Card>

          {/* Trend Tiles Row */}
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
              data={[rates.flashRate, rates.flashRate]} // Flat line if we don't have historical
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

          {/* Recent Sessions */}
          <SectionHeader title="Recent Sessions" action={{ label: "See all", onPress: () => router.push('/history') }} />
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
