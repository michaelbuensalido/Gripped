import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Check, Settings as SettingsIcon } from 'lucide-react-native';
import {
  getGradePyramidData,
  getWeeklyVolumeTrends,
  getWallAngleBreakdown,
  getAnalyticsOverview,
  getRecentBoulderLogs,
  getRecentOutcomesSummary,
  getGradeVolumeEqualizerData,
  getAngleMasteryBreakdown,
  getFailureBreakdown,
  type GradePyramidDataRow,
  type WeeklyVolumeTrendsData,
  type WallAngleBreakdownItem,
  type AngleMasteryItem,
  type AnalyticsOverview,
  type RecentBoulderLog,
  type RecentOutcomesSummaryData,
  type GradeVolumeEqualizerData,
  type FailureBreakdownData,
} from '../db/queries';
import { OutcomeRingGauge } from '../components/analytics/OutcomeRingGauge';
import { BentoMetricRow } from '../components/analytics/BentoMetricRow';
import { GradePyramidWidget } from '../components/analytics/GradePyramidWidget';
import { AngleMasteryWidget } from '../components/analytics/AngleMasteryWidget';
import { FailureBreakdownWidget } from '../components/analytics/FailureBreakdownWidget';
import { ClimbingHoldGraphic, type HoldType } from '../components/ui/ClimbingHoldGraphic';
import { ScreenContainer } from '../components/ui/ScreenContainer';
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
  'ripple-effect', 'slab-rise', 'kars-sloper', 'poly-edge', 'purple-sloper', 'yellow-jug', 'orange-facet',
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('weekly');
  const [isTimeframeModalVisible, setIsTimeframeModalVisible] = useState<boolean>(false);

  const [outcomesSummary, setOutcomesSummary] = useState<RecentOutcomesSummaryData | null>(null);
  const [gradeEqualizer, setGradeEqualizer] = useState<GradeVolumeEqualizerData | null>(null);
  const [pyramidData, setPyramidData] = useState<GradePyramidDataRow[]>([]);
  const [volumeTrends, setVolumeTrends] = useState<WeeklyVolumeTrendsData | null>(null);
  const [wallAngleData, setWallAngleData] = useState<WallAngleBreakdownItem[]>([]);
  const [angleMasteryData, setAngleMasteryData] = useState<AngleMasteryItem[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentBoulderLog[]>([]);
  const [failureBreakdown, setFailureBreakdown] = useState<FailureBreakdownData | null>(null);

  const loadAnalytics = useCallback((tf: TimeframeOption) => {
    let sinceTimestamp: number | undefined;
    const now = Date.now();
    const queryTf: '30d' | '90d' | 'all' = tf === 'weekly' ? '30d' : tf === 'monthly' ? '30d' : 'all';

    if (tf === 'weekly') {
      sinceTimestamp = now - 7 * 24 * 60 * 60 * 1000;
    } else if (tf === 'monthly') {
      sinceTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    }

    try {
      setOutcomesSummary(getRecentOutcomesSummary(20));
      setGradeEqualizer(getGradeVolumeEqualizerData(queryTf));
      setPyramidData(getGradePyramidData(queryTf));
      setVolumeTrends(getWeeklyVolumeTrends(queryTf));
      setWallAngleData(getWallAngleBreakdown(queryTf));
      setAngleMasteryData(getAngleMasteryBreakdown(queryTf));
      setOverview(getAnalyticsOverview(sinceTimestamp));
      setRecentLogs(getRecentBoulderLogs(6));
      setFailureBreakdown(getFailureBreakdown(sinceTimestamp));
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

  const timeframeLabel = timeframe === 'weekly' ? 'Weekly ⌵' : timeframe === 'monthly' ? 'Monthly ⌵' : 'All-Time ⌵';

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
    <ScreenContainer withTopInset={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 48,
          paddingBottom: 120,
        }}
      >
        {/* Header Row */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[24px] font-bold text-white tracking-[-0.8px]" numberOfLines={1}>
            Analytics & Report
          </Text>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { triggerHaptic('light'); setIsTimeframeModalVisible(true); }}
              className="bg-[#1E1E24] border border-[#2C2C35] rounded-full px-3.5 py-2 items-center justify-center"
            >
              <Text className="text-white text-[13px] font-semibold">{timeframeLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { triggerHaptic('light'); router.push('/settings'); }}
              className="w-[40px] h-[40px] bg-[#19191D] border border-[#27272F] rounded-xl items-center justify-center"
            >
              <SettingsIcon size={20} color="#9090A0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        {outcomesSummary && (
          <View className="mb-0">
            <OutcomeRingGauge data={outcomesSummary} />
          </View>
        )}

        <BentoMetricRow peakGrade={overview?.hardestSend} flashRate={overview?.flashRate ?? 38} />

        {/* Section Divider */}
        <View className="flex-row items-center gap-3 mt-7 mb-4">
          <Text className="text-[#8A8A98] text-[11px] font-bold tracking-[1px]">DETAILED PERFORMANCE</Text>
          <View className="flex-1 h-[1px] bg-[#2C2C35]" />
        </View>

        <View className="mb-4">
          <GradePyramidWidget data={pyramidData} title={timeframe === 'all' ? 'ALL-TIME GRADE PYRAMID' : 'GRADE PYRAMID'} />
        </View>

        <View className="mb-4">
          <AngleMasteryWidget data={angleMasteryData} />
        </View>

        <View className="mb-4">
          <FailureBreakdownWidget data={failureBreakdown} />
        </View>

        {/* Recent Sends Ledger */}
        <View className="mt-2">
          <Text className="text-[#8A8A98] text-[12px] font-bold tracking-[0.8px] mb-2.5 uppercase">RECENT SENDS</Text>
          <View className="bg-[#19191D] border border-[#27272F] rounded-xl overflow-hidden">
            {displayRoutes.length === 0 ? (
              <View className="items-center p-8">
                <Text className="text-white text-[14px] font-bold mb-1.5">No climbs logged yet</Text>
                <Text className="text-[#8A8A98] text-[12px] text-center">Completed boulders from your sessions will appear here.</Text>
              </View>
            ) : (
              displayRoutes.map((route, idx) => {
                const isLast = idx === displayRoutes.length - 1;
                const isFlash = route.outcome === 'Flash';
                const badgeColor = isFlash ? '#6EE756' : '#8E7CFF';

                return (
                  <View key={route.id} className={`flex-row items-center px-4 py-3 ${!isLast ? 'border-b border-[#22222A]' : ''}`}>
                    <View className="w-[44px] h-[44px] rounded-xl bg-[#131316] border border-[#2C2C35] items-center justify-center overflow-hidden">
                      <ClimbingHoldGraphic type={route.holdType} size={44} borderRadius={12} />
                    </View>

                    <View className="flex-1 ml-3">
                      <Text className="text-white text-[13px] font-bold mb-1" numberOfLines={1}>{route.title}</Text>
                      <Text className="text-[#8A8A98] text-[12px] font-semibold">{route.grade}</Text>
                    </View>

                    <View className="items-end">
                      <Text className="text-[12px] font-bold mb-1" style={{ color: badgeColor, fontVariant: ['tabular-nums'] }}>{route.outcome}</Text>
                      <Text className="text-[#8A8A98] text-[11px] font-medium" style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{route.date}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Timeframe Selector Modal */}
      <Modal visible={isTimeframeModalVisible} transparent animationType="fade" onRequestClose={() => setIsTimeframeModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsTimeframeModalVisible(false)}>
          <View className="flex-1 bg-black/75 justify-end">
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View className="bg-[#1E1E24] rounded-t-[28px] border border-[#2C2C35] p-6" style={{ paddingBottom: Math.max(insets.bottom + 20, 32) }}>
                <View className="w-[36px] h-[4px] rounded-full bg-[#3E3E4D] self-center mb-4" />
                <Text className="text-white text-[18px] font-bold mb-1">Select Timeframe</Text>
                <Text className="text-[#8A8A98] text-[13px] font-medium mb-5">Choose the analysis window for your climbing metrics</Text>

                {['weekly', 'monthly', 'all'].map((tf) => {
                  const isActive = timeframe === tf;
                  const label = tf === 'weekly' ? 'Weekly' : tf === 'monthly' ? 'Monthly' : 'All-Time';
                  const desc = tf === 'weekly' ? 'Sunday to Saturday capsule volume & daily trends' : tf === 'monthly' ? 'Trailing 30-day send metrics and consistency' : 'Full climbing career send pyramid and lifetime stats';
                  return (
                    <TouchableOpacity
                      key={tf}
                      activeOpacity={0.8}
                      onPress={() => handleTimeframeSelect(tf as TimeframeOption)}
                      className={`flex-row items-center justify-between bg-[#131316] border rounded-2xl p-4 mb-2.5 ${isActive ? 'border-[#6EE756] bg-[#6ee756]/5' : 'border-[#2C2C35]'}`}
                    >
                      <View>
                        <Text className={`text-[15px] font-bold mb-1 ${isActive ? 'text-[#6EE756]' : 'text-white'}`}>{label}</Text>
                        <Text className="text-[#8A8A98] text-[12px] font-medium">{desc}</Text>
                      </View>
                      {isActive && (
                        <View className="w-[24px] h-[24px] rounded-full bg-[#6EE756] items-center justify-center">
                          <Check size={14} color="#131316" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScreenContainer>
  );
}
