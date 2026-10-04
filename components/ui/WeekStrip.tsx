import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { GlowBackdrop } from './GlowBackdrop';
import { Flame } from 'lucide-react-native';

export interface WeekStripProps {
  days: { dayLabel: string; hasSession: boolean; isToday: boolean }[];
  streak: number;
}

export function WeekStrip({ days, streak }: WeekStripProps) {
  const { colors, type, space, radius } = useTheme();

  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderRadius: radius.xl,
      padding: space.xl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.04)',
    }}>
      {/* Header Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
        <Text style={[type.label, { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2 }]}>
          WEEKLY STREAK
        </Text>
        {streak > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Flame size={14} color={colors.accent} />
            <Text style={[type.heading, { color: colors.textWhitePrimary, fontSize: 14 }]}>
              {streak} WEEKS
            </Text>
          </View>
        )}
      </View>

      {/* Days Strip */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xs }}>
        {days.map((day, index) => {
          const filled = day.hasSession;
          return (
            <View key={index} style={{ alignItems: 'center' }}>
              {/* Dot */}
              <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginBottom: space.sm }}>
                {day.isToday && (
                  <View style={{ position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.accent, opacity: 0.8 }} />
                )}
                {filled ? (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }}>
                    <View style={{ position: 'absolute', top: -4, bottom: -4, left: -4, right: -4, pointerEvents: 'none' }}>
                      <GlowBackdrop spread={8} />
                    </View>
                  </View>
                ) : (
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                )}
              </View>
              {/* Label */}
              <Text style={[type.label, { 
                color: day.isToday ? colors.textWhitePrimary : 'rgba(255,255,255,0.3)', 
                fontSize: 9,
                letterSpacing: 1
              }]}>
                {day.dayLabel.charAt(0)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
