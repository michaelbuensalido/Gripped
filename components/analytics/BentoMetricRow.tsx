import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface BentoMetricRowProps {
  peakGrade?: string | null;
  flashRate?: number;
  onPeakGradePress?: () => void;
  onFlashRatePress?: () => void;
}

export function BentoMetricRow({
  peakGrade,
  flashRate = 38,
  onPeakGradePress,
  onFlashRatePress,
}: BentoMetricRowProps) {
  const displayPeak = peakGrade || 'V7';
  const displayRate = `${Math.round(flashRate)}%`;

  return (
    <View style={styles.container}>
      {/* ── Left Card: Peak Grade ────────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPeakGradePress}
        style={styles.card}
      >
        <Text style={styles.cardLabel}>PEAK GRADE</Text>

        <View style={styles.contentRow}>
          <Text style={styles.metricValue}>{displayPeak}</Text>

          {/* Mini vertical 3-bar equalizer on right side */}
          <View style={styles.equalizerContainer}>
            <View style={[styles.equalizerBar, { height: 12 }]} />
            <View style={[styles.equalizerBar, { height: 24 }]} />
            <View style={[styles.equalizerBar, { height: 16 }]} />
          </View>
        </View>

        <Text style={styles.cardSublabel}>Hardest Send</Text>
      </TouchableOpacity>

      {/* ── Right Card: Flash Efficiency ─────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onFlashRatePress}
        style={styles.card}
      >
        <Text style={styles.cardLabel}>FLASH RATE</Text>

        <View style={styles.contentRow}>
          <Text style={styles.metricValue}>{displayRate}</Text>
        </View>

        {/* Horizontal capsule progress bar on bottom */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.max(10, flashRate))}%` },
            ]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C35',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  equalizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 28,
    paddingBottom: 2,
  },
  equalizerBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: '#6EE756',
  },
  cardSublabel: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: '#2C2C35',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#6EE756',
  },
});
