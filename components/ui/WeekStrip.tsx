import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Card } from './Card';
import { GlowBackdrop } from './GlowBackdrop';
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
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.accent + '33',
            paddingHorizontal: space.md,
            paddingVertical: 6,
            borderRadius: radius.pill,
          }}>
            <GlowBackdrop spread={space.lg} />
            <Flame size={14} color={colors.accentText} />
            <Text style={[type.control, { color: colors.accentText, fontWeight: '700', fontSize: 13 }]}>
              {streak} wk streak
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
              <Text
                style={[
                  type.caption,
                  {
                    color: day.isToday ? colors.accentText : colors.textMuted,
                    fontWeight: day.isToday ? '700' : '400',
                    marginBottom: space.sm,
                  },
                ]}
              >
                {day.dayLabel}
              </Text>
              <View style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
                {day.isToday && (
                  <View
                    style={{
                      position: 'absolute',
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: colors.accent,
                    }}
                  />
                )}
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: filled ? colors.accent : colors.cardMuted,
                    borderWidth: 1,
                    borderColor: filled ? colors.accent : colors.border,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
