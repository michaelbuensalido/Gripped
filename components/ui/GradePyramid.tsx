import React from 'react';
import { View, Text } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { ScalePressable } from './ScalePressable';

export interface GradePyramidRowData {
  grade: number;
  flashes: number;
  sends: number; // excluding flashes
}

export interface GradePyramidProps {
  data: GradePyramidRowData[];
  formatGrade?: (gradeIndex: number) => string;
  onPressGrade?: (grade: number) => void;
}

export const GradePyramid = React.memo(function GradePyramid({ data, formatGrade = (g) => `V${g}`, onPressGrade }: GradePyramidProps) {
  const { colors, type, space, radius, gradeBand } = useTheme();
  const reduceMotion = useReducedMotion();

  const isEmpty = !data || data.length === 0;
  const rows: GradePyramidRowData[] = isEmpty
    ? [5, 4, 3, 2, 1, 0].map((grade) => ({ grade, flashes: 0, sends: 0 }))
    : data;

  // Find max volume to scale bars
  const maxVolume = Math.max(...rows.map(d => d.flashes + d.sends), 1);

  return (
    <View style={{ gap: space.xs }}>
      {rows.map((row, idx) => {
        const flashPercent = (row.flashes / maxVolume) * 100;
        const sendPercent = (row.sends / maxVolume) * 100;
        const total = row.flashes + row.sends;
        const band = gradeBand(row.grade);
        const gradeLabel = formatGrade(row.grade);

        const rowContent = (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              minHeight: 44,
              paddingVertical: 4,
              paddingHorizontal: 2,
            }}
          >
            <View style={{ width: 42, alignItems: 'flex-end' }}>
              <Text style={[type.label, { color: colors.text, fontWeight: '700' }]}>{gradeLabel}</Text>
            </View>

            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                height: 24,
                backgroundColor: colors.cardMuted,
                borderRadius: radius.sm,
                overflow: 'hidden',
              }}
            >
              {row.flashes > 0 && (
                <View
                  style={{
                    width: `${flashPercent}%`,
                    backgroundColor: colors.flash,
                    borderRightWidth: row.sends > 0 ? 1 : 0,
                    borderColor: colors.cardMuted,
                  }}
                />
              )}
              {row.sends > 0 && (
                <View
                  style={{
                    width: `${sendPercent}%`,
                    backgroundColor: band.solid || colors.top,
                  }}
                />
              )}
            </View>

            <View style={{ width: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
              <Text style={[type.caption, { color: colors.textMuted, fontVariant: ['tabular-nums'] }]}>
                {total}
              </Text>
              {onPressGrade && !isEmpty && (
                <ChevronRight size={14} color={colors.textMuted} strokeWidth={2} />
              )}
            </View>
          </View>
        );

        return (
          <Animated.View
            key={row.grade}
            entering={reduceMotion ? undefined : FadeIn.delay(Math.min(idx, 6) * 25).duration(220)}
          >
            {onPressGrade && !isEmpty ? (
              <ScalePressable
                haptic="light"
                activeScale={0.98}
                onPress={() => onPressGrade(row.grade)}
                accessibilityRole="button"
                accessibilityLabel={`Grade ${gradeLabel}, ${total} sends. Tap to view matching climbs.`}
              >
                {rowContent}
              </ScalePressable>
            ) : (
              rowContent
            )}
          </Animated.View>
        );
      })}

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg, marginTop: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.flash }} />
          <Text style={[type.caption, { color: colors.textMuted }]}>Flash</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.top }} />
          <Text style={[type.caption, { color: colors.textMuted }]}>Send</Text>
        </View>
      </View>
      {isEmpty && (
        <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center', marginTop: space.xs }]}>
          No sends yet for this period.
        </Text>
      )}
    </View>
  );
});
GradePyramid.displayName = 'GradePyramid';
