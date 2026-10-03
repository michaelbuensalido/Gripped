import React, { useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';
import { useTheme } from '../../theme/useTheme';

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

function LegendRow({
  segment,
  isHighlighted,
  onPress,
}: {
  segment: FailureSegment;
  isHighlighted: boolean;
  onPress: () => void;
}) {
  const { colors, type } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${segment.label}: ${segment.count} falls, ${segment.percentage}%`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
      }}
    >
      {/* Colored dot */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: segment.color,
          marginRight: 10,
        }}
      />

      {/* Label */}
      <Text
        style={[
          type.body,
          {
            flex: 1,
            fontSize: 13,
            color: isHighlighted ? colors.text : colors.textMuted,
            fontWeight: isHighlighted ? '700' : '400',
          },
        ]}
      >
        {segment.label}
      </Text>

      {/* Count */}
      <Text
        style={[
          type.body,
          {
            fontSize: 13,
            marginRight: 8,
            color: isHighlighted ? colors.text : colors.textMuted,
            fontVariant: ['tabular-nums'],
          },
        ]}
      >
        {segment.count}
      </Text>

      {/* Percentage */}
      <Text
        style={[
          type.caption,
          {
            fontSize: 13,
            width: 36,
            textAlign: 'right',
            color: isHighlighted ? segment.color : colors.textMuted,
            fontWeight: isHighlighted ? '700' : '500',
            fontVariant: ['tabular-nums'],
          },
        ]}
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
  const { colors, type, space, radius } = useTheme();

  const fallback: FailureSegment[] = [
    { reason: 'pump', count: 12, percentage: 40, color: colors.danger, label: 'Pump' },
    { reason: 'foot_slip', count: 9, percentage: 30, color: colors.top, label: 'Foot Slip' }, // Send Lavender
    { reason: 'power', count: 5, percentage: 17, color: colors.flash, label: 'Power' },
    { reason: 'beta_error', count: 2, percentage: 7, color: colors.attempt, label: 'Beta Error' },
    { reason: 'fear', count: 2, percentage: 6, color: colors.fail, label: 'Fear' },
  ];

  const segments = propSegments && propSegments.length > 0 ? propSegments : fallback;
  const totalFailures = propTotal ?? segments.reduce((sum, s) => sum + s.count, 0);

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
    <View
      style={{
        backgroundColor: colors.materialBase,
        borderRadius: radius.lg,
        borderWidth: 0,
        borderColor: colors.border,
        padding: space.lg,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <Text
          style={[
            type.label,
            {
              color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 10,
            },
          ]}
        >
          Root Cause
        </Text>
        <Text style={[type.label, { color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 10 }]}>
          {totalFailures} FALLS
        </Text>
      </View>

      {/* Subtitle */}
      <Text style={[type.heading, { color: colors.textWhitePrimary || colors.text, fontSize: 16, fontWeight: '400', marginBottom: space.md }]}>
        Failure Taxonomy
      </Text>

      {/* Segmented bar */}
      <View
        style={{
          width: '100%',
          borderRadius: radius.pill,
          overflow: 'hidden',
          backgroundColor: colors.materialBase,
          height: 10,
          marginBottom: space.md,
          justifyContent: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', width: '100%', height: '100%' }}>
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
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 4 }} />

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
