import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown, Check, CalendarDays } from 'lucide-react-native';
import { ScalePressable } from '../../components/ui/ScalePressable';
import { WeeklyVolumeView } from '../../components/analytics/views/WeeklyVolumeView';
import { FlashEfficiencyView } from '../../components/analytics/views/FlashEfficiencyView';
import { HardestSendView } from '../../components/analytics/views/HardestSendView';
import { SendsByGradeView } from '../../components/analytics/views/SendsByGradeView';
import type { FilteredClimbItem, ProgressPeriod } from '../../db/queries';
import { useTheme } from '../../theme/useTheme';
import { usePreferences } from '../../utils/preferences';

type StatMode = 'volume' | 'flash' | 'hardest' | 'grade';

const VALID_PERIODS: ProgressPeriod[] = ['7d', '30d', '90d', '1y', 'all'];

const PERIOD_LABELS: Record<ProgressPeriod, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 3 Months',
  '1y': 'Last Year',
  all: 'All Time',
};

const PERIOD_SHORT: Record<ProgressPeriod, string> = {
  '7d': '7D',
  '30d': '30D',
  '90d': '3M',
  '1y': '1Y',
  all: 'All',
};

function parsePeriod(raw?: string): ProgressPeriod {
  if (raw && (VALID_PERIODS as string[]).includes(raw)) {
    return raw as ProgressPeriod;
  }
  return '30d';
}

function parseStatMode(raw?: string): StatMode {
  if (raw === 'flash' || raw === 'hardest' || raw === 'grade' || raw === 'volume') {
    return raw;
  }
  return 'volume';
}

function parseGradeParam(raw?: string): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function StatDetailScreen() {
  const params = useLocalSearchParams<{
    stat?: string;
    period?: string;
    grade?: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, space, radius, shadow } = useTheme();
  const { formatGrade } = usePreferences();

  const statMode = parseStatMode(params.stat);
  const initialGrade = parseGradeParam(params.grade);

  const [period, setPeriod] = useState<ProgressPeriod>(() => parsePeriod(params.period));
  const [focusedGrade, setFocusedGrade] = useState<number | null>(initialGrade);
  const [isPeriodSheetOpen, setPeriodSheetOpen] = useState(false);

  useEffect(() => {
    setPeriod(parsePeriod(params.period));
  }, [params.period]);

  useEffect(() => {
    setFocusedGrade(parseGradeParam(params.grade));
  }, [params.grade]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/analytics');
    }
  };

  const handlePressClimb = (climb: FilteredClimbItem) => {
    if (climb.sessionId) {
      router.push(`/session/detail/${climb.sessionId}` as any);
    }
  };

  const title =
    statMode === 'flash'
      ? 'Flash Efficiency'
      : statMode === 'hardest'
      ? 'Hardest Send'
      : statMode === 'grade'
      ? focusedGrade !== null
        ? `Sends · ${formatGrade(focusedGrade)}`
        : 'Sends by Grade'
      : 'Weekly Volume';

  const periodReadable = PERIOD_LABELS[period];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Pinned Navigation Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, space.lg) + space.xs,
          paddingBottom: space.md,
          paddingHorizontal: space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space.md,
        }}
      >
        <ScalePressable
          haptic="light"
          activeScale={0.96}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back to Progress"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.pill,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadow.card,
          }}
        >
          <ChevronLeft size={space.xl} color={colors.text} />
        </ScalePressable>

        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.label, { color: colors.textWhiteMuted }]} numberOfLines={1}>
            Progress
          </Text>
          <Text style={[type.titleBold, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <ScalePressable
          haptic="selection"
          activeScale={0.97}
          onPress={() => setPeriodSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Timeframe ${PERIOD_LABELS[period]}, tap to change`}
          style={{
            minHeight: 44,
            paddingHorizontal: space.md,
            borderRadius: radius.pill,
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.accent,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.xs + 2,
          }}
        >
          <CalendarDays size={space.lg} color={colors.accentText} />
          <Text style={[type.captionSemibold, { color: colors.accentText }]}>
            {PERIOD_SHORT[period]}
          </Text>
          <ChevronDown size={space.md} color={colors.accentText} />
        </ScalePressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.xs,
          paddingBottom: Math.max(insets.bottom, space.xl) + space.xxl,
        }}
      >
        {statMode === 'volume' && (
          <WeeklyVolumeView
            period={period}
            periodLabel={periodReadable}
            onPressClimb={handlePressClimb}
          />
        )}

        {statMode === 'flash' && (
          <FlashEfficiencyView
            period={period}
            periodLabel={periodReadable}
            onPressClimb={handlePressClimb}
          />
        )}

        {statMode === 'hardest' && (
          <HardestSendView
            period={period}
            periodLabel={periodReadable}
            onPressClimb={handlePressClimb}
          />
        )}

        {statMode === 'grade' && (
          <SendsByGradeView
            period={period}
            periodLabel={periodReadable}
            initialGrade={initialGrade}
            onSelectedGradeChange={setFocusedGrade}
            onPressClimb={handlePressClimb}
          />
        )}
      </ScrollView>

      {/* Timeframe Action Sheet */}
      <Modal
        visible={isPeriodSheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPeriodSheetOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim }}>
          <Pressable style={{ flex: 1 }} onPress={() => setPeriodSheetOpen(false)} />
          <View
            style={{
              backgroundColor: colors.materialBase,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              padding: space.xl,
              paddingBottom: Math.max(insets.bottom, space.xl),
            }}
          >
            <View
              style={{
                width: space.xxl,
                height: space.xs,
                borderRadius: radius.pill,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginBottom: space.lg,
              }}
            />

            <Text
              style={[
                type.label,
                { color: colors.textWhiteMuted, marginBottom: space.md },
              ]}
            >
              Select timeframe
            </Text>

            <View style={{ gap: space.xs }}>
              {VALID_PERIODS.map((p) => {
                const isActive = period === p;
                return (
                  <ScalePressable
                    key={p}
                    haptic="selection"
                    activeScale={0.97}
                    onPress={() => {
                      setPeriod(p);
                      setPeriodSheetOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={PERIOD_LABELS[p]}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: space.md,
                      paddingHorizontal: space.md,
                      backgroundColor: isActive ? colors.accentSoft : 'transparent',
                      borderRadius: radius.md,
                      minHeight: 48,
                    }}
                  >
                    <Text
                      style={[
                        type.body,
                        { color: isActive ? colors.accentText : colors.text },
                      ]}
                    >
                      {PERIOD_LABELS[p]}
                    </Text>
                    {isActive && <Check size={space.lg} color={colors.accent} />}
                  </ScalePressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
