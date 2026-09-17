import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { FailureBreakdownData } from '../../db/queries';

interface FailureBreakdownWidgetProps {
  data: FailureBreakdownData | null;
}

export function FailureBreakdownWidget({ data }: FailureBreakdownWidgetProps) {
  const visibleSegments = useMemo(() => {
    if (!data?.hasData) return [];
    return [...data.segments]
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const isEmpty = !data?.hasData;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>FAILURE BREAKDOWN</Text>
        <Text style={styles.subtitle}>Why attempts didn't send</Text>
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>NO DATA LOGGED</Text>
          <Text style={styles.emptyBody}>
            Tag failure reasons on your attempts to generate diagnostic breakdown.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.barTrack}>
            {data!.segments
              .filter((s) => s.percentage > 0)
              .map((seg, i) => (
                <View
                  key={seg.key}
                  style={[
                    styles.barSegment,
                    {
                      flex: seg.percentage,
                      backgroundColor: seg.color,
                      borderTopLeftRadius: i === 0 ? 6 : 0,
                      borderBottomLeftRadius: i === 0 ? 6 : 0,
                    },
                  ]}
                />
              ))}
          </View>

          <View style={styles.legend}>
            {visibleSegments.map((seg) => (
              <View key={seg.key} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                <Text style={styles.legendLabel} numberOfLines={1}>{seg.label}</Text>
                <View style={styles.legendBarTrack}>
                  <View
                    style={[
                      styles.legendBarFill,
                      { width: `${seg.percentage}%`, backgroundColor: seg.color },
                    ]}
                  />
                </View>
                <Text style={[styles.legendPct, { color: seg.color }]}>{seg.percentage}%</Text>
              </View>
            ))}
          </View>

          <Text style={styles.footerText}>
            Based on {data!.totalFailures} tagged attempt{data!.totalFailures !== 1 ? 's' : ''}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#19191D',
    borderWidth: 1,
    borderColor: '#27272F',
    borderRadius: 20,
    padding: 16,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: '#5A5A65',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  barTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2C2C35',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  barSegment: {
    height: '100%',
  },
  legend: {
    gap: 8,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    width: 90,
    flexShrink: 0,
  },
  legendBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#2C2C35',
    borderRadius: 2,
    overflow: 'hidden',
  },
  legendBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  legendPct: {
    fontSize: 12,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
    flexShrink: 0,
  },
  footerText: {
    color: '#5A5A65',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  emptyState: {
    height: 100,
    borderWidth: 1,
    borderColor: '#27272F',
    borderStyle: 'dashed',
    backgroundColor: '#141417',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#555562',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  emptyBody: {
    color: '#8A8A98',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
