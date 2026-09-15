import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { GradeVolumeEqualizerData } from '../../db/queries';

export interface VolumeByGradeCardProps {
  data?: GradeVolumeEqualizerData;
  onPress?: () => void;
}

export function VolumeByGradeCard({
  data,
  onPress,
}: VolumeByGradeCardProps) {
  const totalSends = data?.totalSends ?? 24;
  const trendLabel = data?.trendLabel ?? '▲ 15%';
  const grades = data?.grades ?? [
    { grade: 'V4', sends: 8, heightPercent: 100, color: '#6EE756' },
    { grade: 'V5', sends: 6, heightPercent: 75, color: '#8E7CFF' },
    { grade: 'V6', sends: 7, heightPercent: 88, color: '#6EE756' },
    { grade: 'V7', sends: 3, heightPercent: 38, color: '#8E7CFF' },
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <Text style={styles.cardHeader}>VOLUME BY GRADE</Text>
      </View>

      <View style={styles.valueRow}>
        {/* Left: Primary metric + Trend pill */}
        <View style={styles.metricGroup}>
          <Text style={styles.metricValue}>{totalSends} Sends</Text>
          <View style={styles.trendPill}>
            <Text style={styles.trendText}>{trendLabel}</Text>
          </View>
        </View>

        {/* Right: Multi-bar mini equalizer graphic */}
        <View style={styles.equalizerGroup}>
          {grades.map((item) => (
            <View key={item.grade} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${item.heightPercent}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.grade}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2C2C35',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeader: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  trendPill: {
    backgroundColor: '#6EE756',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trendText: {
    color: '#131316',
    fontSize: 11,
    fontWeight: '800',
  },
  equalizerGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 44,
  },
  barColumn: {
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: 7,
    height: 32,
    backgroundColor: '#17171C',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#2C2C35',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    color: '#8A8A98',
    fontSize: 9,
    fontWeight: '700',
  },
});
