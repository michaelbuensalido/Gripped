import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Zap, X } from 'lucide-react-native';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { GradePill } from '../../ui/GradePill';
import { ScalePressable } from '../../ui/ScalePressable';
import { SectionHeader } from '../../ui/SectionHeader';
import { EmptyState } from '../../ui/EmptyState';
import { ClimbLogCard } from '../../ui/ClimbLogCard';
import { DrillHeroCard } from '../../ui/DrillHeroCard';
import { ContextPill } from '../../ui/ContextPill';
import { StatStrip } from '../../ui/StatStrip';
import { SegmentedBar, BarLegend } from '../../ui/SegmentedBar';
import { ChartCardHeader } from '../../ui/ChartCardHeader';
import { useFlashEfficiencyDetail } from '../../../db/hooks';
import type { FilteredClimbItem, ProgressPeriod } from '../../../db/queries';
import { useTheme } from '../../../theme/useTheme';
import { listLayout, sectionEntering } from '../../../theme/layout';
import { usePreferences } from '../../../utils/preferences';

type OutcomeFilter = 'all' | 'flash' | 'top' | 'attempt';

export interface FlashEfficiencyViewProps {
  period: ProgressPeriod;
  periodLabel: string;
  onPressClimb: (climb: FilteredClimbItem) => void;
}

