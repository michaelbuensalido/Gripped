import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Card } from './Card';

export interface VolumeChartProps {
  data: { weekLabel: string; climbs: number; isCurrent: boolean }[];
  changePercent: number;
  onPress?: () => void;
}

export function VolumeChart({ data, changePercent, onPress }: VolumeChartProps) {
  const { colors, type, space, radius } = useTheme();
  const maxClimbs = Math.max(...data.map(d => d.climbs), 1);
  const MAX_BAR_HEIGHT = 48;

  const changeLabel = changePercent > 0
    ? `↑ ${changePercent}% vs last week`
    : changePercent < 0
    ? `↓ ${Math.abs(changePercent)}% vs last week`
    : 'Same as last week';
  const changeColor = changePercent > 0 ? colors.flashText : changePercent < 0 ? colors.dangerText : colors.textMuted;

  return (
    <Card onPress={onPress}>
      <Text style={[type.label, { color: colors.textMuted, marginBottom: space.md }]}>WEEKLY VOLUME</Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: MAX_BAR_HEIGHT + 24 }}>
        {data.map((item, i) => {
          const h = item.climbs === 0 ? 2 : (item.climbs / maxClimbs) * MAX_BAR_HEIGHT;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', marginLeft: i === 0 ? 0 : space.xs }}>
              <View style={{ height: MAX_BAR_HEIGHT, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                <View style={{
                  height: h, width: '100%',
                  backgroundColor: item.isCurrent ? colors.accent : colors.cardMuted,
                  borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm,
                }} />
              </View>
              <Text numberOfLines={1} style={[type.caption, { color: colors.textMuted, marginTop: space.xs, fontSize: 10 }]}>
                {item.weekLabel}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[type.caption, { color: changeColor, marginTop: space.md }]}>{changeLabel}</Text>
    </Card>
  );
}
