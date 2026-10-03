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
  centerGrade = 'V7',
  centerLabel = 'Average of last 20 routes',
}: ResultDonutProps) {
  const { colors, type } = useTheme();

  const effectiveFlash = flashCount || 8;
  const effectiveTop = topCount || 6;
  const effectiveAttempt = attemptCount || 4;
  const effectiveFail = failCount || 2;

  const pieData = [
    { value: effectiveFlash, color: '#72FF9B' }, // Flash (Neon Mint)
    { value: effectiveTop, color: '#9A85FF' },   // Top (Neon Violet)
    { value: effectiveAttempt, color: '#E2DCBA' }, // Attempt (Sand / Cream)
    { value: effectiveFail, color: '#5E6068' },   // Fail (Slate / Gray)
  ];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, width: '100%', paddingVertical: 10 }}>
      {/* Glow backdrop behind donut */}
      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: 0.4, pointerEvents: 'none' }}>
          <GlowBackdrop spread={10} />
        </View>

        <PieChart
          data={pieData}
          donut
          radius={96}
          innerRadius={76}
          strokeWidth={0}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center', justifyContent: 'center', maxWidth: 110 }}>
              <Text
                style={{
                  color: '#FFFFFF',
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
                  color: 'rgba(255, 255, 255, 0.45)',
                  fontSize: 10.5,
                  textAlign: 'center',
                  fontFamily: type.caption.fontFamily,
                  lineHeight: 13,
                  marginTop: 2,
                }}
              >
                {centerLabel}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Vertical Legend on Right */}
      <View style={{ gap: 14, justifyContent: 'center' }}>
        <LegendRow color="#72FF9B" label="Flash" />
        <LegendRow color="#9A85FF" label="Top" />
        <LegendRow color="#E2DCBA" label="Attempt" />
        <LegendRow color="#5E6068" label="Fail" />
      </View>
    </View>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  const { type } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14, fontWeight: '500', fontFamily: type.body.fontFamily }}>
        {label}
      </Text>
    </View>
  );
}
