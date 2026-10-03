import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { GlowBackdrop } from './GlowBackdrop';
import { useTheme } from '../../theme/useTheme';

export interface ResultDonutProps {
  flashCount: number;
  topCount: number;
  attemptCount: number;
  centerGrade?: string;
  centerLabel?: string;
}

export function ResultDonut({ flashCount, topCount, attemptCount, centerGrade, centerLabel }: ResultDonutProps) {
  const { colors, type, space } = useTheme();

  const total = flashCount + topCount + attemptCount;
  const pieData = total === 0 ? [
    { value: 1, color: colors.border }
  ] : [
    { value: flashCount, color: colors.flash },
    { value: topCount, color: colors.top },
    { value: attemptCount, color: colors.attempt },
  ];

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: 0.5, pointerEvents: 'none' }}>
        <GlowBackdrop spread={8} />
      </View>
      <PieChart
        data={pieData}
        donut
        radius={90}
        innerRadius={70}
        strokeWidth={0}
        centerLabelComponent={() => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[type.display, { color: '#FFFFFF', fontSize: 44, fontWeight: '200' }]}>{centerGrade || '–'}</Text>
            <Text style={[type.caption, { color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 1.5, textTransform: 'uppercase' }]}>{centerLabel || 'AVG'}</Text>
          </View>
        )}
      />
      {total > 0 && (
        <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
          <LegendItem color={colors.flash} label="Flash" count={flashCount} />
          <LegendItem color={colors.top} label="Top" count={topCount} />
          <LegendItem color={colors.attempt} label="Attempt" count={attemptCount} />
        </View>
      )}
    </View>
  );
}

function LegendItem({ color, label, count }: { color: string, label: string, count: number }) {
  const { colors, type, space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={[type.caption, { color: colors.textWhitePrimary || colors.text }]}>{label}</Text>
      <Text style={[type.caption, { color: colors.textWhiteMuted || colors.textMuted }]}>{count}</Text>
    </View>
  );
}
