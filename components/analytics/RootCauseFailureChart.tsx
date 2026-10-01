import React, { useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';

export interface FailureSegment {
  reason: string; // 'pump' | 'foot_slip' | 'power' | 'beta_error' | 'fear'
  count: number;
  percentage: number;
  color: string;
  label: string;
}

export interface RootCauseFailureChartProps {
  segments?: FailureSegment[];
  totalFailures?: number;
}

const FALLBACK: FailureSegment[] = [
  { reason: 'pump',       count: 12, percentage: 40, color: '#FF453A', label: 'Pump' },
  { reason: 'foot_slip',  count: 9,  percentage: 30, color: '#8E7CFF', label: 'Foot Slip' },
  { reason: 'power',      count: 5,  percentage: 17, color: '#6EE756', label: 'Power' },
  { reason: 'beta_error', count: 2,  percentage: 7,  color: '#9090A0', label: 'Beta Error' },
  { reason: 'fear',       count: 2,  percentage: 6,  color: '#3E3E48', label: 'Fear' },
];

const FALLBACK_TOTAL = FALLBACK.reduce((sum, s) => sum + s.count, 0);

// Each legend row manages its own scale animation independently.
function LegendRow({
  segment,
  isHighlighted,
  onPress,
}: {
  segment: FailureSegment;
  isHighlighted: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-[6px]"
      accessibilityRole="button"
      accessibilityLabel={`${segment.label}: ${segment.count} falls, ${segment.percentage}%`}
    >
      {/* Colored dot */}
      <View
        className="rounded-sm mr-3"
        style={{ width: 8, height: 8, backgroundColor: segment.color }}
      />

      {/* Label */}
      <Text
        className="flex-1 text-[13px]"
        style={{
          color: isHighlighted ? '#FFFFFF' : '#9090A0',
          fontWeight: isHighlighted ? '600' : '400',
        }}
      >
        {segment.label}
      </Text>

      {/* Count */}
      <Text
        className="text-[13px] mr-2"
        style={{ color: isHighlighted ? '#FFFFFF' : '#9090A0' }}
      >
        {segment.count}
      </Text>

      {/* Percentage */}
      <Text
        className="text-[13px] w-9 text-right"
        style={{ color: isHighlighted ? segment.color : '#555562', fontVariant: ['tabular-nums'] }}
      >
        {segment.percentage}%
      </Text>
    </Pressable>
  );
}

export default function RootCauseFailureChart({
  segments: propSegments,
  totalFailures: propTotal,
}: RootCauseFailureChartProps) {
  const segments = propSegments && propSegments.length > 0 ? propSegments : FALLBACK;
  const totalFailures = propTotal ?? FALLBACK_TOTAL;

  const [highlightedReason, setHighlightedReason] = useState<string | null>(null);

  // One Animated.Value per segment for the bar height highlight
  const segmentScales = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(segments.map((s) => [s.reason, new Animated.Value(8)])),
  ).current;

  const handlePress = (segment: FailureSegment) => {
    triggerHaptic('selection');

    const next = highlightedReason === segment.reason ? null : segment.reason;
    setHighlightedReason(next);

    segments.forEach((s) => {
      const target = next === s.reason ? 14 : 8;
      Animated.spring(segmentScales[s.reason], {
        toValue: target,
        useNativeDriver: false,
        speed: 28,
        bounciness: 8,
      }).start();
    });
  };

  return (
    <View className="bg-surface border border-border rounded-[20px] p-4">
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-[2px]">
        <Text className="text-structural text-[10px] uppercase tracking-widest">
          Root Cause
        </Text>
        <Text className="text-structural text-[10px]">{totalFailures} FALLS</Text>
      </View>

      {/* Subtitle */}
      <Text className="text-primary text-base font-bold mb-4">
        Failure Taxonomy
      </Text>

      {/* Segmented bar */}
      <View className="w-full rounded-full overflow-hidden mb-4" style={{ height: 8 }}>
        <View className="flex-row w-full h-full">
          {segments.map((segment) => (
            <Animated.View
              key={segment.reason}
              style={{
                flex: segment.percentage,
                height: segmentScales[segment.reason],
                backgroundColor: segment.color,
                alignSelf: 'center',
              }}
            />
          ))}
        </View>
      </View>

      {/* Divider */}
      <View className="border-t border-border mb-1" />

      {/* Legend rows */}
      {segments.map((segment) => (
        <LegendRow
          key={segment.reason}
          segment={segment}
          isHighlighted={highlightedReason === segment.reason}
          onPress={() => handlePress(segment)}
        />
      ))}
    </View>
  );
}
