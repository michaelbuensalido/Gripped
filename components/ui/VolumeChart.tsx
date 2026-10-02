import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Card } from './Card';

export interface VolumeChartProps {
  data: { weekLabel: string; climbs: number; isCurrent: boolean }[];
  onPress?: () => void;
}

export function VolumeChart({ data, onPress }: VolumeChartProps) {
  const { colors, type, space, radius } = useTheme();
  const maxClimbs = Math.max(...data.map(d => d.climbs), 1);
  const MAX_BAR_HEIGHT = 56;

  const currentWeek = data[data.length - 1] || { climbs: 0 };
  const lastWeek = data[data.length - 2] || { climbs: 0 };
  const diff = currentWeek.climbs - lastWeek.climbs;

  let changeLabel = 'Same as last week';
  let changeColor = colors.textMuted;

  if (lastWeek.climbs === 0) {
    changeLabel = 'First week logged';
  } else if (diff > 0) {
    changeLabel = `↑ ${diff} vs last week`;
    changeColor = colors.flashText;
  } else if (diff < 0) {
    changeLabel = `↓ ${Math.abs(diff)} vs last week`;
    changeColor = colors.dangerText;
  }

  return (
    <Card onPress={onPress}>
      <Text style={[type.label, { color: colors.textMuted, marginBottom: space.lg }]}>
        Weekly volume
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: MAX_BAR_HEIGHT + 24 }}>
        {data.map((item, i) => {
          const h = item.climbs === 0 ? 2 : (item.climbs / maxClimbs) * MAX_BAR_HEIGHT;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', marginLeft: i === 0 ? 0 : space.xs }}>
              <View style={{ height: MAX_BAR_HEIGHT, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                {item.isCurrent && item.climbs > 0 && (
                  <Text style={[type.caption, { color: colors.text, marginBottom: space.xs }]}>
                    {item.climbs}
                  </Text>
                )}
                <View style={{
                  height: h,
                  width: '80%',
                  backgroundColor: item.isCurrent ? colors.accent : colors.cardMuted,
                  borderRadius: radius.sm,
                }} />
              </View>
              <Text numberOfLines={1} style={[type.caption, { color: colors.textMuted, marginTop: space.sm, fontSize: 10 }]}>
                {i % 2 === 1 || item.isCurrent ? item.weekLabel : ''}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[type.caption, { color: changeColor, marginTop: space.md }]}>
        {changeLabel}
      </Text>
    </Card>
  );
}
