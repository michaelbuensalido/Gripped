import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Check } from 'lucide-react-native';
import {
  getGradePyramidData,
  getWeeklyVolumeTrends,
  getWallAngleBreakdown,
  getAnalyticsOverview,
  getRecentBoulderLogs,
  getWeeklyCapsuleData,
  getGradeVolumeEqualizerData,
  type GradePyramidDataRow,
  type WeeklyVolumeTrendsData,
  type WallAngleBreakdownItem,
  type AnalyticsOverview,
  type RecentBoulderLog,
  type WeeklyCapsuleOverviewData,
  type GradeVolumeEqualizerData,
} from '../db/queries';
import { WeeklyCapsuleBarChart } from '../components/analytics/WeeklyCapsuleBarChart';
import { BentoMetricRow } from '../components/analytics/BentoMetricRow';
import { VolumeByGradeCard } from '../components/analytics/VolumeByGradeCard';
import { GradePyramidWidget } from '../components/analytics/GradePyramidWidget';
import { TerrainSplitWidget } from '../components/analytics/TerrainSplitWidget';
import { ClimbingHoldGraphic, type HoldType } from '../components/ui/ClimbingHoldGraphic';
import { triggerHaptic } from '../utils/haptics';

export type TimeframeOption = 'weekly' | 'monthly' | 'all';

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
  const [timeframe, setTimeframe] = useState<TimeframeOption>('weekly');
  const [isTimeframeModalVisible, setIsTimeframeModalVisible] = useState<boolean>(false);

  // Data States
  const [weeklyCapsule, setWeeklyCapsule] = useState<WeeklyCapsuleOverviewData | null>(null);
  const [gradeEqualizer, setGradeEqualizer] = useState<GradeVolumeEqualizerData | null>(null);
  const [pyramidData, setPyramidData] = useState<GradePyramidDataRow[]>([]);
  const [volumeTrends, setVolumeTrends] = useState<WeeklyVolumeTrendsData | null>(null);
  const [wallAngleData, setWallAngleData] = useState<WallAngleBreakdownItem[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentBoulderLog[]>([]);

  const loadAnalytics = useCallback((tf: TimeframeOption) => {
    let sinceTimestamp: number | undefined;
    const now = Date.now();

    const queryTf: '30d' | '90d' | 'all' =
      tf === 'weekly' ? '30d' : tf === 'monthly' ? '30d' : 'all';

    if (tf === 'weekly') {
      sinceTimestamp = now - 7 * 24 * 60 * 60 * 1000;
    } else if (tf === 'monthly') {
      sinceTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    }

    try {
      setWeeklyCapsule(getWeeklyCapsuleData());
      setGradeEqualizer(getGradeVolumeEqualizerData(queryTf));
      setPyramidData(getGradePyramidData(queryTf));
      setVolumeTrends(getWeeklyVolumeTrends(queryTf));
      setWallAngleData(getWallAngleBreakdown(queryTf));
      setOverview(getAnalyticsOverview(sinceTimestamp));
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

  const handleTimeframeSelect = (tf: TimeframeOption) => {
    triggerHaptic('light');
    setTimeframe(tf);
    setIsTimeframeModalVisible(false);
    loadAnalytics(tf);
  };

  const timeframeLabel =
    timeframe === 'weekly'
      ? 'Weekly ⌵'
      : timeframe === 'monthly'
      ? 'Monthly ⌵'
      : 'All-Time ⌵';

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
      {/* ── Canvas Background: #131316 with 18% speckle texture ─ */}
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
          paddingBottom: 190,
          paddingHorizontal: 16,
        }}
      >
        {/* ── 2. Top Header & Timeframe Dropdown Filter Pill ── */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.screenTitle}>Analytics &</Text>
            <Text style={styles.screenTitle}>Report</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('light');
              setIsTimeframeModalVisible(true);
            }}
            style={styles.dropdownPill}
          >
            <Text style={styles.dropdownPillText}>{timeframeLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. Hero Card: Weekly Capsule Bar Chart ────────── */}
        {weeklyCapsule && (
          <View style={styles.heroCardMargin}>
            <WeeklyCapsuleBarChart data={weeklyCapsule} />
          </View>
        )}

        {/* ── 4. 2-Column Middle Bento Row ──────────────────── */}
        <BentoMetricRow
          peakGrade={overview?.hardestSend}
          flashRate={overview?.flashRate ?? 38}
        />

        {/* ── 5. Bottom Wide Bento Card: Volume by Grade ────── */}
        {gradeEqualizer && (
          <VolumeByGradeCard data={gradeEqualizer} />
        )}

        {/* ── Section Divider: Detailed Analytical Breakdown ─── */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionDividerText}>DETAILED PERFORMANCE</Text>
          <View style={styles.sectionDividerLine} />
        </View>

        {/* ── Historical Grade Pyramid Widget ───────────────── */}
        <View style={styles.widgetMargin}>
          <GradePyramidWidget
            data={pyramidData}
            title={timeframe === 'all' ? 'ALL-TIME GRADE PYRAMID' : 'GRADE PYRAMID'}
          />
        </View>

        {/* ── Wall Style & Terrain Split Widget ─────────────── */}
        <View style={styles.widgetMargin}>
          <TerrainSplitWidget data={wallAngleData} />
        </View>

        {/* ── Recent Sends Activity Feed ────────────────────── */}
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

      {/* ── Timeframe Selector Bottom Sheet Modal ─────────── */}
      <Modal
        visible={isTimeframeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTimeframeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsTimeframeModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.bottomSheetSurface,
                  { paddingBottom: Math.max(insets.bottom + 20, 32) },
                ]}
              >
                {/* Grab Handle */}
                <View style={styles.sheetHandle} />

                <Text style={styles.sheetTitle}>Select Timeframe</Text>
                <Text style={styles.sheetSubtitle}>
                  Choose the analysis window for your climbing metrics
                </Text>

                {/* Option 1: Weekly */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleTimeframeSelect('weekly')}
                  style={[
                    styles.sheetOptionRow,
                    timeframe === 'weekly' && styles.sheetOptionRowActive,
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        styles.optionTitle,
                        timeframe === 'weekly' && styles.optionTitleActive,
                      ]}
                    >
                      Weekly
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      Sunday to Saturday capsule volume & daily trends
                    </Text>
                  </View>
                  {timeframe === 'weekly' && (
                    <View style={styles.activeCheckCircle}>
                      <Check size={14} color="#131316" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Option 2: Monthly */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleTimeframeSelect('monthly')}
                  style={[
                    styles.sheetOptionRow,
                    timeframe === 'monthly' && styles.sheetOptionRowActive,
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        styles.optionTitle,
                        timeframe === 'monthly' && styles.optionTitleActive,
                      ]}
                    >
                      Monthly
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      Trailing 30-day send metrics and consistency
                    </Text>
                  </View>
                  {timeframe === 'monthly' && (
                    <View style={styles.activeCheckCircle}>
                      <Check size={14} color="#131316" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Option 3: All-Time */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleTimeframeSelect('all')}
                  style={[
                    styles.sheetOptionRow,
                    timeframe === 'all' && styles.sheetOptionRowActive,
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        styles.optionTitle,
                        timeframe === 'all' && styles.optionTitleActive,
                      ]}
                    >
                      All-Time
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      Full climbing career send pyramid and lifetime stats
                    </Text>
                  </View>
                  {timeframe === 'all' && (
                    <View style={styles.activeCheckCircle}>
                      <Check size={14} color="#131316" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131316',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  dropdownPill: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2C2C35',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  heroCardMargin: {
    marginBottom: 0,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 16,
    gap: 12,
  },
  sectionDividerText: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2C2C35',
  },
  widgetMargin: {
    marginBottom: 16,
  },
  recentSection: {
    marginTop: 8,
  },
  recentSectionTitle: {
    color: '#8A8A98',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  recentListCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2C35',
    overflow: 'hidden',
  },
  emptyRecent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C35',
    gap: 12,
  },
  holdThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#131316',
    borderWidth: 1,
    borderColor: '#2C2C35',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  routeDetails: {
    flex: 1,
  },
  routeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  routeGrade: {
    color: '#8A8A98',
    fontSize: 12,
    fontWeight: '600',
  },
  routeMeta: {
    alignItems: 'flex-end',
  },
  routeBadge: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  routeDate: {
    color: '#8A8A98',
    fontSize: 11,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  bottomSheetSurface: {
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#2C2C35',
    padding: 22,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3E3E4D',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sheetSubtitle: {
    color: '#8A8A98',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 20,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131316',
    borderWidth: 1,
    borderColor: '#2C2C35',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  sheetOptionRowActive: {
    borderColor: '#6EE756',
    backgroundColor: 'rgba(110, 231, 86, 0.05)',
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  optionTitleActive: {
    color: '#6EE756',
  },
  optionSubtitle: {
    color: '#8A8A98',
    fontSize: 12,
    fontWeight: '500',
  },
  activeCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6EE756',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
