import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BarChart2, Zap, TrendingUp } from 'lucide-react-native';
import type { WeeklyVolumeStat } from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';

export interface MonthlyVolumeWidgetProps {
  stats: WeeklyVolumeStat[];
}

const BAR_TRACK_HEIGHT = 110;

export function MonthlyVolumeWidget({ stats }: MonthlyVolumeWidgetProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const maxBurns = Math.max(
    1,
    ...stats.map((s) => s.totalBurns)
  );

  const peakIdx = stats.reduce(
    (maxI, s, i, arr) => (s.totalBurns > arr[maxI].totalBurns ? i : maxI),
    0
  );

  const totalBurnsPeriod = stats.reduce((acc, s) => acc + s.totalBurns, 0);
  const totalSendsPeriod = stats.reduce((acc, s) => acc + s.sends, 0);
  const avgBurnsPerWeek = Math.round(totalBurnsPeriod / (stats.length || 1));

  const activeStat = selectedIdx !== null ? stats[selectedIdx] : null;

  return (
    <View style={styles.card}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <BarChart2 size={14} color="#8E7CFF" />
          </View>
          <View>
            <Text style={styles.cardTitle}>WEEKLY VOLUME</Text>
            <Text style={styles.cardSubtitle}>Last 8 weeks • {totalBurnsPeriod} burns</Text>
          </View>
        </View>

        <View style={styles.kpiPill}>
          <Text style={styles.kpiLabel}>Avg/Wk</Text>
          <Text style={styles.kpiValue}>{avgBurnsPerWeek}</Text>
        </View>
      </View>

      {/* ── 8-Week Bar Visual ─────────────────────────────── */}
      <View style={styles.chartArea}>
        {stats.map((stat, idx) => {
          const isSelected = selectedIdx === idx;
          const isPeak = idx === peakIdx && stat.totalBurns > 0;
          const heightPercent =
            stat.totalBurns > 0
              ? Math.max(10, (stat.totalBurns / maxBurns) * 100)
              : 4;

          const barColor = isPeak
            ? '#6EE756'
            : isSelected
            ? '#A594FF'
            : '#8E7CFF';

          return (
            <TouchableOpacity
              key={stat.weekIndex}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('selection');
                setSelectedIdx(isSelected ? null : idx);
              }}
              style={styles.colContainer}
            >
              {/* Average Grade Indicator */}
              <View
                style={[
                  styles.gradePill,
                  isPeak && styles.gradePillPeak,
                  isSelected && styles.gradePillSelected,
                ]}
              >
                <Text
                  style={[
                    styles.gradePillText,
                    isPeak && styles.gradePillTextPeak,
                  ]}
                  numberOfLines={1}
                >
                  {stat.avgGradeLabel}
                </Text>
              </View>

              {/* Bar Track */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                >
                  {/* Subtle inner highlight */}
                  <View style={styles.barCap} />
                </View>
              </View>

              {/* Burns count label */}
              <Text
                style={[
                  styles.burnCount,
                  (isSelected || isPeak) && styles.burnCountActive,
                ]}
              >
                {stat.totalBurns}
              </Text>

              {/* Week Label */}
              <Text
                style={[
                  styles.weekLabel,
                  isSelected && styles.weekLabelSelected,
                ]}
                numberOfLines={1}
              >
                {stat.weekLabel.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Active Week Inspection Banner ──────────────────── */}
      {activeStat ? (
        <View style={styles.inspectBanner}>
          <View style={styles.inspectRow}>
            <Text style={styles.inspectWeek}>{activeStat.weekLabel}</Text>
            <View style={styles.inspectPills}>
              <Text style={styles.inspectChipSends}>
                {activeStat.sends} Sends
              </Text>
              <Text style={styles.inspectChipBurns}>
                {activeStat.totalBurns} Burns
              </Text>
              <Text style={styles.inspectChipGrade}>
                Avg {activeStat.avgGradeLabel}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.footerRow}>
          <View style={styles.footerItem}>
            <View style={[styles.dot, { backgroundColor: '#6EE756' }]} />
            <Text style={styles.footerText}>Peak Volume Week</Text>
          </View>
          <Text style={styles.footerSubText}>{totalSendsPeriod} sends completed</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  kpiPill: {
    backgroundColor: '#16161A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  kpiLabel: {
    color: '#8A8A98',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: BAR_TRACK_HEIGHT + 48,
    paddingVertical: 4,
  },
  colContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  gradePill: {
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradePillPeak: {
    backgroundColor: 'rgba(110, 231, 86, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 86, 0.4)',
  },
  gradePillSelected: {
    backgroundColor: 'rgba(142, 124, 255, 0.25)',
  },
  gradePillText: {
    color: '#8A8A98',
    fontSize: 9,
    fontWeight: '700',
  },
  gradePillTextPeak: {
    color: '#6EE756',
  },
  barTrack: {
    width: 20,
    height: BAR_TRACK_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    position: 'relative',
  },
  barCap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  burnCount: {
    color: '#6F6F7C',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  burnCountActive: {
    color: '#FFFFFF',
  },
  weekLabel: {
    color: '#8A8A98',
    fontSize: 9,
    fontWeight: '600',
  },
  weekLabelSelected: {
    color: '#8E7CFF',
    fontWeight: '800',
  },
  inspectBanner: {
    marginTop: 12,
    backgroundColor: '#16161A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.25)',
  },
  inspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inspectWeek: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  inspectPills: {
    flexDirection: 'row',
    gap: 6,
  },
  inspectChipSends: {
    color: '#6EE756',
    fontSize: 11,
    fontWeight: '700',
  },
  inspectChipBurns: {
    color: '#8E7CFF',
    fontSize: 11,
    fontWeight: '700',
  },
  inspectChipGrade: {
    color: '#E8DEB5',
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerText: {
    color: '#8A8A98',
    fontSize: 10,
    fontWeight: '600',
  },
  footerSubText: {
    color: '#8E7CFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
