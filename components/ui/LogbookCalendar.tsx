import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

interface LogbookCalendarProps {
  sessions: any[]; // Flat list of sessions or grouped by month, we need to extract dates
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export function LogbookCalendar({ sessions, selectedDate, onSelectDate }: LogbookCalendarProps) {
  const { colors, type, space, radius } = useTheme();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 is Sunday
  
  // Create a map of date string (YYYY-MM-DD) -> max climbs in a session that day (to scale dot)
  const sessionCounts = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(group => {
      group.data.forEach((s: any) => {
        const d = new Date(s.startTime);
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const key = `${y}-${m}-${day}`;
        map.set(key, (map.get(key) || 0) + s.climbsCount);
      });
    });
    return map;
  }, [sessions]);

  const maxClimbs = Math.max(1, ...Array.from(sessionCounts.values()));

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const renderDays = () => {
    const cells = [];
    // Empty cells for first day of week
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(<View key={`empty-${i}`} style={{ width: '14.28%', height: 40 }} />);
    }
    
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const y = currentMonth.getFullYear();
      const m = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const key = `${y}-${m}-${dayStr}`;
      
      const climbs = sessionCounts.get(key) || 0;
      const isToday = key === todayKey;
      const isSelected = key === selectedDate;
      
      const dotOpacity = climbs > 0 ? Math.max(0.2, climbs / maxClimbs) : 0;
      
      cells.push(
        <TouchableOpacity
          key={key}
          onPress={() => onSelectDate(isSelected ? null : key)}
          style={{
            width: '14.28%',
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel={`${monthLabel} ${d}. ${climbs} climbs. ${isToday ? 'Today.' : ''}`}
        >
          <View style={[
            {
              width: 32, height: 32, borderRadius: 16,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: isSelected ? colors.accentSoft : 'transparent'
            },
            isToday && !isSelected && { borderWidth: 1, borderColor: colors.accent }
          ]}>
            <Text style={[type.body, { color: isSelected ? colors.accentText : (isToday ? colors.accent : colors.text), fontSize: 14, fontWeight: isSelected || isToday ? '600' : '400' }]}>
              {d}
            </Text>
            {climbs > 0 && (
              <View style={{
                position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2,
                backgroundColor: isSelected ? colors.accentText : colors.accent,
                opacity: isSelected ? 1 : dotOpacity
              }} />
            )}
          </View>
        </TouchableOpacity>
      );
    }
    
    return cells;
  };

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
        <TouchableOpacity onPress={prevMonth} style={{ padding: space.xs }} accessibilityRole="button" accessibilityLabel="Previous month">
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[type.heading, { color: colors.text }]}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} style={{ padding: space.xs }} accessibilityRole="button" accessibilityLabel="Next month">
          <ChevronRight size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <View key={i} style={{ width: '14.28%', alignItems: 'center', marginBottom: space.sm }}>
            <Text style={[type.caption, { color: colors.textMuted }]}>{day}</Text>
          </View>
        ))}
        {renderDays()}
      </View>
    </View>
  );
}
