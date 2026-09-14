import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap, Clock, Target, Flame, Trophy } from 'lucide-react-native';
import type { SessionDetailData } from '../../db/queries';

export interface ShareWorkoutCardProps {
  data: SessionDetailData;
}

const CARD_WIDTH = 360;
const CARD_HEIGHT = 640; // 9:16 aspect ratio

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const ShareWorkoutCard = forwardRef<View, ShareWorkoutCardProps>(
  ({ data }, ref) => {
    const { session, groups, pyramid, kpis } = data;

    // Determine hardest send & whether it was a flash
    const allSends = groups
      .flatMap((g) => g.logs)
      .filter((l) => l.outcome === 'flash' || l.outcome === 'send');

    const hardestLog = allSends.sort(
      (a, b) => (b.normalizedDifficulty ?? 0) - (a.normalizedDifficulty ?? 0)
    )[0];

    const hardestGrade = hardestLog?.gradeRaw ?? kpis.hardestSend ?? 'V0';
    const isHardestFlash = hardestLog?.outcome === 'flash';

    // Find max count in pyramid for relative bar scaling
    const maxPyramidCount = Math.max(
      1,
      ...pyramid.map((p) => p.flashes + p.sends + p.attempts)
    );

    // Keep top 5 grades for compact display
    const displayPyramid = pyramid.slice(0, 5);

    return (
      <View ref={ref} collapsable={false} style={styles.cardContainer}>
        {/* Dark Gym Mat Texture Overlay Effect */}
        <View style={styles.matTexturePattern}>
          {/* Subtle grid lines */}
          <View style={styles.matGridLineH1} />
          <View style={styles.matGridLineH2} />
          <View style={styles.matGridLineH3} />
        </View>

        {/* ── Top Header: CruxLog Branding ─────────────────────── */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoPill}>
              <Flame size={14} color="#8E7CFF" />
              <Text style={styles.brandText}>CRUXLOG</Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>WORKOUT BETA</Text>
            </View>
          </View>

          <View style={styles.gymMetaRow}>
            <Text style={styles.gymName} numberOfLines={1}>
              {session.title || session.gymName || 'Bouldering Session'}
            </Text>
            <Text style={styles.sessionDate}>{formatDate(session.startTime)}</Text>
          </View>
        </View>

        {/* ── Hero Section: Hardest Send of Session ───────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Trophy size={14} color="#6EE756" />
            <Text style={styles.heroLabel}>HARDEST SEND OF THE SESSION</Text>
          </View>

          <View style={styles.heroGradeRow}>
            <Text style={styles.heroGrade}>{hardestGrade}</Text>
            {isHardestFlash ? (
              <View style={styles.flashBadge}>
                <Zap size={14} color="#111115" fill="#111115" />
                <Text style={styles.flashBadgeText}>FLASH</Text>
              </View>
            ) : (
              <View style={styles.sendBadge}>
                <Text style={styles.sendBadgeText}>SEND</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroSub}>
            {isHardestFlash
              ? 'Conquered on the very first attempt'
              : 'Sent with relentless grit'}
          </Text>
        </View>

        {/* ── Stats Row: 3 Metrics ─────────────────────────────── */}
        <View style={styles.statsRow}>
          {/* Duration */}
          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Clock size={12} color="#8E7CFF" />
              <Text style={styles.statLabel}>TIME</Text>
            </View>
            <Text style={styles.statValue}>{formatDuration(kpis.durationMs)}</Text>
          </View>

          {/* Sends / Attempts */}
          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Target size={12} color="#8E7CFF" />
              <Text style={styles.statLabel}>SENDS</Text>
            </View>
            <Text style={styles.statValue}>
              {kpis.totalSends}
              <Text style={styles.statSubValue}>/{kpis.totalClimbs}</Text>
            </Text>
          </View>

          {/* Flash Rate */}
          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Zap size={12} color="#6EE756" />
              <Text style={styles.statLabel}>FLASH %</Text>
            </View>
            <Text style={[styles.statValue, { color: '#6EE756' }]}>
              {kpis.flashRate}%
            </Text>
          </View>
        </View>

        {/* ── Visual: Compact Grade Pyramid ───────────────────── */}
        <View style={styles.pyramidSection}>
          <View style={styles.pyramidHeader}>
            <Text style={styles.pyramidTitle}>GRADE PYRAMID</Text>
            <View style={styles.pyramidLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#6EE756' }]} />
                <Text style={styles.legendText}>Flash</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8E7CFF' }]} />
                <Text style={styles.legendText}>Send</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2C2C35' }]} />
                <Text style={styles.legendText}>Fail</Text>
              </View>
            </View>
          </View>

          {displayPyramid.length === 0 ? (
            <View style={styles.emptyPyramid}>
              <Text style={styles.emptyPyramidText}>No completed climbs logged</Text>
            </View>
          ) : (
            <View style={styles.pyramidRows}>
              {displayPyramid.map((row) => {
                const flashFlex = row.flashes;
                const sendFlex = row.sends;
                const attemptFlex = row.attempts;
                const rowTotal = row.flashes + row.sends + row.attempts;
                const barScale = rowTotal / maxPyramidCount;

                return (
                  <View key={row.gradeRaw} style={styles.pyramidRow}>
                    <Text style={styles.gradeBadge}>{row.gradeRaw}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFillContainer,
                          { width: `${Math.max(12, barScale * 100)}%` },
                        ]}
                      >
                        {flashFlex > 0 && (
                          <View
                            style={[
                              styles.barSegment,
                              { flex: flashFlex, backgroundColor: '#6EE756' },
                            ]}
                          />
                        )}
                        {sendFlex > 0 && (
                          <View
                            style={[
                              styles.barSegment,
                              { flex: sendFlex, backgroundColor: '#8E7CFF' },
                            ]}
                          />
                        )}
                        {attemptFlex > 0 && (
                          <View
                            style={[
                              styles.barSegment,
                              { flex: attemptFlex, backgroundColor: '#2C2C35' },
                            ]}
                          />
                        )}
                      </View>
                    </View>
                    <Text style={styles.rowTotal}>{rowTotal}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Footer Branding ──────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CLIMB HARDER • LOG SMARTER</Text>
          <Text style={styles.footerSub}>cruxlog.app</Text>
        </View>
      </View>
    );
  }
);

ShareWorkoutCard.displayName = 'ShareWorkoutCard';

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#131316',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  matTexturePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  matGridLineH1: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FFFFFF',
  },
  matGridLineH2: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FFFFFF',
  },
  matGridLineH3: {
    position: 'absolute',
    top: '75%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(142, 124, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.3)',
  },
  brandText: {
    color: '#8E7CFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#9A9AA6',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  gymMetaRow: {
    marginTop: 2,
  },
  gymName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sessionDate: {
    color: '#9A9AA6',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: 'rgba(26, 26, 32, 0.85)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(110, 231, 86, 0.25)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  heroLabel: {
    color: '#6EE756',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroGradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroGrade: {
    color: '#6EE756',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6EE756',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  flashBadgeText: {
    color: '#111115',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sendBadge: {
    backgroundColor: 'rgba(142, 124, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 255, 0.4)',
  },
  sendBadgeText: {
    color: '#8E7CFF',
    fontSize: 11,
    fontWeight: '800',
  },
  heroSub: {
    color: '#9A9AA6',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1B1B22',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    color: '#8A8A98',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  statSubValue: {
    color: '#8A8A98',
    fontSize: 12,
    fontWeight: '600',
  },
  pyramidSection: {
    backgroundColor: '#18181E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  pyramidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pyramidTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pyramidLegend: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: '#8A8A98',
    fontSize: 9,
    fontWeight: '600',
  },
  emptyPyramid: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyPyramidText: {
    color: '#8A8A98',
    fontSize: 11,
  },
  pyramidRows: {
    gap: 5,
  },
  pyramidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeBadge: {
    width: 28,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFillContainer: {
    height: '100%',
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  rowTotal: {
    width: 18,
    color: '#9A9AA6',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 4,
  },
  footerText: {
    color: '#6F6F7C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  footerSub: {
    color: '#4C4C58',
    fontSize: 9,
    fontWeight: '600',
  },
});
