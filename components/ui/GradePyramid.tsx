import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export interface GradePyramidRowData {
  grade: number;
  flashes: number;
  sends: number; // excluding flashes
}

export interface GradePyramidProps {
  data: GradePyramidRowData[];
  formatGrade?: (gradeIndex: number) => string;
}

export function GradePyramid({ data, formatGrade = (g) => `V${g}` }: GradePyramidProps) {
  const { colors, type, space, radius } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={{ alignItems: 'center', padding: space.xl }}>
        <Text style={[type.body, { color: colors.textMuted }]}>No sends yet for this period.</Text>
      </View>
    );
  }

  // Find max volume to scale bars
  const maxVolume = Math.max(...data.map(d => d.flashes + d.sends), 1);

  return (
    <View style={{ gap: space.sm }}>
      {data.map((row) => {
        const flashPercent = (row.flashes / maxVolume) * 100;
        const sendPercent = (row.sends / maxVolume) * 100;
        const total = row.flashes + row.sends;
        
        return (
          <View key={row.grade} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ width: 40, alignItems: 'flex-end' }}>
              <Text style={[type.label, { color: colors.text }]}>{formatGrade(row.grade)}</Text>
            </View>
            
            <View style={{ flex: 1, flexDirection: 'row', height: 24, backgroundColor: colors.cardMuted, borderRadius: radius.sm, overflow: 'hidden' }}>
              {row.flashes > 0 && (
                <View style={{ width: `${flashPercent}%`, backgroundColor: colors.flashSoft, borderRightWidth: row.sends > 0 ? 1 : 0, borderColor: colors.cardMuted }} />
              )}
              {row.sends > 0 && (
                <View style={{ width: `${sendPercent}%`, backgroundColor: colors.topSoft }} />
              )}
            </View>

            <View style={{ width: 30 }}>
              <Text style={[type.caption, { color: colors.textMuted }]}>{total}</Text>
            </View>
          </View>
        );
      })}
      
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg, marginTop: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.flashSoft }} />
          <Text style={[type.caption, { color: colors.textMuted }]}>Flash</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.topSoft }} />
          <Text style={[type.caption, { color: colors.textMuted }]}>Send</Text>
        </View>
      </View>
    </View>
  );
}
