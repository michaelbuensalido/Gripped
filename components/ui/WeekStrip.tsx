import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Card } from './Card';
import { Flame } from 'lucide-react-native';
import { plural } from '../../utils/string';

export interface WeekStripProps {
  days: { dayLabel: string; hasSession: boolean; isToday: boolean }[];
  streak: number;
}

export function WeekStrip({ days, streak }: WeekStripProps) {
  const { colors, type, space, radius } = useTheme();

  return (
    <Card>
      {/* Streak badge row */}
      {streak > 0 && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          marginBottom: space.md,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.xs,
            backgroundColor: colors.cardMuted,
            paddingHorizontal: space.md,
            paddingVertical: space.xs,
            borderRadius: radius.pill,
          }}>
            <Text style={[type.control, { color: colors.text }]}>
              {streak} wk
            </Text>
          </View>
        </View>
      )}

      {/* Day dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map((day, index) => {
          const filled = day.hasSession;
          return (
            <View key={index} style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.sm }]}>
                {day.dayLabel}
              </Text>
              <View style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
                {day.isToday && (
                  <View style={{
                    position: 'absolute',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 2,
                    borderColor: colors.accent,
                  }} />
                )}
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: filled ? colors.accent : colors.cardMuted,
                }} />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
