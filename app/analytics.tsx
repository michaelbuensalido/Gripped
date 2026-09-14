import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  getAnalyticsOverview,
  getGradePyramidAllTime,
  getMonthlyVolumeStats,
  getDisciplineSplit,
  getRecentBoulderLogs,
  type AnalyticsOverview,
  type GradePyramidAllTimeRow,
  type WeeklyVolumeStat,
  type DisciplineSplitItem,
  type RecentBoulderLog,
} from '../db/queries';
import { GradePyramidWidget } from '../components/analytics/GradePyramidWidget';
import { MonthlyVolumeWidget } from '../components/analytics/MonthlyVolumeWidget';
import { DisciplineSplitWidget } from '../components/analytics/DisciplineSplitWidget';
import { ClimbingHoldGraphic, type HoldType } from '../components/ui/ClimbingHoldGraphic';
import { triggerHaptic } from '../utils/haptics';

type TimeframeOption = '30D' | '3M' | 'ALL';

interface DisplayRoute {
  id: string;
  title: string;
  grade: string;
  holdType: HoldType;
  outcome: 'Flash' | 'Top';
  date: string;
}

const HOLD_TYPE_LIST: HoldType[] = [
  'ripple-effect',
  'slab-rise',
  'kars-sloper',
  'poly-edge',
  'purple-sloper',
  'yellow-jug',
  'orange-facet',
];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('ALL');

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [pyramid, setPyramid] = useState<GradePyramidAllTimeRow[]>([]);
  const [monthlyVolume, setMonthlyVolume] = useState<WeeklyVolumeStat[]>([]);
  const [disciplineSplit, setDisciplineSplit] = useState<DisciplineSplitItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentBoulderLog[]>([]);

  const loadAnalytics = useCallback((tf: TimeframeOption) => {
    let sinceTimestamp: number | undefined;
    const now = Date.now();

    if (tf === '30D') {
      sinceTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    } else if (tf === '3M') {
      sinceTimestamp = now - 90 * 24 * 60 * 60 * 1000;
    }

    try {
      setOverview(getAnalyticsOverview(sinceTimestamp));
      setPyramid(getGradePyramidAllTime(sinceTimestamp));
      setMonthlyVolume(getMonthlyVolumeStats(8));
      setDisciplineSplit(getDisciplineSplit(sinceTimestamp));
      setRecentLogs(getRecentBoulderLogs(6));
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics(timeframe);
    }, [loadAnalytics, timeframe])
  );

  const handleTimeframeChange = (tf: TimeframeOption) => {
    if (tf === timeframe) return;
    triggerHaptic('light');
    setTimeframe(tf);
    loadAnalytics(tf);
  };

  const displayRoutes: DisplayRoute[] = recentLogs.map((log, index) => {
    const d = new Date(log.timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${months[d.getMonth()]} ${d.getDate()}`;
    const holdType = HOLD_TYPE_LIST[index % HOLD_TYPE_LIST.length];
    return {
      id: log.id,
      title: `${log.gymName || 'Bouldering'} • #${log.attempts} att`,
      grade: log.gradeRaw,
      holdType,
      outcome: log.outcome === 'flash' ? 'Flash' : 'Top',
      date: dateStr,
    };
  });

  return (
    <View style={styles.container}>
      {/* ── Canvas Background with 18% Speckle Mat Overlay ────── */}
      <ImageBackground
        source={require('../assets/speckled_mat_bg.jpg')}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.18 }}
        resizeMode="cover"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top > 0 ? insets.top + 8 : 20,
          paddingBottom: 180,
          paddingHorizontal: 16,
        }}
      >
        {/* ── Screen Header ───────────────────────────────────── */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Your Progress</Text>
          <Text style={styles.screenSubtitle}>
            Historical performance & climbing analytics
          </Text>
        </View>

        {/* ── Top Timeframe Segmented Control ─────────────────── */}
        <View style={styles.timeframeSurface}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTimeframeChange('30D')}
            style={[
              styles.timeframeTab,
              timeframe === '30D' && styles.timeframeTabActive,
            ]}
          >
            <Text
              style={[
                styles.timeframeText,
                timeframe === '30D' && styles.timeframeTextActive,
              ]}
            >
              30 Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTimeframeChange('3M')}
            style={[
              styles.timeframeTab,
              timeframe === '3M' && styles.timeframeTabActive,
            ]}
          >
            <Text
              style={[
                styles.timeframeText,
                timeframe === '3M' && styles.timeframeTextActive,
              ]}
            >
              3 Months
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTimeframeChange('ALL')}
            style={[
              styles.timeframeTab,
              timeframe === 'ALL' && styles.timeframeTabActive,
            ]}
          >
            <Text
              style={[
                styles.timeframeText,
                timeframe === 'ALL' && styles.timeframeTextActive,
              ]}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── KPI Grid ────────────────────────────────────────── */}
        <View style={styles.kpiRow}>
          {/* Card 1: Volume */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL BURNS</Text>
            <Text style={styles.kpiSublabel}>Volume</Text>
            <Text style={styles.kpiValue}>
              {overview?.totalClimbs ?? 0}
            </Text>
          </View>

          {/* Card 2: Flash Rate */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>FLASH RATE</Text>
            <Text style={[styles.kpiSublabel, { color: '#6EE756' }]}>
              Efficiency
            </Text>
            <Text style={[styles.kpiValue, { color: '#6EE756' }]}>
              {overview?.flashRate ?? 0}%
            </Text>
          </View>

          {/* Card 3: Hardest Send */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PEAK GRADE</Text>
            <Text style={[styles.kpiSublabel, { color: '#8E7CFF' }]}>
              Hardest Send
            </Text>
            <Text style={[styles.kpiValue, { color: '#FFFFFF' }]}>
              {overview?.hardestSend ?? '—'}
            </Text>
          </View>
        </View>

        {/* ── All-Time Grade Pyramid Widget ────────────────────── */}
        <View style={styles.sectionMargin}>
          <GradePyramidWidget
            pyramid={pyramid}
            title={timeframe === 'ALL' ? 'ALL-TIME GRADE PYRAMID' : 'GRADE PYRAMID'}
          />
        </View>

        {/* ── Monthly Volume 8-Week Sparkline Bar Chart ────────── */}
        <View style={styles.sectionMargin}>
          <MonthlyVolumeWidget stats={monthlyVolume} />
        </View>

        {/* ── Wall Angle & Style Split ─────────────────────────── */}
        <View style={styles.sectionMargin}>
          <DisciplineSplitWidget disciplines={disciplineSplit} />
        </View>

        {/* ── Recent Routes Summary ────────────────────────────── */}
        <View style={styles.recentSection}>
          <Text style={styles.recentSectionTitle}>RECENT SENDS</Text>
          <View style={styles.recentListCard}>
            {displayRoutes.length === 0 ? (
              <View style={styles.emptyRecent}>
                <Text style={styles.emptyTitle}>No climbs logged yet</Text>
                <Text style={styles.emptySubtitle}>
                  Completed boulders from your sessions will appear here.
                </Text>
              </View>
            ) : (
              displayRoutes.map((route, idx) => {
                const isLast = idx === displayRoutes.length - 1;
                const isFlash = route.outcome === 'Flash';
                const badgeColor = isFlash ? '#6EE756' : '#8E7CFF';

                return (
                  <View
                    key={route.id}
                    style={[
                      styles.routeRow,
                      isLast && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.holdThumb}>
                      <ClimbingHoldGraphic
                        type={route.holdType}
                        size={44}
                        borderRadius={12}
                      />
                    </View>

                    <View style={styles.routeDetails}>
                      <Text style={styles.routeTitle} numberOfLines={1}>
                        {route.title}
                      </Text>
                      <Text style={styles.routeGrade}>{route.grade}</Text>
                    </View>

                    <View style={styles.routeMeta}>
                      <Text style={[styles.routeBadge, { color: badgeColor }]}>
                        {route.outcome}
                      </Text>
                      <Text style={styles.routeDate}>{route.date}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131316',
  },
  screenHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    color: '#8A8A98',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  timeframeSurface: {
    flexDirection: 'row',
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeframeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  timeframeTabActive: {
    backgroundColor: '#8E7CFF',
    shadowColor: '#8E7CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  timeframeText: {
    color: '#8A8A98',
    fontSize: 13,
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#1E1E24',
    borderRadius: 18,
    padding: 12,
    minHeight: 90,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  kpiLabel: {
    color: '#8E8E9A',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  kpiSublabel: {
    color: '#8E7CFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionMargin: {
    marginBottom: 16,
  },
  recentSection: {
    marginTop: 4,
    marginBottom: 16,
  },
  recentSectionTitle: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  recentListCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#8A8A98',
    fontSize: 12,
    textAlign: 'center',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  holdThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#141418',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeDetails: {
    flex: 1,
    marginRight: 8,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  routeGrade: {
    fontSize: 12,
    color: '#8A8A98',
    marginTop: 2,
    fontWeight: '600',
  },
  routeMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  routeBadge: {
    fontSize: 13,
    fontWeight: '700',
  },
  routeDate: {
    fontSize: 11,
    color: '#6F6F7C',
    fontWeight: '500',
  },
});
