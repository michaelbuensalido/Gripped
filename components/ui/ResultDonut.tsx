import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
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
    { value: flashCount, color: colors.flashText },
    { value: topCount, color: colors.topText },
    { value: attemptCount, color: colors.attemptText },
  ];

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <PieChart
        data={pieData}
        donut
        radius={70}
        innerRadius={50}
        centerLabelComponent={() => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[type.display, { color: colors.text, fontSize: 32 }]}>{centerGrade || '–'}</Text>
            <Text style={[type.caption, { color: colors.textMuted, marginTop: -4 }]}>{centerLabel || 'AVG'}</Text>
          </View>
        )}
      />
      {total > 0 && (
        <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
          <LegendItem color={colors.flashText} label="Flash" count={flashCount} />
          <LegendItem color={colors.topText} label="Top" count={topCount} />
          <LegendItem color={colors.attemptText} label="Attempt" count={attemptCount} />
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
      <Text style={[type.caption, { color: colors.text }]}>{label}</Text>
      <Text style={[type.caption, { color: colors.textMuted }]}>{count}</Text>
    </View>
  );
}
