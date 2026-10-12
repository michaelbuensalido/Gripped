import React, { useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { useReducedMotion } from 'react-native-reanimated';
import { ChevronLeft, Calendar, MapPin, X, Sparkles, CheckCircle2, CircleDashed } from 'lucide-react-native';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { ScalePressable } from '../../components/ui/ScalePressable';
import { EmptyState } from '../../components/ui/EmptyState';
import { useProgressStats, useClimbsForGrade, useClimbsForStat } from '../../db/hooks';
import { useTheme } from '../../theme/useTheme';

export default function StatDetailScreen() {
  const { stat = 'volume', period = '30d', grade } = useLocalSearchParams<{
    stat?: string;
    period?: any;
    grade?: string;
  }>();

  const router = useRouter();
  const { colors, type, space, radius, gradeBand } = useTheme();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const stats = useProgressStats(period || '30d');
  const gradeIndex = grade !== undefined ? parseInt(grade, 10) : null;

  // Query matching climbs based on whether it is a grade drilldown or metric drilldown
  const gradeClimbs = useClimbsForGrade(period, gradeIndex);
  const metricClimbs = useClimbsForStat(
    (stat as any) || 'volume',
    period,
    selectedWeek || undefined
  );

  const climbs = stat === 'grade' ? gradeClimbs : metricClimbs;

  let title = 'Trend Details';
  let chartData: any[] = [];
  let isBar = false;

  const chartWidth = Math.max(260, Math.min(width - 64, 380));

  if (stat === 'grade') {
    title = `Grade V${gradeIndex ?? 0} Climbs`;
  } else if (stat === 'volume') {
    title = 'Weekly Volume';
    isBar = true;
    chartData = stats.weeklyVolume.map((v: any) => ({
      value: v.count,
      label: v.week.split('-')[1] ? `W${v.week.split('-')[1]}` : v.week,
      weekKey: v.week,
      frontColor: selectedWeek === v.week ? colors.flash : colors.accent,
      onPress: () => {
        setSelectedWeek((prev) => (prev === v.week ? null : v.week));
      },
    }));
  } else if (stat === 'hardest') {
    title = 'Hardest Send Trend';
    chartData = stats.hardestSend.map((v: any) => ({
      value: v.max_grade,
      label: v.week.split('-')[1] ? `W${v.week.split('-')[1]}` : v.week,
      weekKey: v.week,
      dataPointColor: selectedWeek === v.week ? colors.flash : colors.accent,
      onPress: () => {
        setSelectedWeek((prev) => (prev === v.week ? null : v.week));
      },
    }));
  } else if (stat === 'flash') {
    title = 'Flash Efficiency';
    isBar = true;
    chartData = [
      {
        value: stats.resultCounts.flash,
        label: 'Flashes',
        frontColor: colors.flash,
      },
      {
        value: stats.resultCounts.top,
        label: 'Sends',
        frontColor: colors.top,
      },
      {
        value: stats.resultCounts.attempt,
        label: 'Attempts',
        frontColor: colors.border,
      },
    ];
  }

  // Summary figures for grade view
  const gradeSends = climbs.filter((c) => c.result === 'send' || c.result === 'top').length;
  const gradeFlashes = climbs.filter((c) => c.result === 'flash').length;
  const gradeAttempts = climbs.filter((c) => c.result === 'attempt').length;

  return (
    <Screen
      title={title}
      subtitle={`Over ${period?.toUpperCase() || '30D'}`}
      scroll={false}
      headerLeft={
        <ScalePressable
          haptic="light"
          activeScale={0.94}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to Progress"
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} color={colors.text} />
        </ScalePressable>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Metric summary banner */}
        {stat === 'grade' ? (
          <View
            style={{
              flexDirection: 'row',
              gap: space.sm,
              marginTop: space.md,
              marginBottom: space.lg,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.md,
                padding: space.md,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={[type.caption, { color: colors.textMuted }]}>TOTAL</Text>
              <Text style={[type.heading, { color: colors.text, marginTop: 4, fontVariant: ['tabular-nums'] }]}>
                {climbs.length}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.md,
                padding: space.md,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={[type.caption, { color: colors.flash }]}>FLASHES</Text>
              <Text style={[type.heading, { color: colors.flash, marginTop: 4, fontVariant: ['tabular-nums'] }]}>
                {gradeFlashes}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.md,
                padding: space.md,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={[type.caption, { color: colors.top }]}>SENDS</Text>
              <Text style={[type.heading, { color: colors.top, marginTop: 4, fontVariant: ['tabular-nums'] }]}>
                {gradeSends}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.md,
                padding: space.md,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={[type.caption, { color: colors.textMuted }]}>ATTEMPTS</Text>
              <Text style={[type.heading, { color: colors.textMuted, marginTop: 4, fontVariant: ['tabular-nums'] }]}>
                {gradeAttempts}
              </Text>
            </View>
          </View>
        ) : (
          /* Chart Card for non-grade views */
          <Card
            style={{
              paddingVertical: space.lg,
              paddingHorizontal: space.sm,
              alignItems: 'center',
              marginTop: space.md,
              marginBottom: space.lg,
              backgroundColor: colors.card,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {chartData.length > 0 ? (
              <View style={{ alignItems: 'center', width: '100%' }}>
                {isBar ? (
                  <BarChart
                    data={chartData}
                    height={180}
                    width={chartWidth}
                    barWidth={chartData.length > 6 ? 18 : 28}
                    spacing={chartData.length > 6 ? 14 : 24}
                    frontColor={colors.accent}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor={colors.border}
                    yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                    noOfSections={4}
                    isAnimated={!reduceMotion}
                    animationDuration={reduceMotion ? 0 : 350}
                  />
                ) : (
                  <LineChart
                    data={chartData}
                    height={180}
                    width={chartWidth}
                    color={colors.accent}
                    thickness={3}
                    dataPointsColor={colors.accent}
                    dataPointsRadius={5}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor={colors.border}
                    yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                    noOfSections={4}
                    isAnimated={!reduceMotion}
                    animationDuration={reduceMotion ? 0 : 350}
                  />
                )}

                {/* Tappable filter tip */}
                <Text
                  style={[
                    type.caption,
                    { color: colors.textMuted, marginTop: space.sm, fontStyle: 'italic', fontSize: 11 },
                  ]}
                >
                  Tap any bar/point to filter climbs below
                </Text>
              </View>
            ) : (
              <Text style={[type.body, { color: colors.textMuted }]}>Not enough data</Text>
            )}
          </Card>
        )}

        {/* Section header with active filter pill */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: space.md,
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {selectedWeek ? `CLIMBS IN ${selectedWeek}` : `MATCHING CLIMBS (${climbs.length})`}
          </Text>

          {selectedWeek && (
            <ScalePressable
              haptic="light"
              activeScale={0.96}
              onPress={() => setSelectedWeek(null)}
              accessibilityRole="button"
              accessibilityLabel="Clear week filter"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: radius.pill,
                backgroundColor: colors.cardMuted,
              }}
            >
              <Text style={[type.caption, { color: colors.accent, fontWeight: '600' }]}>Show all</Text>
              <X size={12} color={colors.accent} />
            </ScalePressable>
          )}
        </View>

        {/* Filtered Climbs List */}
        {climbs.length === 0 ? (
          <EmptyState
            asCard
            title="No matching climbs"
            body={selectedWeek ? "No climbs logged in this week." : "No climbs found for this criteria."}
          />
        ) : (
          <View style={{ gap: space.sm }}>
            {climbs.map((climb) => {
              const band = gradeBand(climb.gradeIndex);
              const isFlash = climb.result === 'flash';
              const isSend = climb.result === 'send' || climb.result === 'top';
              const dateStr = new Date(climb.loggedAt).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              return (
                <ScalePressable
                  key={climb.id}
                  haptic="light"
                  activeScale={0.98}
                  onPress={() => {
                    if (climb.sessionId) {
                      router.push(`/session/${climb.sessionId}` as any);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${climb.gradeRaw} ${climb.result} at ${climb.gymName}. Tap to view session.`}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: radius.md,
                    padding: space.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 44,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                      {/* Grade chip */}
                      <View
                        style={{
                          backgroundColor: band.bg,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: radius.sm,
                          borderWidth: 1,
                          borderColor: band.solid,
                        }}
                      >
                        <Text style={[type.label, { color: colors.text, fontWeight: '700' }]}>
                          {climb.gradeRaw}
                        </Text>
                      </View>

                      {/* Result Chip */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: radius.sm,
                          backgroundColor: isFlash
                            ? colors.flash + '22'
                            : isSend
                            ? colors.top + '22'
                            : colors.cardMuted,
                        }}
                      >
                        {isFlash ? (
                          <Sparkles size={12} color={colors.flash} />
                        ) : isSend ? (
                          <CheckCircle2 size={12} color={colors.top} />
                        ) : (
                          <CircleDashed size={12} color={colors.textMuted} />
                        )}
                        <Text
                          style={[
                            type.caption,
                            {
                              color: isFlash ? colors.flash : isSend ? colors.top : colors.textMuted,
                              fontWeight: '600',
                              textTransform: 'capitalize',
                            },
                          ]}
                        >
                          {climb.result}
                        </Text>
                      </View>
                    </View>

                    {/* Attempts count */}
                    <Text style={[type.caption, { color: colors.textMuted, fontVariant: ['tabular-nums'] }]}>
                      {climb.attempts} {climb.attempts === 1 ? 'burn' : 'burns'}
                    </Text>
                  </View>

                  {/* Metadata Row: Gym & Date */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.md,
                      marginTop: space.sm,
                      flexWrap: 'wrap',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} color={colors.textMuted} />
                      <Text style={[type.caption, { color: colors.textMuted }]}>{climb.gymName}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} color={colors.textMuted} />
                      <Text style={[type.caption, { color: colors.textMuted }]}>{dateStr}</Text>
                    </View>
                  </View>

                  {/* Wall Angle / Hold Type Tags if present */}
                  {(climb.wallAngle || climb.holdType) && (
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: space.sm }}>
                      {climb.wallAngle && <Chip label={climb.wallAngle} />}
                      {climb.holdType && <Chip label={climb.holdType} />}
                    </View>
                  )}

                  {/* Notes snippet if present */}
                  {Boolean(climb.notes) && (
                    <Text
                      numberOfLines={2}
                      style={[
                        type.caption,
                        { color: colors.textMuted, marginTop: space.xs, fontStyle: 'italic' },
                      ]}
                    >
                      &ldquo;{climb.notes}&rdquo;
                    </Text>
                  )}
                </ScalePressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
