import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react-native';
import { BarChart, barDataItem } from 'react-native-gifted-charts';
import type { WeeklyVolumeTrendsData } from '../../db/queries';

export interface VolumeTrendWidgetProps {
  data: WeeklyVolumeTrendsData;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function VolumeTrendWidget({ data }: VolumeTrendWidgetProps) {
  const { weeks, trend_label, trend_direction } = data;

  const totalBurns = weeks.reduce((acc, w) => acc + w.attempt_count, 0);
  const totalSends = weeks.reduce((acc, w) => acc + w.send_count, 0);
  const peakWeekBurns = Math.max(1, ...weeks.map((w) => w.attempt_count));

  const isPositiveTrend = trend_direction === 'up';

  // Transform weeks into BarChart barDataItem
  const barData: barDataItem[] = weeks.map((w) => {
    const isPeak = w.attempt_count === peakWeekBurns && w.attempt_count > 0;
    return {
      value: w.attempt_count,
      label: w.date_label.split(' ')[0] || w.week_label,
      labelTextStyle: {
        color: '#8A8A98',
        fontSize: 10,
        fontWeight: '600',
      },
      frontColor: isPeak ? '#6EE756' : '#8E7CFF',
      topLabelComponent: () => (
        <Text style={[styles.topLabel, isPeak && styles.topLabelPeak]}>
          {w.avg_grade !== '—' ? w.avg_grade : w.attempt_count > 0 ? `${w.attempt_count}` : ''}
        </Text>
      ),
    };
  });

  const chartWidth = Math.max(220, SCREEN_WIDTH - 84);

  return (
    <View style={styles.card}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <BarChart2 size={15} color="#8E7CFF" />
          </View>
          <View>
            <Text style={styles.cardTitle}>WEEKLY VOLUME TRENDS</Text>
            <Text style={styles.cardSubtitle}>
              {totalBurns} burns logged • {totalSends} sends
            </Text>
          </View>
        </View>

        {/* Upward Green Trend Indicator Badge */}
        <View
          style={[
            styles.trendBadge,
            isPositiveTrend ? styles.trendBadgeUp : styles.trendBadgeFlat,
          ]}
        >
          {isPositiveTrend ? (
            <TrendingUp size={13} color="#6EE756" />
          ) : (
            <TrendingDown size={13} color="#8A8A98" />
          )}
          <Text
            style={[
              styles.trendBadgeText,
              isPositiveTrend ? styles.trendBadgeTextUp : styles.trendBadgeTextFlat,
            ]}
          >
            {trend_label}
          </Text>
        </View>
      </View>

      {/* ── Vertical Bar Chart ────────────────────────────── */}
      <View style={styles.chartContainer}>
        <BarChart
          data={barData}
          barWidth={20}
          barBorderRadius={6}
          spacing={14}
          width={chartWidth}
          height={140}
          hideRules
          xAxisThickness={1}
          xAxisColor="#2C2C35"
          yAxisThickness={1}
          yAxisColor="#2C2C35"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          isAnimated
          animationDuration={450}
        />
      </View>

      {/* ── Bottom Summary ────────────────────────────────── */}
      <View style={styles.footerRow}>
        <View style={styles.footerLegend}>
          <View style={[styles.dot, { backgroundColor: '#6EE756' }]} />
          <Text style={styles.footerText}>Peak Volume Week</Text>
          <View style={[styles.dot, { backgroundColor: '#8E7CFF', marginLeft: 12 }]} />
          <Text style={styles.footerText}>Standard Week</Text>
        </View>
        <Text style={styles.footerKpi}>Avg Grade Atop</Text>
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
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 124, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.3)',
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
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  trendBadgeUp: {
    backgroundColor: 'rgba(110, 231, 86, 0.12)',
    borderColor: 'rgba(110, 231, 86, 0.3)',
  },
  trendBadgeFlat: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trendBadgeTextUp: {
    color: '#6EE756',
  },
  trendBadgeTextFlat: {
    color: '#8A8A98',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  axisText: {
    color: '#8A8A98',
    fontSize: 10,
    fontWeight: '600',
  },
  topLabel: {
    color: '#8E7CFF',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  topLabelPeak: {
    color: '#6EE756',
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  footerText: {
    color: '#8A8A98',
    fontSize: 10,
    fontWeight: '600',
  },
  footerKpi: {
    color: '#6F6F7C',
    fontSize: 10,
    fontWeight: '600',
  },
});
