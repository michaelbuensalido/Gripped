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
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardTitle}>Terrain & Angle Mastery</Text>
          <Text style={styles.cardSubtitle}>
            Send completion rate by wall profile
          </Text>
        </View>
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
              {/* Left: Angle name */}
              <View style={styles.angleLabelContainer}>
                <Text style={styles.angleName}>{item.angle}</Text>
              </View>

              {/* Center: Horizontal progress bar */}
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

              {/* Right: Send efficiency percentage */}
              <View style={styles.rateContainer}>
                <Text style={[styles.rateText, { color: rateColor }]}>
                  {item.sendRate}%
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
    padding: 18,
    borderWidth: 1,
    borderColor: '#2C2C35',
  },
  headerRow: {
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
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
    width: 80,
  },
  angleName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#16161A',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rateContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