export function FlashEfficiencyView({
  period,
  periodLabel,
  onPressClimb,
}: FlashEfficiencyViewProps) {
  const { colors, type, space, radius } = useTheme();
  const { formatGrade } = usePreferences();
  const reduceMotion = useReducedMotion();
  const detail = useFlashEfficiencyDetail(period);

  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  useEffect(() => {
    setSelectedGrade(null);
  }, [period]);

  const selectedGradeRow = useMemo(
    () =>
      selectedGrade !== null
        ? detail.flashByGrade.find((r) => r.gradeIndex === selectedGrade) ?? null
        : null,
    [detail.flashByGrade, selectedGrade]
  );

  const activeFlashes = selectedGradeRow ? selectedGradeRow.flashes : detail.flashes;
  const activeTops = selectedGradeRow ? selectedGradeRow.tops : detail.tops;
  const activeAttempts = selectedGradeRow ? selectedGradeRow.attempts : detail.attempts;
  const activeTotal = selectedGradeRow ? selectedGradeRow.total : detail.total;
  const activeFlashRate = selectedGradeRow ? selectedGradeRow.flashRate : detail.flashRate;
  const activeSendRate = selectedGradeRow ? selectedGradeRow.sendRate : detail.sendRate;
  const activeSends = activeFlashes + activeTops;
  const activeFirstTryShare =
    activeSends > 0 ? Math.round((activeFlashes / activeSends) * 100) : 0;

  const filteredClimbs = useMemo(() => {
    return detail.climbs.filter((c) => {
      if (selectedGrade !== null && c.gradeIndex !== selectedGrade) return false;
      if (outcomeFilter === 'flash') return c.result === 'flash';
      if (outcomeFilter === 'top') return c.result === 'send' || c.result === 'top';
      if (outcomeFilter === 'attempt') {
        return c.result !== 'flash' && c.result !== 'send' && c.result !== 'top';
      }
      return true;
    });
  }, [detail.climbs, selectedGrade, outcomeFilter]);

  return (
    <View style={{ gap: space.lg }}>
      {/* Plane 2 — Hero conversion card */}
      <Animated.View entering={reduceMotion ? undefined : sectionEntering(0)}>
        <DrillHeroCard
          icon={<Zap size={space.lg} color={colors.flash} />}
          eyebrow="Flash efficiency"
          subtitle={
            selectedGradeRow
              ? `${formatGrade(selectedGradeRow.gradeIndex)} conversion`
              : periodLabel
          }
          wash={colors.washFlash}
          trailing={
            selectedGradeRow ? (
              <ContextPill
                tone="accent"
                label="All grades"
                trailingIcon={<X size={space.md} color={colors.accentText} />}
                onPress={() => setSelectedGrade(null)}
                accessibilityLabel="Clear grade filter"
              />
            ) : detail.peakFlashGradeIndex !== null ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text style={[type.captionMedium, { color: colors.textWhiteMuted }]}>
                  Peak flash
                </Text>
                <GradePill gradeIndex={detail.peakFlashGradeIndex} />
              </View>
            ) : null
          }
        >
          {/* Primary flash-rate readout */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
            <Text style={[type.heroStat, { color: colors.flashText }]}>
              {`${activeFlashRate}%`}
            </Text>
            <Text style={[type.body, { color: colors.textMuted }]}>
              {activeTotal > 0 ? `${activeFlashes} of ${activeTotal} flashed` : 'No routes logged'}
            </Text>
          </View>

          {/* Conversion bar + legend */}
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
              { label: 'Send rate', value: `${activeSendRate}%` },
              { label: '1st-try share', value: `${activeFirstTryShare}%` },
              {
                label: 'Avg burns',
                value: detail.avgBurnsToSend > 0 ? `${detail.avgBurnsToSend}` : '—',
              },
            ]}
          />
        </DrillHeroCard>
      </Animated.View>

      {/* Plane 1 — Interactive conversion-by-grade card */}
      <Animated.View entering={reduceMotion ? undefined : sectionEntering(1)}>
        <Card style={{ gap: space.md }}>
          <ChartCardHeader
            title="Conversion by grade"
            subtitle="First-try flashes vs multi-burn sends"
            hint={detail.flashByGrade.length > 0 ? 'Tap a grade' : undefined}
          />

          {detail.flashByGrade.length === 0 ? (
            <View style={{ gap: space.sm, paddingVertical: space.md }}>
              {[1, 2, 3].map((idx) => (
                <View
                  key={idx}
                  style={{
                    height: space.xl,
                    borderRadius: radius.sm,
                    backgroundColor: colors.chartGhost,
                  }}
                />
              ))}
              <Text
                style={[
                  type.caption,
                  { color: colors.textMuted, textAlign: 'center', marginTop: space.xs },
                ]}
              >
                No climbs logged in this period yet.
              </Text>
            </View>
          ) : (
            <>
              <BarLegend
                items={[
                  { label: 'Flash', color: colors.flash },
                  { label: 'Top', color: colors.top },
                  { label: 'Attempt', color: colors.attempt },
                ]}
              />

              <View style={{ gap: space.xs }}>
                {detail.flashByGrade.map((row) => {
                  const isSelected = selectedGrade === row.gradeIndex;
                  const isDimmed = selectedGrade !== null && !isSelected;

                  return (
                    <ScalePressable
                      key={row.gradeIndex}
                      haptic="selection"
                      activeScale={0.98}
                      onPress={() =>
                        setSelectedGrade((prev) =>
                          prev === row.gradeIndex ? null : row.gradeIndex
                        )
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Grade ${formatGrade(row.gradeIndex)}, ${row.flashRate}% flash rate, ${row.flashes} of ${row.total} flashed`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space.md,
                        minHeight: 48,
                        paddingVertical: space.xs,
                        paddingHorizontal: space.sm,
                        borderRadius: radius.md,
                        backgroundColor: isSelected ? colors.accentSoft : 'transparent',
                        borderWidth: 1,
                        borderColor: isSelected ? colors.accent : 'transparent',
                        opacity: isDimmed ? 0.42 : 1,
                      }}
                    >
                      <View style={{ width: space.xxl + space.lg, alignItems: 'flex-start' }}>
                        <GradePill gradeIndex={row.gradeIndex} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <SegmentedBar
                          height={space.md}
                          segments={[
                            { value: row.flashes, color: colors.flash },
                            { value: row.tops, color: colors.top },
                            { value: row.attempts, color: colors.attempt },
                          ]}
                        />
                      </View>

                      <View style={{ minWidth: 64, alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            type.statBold,
                            {
                              color:
                                row.flashRate >= 50
                                  ? colors.flashText
                                  : row.flashRate > 0
                                  ? colors.text
                                  : colors.textMuted,
                            },
                          ]}
                        >
                          {`${row.flashRate}%`}
                        </Text>
                        <Text style={[type.caption, { color: colors.textWhiteMuted }]}>
                          {`${row.flashes}/${row.total} 1st`}
                        </Text>
                      </View>
                    </ScalePressable>
                  );
                })}
              </View>
            </>
          )}
        </Card>
      </Animated.View>

      {/* Filter & route log stream */}
      <Animated.View
        entering={reduceMotion ? undefined : sectionEntering(2)}
        style={{ gap: space.md }}
      >
        <SectionHeader
          title={
            selectedGradeRow
              ? `${formatGrade(selectedGradeRow.gradeIndex)} climbs`
              : 'Logged climbs'
          }
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
            label="Flashed"
            active={outcomeFilter === 'flash'}
            onPress={() => setOutcomeFilter('flash')}
          />
          <Chip
            label="Topped"
            active={outcomeFilter === 'top'}
            onPress={() => setOutcomeFilter('top')}
          />
          <Chip
            label="Attempts"
            active={outcomeFilter === 'attempt'}
            onPress={() => setOutcomeFilter('attempt')}
          />
        </View>

        {filteredClimbs.length === 0 ? (
          <EmptyState
            asCard
            icon={<Zap size={space.xl} color={colors.flash} />}
            title="No matching climbs"
            body="Try selecting another outcome filter or timeframe."
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
