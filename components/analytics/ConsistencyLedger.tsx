import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getAllSessionSummaries } from '../../db/queries';

interface DayData {
  date: Date;
  volume: number; // e.g. total sends
  label: string;
}

export function ConsistencyLedger() {
  const sessions = useMemo(() => getAllSessionSummaries(), []);

  const heatmapData = useMemo(() => {
    // 1. Map session dates to volume
    const volumeByDate = new Map<string, number>();
    for (const s of sessions) {
      if (!s.startTime) continue;
      const d = new Date(s.startTime);
      // local date string YYYY-MM-DD
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const current = volumeByDate.get(dateKey) || 0;
      volumeByDate.set(dateKey, current + s.sendCount + s.flashCount + 1); // +1 just to count the session itself
    }

    // 2. Generate the 12-week grid (12 cols x 7 rows)
    // Find the most recent Sunday
    const today = new Date();
    // In JS, 0 = Sunday, 1 = Monday. We want Monday=0, Sunday=6
    const jsDay = today.getDay();
    const daysSinceSunday = jsDay === 0 ? 0 : jsDay; 
    
    // Actually, if we want Monday to Sunday, current week ends on Sunday.
    // If today is Wednesday (jsDay=3), Sunday is in 4 days. 
    // Wait, the grid should end on the CURRENT day or the end of the current week?
    // Usually it ends on the current week. Let's make the last day of the 12th week be the upcoming/current Sunday.
    const lastDayOfGrid = new Date(today);
    const diffToSunday = jsDay === 0 ? 0 : 7 - jsDay;
    lastDayOfGrid.setDate(today.getDate() + diffToSunday);
    
    const weeks: DayData[][] = [];
    // 12 weeks = 84 days total
    const totalDays = 12 * 7;
    const startDate = new Date(lastDayOfGrid);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    for (let w = 0; w < 12; w++) {
      const week: DayData[] = [];
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (w * 7) + d);
        
        const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const vol = volumeByDate.get(dateKey) || 0;
        
        week.push({
          date: currentDate,
          volume: vol,
          label: `${dateKey} : Score ${vol}`
        });
      }
      weeks.push(week);
    }
    return weeks;
  }, [sessions]);

  const getLevelColor = (volume: number) => {
    if (volume === 0) return 'bg-[#27272F]';
    if (volume <= 2) return 'bg-[#6EE756]/30'; // Level 1
    if (volume <= 5) return 'bg-[#6EE756]/60'; // Level 2
    return 'bg-[#6EE756]'; // Level 3
  };

  const handlePress = (day: DayData) => {
    if (day.volume > 0) {
      Haptics.selectionAsync();
      // Tooltip or alert (for now just console log, could use an alert or a tooltip state)
      console.log('Tapped:', day.label);
    }
  };

  return (
    <View className="bg-[#19191D] border border-[#27272F] rounded-xl p-4">
      <View className="mb-4">
        <Text className="text-white font-bold">CONSISTENCY LEDGER</Text>
        <Text className="text-[#8A8A98] text-xs mt-1">Last 12 weeks of session volume</Text>
      </View>

      <View className="flex-row justify-between w-full">
        {/* Heatmap Grid */}
        {heatmapData.map((week, wIndex) => {
          // Month label logic: show month if it's the first week of the month, or if the month changed from previous week
          const firstDayOfWeek = week[0].date;
          const showMonth = wIndex === 0 || firstDayOfWeek.getDate() <= 7;
          const monthStr = firstDayOfWeek.toLocaleString('default', { month: 'short' });

          return (
            <View key={wIndex} className="flex-col items-center">
              {/* X-axis Label */}
              <View className="h-4 mb-1 justify-end">
                {showMonth && (
                  <Text className="text-[10px] text-[#8A8A98] tabular-nums">
                    {monthStr}
                  </Text>
                )}
              </View>
              {/* 7 Days (Rows) */}
              {week.map((day, dIndex) => (
                <Pressable
                  key={dIndex}
                  onPress={() => handlePress(day)}
                  className={`w-4 h-4 rounded-sm mb-1 ${getLevelColor(day.volume)}`}
                />
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}
