import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, LayoutChangeEvent } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Path,
  Line,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Trophy, ChevronRight, X, Mountain } from 'lucide-react-native';
import { Card } from '../../ui/Card';
import { Chip } from '../../ui/Chip';
import { ResultChip } from '../../ui/ResultChip';
import { ScalePressable } from '../../ui/ScalePressable';
import { SectionHeader } from '../../ui/SectionHeader';
import { EmptyState } from '../../ui/EmptyState';
import { ClimbingHoldGraphic, holdTypeForGrade } from '../../ui/ClimbingHoldGraphic';
import { ClimbLogCard } from '../../ui/ClimbLogCard';
import { DrillHeroCard } from '../../ui/DrillHeroCard';
import { ContextPill } from '../../ui/ContextPill';
import { StatStrip } from '../../ui/StatStrip';
import { ChartCardHeader } from '../../ui/ChartCardHeader';
import { useHardestSendDetail } from '../../../db/hooks';
import type { FilteredClimbItem, ProgressPeriod } from '../../../db/queries';
import { useTheme } from '../../../theme/useTheme';
import { listLayout, sectionEntering } from '../../../theme/layout';
import { usePreferences } from '../../../utils/preferences';

type SortMode = 'hardest' | 'latest';

const PLOT_HEIGHT = 156;
const PLOT_TOP_PAD = 30;
const PLOT_BOTTOM_PAD = 14;
const Y_AXIS_WIDTH = 38;
const MIN_POINT_COL_WIDTH = 52;

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function formatShortDate(ms: number): string {
  const d = new Date(ms);
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

interface Coord {
  x: number;
  y: number;
}

/**
 * Catmull-Rom → cubic Bézier smoothing. Control-point Y is clamped to the plot so
 * abrupt grade jumps never overshoot above the ceiling or below the baseline.
 */
function smoothPath(coords: Coord[], minY: number, maxY: number): string {
  if (coords.length < 2) return '';
  const clampY = (y: number) => Math.max(minY, Math.min(maxY, y));
  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clampY(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export interface HardestSendViewProps {
  period: ProgressPeriod;
  periodLabel: string;
  onPressClimb: (climb: FilteredClimbItem) => void;
}

export function HardestSendView({
  period,
  periodLabel,
  onPressClimb,
}: HardestSendViewProps) {
  const { colors, type, space, radius, gradeBand, withAlpha } = useTheme();
  const { formatGrade } = usePreferences();
  const reduceMotion = useReducedMotion();
  const detail = useHardestSendDetail(period);

  const [selectedMonday, setSelectedMonday] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('hardest');
  const [chartContainerWidth, setChartContainerWidth] = useState(0);

  useEffect(() => {
    setSelectedMonday(null);
  }, [period]);

  const selectedPoint = useMemo(
    () =>
      selectedMonday !== null
        ? detail.weeklyProgression.find((p) => p.mondayMs === selectedMonday) ?? null
        : null,
    [detail.weeklyProgression, selectedMonday]
  );

  const activePeakGrade = selectedPoint
    ? selectedPoint.maxSendGrade
    : detail.peakGradeIndex;

  const peakBand = activePeakGrade !== null ? gradeBand(activePeakGrade) : null;

  const displayedClimbs = useMemo(() => {
    const filtered =
      selectedMonday !== null
        ? detail.climbs.filter((c) => c.mondayMs === selectedMonday)
        : detail.climbs;

    if (sortMode === 'latest') {
      return [...filtered].sort((a, b) => b.loggedAt - a.loggedAt);
    }

    return [...filtered].sort((a, b) => {
      if (b.gradeIndex !== a.gradeIndex) return b.gradeIndex - a.gradeIndex;
      if (a.result === 'flash' && b.result !== 'flash') return -1;
      if (b.result === 'flash' && a.result !== 'flash') return 1;
      return b.loggedAt - a.loggedAt;
    });
  }, [detail.climbs, selectedMonday, sortMode]);

  // Compute Y-axis grade ticks (3 clean integer grade ticks)
  const chartScale = useMemo(() => {
    const pts = detail.weeklyProgression;
    if (pts.length === 0) {
      return { minG: 0, maxG: 6, ticks: [6, 3, 0] };
    }
    const grades = pts.map((p) => p.maxSendGrade);
    let minG = Math.max(0, Math.min(...grades) - 1);
    let maxG = Math.min(16, Math.max(...grades) + 1);
    if (maxG - minG < 2) {
      maxG = Math.min(16, minG + 2);
      minG = Math.max(0, maxG - 2);
    }
    const midG = Math.round((minG + maxG) / 2);
    const ticks = Array.from(new Set([maxG, midG, minG])).sort((a, b) => b - a);
    return { minG, maxG, ticks };
  }, [detail.weeklyProgression]);

  const handleChartLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - chartContainerWidth) > 2) {
      setChartContainerWidth(w);
    }
  };

  // Card padding (space.lg) on both sides + the Y-axis gutter are not plottable.
  const plotAvailableWidth = Math.max(200, chartContainerWidth - Y_AXIS_WIDTH - space.lg * 2);
  const points = detail.weeklyProgression;
  const needsScroll = points.length * MIN_POINT_COL_WIDTH > plotAvailableWidth;
  const svgWidth = needsScroll
    ? points.length * MIN_POINT_COL_WIDTH
    : plotAvailableWidth;
  const colWidth = points.length > 0 ? svgWidth / points.length : svgWidth;
  const innerPlotH = PLOT_HEIGHT - PLOT_TOP_PAD - PLOT_BOTTOM_PAD;

  const getY = (gradeIndex: number): number => {
    const span = Math.max(1, chartScale.maxG - chartScale.minG);
    const clamped = Math.max(chartScale.minG, Math.min(chartScale.maxG, gradeIndex));
    const ratio = (clamped - chartScale.minG) / span;
    return PLOT_TOP_PAD + (1 - ratio) * innerPlotH;
  };

  const getX = (idx: number): number => {
    if (points.length <= 1) return svgWidth / 2;
    return colWidth * idx + colWidth / 2;
  };

  const baselineY = PLOT_HEIGHT - PLOT_BOTTOM_PAD;

  const { linePath, areaPath } = useMemo(() => {
    if (points.length < 2) {
      return { linePath: '', areaPath: '' };
    }
    const coords = points.map((p, idx) => ({
      x: getX(idx),
      y: getY(p.maxSendGrade),
    }));
    const line = smoothPath(coords, PLOT_TOP_PAD, baselineY);
    const first = coords[0];
    const last = coords[coords.length - 1];
    const area = `${line} L ${last.x.toFixed(1)} ${baselineY.toFixed(1)} L ${first.x.toFixed(1)} ${baselineY.toFixed(1)} Z`;
    return { linePath: line, areaPath: area };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, svgWidth, chartScale]);

  const renderPlotCanvas = () => (
    <View style={{ width: svgWidth }}>
      <Svg width={svgWidth} height={PLOT_HEIGHT}>
        <Defs>
          <SvgLinearGradient id="hardestAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.34} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>

        {/* Horizontal dashed grid lines for each Y-axis tick */}
        {chartScale.ticks.map((tick) => {
          const y = getY(tick);
          return (
            <Line
              key={tick}
              x1={0}
              y1={y}
              x2={svgWidth}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Area & line trajectory */}
        {points.length >= 2 && (
          <>
            <Path d={areaPath} fill="url(#hardestAreaGrad)" />
            <Path
              d={linePath}
              fill="none"
              stroke={colors.accent}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Single-point benchmark baseline */}
        {points.length === 1 && (
          <Line
            x1={space.lg}
            y1={getY(points[0].maxSendGrade)}
            x2={svgWidth - space.lg}
            y2={getY(points[0].maxSendGrade)}
            stroke={colors.accent}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
        )}

        {/* Selected-week drop line */}
        {selectedPoint && (
          <Line
            x1={getX(points.findIndex((p) => p.mondayMs === selectedPoint.mondayMs))}
            y1={getY(selectedPoint.maxSendGrade)}
            x2={getX(points.findIndex((p) => p.mondayMs === selectedPoint.mondayMs))}
            y2={baselineY}
            stroke={colors.accent}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}

        {/* Data nodes */}
        {points.map((pt, idx) => {
          const cx = getX(idx);
          const cy = getY(pt.maxSendGrade);
          const isSelected = selectedMonday === pt.mondayMs;
          const ptBand = gradeBand(pt.maxSendGrade);
          const nodeColor = isSelected
            ? colors.text
            : pt.isPeak
            ? ptBand.solid
            : colors.accent;
          const showLabel = isSelected || (pt.isPeak && selectedMonday === null);

          return (
            <React.Fragment key={pt.mondayMs}>
              {(isSelected || pt.isPeak) && (
                <Circle cx={cx} cy={cy} r={11} fill={nodeColor} fillOpacity={0.2} />
              )}
              <Circle
                cx={cx}
                cy={cy}
                r={isSelected ? 6 : pt.isPeak ? 5.5 : 4}
                fill={nodeColor}
                stroke={colors.card}
                strokeWidth={2}
              />
              {showLabel && (
                <SvgText
                  x={cx}
                  y={cy - 16}
                  fill={isSelected ? colors.text : ptBand.text}
                  fontFamily={type.captionSemibold.fontFamily}
                  fontSize={type.captionSemibold.fontSize}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {formatGrade(pt.maxSendGrade)}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Interactive >= 44pt touch target overlay + X-axis labels */}
      <View
        style={{
          flexDirection: 'row',
          marginTop: -PLOT_HEIGHT,
          height: PLOT_HEIGHT + space.xl,
        }}
      >
        {points.map((pt) => {
          const isSelected = selectedMonday === pt.mondayMs;
          const isDimmed = selectedMonday !== null && !isSelected;

          return (
            <ScalePressable
              key={pt.mondayMs}
              haptic="selection"
              activeScale={0.97}
              onPress={() =>
                setSelectedMonday((prev) =>
                  prev === pt.mondayMs ? null : pt.mondayMs
                )
              }
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Week of ${pt.rangeLabel}, hardest send ${formatGrade(pt.maxSendGrade)}, ${pt.sendsCount} sends`}
              style={{
                width: colWidth,
                minWidth: 44,
                height: PLOT_HEIGHT + space.xl,
                justifyContent: 'flex-end',
                alignItems: 'center',
                opacity: isDimmed ? 0.45 : 1,
              }}
            >
              <Text
                numberOfLines={1}
                style={[
                  type.captionMedium,
                  {
                    color: isSelected
                      ? colors.text
                      : pt.isPeak
                      ? colors.text
                      : colors.textMuted,
                  },
                ]}
              >
                {pt.dateLabel}
              </Text>
            </ScalePressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={{ gap: space.lg }}>
      {/* Plane 2 — Hero peak difficulty card */}
      <Animated.View entering={reduceMotion ? undefined : sectionEntering(0)}>
        <DrillHeroCard
          icon={<Trophy size={space.lg} color={peakBand ? peakBand.text : colors.accentText} />}
          eyebrow="Hardest send"
          subtitle={selectedPoint ? `Week of ${selectedPoint.rangeLabel}` : periodLabel}
          wash={peakBand ? withAlpha(peakBand.solid, 0.2) : colors.washAccent}
          trailing={
            selectedPoint ? (
              <ContextPill
                tone="accent"
                label="All weeks"
                trailingIcon={<X size={space.md} color={colors.accentText} />}
                onPress={() => setSelectedMonday(null)}
                accessibilityLabel="Show all weeks"
              />
            ) : detail.isAllTimeBest && peakBand ? (
              <ContextPill
                tone="custom"
                customColors={{ bg: peakBand.bg, fg: peakBand.text, border: peakBand.solid }}
                icon={<Trophy size={space.md} color={peakBand.text} />}
                label="All-time PB"
              />
            ) : null
          }
        >
          {/* Peak grade readout + 3D hold artwork */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: space.lg,
            }}
          >
            <View style={{ flex: 1, gap: space.xs }}>
              <Text
                style={[type.heroStat, { color: peakBand ? peakBand.text : colors.textMuted }]}
              >
                {activePeakGrade !== null ? formatGrade(activePeakGrade) : '—'}
              </Text>
              <Text style={[type.body, { color: colors.textMuted }]}>
                {peakBand
                  ? selectedPoint
                    ? `${peakBand.label} tier · ${selectedPoint.sendsCount} ${
                        selectedPoint.sendsCount === 1 ? 'send' : 'sends'
                      } that week`
                    : `${peakBand.label} tier · ${detail.sendsAtPeakCount} ${
                        detail.sendsAtPeakCount === 1 ? 'send' : 'sends'
                      } at this grade`
                  : 'No sends logged in this period'}
              </Text>
            </View>

            <ClimbingHoldGraphic
              type={holdTypeForGrade(activePeakGrade)}
              size={space.xxl * 2 + space.xl}
              borderRadius={radius.lg}
              style={{
                borderWidth: 1,
                borderColor: peakBand ? peakBand.solid : colors.border,
                shadowColor: peakBand ? peakBand.solid : colors.bgTexture,
                shadowOpacity: peakBand ? 0.45 : 0,
                shadowRadius: space.lg,
                shadowOffset: { width: 0, height: space.xs },
              }}
            />
          </View>

          {/* Best ascent spotlight row */}
          {detail.peakClimb && !selectedPoint && (
            <ScalePressable
              haptic="light"
              activeScale={0.98}
              onPress={() => onPressClimb(detail.peakClimb!)}
              accessibilityRole="button"
              accessibilityLabel={`Best send at ${detail.peakClimb.gymName}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                backgroundColor: colors.surfaceInset,
                borderRadius: radius.md,
                paddingHorizontal: space.md,
                paddingVertical: space.md,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: 52,
              }}
            >
              <ResultChip
                result={detail.peakClimb.result === 'flash' ? 'flash' : 'top'}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.micro, { color: colors.textWhiteMuted }]}>Best ascent</Text>
                <Text numberOfLines={1} style={[type.captionSemibold, { color: colors.text }]}>
                  {detail.peakClimb.projectTitle || detail.peakClimb.gymName}
                </Text>
              </View>
              <Text style={[type.caption, { color: colors.textMuted }]}>
                {formatShortDate(detail.peakClimb.loggedAt)}
              </Text>
              <ChevronRight size={space.lg} color={colors.textWhiteMuted} />
            </ScalePressable>
          )}

          <StatStrip
            cells={[
              {
                label: 'All-time PB',
                value:
                  detail.allTimePeakGradeIndex !== null
                    ? formatGrade(detail.allTimePeakGradeIndex)
                    : '—',
              },
              {
                label: 'Peak flash',
                value:
                  detail.peakFlashGradeIndex !== null
                    ? formatGrade(detail.peakFlashGradeIndex)
                    : '—',
                valueColor: colors.flashText,
              },
              {
                label: 'Last-20 avg',
                value:
                  detail.avgLast20GradeIndex !== null
                    ? formatGrade(detail.avgLast20GradeIndex)
                    : '—',
              },
            ]}
          />
        </DrillHeroCard>
      </Animated.View>

      {/* Plane 1 — Weekly progression curve */}
      <Animated.View entering={reduceMotion ? undefined : sectionEntering(1)}>
        <Card style={{ gap: space.md }} onLayout={handleChartLayout}>
          <ChartCardHeader
            title="Weekly progression"
            subtitle="Hardest boulder sent each active week"
            hint={points.length > 0 ? 'Tap a node' : undefined}
          />

          {points.length === 0 ? (
            <View
              style={{
                height: PLOT_HEIGHT,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceInset,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: space.lg,
              }}
            >
              <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center' }]}>
                No completed sends in this timeframe yet.
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              {/* Formatted grade Y-axis */}
              <View
                style={{
                  width: Y_AXIS_WIDTH,
                  height: PLOT_HEIGHT,
                  position: 'relative',
                }}
              >
                {chartScale.ticks.map((tick) => (
                  <Text
                    key={tick}
                    style={[
                      type.captionSemibold,
                      {
                        position: 'absolute',
                        top: getY(tick) - space.sm,
                        left: 0,
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    {formatGrade(tick)}
                  </Text>
                ))}
              </View>

              {needsScroll ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {renderPlotCanvas()}
                </ScrollView>
              ) : (
                renderPlotCanvas()
              )}
            </View>
          )}
        </Card>
      </Animated.View>

      {/* Sent routes stream */}
      <Animated.View
        entering={reduceMotion ? undefined : sectionEntering(2)}
        style={{ gap: space.md }}
      >
        <SectionHeader
          title={selectedPoint ? `Sends · ${selectedPoint.rangeLabel}` : 'Sent routes'}
          count={displayedClimbs.length}
          style={{ marginBottom: 0 }}
        />

        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          <Chip
            label="Hardest First"
            active={sortMode === 'hardest'}
            onPress={() => setSortMode('hardest')}
          />
          <Chip
            label="Latest First"
            active={sortMode === 'latest'}
            onPress={() => setSortMode('latest')}
          />
        </View>

        {displayedClimbs.length === 0 ? (
          <EmptyState
            asCard
            icon={<Mountain size={space.xl} color={colors.textMuted} />}
            title="No sends in this window"
            body="Log a Flash or Top during a session to track your grade progression."
          />
        ) : (
          <Animated.View
            layout={reduceMotion ? undefined : listLayout}
            style={{ gap: space.sm }}
          >
            {displayedClimbs.map((climb) => (
              <ClimbLogCard
                key={climb.id}
                climb={climb}
                highlightPeak={
                  detail.peakGradeIndex !== null &&
                  climb.gradeIndex === detail.peakGradeIndex
                }
                onPress={onPressClimb}
              />
            ))}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
