import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { AngleMasteryItem } from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';

export interface AngleMasteryWidgetProps {
  data?: AngleMasteryItem[];
}

export function AngleMasteryWidget({ data }: AngleMasteryWidgetProps) {
  const items: AngleMasteryItem[] = data && data.length > 0
    ? data
    : [
        { angle: 'Overhang', sendRate: 68, totalSends: 17, totalAttempts: 25, color: '#6EE756' },
        { angle: 'Slab', sendRate: 42, totalSends: 8, totalAttempts: 19, color: '#8E7CFF' },
        { angle: 'Vertical', sendRate: 55, totalSends: 11, totalAttempts: 20, color: '#8E7CFF' },
      ];

  return (
    <View style={styles.card}>
      {/* ── Header: 15pt Bold White + 12pt subtitle ───────── */}
      <View style={styles.headerContainer}>
        <Text style={styles.cardTitle}>Terrain & Angle Mastery</Text>
        <Text style={styles.cardSubtitle}>
          Send completion rate by wall profile
        </Text>
      </View>

      {/* ── 3 Sleek Rows: Overhang, Slab, Vertical ──────────── */}
      <View style={styles.rowsContainer}>
        {items.map((item) => {
          const rateColor = item.sendRate >= 60 ? '#6EE756' : '#8E7CFF';

          return (
            <TouchableOpacity
              key={item.angle}
              activeOpacity={0.8}
              onPress={() => triggerHaptic('light')}
              style={styles.angleRow}
            >
              {/* Left: Profile Label: 14pt SemiBold White (width 75pt) */}
              <View style={styles.angleLabelContainer}>
                <Text style={styles.angleName}>{item.angle}</Text>
              </View>

              {/* Center: Progress Track: Height 8pt, background #17171C, border 1px #22222A, rounded-full, flex-1 mx-3 */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(6, item.sendRate)}%`,
                      backgroundColor: rateColor,
                    },
                  ]}
                />
              </View>

              {/* Right: Metric Text: 12pt Bold White + #8A8A98 details */}
              <View style={styles.rateContainer}>
                <Text style={styles.metricText}>
                  <Text style={styles.rateWhite}>{item.sendRate}%</Text>
                  <Text style={styles.rateDetails}>
                    {' • '}
                    {item.totalSends}/{item.totalAttempts} sends
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C35',
    marginTop: 16,
  },
  headerContainer: {
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    color: '#8A8A98',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  rowsContainer: {
    gap: 14,
  },
  angleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  angleLabelContainer: {
    width: 75,
  },
  angleName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#17171C',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#22222A',
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  rateContainer: {
    alignItems: 'flex-end',
    minWidth: 110,
  },
  metricText: {
    fontSize: 12,
  },
  rateWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rateDetails: {
    color: '#8A8A98',
    fontWeight: '500',
  },
});
