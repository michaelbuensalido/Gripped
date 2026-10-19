import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/useTheme';
import { ScalePressable } from './ScalePressable';
import { triggerHaptic } from '../../utils/haptics';

interface LogbookCalendarProps {
  sessions: any[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export function LogbookCalendar({ sessions, selectedDate, onSelectDate }: LogbookCalendarProps) {
  const { colors, type, space, radius, shadow } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfWeek = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  // Map YYYY-MM-DD -> { climbs, sends }
  const sessionStatsByDate = useMemo(() => {
    const map = new Map<string, { climbs: number; sends: number }>();
    sessions.forEach((group) => {
      group.data.forEach((s: any) => {
        const d = new Date(s.startTime);
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const key = `${y}-${m}-${day}`;
        const prev = map.get(key) || { climbs: 0, sends: 0 };
        map.set(key, {
          climbs: prev.climbs + (s.climbsCount || 0),
          sends: prev.sends + (s.sendsCount || 0),
        });
      });
    });
    return map;
  }, [sessions]);

  const maxClimbs = useMemo(() => {
    let m = 1;
    sessionStatsByDate.forEach((v) => {
      if (v.climbs > m) m = v.climbs;
    });
    return m;
  }, [sessionStatsByDate]);

  const prevMonth = () => {
    triggerHaptic('selection');
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    triggerHaptic('selection');
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const renderDays = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(<View key={`empty-${i}`} style={{ width: '14.28%', height: 44 }} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const y = currentMonth.getFullYear();
      const m = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const key = `${y}-${m}-${dayStr}`;

      const stats = sessionStatsByDate.get(key);
      const climbs = stats?.climbs || 0;
      const hasSend = (stats?.sends || 0) > 0;
      const isToday = key === todayKey;
      const isSelected = key === selectedDate;
      const intensity = climbs > 0 ? Math.max(0.35, climbs / maxClimbs) : 0;

      cells.push(
        <TouchableOpacity
          key={key}
          activeOpacity={0.75}
          onPress={() => {
            triggerHaptic('selection');
            onSelectDate(isSelected ? null : key);
          }}
          style={{
            width: '14.28%',
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel={`${monthLabel} ${d}. ${climbs} climbs. ${isToday ? 'Today.' : ''}`}
        >
          <View
            style={[
              {
                width: 34,
                height: 36,
                borderRadius: radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected
                  ? colors.accent
                  : climbs > 0
                  ? colors.accentSoft
                  : 'transparent',
                borderWidth: isSelected || isToday || climbs > 0 ? 1 : 0,
                borderColor: isSelected
                  ? colors.accent
                  : isToday
                  ? colors.accentText
                  : climbs > 0
                  ? colors.glassBorder
                  : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                type.body,
                {
                  color: isSelected
                    ? colors.textOnAccent
                    : isToday
                    ? colors.accentText
                    : climbs > 0
                    ? colors.textWhitePrimary
                    : colors.textMuted,
                  fontSize: 13,
                  fontWeight: isSelected || isToday || climbs > 0 ? '700' : '400',
                },
              ]}
            >
              {d}
            </Text>
            {climbs > 0 && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 3,
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: isSelected
                    ? colors.textOnAccent
                    : hasSend
                    ? colors.flash
                    : colors.accent,
                  opacity: isSelected ? 1 : intensity,
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return cells;
  };

  return (
    <View
      style={{
        backgroundColor: colors.materialBase,
        borderRadius: radius.xl,
        padding: space.lg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        overflow: 'hidden',
        position: 'relative',
        ...shadow.card,
      }}
    >
      <LinearGradient
        colors={[colors.glassHighlight, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 40,
        }}
        pointerEvents="none"
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: space.md,
        }}
      >
        <ScalePressable
          onPress={prevMonth}
          haptic="light"
          activeScale={0.92}
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.sm,
            backgroundColor: colors.cardMuted,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <ChevronLeft size={18} color={colors.text} />
        </ScalePressable>

        <View style={{ alignItems: 'center' }}>
          <Text style={[type.label, { color: colors.accentText, fontSize: 9, letterSpacing: 2 }]}>
            ACTIVITY HEATMAP
          </Text>
          <Text style={[type.heading, { color: colors.text, fontWeight: '700', marginTop: 1 }]}>
            {monthLabel}
          </Text>
        </View>

        <ScalePressable
          onPress={nextMonth}
          haptic="light"
          activeScale={0.92}
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.sm,
            backgroundColor: colors.cardMuted,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <ChevronRight size={18} color={colors.text} />
        </ScalePressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
          <View
            key={i}
            style={{ width: '14.28%', alignItems: 'center', marginBottom: space.xs }}
          >
            <Text style={[type.label, { color: colors.textMuted, fontSize: 9, letterSpacing: 1 }]}>
              {day}
            </Text>
          </View>
        ))}
        {renderDays()}
      </View>
    </View>
  );
}
