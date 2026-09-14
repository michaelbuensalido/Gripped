import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, stackDataItem } from 'react-native-gifted-charts';
import type { GradePyramidDataRow, GradePyramidAllTimeRow } from '../../db/queries';

export interface GradePyramidWidgetProps {
  data?: GradePyramidDataRow[];
  pyramid?: GradePyramidDataRow[] | GradePyramidAllTimeRow[];
  title?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function GradePyramidWidget({
  data,
  pyramid,
  title = 'ALL-TIME GRADE PYRAMID',
}: GradePyramidWidgetProps) {
  const rawData = data ?? (pyramid as GradePyramidDataRow[]) ?? [];
  const normalizedRows: GradePyramidDataRow[] = rawData.map((r: any) => ({
    grade_raw: r.grade_raw ?? r.gradeRaw ?? 'V0',
    normalized_difficulty: r.normalized_difficulty ?? r.normalizedDifficulty ?? 0,
    flash_count: r.flash_count ?? r.flash ?? 0,
    top_count: r.top_count ?? r.top ?? 0,
    attempt_count: r.attempt_count ?? r.attempt ?? 0,
    total_sends: r.total_sends ?? (r.flash_count ?? r.flash ?? 0) + (r.top_count ?? r.top ?? 0),
    total_attempts:
      r.total_attempts ??
      r.totalBurns ??
      (r.flash_count ?? r.flash ?? 0) +
        (r.top_count ?? r.top ?? 0) +
        (r.attempt_count ?? r.attempt ?? 0),
  }));

  // Sort from V0 upwards to V13+ for horizontal chart display
  const sortedData = [...normalizedRows].sort(
    (a, b) => a.normalized_difficulty - b.normalized_difficulty
  );

  // If no burns logged, show a placeholder ladder with 1-burn scale for visual elegance
  const hasData = sortedData.some((r) => r.total_attempts > 0);

  const totalSends = sortedData.reduce((acc, r) => acc + r.total_sends, 0);
  const totalFlashes = sortedData.reduce((acc, r) => acc + r.flash_count, 0);

  // Prepare stackData for react-native-gifted-charts
  const stackData: stackDataItem[] = sortedData.map((row) => {
    const flash = row.flash_count;
    const top = row.top_count;
    const attempt = row.attempt_count;

    return {
      label: row.grade_raw,
      labelTextStyle: {
        color: row.total_sends > 0 ? '#FFFFFF' : '#8A8A98',
        fontSize: 11,
        fontWeight: '700',
      },
      stacks: [
        {
          value: flash,
          color: '#6EE756',
          borderRadius: 6,
        },
        {
          value: top,
          color: '#8E7CFF',
          borderRadius: 6,
        },
        {
          value: attempt,
          color: '#3E3E4D',
          borderRadius: 6,
        },
      ],
    };
  });

  const chartWidth = Math.max(220, SCREEN_WIDTH - 120);

  return (
    <View style={styles.card}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>
            {totalSends} total sends • {totalFlashes} flashes
          </Text>
        </View>
      </View>

      {/* ── Horizontal Stacked Bar Chart ──────────────────── */}
      <View style={styles.chartContainer}>
        {hasData ? (
          <BarChart
            horizontal
            stackData={stackData}
            barWidth={18}
            barBorderRadius={6}
            spacing={14}
            width={chartWidth}
            hideRules
            xAxisThickness={1}
            xAxisColor="#2C2C35"
            yAxisThickness={1}
            yAxisColor="#2C2C35"
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            isAnimated
            animationDuration={400}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No send data for this timeframe</Text>
            <Text style={styles.emptySubtitle}>
              Logged burns and tops will form your pyramid here.
            </Text>
          </View>
        )}
      </View>

      {/* ── Bottom Legend with Color Indicators ───────────── */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6EE756' }]} />
          <Text style={styles.legendLabel}>Flash</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8E7CFF' }]} />
          <Text style={styles.legendLabel}>Top</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3E3E4D' }]} />
          <Text style={styles.legendLabel}>Attempt</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2C2C35',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardSubtitle: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    overflow: 'hidden',
  },
  axisText: {
    color: '#8A8A98',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#8A8A98',
    fontSize: 11,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '600',
  },
});
