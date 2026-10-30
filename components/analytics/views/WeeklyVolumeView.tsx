import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, LayoutChangeEvent } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { TrendingUp, TrendingDown, Minus, X, Layers, BarChart3 } from 'lucide-react-native';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { ScalePressable } from '../../ui/ScalePressable';
import { SectionHeader } from '../../ui/SectionHeader';
import { EmptyState } from '../../ui/EmptyState';
import { ClimbLogCard } from '../../ui/ClimbLogCard';
import { DrillHeroCard } from '../../ui/DrillHeroCard';
import { ContextPill } from '../../ui/ContextPill';
import { StatStrip } from '../../ui/StatStrip';
import { SegmentedBar, BarLegend } from '../../ui/SegmentedBar';
import { ChartCardHeader } from '../../ui/ChartCardHeader';
import { useWeeklyVolumeDetail } from '../../../db/hooks';
import type { FilteredClimbItem, ProgressPeriod } from '../../../db/queries';
import { useTheme } from '../../../theme/useTheme';
import { listLayout, sectionEntering } from '../../../theme/layout';

type OutcomeFilter = 'all' | 'sends' | 'attempts';

const BAR_TRACK_HEIGHT = 136;
const BAR_WIDTH = 24;
const MIN_COL_WIDTH = 48;

