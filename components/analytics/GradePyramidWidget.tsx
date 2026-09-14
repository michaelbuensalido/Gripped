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
  title = 'GRADE PYRAMID',
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

  // Find distinct grades with logged activity
  const rowsWithActivity = normalizedRows.filter(
    (r) => r.total_sends > 0 || r.total_attempts > 0
  );
  const hasData = rowsWithActivity.length > 0;

  // Determine clamped range: [minGrade - 1] to [maxGrade + 1]
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
    const flashCount = existing?.flash_count ?? 0;
    const topCount = existing?.top_count ?? 0;
    const attemptCount = existing?.attempt_count ?? 0;
    const totalSends = existing?.total_sends ?? flashCount + topCount;
    const totalBurns = existing?.total_attempts ?? flashCount + topCount + attemptCount;

    pyramidDisplayRows.push({
      grade_raw: existing?.grade_raw ?? label,
      normalized_difficulty: diff,
      flash_count: flashCount,
      top_count: topCount,
      attempt_count: attemptCount,
      total_sends: totalSends,
      total_attempts: totalBurns,
    });
  }

  // Use max total activity (sends + attempts) to scale bar width proportionally
  const maxTotalAcrossGrades = Math.max(
    1,
    ...pyramidDisplayRows.map((r) => r.total_attempts || (r.flash_count + r.top_count + r.attempt_count))
  );

  const totalSends = normalizedRows.reduce((acc, r) => acc + r.total_sends, 0);
  const totalFlashes = normalizedRows.reduce((acc, r) => acc + r.flash_count, 0);

  return (
    <View style={styles.card}>
      {/* ── Header: 11pt uppercase tracked #8A8A98, font-bold, mb-3 ── */}
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      {/* ── Dynamic Clamped Horizontal Stacked Pyramid ───── */}
      <View style={styles.chartContainer}>
        {hasData ? (
          <View style={styles.pyramidList}>
            {pyramidDisplayRows.map((row) => {
              const rowActivity = row.flash_count + row.top_count + row.attempt_count;
              const hasActivity = rowActivity > 0 || row.total_sends > 0;
              const effectiveTotal = Math.max(1, rowActivity);

              const flashPct = (row.flash_count / effectiveTotal) * 100;
              const topPct = (row.top_count / effectiveTotal) * 100;
              const attemptPct = (row.attempt_count / effectiveTotal) * 100;

              // Scale total bar width relative to maximum grade volume
              const barWidthPercent = hasActivity
                ? Math.max(12, (effectiveTotal / maxTotalAcrossGrades) * 100)
                : 0;

              return (
                <View key={row.grade_raw} style={styles.rowContainer}>
                  {/* Left: Grade Label (13pt Bold White, fixed width 28pt) */}
                  <View style={styles.gradeLabelContainer}>
                    <Text
                      style={[
                        styles.gradeLabel,
                        hasActivity && styles.gradeLabelActive,
                      ]}
                    >
                      {row.grade_raw}
                    </Text>
                  </View>

                  {/* Center: Horizontal Stacked Bar (Height 16pt, background #17171C, rounded-md) */}
                  <View style={styles.barTrackContainer}>
                    {hasActivity ? (
                      <View
                        style={[
                          styles.stackedBar,
                          { width: `${barWidthPercent}%` },
                        ]}
                      >
                        {/* Flashes: Green #6EE756 */}
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
                        {/* Tops / Redpoints: Lavender #8E7CFF */}
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
                        {/* Attempts / Fails: Dark Slate #3E3E48 */}
                        {row.attempt_count > 0 && (
                          <View
                            style={[
                              styles.barSlice,
                              {
                                width: `${attemptPct}%`,
                                backgroundColor: '#3E3E48',
                              },
                            ]}
                          />
                        )}
                      </View>
                    ) : (
                      // Subtle dark track for 0 activity rows
                      <View style={styles.emptyTrack} />
                    )}
                  </View>

                  {/* Right: Total Send Count (12pt #8A8A98, e.g. "5 sends") */}
                  <View style={styles.countContainer}>
                    <Text
                      style={[
                        styles.countText,
                        row.total_sends > 0 && styles.countTextActive,
                      ]}
                    >
                      {row.total_sends > 0
                        ? `${row.total_sends} ${row.total_sends === 1 ? 'send' : 'sends'}`
                        : ''}
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
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3E3E48' }]} />
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C35',
  },
  headerRow: {
    marginBottom: 12,
  },
  cardTitle: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  chartContainer: {
    paddingVertical: 2,
  },
  pyramidList: {
    gap: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  gradeLabelContainer: {
    width: 28,
    justifyContent: 'center',
  },
  gradeLabel: {
    color: '#5A5A68',
    fontSize: 13,
    fontWeight: '700',
  },
  gradeLabelActive: {
    color: '#FFFFFF',
  },
  barTrackContainer: {
    flex: 1,
    height: 16,
    backgroundColor: '#17171C',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  stackedBar: {
    height: 16,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barSlice: {
    height: 16,
  },
  emptyTrack: {
    height: 2,
    backgroundColor: '#22222A',
    borderRadius: 1,
    width: '100%',
  },
  countContainer: {
    width: 54,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  countText: {
    color: '#4E4E58',
    fontSize: 12,
    fontWeight: '600',
  },
  countTextActive: {
    color: '#8A8A98',
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
