import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { BarChart3, Triangle, X } from 'lucide-react-native';
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
import { useSendsByGradeDetail } from '../../../db/hooks';
import type {
  FilteredClimbItem,
  ProgressPeriod,
  SendsByGradeRow,
} from '../../../db/queries';
import { useTheme } from '../../../theme/useTheme';
import { listLayout, sectionEntering } from '../../../theme/layout';
import { usePreferences } from '../../../utils/preferences';

type OutcomeFilter = 'all' | 'flash' | 'top' | 'attempt';

export interface SendsByGradeViewProps {
  period: ProgressPeriod;
  periodLabel: string;
  initialGrade: number | null;
  onSelectedGradeChange?: (gradeIndex: number | null) => void;
  onPressClimb: (climb: FilteredClimbItem) => void;
}

export function SendsByGradeView({
  period,
  periodLabel,
  initialGrade,
  onSelectedGradeChange,
  onPressClimb,
}: SendsByGradeViewProps) {
  const { colors, type, space, radius, gradeBands, gradeBand, withAlpha } = useTheme();
  const { formatGrade } = usePreferences();
  const reduceMotion = useReducedMotion();
  const detail = useSendsByGradeDetail(period);

  const [selectedGrade, setSelectedGrade] = useState<number | null>(initialGrade);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');

  useEffect(() => {
    setSelectedGrade(initialGrade);
  }, [initialGrade]);

  const updateSelectedGrade = (next: number | null) => {
    setSelectedGrade(next);
    onSelectedGradeChange?.(next);
  };

  // Ensure focused grade appears in pyramid rows even if 0 climbs exist in current timeframe
  const displayRows: SendsByGradeRow[] = useMemo(() => {
    if (
      selectedGrade === null ||
      detail.pyramidRows.some((r) => r.gradeIndex === selectedGrade)
    ) {
      return detail.pyramidRows;
    }
    const synthetic: SendsByGradeRow = {
      gradeIndex: selectedGrade,
      uniqueFlashes: 0,
      uniqueTops: 0,
      uniqueSends: 0,
      repeatSends: 0,
      attempts: 0,
      totalClimbs: 0,
      sendRate: 0,
      flashRate: 0,
    };
    return [...detail.pyramidRows, synthetic].sort(
      (a, b) => b.gradeIndex - a.gradeIndex
    );
  }, [detail.pyramidRows, selectedGrade]);

  const activeRow = useMemo(
    () =>
      selectedGrade !== null
        ? displayRows.find((r) => r.gradeIndex === selectedGrade) ?? null
        : null,
    [displayRows, selectedGrade]
  );

  const selectedBand = selectedGrade !== null ? gradeBand(selectedGrade) : null;

  const maxBarTotal = useMemo(() => {
    if (displayRows.length === 0) return 1;
    return Math.max(
      ...displayRows.map((r) => r.uniqueSends + r.attempts),
      1
    );
  }, [displayRows]);

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

  const bandEntries = [
    { band: gradeBands[0], count: detail.bandCounts.beginner },
    { band: gradeBands[1], count: detail.bandCounts.intermediate },
    { band: gradeBands[2], count: detail.bandCounts.advanced },
    { band: gradeBands[3], count: detail.bandCounts.expert },
  ];

  const focused = selectedGrade !== null && activeRow !== null;

  return (
    <View style={{ gap: space.lg }}>
      {/* Plane 2 — Dual-mode hero: pyramid overview / focused grade */}
      <Animated.View entering={reduceMotion ? undefined : sectionEntering(0)}>
        <DrillHeroCard
          icon={
            <Triangle
              size={space.lg}
              color={selectedBand ? selectedBand.text : colors.accentText}
            />
          }
          eyebrow="Sends by grade"
          subtitle={selectedBand ? `${selectedBand.label} tier · ${periodLabel}` : periodLabel}
          wash={selectedBand ? withAlpha(selectedBand.solid, 0.2) : colors.washAccent}
          trailing={
            selectedGrade !== null ? (
              <ContextPill
                tone="accent"
                label="All grades"
                trailingIcon={<X size={space.md} color={colors.accentText} />}
                onPress={() => updateSelectedGrade(null)}
                accessibilityLabel="View all grades"
              />
            ) : detail.workhorseGrade ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text style={[type.captionMedium, { color: colors.textWhiteMuted }]}>
                  Most sent
                </Text>
                <GradePill gradeIndex={detail.workhorseGrade.gradeIndex} />
              </View>
            ) : null
          }
        >
          {focused && activeRow ? (
            <>
              {/* Focused grade readout */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
                <Text
                  style={[
                    type.heroStat,
                    { color: selectedBand ? selectedBand.text : colors.text },
                  ]}
                >
                  {formatGrade(selectedGrade as number)}
                </Text>
                <Text style={[type.body, { color: colors.textMuted }]}>
                  {`${activeRow.uniqueSends} ${
                    activeRow.uniqueSends === 1 ? 'distinct send' : 'distinct sends'
                  }`}
                </Text>
              </View>

              <StatStrip
                cells={[
                  {
                    label: 'Flashes',
                    value: activeRow.uniqueFlashes,
                    labelColor: colors.flashText,
                  },
                  { label: 'Tops', value: activeRow.uniqueTops, labelColor: colors.topText },
                  { label: 'Tries', value: activeRow.attempts, labelColor: colors.attemptText },
                  { label: 'Send rate', value: `${activeRow.sendRate}%` },
                ]}
              />
            </>
          ) : (
            <>
              {/* All-grades summary readout */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
                <Text style={[type.heroStat, { color: colors.text }]}>
                  {detail.totalUniqueSends}
                </Text>
                <Text style={[type.body, { color: colors.textMuted }]}>
                  {detail.totalUniqueSends === 1
                    ? 'distinct problem sent'
                    : 'distinct problems sent'}
                </Text>
              </View>

              {/* 4-band grade distribution */}
              <View style={{ gap: space.md }}>
                <SegmentedBar
                  segments={bandEntries.map(({ band, count }) => ({
                    value: count,
                    color: band.solid,
                  }))}
                />
                <BarLegend
                  items={bandEntries.map(({ band, count }) => ({
                    label: band.label,
                    value: count,
                    color: band.solid,
                  }))}
                />
              </View>

              <StatStrip
                cells={[
                  {
                    label: 'Flashed',
                    value: detail.totalUniqueFlashes,
                    labelColor: colors.flashText,
                  },
                  {
                    label: 'Peak grade',
                    value:
                      detail.peakSendGrade !== null ? formatGrade(detail.peakSendGrade) : '—',
                  },
                  { label: 'Repeats', value: detail.totalRepeatSends },
                ]}
              />
            </>
          )}
        </DrillHeroCard>
      </Animated.View>

      {/* Plane 1 — Interactive ascent pyramid */}
      <Animated.View entering={reduceMotion ? undefined : sectionEntering(1)}>
        <Card style={{ gap: space.md }}>
          <ChartCardHeader
            title="Ascent pyramid"
            subtitle="First send per project"
            hint={displayRows.length > 0 ? 'Tap a grade' : undefined}
          />

          {displayRows.length === 0 ? (
            <View style={{ gap: space.sm, paddingVertical: space.md }}>
              {[45, 75, 100, 60].map((pct, idx) => (
                <View
                  key={idx}
                  style={{
                    height: space.lg,
                    width: `${pct}%`,
                    borderRadius: radius.pill,
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
                No climbs logged in this timeframe yet.
              </Text>
            </View>
          ) : (
            <>
              {/* Legend: flash · top (grade-band colour) · attempts */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 }}>
                  <View
                    style={{
                      width: space.sm,
                      height: space.sm,
                      borderRadius: radius.pill,
                      backgroundColor: colors.flash,
                    }}
                  />
                  <Text style={[type.captionMedium, { color: colors.textMuted }]}>Flash</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 }}>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {gradeBands.map((b) => (
                      <View
                        key={b.label}
                        style={{
                          width: space.sm,
                          height: space.sm,
                          borderRadius: radius.pill,
                          backgroundColor: b.solid,
                        }}
                      />
                    ))}
                  </View>
                  <Text style={[type.captionMedium, { color: colors.textMuted }]}>
                    Top · by band
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 }}>
                  <View
                    style={{
                      width: space.sm,
                      height: space.sm,
                      borderRadius: radius.pill,
                      backgroundColor: colors.attemptSoft,
                      borderWidth: 1,
                      borderColor: colors.attempt,
                    }}
                  />
                  <Text style={[type.captionMedium, { color: colors.textMuted }]}>Tries</Text>
                </View>
              </View>

              <View style={{ gap: space.xs }}>
                {displayRows.map((row) => {
                  const isSelected = selectedGrade === row.gradeIndex;
                  const isDimmed = selectedGrade !== null && !isSelected;
                  const rowBand = gradeBand(row.gradeIndex);
                  const rowTotalVolume = row.uniqueSends + row.attempts;
                  const fillRatio =
                    rowTotalVolume > 0
                      ? Math.max(0.08, rowTotalVolume / maxBarTotal)
                      : 0;

                  return (
                    <ScalePressable
                      key={row.gradeIndex}
                      haptic="selection"
                      activeScale={0.98}
                      onPress={() =>
                        updateSelectedGrade(
                          selectedGrade === row.gradeIndex ? null : row.gradeIndex
                        )
                      }
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Grade ${formatGrade(row.gradeIndex)}, ${row.uniqueSends} sends, ${row.uniqueFlashes} flashes, ${row.attempts} attempts`}
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

                      {/* Pyramid bar track */}
                      <View
                        style={{
                          flex: 1,
                          height: space.md,
                          borderRadius: radius.pill,
                          backgroundColor: colors.chartGhost,
                          overflow: 'hidden',
                        }}
                      >
                        {fillRatio > 0 && (
                          <View style={{ width: `${Math.round(fillRatio * 100)}%` }}>
                            <SegmentedBar
                              height={space.md}
                              segments={[
                                { value: row.uniqueFlashes, color: colors.flash },
                                { value: row.uniqueTops, color: rowBand.solid },
                                { value: row.attempts, color: colors.attemptSoft },
                              ]}
                            />
                          </View>
                        )}
                      </View>

                      {/* Right count + conversion readout */}
                      <View style={{ minWidth: 76, alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            type.captionSemibold,
                            { color: row.uniqueSends > 0 ? colors.text : colors.textMuted },
                          ]}
                        >
                          {`${row.uniqueSends} ${row.uniqueSends === 1 ? 'send' : 'sends'}`}
                        </Text>
                        <Text style={[type.caption, { color: colors.textWhiteMuted }]}>
                          {row.repeatSends > 0
                            ? `+${row.repeatSends} rpt · ${row.sendRate}%`
                            : `${row.sendRate}% conv`}
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

      {/* Route log stream */}
      <Animated.View
        entering={reduceMotion ? undefined : sectionEntering(2)}
        style={{ gap: space.md }}
      >
        <SectionHeader
          title={
            selectedGrade !== null ? `${formatGrade(selectedGrade)} routes` : 'All logged routes'
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
            icon={<BarChart3 size={space.xl} color={colors.textMuted} />}
            title={
              selectedGrade !== null
                ? `No ${formatGrade(selectedGrade)} climbs match`
                : 'No climbs match this filter'
            }
            body="Tap another grade in the pyramid above or switch your timeframe."
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
