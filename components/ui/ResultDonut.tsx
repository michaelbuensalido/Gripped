import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { GlowBackdrop } from './GlowBackdrop';
import { useTheme } from '../../theme/useTheme';

export interface ResultDonutProps {
  flashCount: number;
  topCount: number;
  attemptCount: number;
  failCount?: number;
  centerGrade?: string;
  centerLabel?: string;
}

export function ResultDonut({
  flashCount,
  topCount,
  attemptCount,
  failCount = 0,
  centerGrade = '–',
  centerLabel = 'Average of last 20 routes',
}: ResultDonutProps) {
  const { colors, type } = useTheme();

  const total = flashCount + topCount + attemptCount + failCount;
  const isEmpty = total === 0;

  const pieData = isEmpty
    ? [{ value: 1, color: colors.chartGhostStrong }]
    : [
        { value: flashCount, color: colors.flash },     // Flash (Neon Mint)
        { value: topCount, color: colors.top },         // Top (Neon Violet)
        { value: attemptCount, color: colors.attempt }, // Attempt (Sand / Cream)
        { value: failCount, color: colors.fail },       // Fail (Slate / Gray)
      ].filter((d) => d.value > 0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, width: '100%', paddingVertical: 10 }}>
      {/* Glow backdrop behind donut */}
      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {!isEmpty && (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: 0.4, pointerEvents: 'none' }}>
            <GlowBackdrop spread={10} />
          </View>
        )}

        <PieChart
          data={pieData}
          donut
          radius={96}
          innerRadius={76}
          innerCircleColor={colors.bgTexture}
          strokeWidth={0}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center', justifyContent: 'center', maxWidth: 110 }}>
              <Text
                style={{
                  color: isEmpty ? colors.textWhiteMuted : colors.text,
                  fontSize: 42,
                  fontWeight: '500',
                  fontFamily: type.display.fontFamily,
                  lineHeight: 46,
                }}
              >
                {centerGrade}
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 10.5,
                  textAlign: 'center',
                  fontFamily: type.caption.fontFamily,
                  lineHeight: 13,
                  marginTop: 2,
                }}
              >
                {isEmpty ? 'Log climbs to fill the ring' : centerLabel}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Vertical Legend on Right */}
      <View style={{ gap: 14, justifyContent: 'center' }}>
        <LegendRow color={colors.flash} label="Flash" count={flashCount} />
        <LegendRow color={colors.top} label="Top" count={topCount} />
        <LegendRow color={colors.attempt} label="Attempt" count={attemptCount} />
        <LegendRow color={colors.fail} label="Fail" count={failCount} />
      </View>
    </View>
  );
}

function LegendRow({ color, label, count }: { color: string; label: string; count: number }) {
  const { type, colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ color: colors.textWhiteSecondary, fontSize: 14, fontWeight: '500', fontFamily: type.body.fontFamily, minWidth: 58 }}>
        {label}
      </Text>
      <Text style={{ color: colors.text, fontSize: 14, fontFamily: type.body.fontFamily, fontVariant: ['tabular-nums'] }}>
        {count}
      </Text>
    </View>
  );
}
