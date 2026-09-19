import React from 'react';
import { View, Text } from 'react-native';
import type { GradePyramidDataRow, GradePyramidAllTimeRow } from '../../db/queries';

export interface GradePyramidWidgetProps {
  data?: GradePyramidDataRow[];
  pyramid?: GradePyramidDataRow[] | GradePyramidAllTimeRow[];
  title?: string;
}

export function GradePyramidWidget({
  data,
  pyramid,
  title = 'ATTEMPT-TO-SEND MATRIX',
}: GradePyramidWidgetProps) {
  const rawData = data ?? (pyramid as GradePyramidDataRow[]) ?? [];
  const normalizedRows: GradePyramidDataRow[] = rawData.map((r: any) => ({
    grade_raw: r.grade_raw ?? r.gradeRaw ?? 'V0',
    normalized_difficulty: r.normalized_difficulty ?? r.normalizedDifficulty ?? 0,
    flash_count: r.flash_count ?? r.flash ?? 0,
    top_count: r.top_count ?? r.top ?? 0,
    attempt_count: r.attempt_count ?? r.attempt ?? 0,
    total_sends: r.total_sends ?? (r.flash_count ?? r.flash ?? 0) + (r.top_count ?? r.top ?? 0),
    total_attempts:
      r.total_attempts ??
      r.totalBurns ??
      (r.flash_count ?? r.flash ?? 0) +
        (r.top_count ?? r.top ?? 0) +
        (r.attempt_count ?? r.attempt ?? 0),
  }));

  // Filter out grades with no attempts
  const activeRows = normalizedRows
    .filter((r) => r.total_attempts > 0)
    .sort((a, b) => b.normalized_difficulty - a.normalized_difficulty);

  const maxBurns = Math.max(0, ...activeRows.map(r => r.total_attempts));

  return (
    <View className="bg-[#19191D] border border-[#27272F] rounded-xl p-4">
      <Text className="text-[#8A8A98] text-[11px] font-bold tracking-[1px] mb-4 uppercase">
        {title}
      </Text>

      {/* Table Header */}
      <View className="flex-row items-center mb-2 px-3">
        <Text className="flex-1 text-[#8A8A98] text-[12px] font-semibold">GRADE</Text>
        <Text className="w-[60px] text-center text-[#8A8A98] text-[12px] font-semibold">BURNS</Text>
        <Text className="w-[70px] text-right text-[#8A8A98] text-[12px] font-semibold">SEND %</Text>
      </View>

      {/* Table Body */}
      <View className="overflow-hidden rounded-lg">
        {activeRows.length === 0 ? (
          <View className="py-6 items-center">
            <Text className="text-[#8A8A98] text-[13px]">No data available</Text>
          </View>
        ) : (
          activeRows.map((row, index) => {
            const sendPercent = row.total_attempts > 0 
              ? ((row.total_sends / row.total_attempts) * 100).toFixed(0) 
              : '0';
            const isMaxBurns = row.total_attempts === maxBurns && row.total_attempts > 0;
            
            return (
              <View 
                key={row.normalized_difficulty} 
                className={`flex-row items-center py-3 px-3 relative ${isMaxBurns ? 'border-l-2 border-[#8E7CFF]' : 'border-l-2 border-transparent'}`}
              >
                {/* Volume Bar Background */}
                <View 
                  className="absolute left-0 top-0 bottom-0 bg-[#27272F] opacity-30 rounded-r-md" 
                  style={{ width: maxBurns > 0 ? `${(row.total_attempts / maxBurns) * 100}%` : '0%' }}
                  pointerEvents="none"
                />

                <Text className="flex-1 text-white text-[14px] font-bold z-10">
                  {row.grade_raw}
                </Text>
                
                <Text 
                  className={`w-[60px] text-center text-[14px] font-bold z-10 ${isMaxBurns ? 'text-[#8E7CFF]' : 'text-white'}`}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {row.total_attempts}
                </Text>
                
                <Text 
                  className="w-[70px] text-right text-[14px] font-bold z-10"
                  style={{ 
                    color: sendPercent === '100' ? '#6EE756' : '#8A8A98',
                    fontVariant: ['tabular-nums'] 
                  }}
                >
                  {sendPercent}%
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
