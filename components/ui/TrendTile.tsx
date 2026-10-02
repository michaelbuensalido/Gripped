import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/useTheme';

export interface TrendTileProps {
  label: string;
  value: string | number;
  data: number[];
  onPress?: () => void;
  flex?: boolean;
}

export function TrendTile({ label, value, data, onPress, flex }: TrendTileProps) {
  const { colors, type, space, radius } = useTheme();

  const chartData = data.map(v => ({ value: v }));
  
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      style={{
        flex: flex ? 1 : undefined,
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: space.md,
        justifyContent: 'space-between',
        height: 104,
      }}
    >
      <View>
        <Text style={[type.caption, { color: colors.textMuted, marginBottom: 2 }]}>{label}</Text>
        <Text style={[type.stat, { color: colors.text, fontSize: 20 }]}>{value}</Text>
      </View>
      <View style={{ height: 30, marginTop: 'auto', marginLeft: -10 }}>
        {data.length > 1 ? (
          <LineChart
            data={chartData}
            height={30}
            width={70}
            thickness={2}
            color={colors.accent}
            hideDataPoints
            hideAxesAndRules
            hideYAxisText
            yAxisThickness={0}
            xAxisThickness={0}
          />
        ) : (
          <View style={{ flex: 1, borderBottomWidth: 2, borderBottomColor: colors.border, borderStyle: 'dashed' }} />
        )}
      </View>
    </TouchableOpacity>
  );
}