function formatWallTime(minutes: number): string {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export interface WeeklyVolumeViewProps {
  period: ProgressPeriod;
  periodLabel: string;
  onPressClimb: (climb: FilteredClimbItem) => void;
}

export function WeeklyVolumeView({
  period,
  periodLabel,
  onPressClimb,
}: WeeklyVolumeViewProps) {
  const { colors, type, space, radius } = useTheme();
  const reduceMotion = useReducedMotion();
  const detail = useWeeklyVolumeDetail(period);

  const [selectedMonday, setSelectedMonday] = useState<number | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');
  const [chartAreaWidth, setChartAreaWidth] = useState(0);

  useEffect(() => {
    setSelectedMonday(null);
  }, [period]);

  const selectedBucket = useMemo(
    () =>
      selectedMonday !== null
        ? detail.buckets.find((b) => b.mondayMs === selectedMonday) ?? null
        : null,
    [detail.buckets, selectedMonday]
  );

  const activeFlashes = selectedBucket ? selectedBucket.flashes : detail.totalFlashes;
  const activeTops = selectedBucket ? selectedBucket.tops : detail.totalTops;
  const activeAttempts = selectedBucket ? selectedBucket.attempts : detail.totalAttempts;
  const activeTotal = selectedBucket ? selectedBucket.totalClimbs : detail.totalClimbs;
  const activeSessions = selectedBucket ? selectedBucket.sessionsCount : detail.totalSessions;
  const activeMinutes = selectedBucket ? selectedBucket.durationMinutes : detail.totalMinutes;

  const maxBucketTotal = useMemo(() => {
    if (detail.buckets.length === 0) return 1;
    return Math.max(...detail.buckets.map((b) => b.totalClimbs), 1);
  }, [detail.buckets]);

  const avgLineBottom = useMemo(() => {
    if (detail.avgPerWeek <= 0 || maxBucketTotal <= 0) return null;
    const ratio = Math.min(1, detail.avgPerWeek / maxBucketTotal);
    return Math.round(ratio * BAR_TRACK_HEIGHT);
  }, [detail.avgPerWeek, maxBucketTotal]);

  const filteredClimbs = useMemo(() => {
    return detail.climbs.filter((c) => {
      if (selectedMonday !== null && c.mondayMs !== selectedMonday) return false;
      if (outcomeFilter === 'sends') {
        return c.result === 'flash' || c.result === 'send' || c.result === 'top';
      }
      if (outcomeFilter === 'attempts') {
        return c.result !== 'flash' && c.result !== 'send' && c.result !== 'top';
      }
      return true;
    });
  }, [detail.climbs, selectedMonday, outcomeFilter]);

  const needsHorizontalScroll =
    chartAreaWidth > 0 && detail.buckets.length * MIN_COL_WIDTH > chartAreaWidth;

  const handleChartLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - chartAreaWidth) > 2) {
      setChartAreaWidth(w);
    }
  };

  // Height of the date-label row beneath each bar (label + marginTop).
  const LABEL_ROW = space.xl + space.xs;

  const renderColumns = () => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: needsHorizontalScroll ? 'flex-start' : 'space-between',
        minWidth: needsHorizontalScroll
          ? detail.buckets.length * MIN_COL_WIDTH
          : '100%',
        paddingTop: space.xl,
        position: 'relative',
      }}
    >
      {/* Hairline grid: baseline, midpoint, ceiling */}
      {[0, 0.5, 1].map((frac) => (
        <View
          key={frac}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: LABEL_ROW + Math.round(frac * BAR_TRACK_HEIGHT),
            height: 1,
            backgroundColor: colors.chartGrid,
          }}
        />
      ))}

      {/* Dashed average guide line */}
      {avgLineBottom !== null && detail.buckets.length > 1 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: LABEL_ROW + avgLineBottom,
            borderTopWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.accent,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            zIndex: 1,
          }}
        >
          <View
            style={{
              backgroundColor: colors.accentSoft,
              paddingHorizontal: space.sm,
              borderRadius: radius.pill,
              marginTop: -space.md,
              borderWidth: 1,
              borderColor: colors.accent,
            }}
          >
            <Text style={[type.captionSemibold, { color: colors.accentText }]}>
              {`avg ${detail.avgPerWeek}`}
            </Text>
          </View>
        </View>
      )}

      {detail.buckets.map((bucket) => {
        const isSelected = selectedMonday === bucket.mondayMs;
        const isDimmed = selectedMonday !== null && !isSelected;
        const totalHeight =
          bucket.totalClimbs > 0
            ? Math.max(
                space.md,
                Math.round((bucket.totalClimbs / maxBucketTotal) * BAR_TRACK_HEIGHT)
              )
            : 0;

        const flashH =
          bucket.totalClimbs > 0
            ? Math.round((bucket.flashes / bucket.totalClimbs) * totalHeight)
            : 0;
        const topH =
          bucket.totalClimbs > 0
            ? Math.round((bucket.tops / bucket.totalClimbs) * totalHeight)
            : 0;
        const attemptH = Math.max(0, totalHeight - flashH - topH);

        return (
          <ScalePressable
            key={bucket.mondayMs}
            haptic="selection"
            activeScale={0.96}
            onPress={() =>
              setSelectedMonday((prev) =>
                prev === bucket.mondayMs ? null : bucket.mondayMs
              )
            }
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Week of ${bucket.rangeLabel}, ${bucket.totalClimbs} climbs, ${bucket.flashes} flashes, ${bucket.tops} tops, ${bucket.attempts} attempts`}
            style={{
              flex: needsHorizontalScroll ? undefined : 1,
              width: needsHorizontalScroll ? MIN_COL_WIDTH : undefined,
              minWidth: 44,
              alignItems: 'center',
              opacity: isDimmed ? 0.38 : 1,
            }}
          >
            {/* Count label above bar */}
            <Text
              style={[
                type.captionSemibold,
                {
                  color: isSelected
                    ? colors.accentText
                    : bucket.totalClimbs > 0
                    ? colors.text
                    : colors.textWhiteMuted,
                  marginBottom: space.xs,
                },
              ]}
            >
              {bucket.totalClimbs}
            </Text>

            {/* Capsule track + stacked outcome segments */}
            <View
              style={{
                width: BAR_WIDTH,
                height: BAR_TRACK_HEIGHT,
                borderRadius: radius.sm,
                backgroundColor: colors.chartGhost,
                justifyContent: 'flex-end',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: isSelected
                  ? colors.accent
                  : bucket.isCurrentWeek
                  ? colors.glassBorder
                  : 'transparent',
              }}
            >
              {totalHeight > 0 && (
                <View style={{ width: '100%', height: totalHeight, justifyContent: 'flex-end' }}>
                  {attemptH > 0 && (
                    <View
                      style={{ width: '100%', height: attemptH, backgroundColor: colors.attempt }}
                    />
                  )}
                  {topH > 0 && (
                    <View style={{ width: '100%', height: topH, backgroundColor: colors.top }} />
                  )}
                  {flashH > 0 && (
                    <View style={{ width: '100%', height: flashH, backgroundColor: colors.flash }} />
                  )}
                </View>
              )}
            </View>

            {/* Date label + current-week dot */}
            <View
              style={{
                height: space.xl,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: space.xs,
              }}
            >
              <Text
                numberOfLines={1}
                style={[
                  type.captionMedium,
                  {
                    color: isSelected
                      ? colors.accentText
                      : bucket.isCurrentWeek
                      ? colors.text
                      : colors.textMuted,
                  },
                ]}
              >
                {bucket.dateLabel}
              </Text>
              {bucket.isCurrentWeek && (
                <View
                  style={{
                    width: space.xs,
                    height: space.xs,
                    borderRadius: radius.pill,
                    backgroundColor: colors.accent,
                    marginTop: 2,
                  }}
                />
              )}
            </View>
          </ScalePressable>
        );
      })}
    </View>
  );

  const delta = detail.vsPrevWeekDelta;

  return (
    <View style={{ gap: space.lg }}>
      {/* Plane 2 — Hero volume card */}
      <Animated.View entering={reduceMotion ? undefined : sectionEntering(0)}>
        <DrillHeroCard
          icon={<BarChart3 size={space.lg} color={colors.accentText} />}
          eyebrow="Weekly volume"
          subtitle={selectedBucket ? `Week of ${selectedBucket.rangeLabel}` : periodLabel}
          wash={colors.washAccent}
          trailing={
            selectedBucket ? (
              <ContextPill
                tone="accent"
                label="All weeks"
                trailingIcon={<X size={space.md} color={colors.accentText} />}
                onPress={() => setSelectedMonday(null)}
                accessibilityLabel="Show all weeks"
              />
            ) : (
              <ContextPill
                tone={delta > 0 ? 'positive' : 'neutral'}
                icon={
                  delta > 0 ? (
                    <TrendingUp size={space.md} color={colors.flashText} />
                  ) : delta < 0 ? (
                    <TrendingDown size={space.md} color={colors.textMuted} />
                  ) : (
                    <Minus size={space.md} color={colors.textMuted} />
                  )
                }
                label={
                  delta > 0
                    ? `+${delta} vs last wk`
                    : delta < 0
                    ? `${delta} vs last wk`
                    : 'Steady vs last wk'
                }
              />
            )
          }
        >
          {/* Primary volume readout */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
            <Text style={[type.heroStat, { color: colors.text }]}>{activeTotal}</Text>
            <Text style={[type.body, { color: colors.textMuted }]}>
              {activeTotal === 1 ? 'route logged' : 'routes logged'}
            </Text>
          </View>

          {/* Proportional outcome split */}
          <View style={{ gap: space.md }}>
            <SegmentedBar
              segments={[
                { value: activeFlashes, color: colors.flash },
                { value: activeTops, color: colors.top },
                { value: activeAttempts, color: colors.attempt },
              ]}
            />
            <BarLegend
              items={[
                { label: 'Flashed', value: activeFlashes, color: colors.flash },
                { label: 'Topped', value: activeTops, color: colors.top },
                { label: 'Attempts', value: activeAttempts, color: colors.attempt },
              ]}
            />
          </View>

          <StatStrip
            cells={[
              {
                label: selectedBucket ? 'Sends' : 'Weekly avg',
                value: selectedBucket ? selectedBucket.sends : detail.avgPerWeek,
              },
              { label: 'Sessions', value: activeSessions },
              { label: 'Wall time', value: formatWallTime(activeMinutes) },
            ]}
          />
        </DrillHeroCard>
      </Animated.View>

      {/* Plane 1 — Interactive stacked weekly chart */}
      <Animated.View entering={reduceMotion ? undefined : sectionEntering(1)}>
        <Card style={{ gap: space.md }} onLayout={handleChartLayout}>
          <ChartCardHeader
            title="Weekly activity"
            subtitle={
              detail.peakWeek
                ? `Peak week · ${detail.peakWeek.rangeLabel} (${detail.peakWeek.totalClimbs} routes)`
                : 'Tap any week bar to inspect climbs'
            }
            hint={detail.buckets.length > 0 ? 'Tap a bar' : undefined}
          />

          {detail.buckets.length === 0 ? (
            <View style={{ paddingVertical: space.lg, alignItems: 'center', gap: space.md }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  width: '100%',
                  height: 112,
                  paddingHorizontal: space.md,
                }}
              >
                {[44, 72, 56, 92, 64].map((h, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: BAR_WIDTH,
                      height: h,
                      borderRadius: radius.sm,
                      backgroundColor: colors.chartGhost,
                    }}
                  />
                ))}
              </View>
              <Text style={[type.caption, { color: colors.textMuted }]}>
                No weekly activity recorded in this timeframe yet.
              </Text>
            </View>
          ) : needsHorizontalScroll ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {renderColumns()}
            </ScrollView>
          ) : (
            renderColumns()
          )}
        </Card>
      </Animated.View>

      {/* Filter & route log stream */}
      <Animated.View
        entering={reduceMotion ? undefined : sectionEntering(2)}
        style={{ gap: space.md }}
      >
        <SectionHeader
          title={selectedBucket ? `Routes · ${selectedBucket.rangeLabel}` : 'Logged routes'}
          count={filteredClimbs.length}
          style={{ marginBottom: 0 }}
        />

        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          <Chip
            label="All"
            active={outcomeFilter === 'all'}
            onPress={() => setOutcomeFilter('all')}
          />
          <Chip
            label="Sends"
            active={outcomeFilter === 'sends'}
            onPress={() => setOutcomeFilter('sends')}
          />
          <Chip
            label="Attempts"
            active={outcomeFilter === 'attempts'}
            onPress={() => setOutcomeFilter('attempts')}
          />
        </View>

        {filteredClimbs.length === 0 ? (
          <EmptyState
            asCard
            icon={<Layers size={space.xl} color={colors.textMuted} />}
            title="No routes match this filter"
            body={
              selectedBucket
                ? `No ${outcomeFilter === 'all' ? 'climbs' : outcomeFilter} were logged during ${selectedBucket.rangeLabel}.`
                : 'Log climbs in an active session to build your volume history.'
            }
          />
        ) : (
          <Animated.View
            layout={reduceMotion ? undefined : listLayout}
            style={{ gap: space.sm }}
          >
            {filteredClimbs.map((climb) => (
              <ClimbLogCard key={climb.id} climb={climb} onPress={onPressClimb} />
            ))}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
