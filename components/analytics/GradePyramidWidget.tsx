import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GradePyramidDataRow, GradePyramidAllTimeRow } from '../../db/queries';

export interface GradePyramidWidgetProps {
  data?: GradePyramidDataRow[];
  pyramid?: GradePyramidDataRow[] | GradePyramidAllTimeRow[];
  title?: string;
}

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

  // Find rows with any logged activity (sends or attempts)
  const rowsWithActivity = normalizedRows.filter(
    (r) => r.total_sends > 0 || r.total_attempts > 0
  );
  const hasData = rowsWithActivity.length > 0;

  // Determine min and max logged grades dynamically:
  // Filter the Y-axis to only show [minLoggedGrade - 1] to [maxLoggedGrade + 1]
  let rangeMin = 3;
  let rangeMax = 7;
  if (hasData) {
    const minDiff = Math.min(...rowsWithActivity.map((r) => r.normalized_difficulty));
    const maxDiff = Math.max(...rowsWithActivity.map((r) => r.normalized_difficulty));
    rangeMin = Math.max(0, minDiff - 1);
    rangeMax = Math.min(14, maxDiff + 1);
  }

  // Generate pyramid rows from highest grade (top) down to lowest grade (bottom)
  const pyramidDisplayRows = [];
  for (let diff = rangeMax; diff >= rangeMin; diff--) {
    const existing = normalizedRows.find((r) => r.normalized_difficulty === diff);
    const label = diff >= 13 ? 'V13+' : `V${diff}`;
    pyramidDisplayRows.push({
      grade_raw: existing?.grade_raw ?? label,
      normalized_difficulty: diff,
      flash_count: existing?.flash_count ?? 0,
      top_count: existing?.top_count ?? 0,
      attempt_count: existing?.attempt_count ?? 0,
      total_sends: existing?.total_sends ?? 0,
      total_attempts: existing?.total_attempts ?? 0,
    });
  }

  const maxSendsInAnyGrade = Math.max(
    1,
    ...pyramidDisplayRows.map((r) => r.total_sends)
  );

  const totalSends = normalizedRows.reduce((acc, r) => acc + r.total_sends, 0);
  const totalFlashes = normalizedRows.reduce((acc, r) => acc + r.flash_count, 0);

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

      {/* ── Dynamic Horizontal Stacked Pyramid ───────────── */}
      <View style={styles.chartContainer}>
        {hasData ? (
          <View style={styles.pyramidList}>
            {pyramidDisplayRows.map((row) => {
              const hasSends = row.total_sends > 0;
              const flashPct = hasSends
                ? (row.flash_count / row.total_sends) * 100
                : 0;
              const topPct = hasSends
                ? (row.top_count / row.total_sends) * 100
                : 0;
              const barWidthPercent = hasSends
                ? Math.max(10, (row.total_sends / maxSendsInAnyGrade) * 100)
                : 0;

              return (
                <View key={row.grade_raw} style={styles.rowContainer}>
                  {/* Grade Label */}
                  <View style={styles.gradeLabelContainer}>
                    <Text
                      style={[
                        styles.gradeLabel,
                        hasSends && styles.gradeLabelActive,
                      ]}
                    >
                      {row.grade_raw}
                    </Text>
                  </View>

                  {/* Horizontal Bar Track */}
                  <View style={styles.barTrackContainer}>
                    {hasSends ? (
                      <View
                        style={[
                          styles.stackedBar,
                          { width: `${barWidthPercent}%` },
                        ]}
                      >
                        {/* Flashes (Lime Green #6EE756) */}
                        {row.flash_count > 0 && (
                          <View
                            style={[
                              styles.barSlice,
                              {
                                width: `${flashPct}%`,
                                backgroundColor: '#6EE756',
                              },
                            ]}
                          />
                        )}
                        {/* Tops (Lavender #8E7CFF) */}
                        {row.top_count > 0 && (
                          <View
                            style={[
                              styles.barSlice,
                              {
                                width: `${topPct}%`,
                                backgroundColor: '#8E7CFF',
                              },
                            ]}
                          />
                        )}
                      </View>
                    ) : (
                      // Subtle 2pt dark track for 0-send rows
                      <View style={styles.emptyTrack} />
                    )}
                  </View>

                  {/* Send Count */}
                  <View style={styles.countContainer}>
                    <Text
                      style={[
                        styles.countText,
                        hasSends && styles.countTextActive,
                      ]}
                    >
                      {hasSends ? row.total_sends : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
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
    paddingVertical: 4,
  },
  pyramidList: {
    gap: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
  },
  gradeLabelContainer: {
    width: 36,
    justifyContent: 'center',
  },
  gradeLabel: {
    color: '#5A5A68',
    fontSize: 12,
    fontWeight: '700',
  },
  gradeLabelActive: {
    color: '#FFFFFF',
  },
  barTrackContainer: {
    flex: 1,
    height: 14,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  stackedBar: {
    height: 14,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barSlice: {
    height: 14,
  },
  emptyTrack: {
    height: 2,
    backgroundColor: '#25252E',
    borderRadius: 1,
    width: '100%',
  },
  countContainer: {
    width: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  countText: {
    color: '#4E4E58',
    fontSize: 11,
    fontWeight: '600',
  },
  countTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    marginTop: 16,
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
