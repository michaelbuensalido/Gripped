import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trophy, ChevronDown, ChevronUp, Layers } from 'lucide-react-native';
import type { GradePyramidAllTimeRow } from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';

export interface GradePyramidWidgetProps {
  pyramid: GradePyramidAllTimeRow[];
  title?: string;
}

export function GradePyramidWidget({
  pyramid,
  title = 'GRADE PYRAMID',
}: GradePyramidWidgetProps) {
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  // Filter down to rows that have at least 1 burn, or keep V0–V6 if all empty
  const hasData = pyramid.some((r) => r.totalBurns > 0);

  // Order highest difficulty at top down to V0 (pyramid structure)
  const sortedPyramid = [...pyramid].reverse();

  // Trim leading zeros from the top so we don't show empty high grades
  let firstActiveIdx = 0;
  for (let i = 0; i < sortedPyramid.length; i++) {
    if (sortedPyramid[i].totalBurns > 0) {
      firstActiveIdx = i;
      break;
    }
  }

  const activePyramid = hasData
    ? sortedPyramid.slice(firstActiveIdx)
    : sortedPyramid.slice(sortedPyramid.length - 6);

  const maxBurns = Math.max(
    1,
    ...activePyramid.map((r) => r.totalBurns)
  );

  const totalAllSends = pyramid.reduce((acc, r) => acc + r.totalSends, 0);
  const totalAllFlashes = pyramid.reduce((acc, r) => acc + r.flash, 0);

  return (
    <View style={styles.card}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <Trophy size={14} color="#8E7CFF" />
          </View>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>
              {totalAllSends} total sends • {totalAllFlashes} flashes
            </Text>
          </View>
        </View>

        {/* Legend */}
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

      {/* ── Pyramid Rows ──────────────────────────────────── */}
      <View style={styles.rowsContainer}>
        {activePyramid.map((row) => {
          const isSelected = selectedGrade === row.gradeRaw;
          const flash = row.flash;
          const top = row.top;
          const attempt = row.attempt;
          const totalBurns = row.totalBurns;
          const totalSends = row.totalSends;

          const barWidthPercent =
            totalBurns > 0 ? Math.max(8, (totalBurns / maxBurns) * 100) : 4;

          const sendRate =
            totalBurns > 0 ? Math.round((totalSends / totalBurns) * 100) : 0;

          return (
            <View key={row.gradeRaw} style={styles.rowWrapper}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedGrade(isSelected ? null : row.gradeRaw);
                }}
                style={[
                  styles.rowTouchable,
                  isSelected && styles.rowTouchableSelected,
                ]}
              >
                {/* Grade Badge */}
                <View
                  style={[
                    styles.gradeBadge,
                    totalSends > 0 && styles.gradeBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.gradeBadgeText,
                      totalSends > 0 && styles.gradeBadgeTextActive,
                    ]}
                  >
                    {row.gradeRaw}
                  </Text>
                </View>

                {/* Horizontal Stacked Bar */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${barWidthPercent}%` },
                    ]}
                  >
                    {flash > 0 && (
                      <View
                        style={[
                          styles.segment,
                          { flex: flash, backgroundColor: '#6EE756' },
                        ]}
                      />
                    )}
                    {top > 0 && (
                      <View
                        style={[
                          styles.segment,
                          { flex: top, backgroundColor: '#8E7CFF' },
                        ]}
                      />
                    )}
                    {attempt > 0 && (
                      <View
                        style={[
                          styles.segment,
                          { flex: attempt, backgroundColor: '#3E3E4D' },
                        ]}
                      />
                    )}
                  </View>
                </View>

                {/* Send Count Badge */}
                <View style={styles.countContainer}>
                  <Text
                    style={[
                      styles.countPrimary,
                      totalSends > 0 && styles.countPrimaryActive,
                    ]}
                  >
                    {totalSends}
                  </Text>
                  <Text style={styles.countSecondary}>/{totalBurns}</Text>
                </View>
              </TouchableOpacity>

              {/* Expanded Detail Pill */}
              {isSelected && (
                <View style={styles.expandedPill}>
                  <View style={styles.expandedStats}>
                    <Text style={styles.statChipGreen}>{flash}⚡ Flash</Text>
                    <Text style={styles.statChipPurple}>{top}✓ Top</Text>
                    <Text style={styles.statChipGray}>{attempt}✗ Fail</Text>
                    <View style={styles.statDivider} />
                    <Text style={styles.statRateText}>
                      {sendRate}% Send Rate
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
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
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16161A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    color: '#9A9AA6',
    fontSize: 10,
    fontWeight: '600',
  },
  rowsContainer: {
    gap: 6,
  },
  rowWrapper: {
    gap: 4,
  },
  rowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  rowTouchableSelected: {
    backgroundColor: 'rgba(142, 124, 255, 0.08)',
  },
  gradeBadge: {
    width: 34,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#262630',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  gradeBadgeActive: {
    backgroundColor: 'rgba(142, 124, 255, 0.18)',
    borderColor: 'rgba(142, 124, 255, 0.4)',
  },
  gradeBadgeText: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '800',
  },
  gradeBadgeTextActive: {
    color: '#FFFFFF',
  },
  barTrack: {
    flex: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    flexDirection: 'row',
    borderRadius: 5,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  countContainer: {
    width: 48,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
  },
  countPrimary: {
    color: '#8A8A98',
    fontSize: 13,
    fontWeight: '800',
  },
  countPrimaryActive: {
    color: '#FFFFFF',
  },
  countSecondary: {
    color: '#5C5C68',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 1,
  },
  expandedPill: {
    backgroundColor: '#16161A',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.2)',
    marginLeft: 44,
  },
  expandedStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statChipGreen: {
    color: '#6EE756',
    fontSize: 11,
    fontWeight: '700',
  },
  statChipPurple: {
    color: '#8E7CFF',
    fontSize: 11,
    fontWeight: '700',
  },
  statChipGray: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statRateText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
