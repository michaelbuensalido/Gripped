import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Card } from './Card';
import { Flame } from 'lucide-react-native';
import { plural } from '../../utils/string';

export interface WeekStripProps {
  days: { dayLabel: string; hasSession: boolean; isToday: boolean }[];
  streak: number;
}

export function WeekStrip({ days, streak }: WeekStripProps) {
  const { colors, type, space } = useTheme();

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between' }}>
          {days.map((day, index) => {
            const filled = day.hasSession;
            return (
              <View key={index} style={{ alignItems: 'center' }}>
                <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.xs }]}>
                  {day.dayLabel}
                </Text>
                <View style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
                  {day.isToday && (
                    <View style={{
                      position: 'absolute', width: 36, height: 36, borderRadius: 18,
                      borderWidth: 2, borderColor: colors.accent,
                    }} />
                  )}
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    borderWidth: filled ? 0 : 1,
                    borderColor: colors.border,
                    backgroundColor: filled ? colors.accent : 'transparent',
                  }} />
                </View>
              </View>
            );
          })}
        </View>
        {streak > 0 && (
          <View style={{ marginLeft: space.md, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Flame size={20} color={colors.accent} /><Text style={[type.heading, { color: colors.text }]}>{plural(streak, 'week streak')}</Text></View>
          </View>
        )}
      </View>
    </Card>
  );
}
