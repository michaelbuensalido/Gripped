import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { FailureBreakdownData } from '../../db/queries';

interface FailureBreakdownWidgetProps {
  data: FailureBreakdownData | null;
}

export function FailureBreakdownWidget({ data }: FailureBreakdownWidgetProps) {
  const visibleSegments = useMemo(() => {
    if (!data?.hasData) return [];
    return [...data.segments]
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const isEmpty = !data?.hasData;

  return (
    <View className="bg-[#19191D] border border-[#27272F] rounded-xl p-4 mt-4">
      <View className="mb-4">
        <Text className="text-[#8A8A98] text-[11px] font-bold tracking-[1px] uppercase">
          FALL DIAGNOSTICS
        </Text>
        <Text className="text-[#5A5A65] text-[12px] font-medium mt-1">
          Why attempts didn't send
        </Text>
      </View>

      {isEmpty ? (
        <View className="border border-dashed border-[#27272F] bg-[#111113] rounded-lg p-6 items-center justify-center">
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke="#555562" strokeWidth="2" strokeDasharray="4 4" />
            <Path d="M12 8V16M8 12H16" stroke="#555562" strokeWidth="2" strokeLinecap="round" />
          </Svg>
          <Text className="text-[#8A8A98] text-xs text-center mt-2 leading-tight">
            Tag fall reasons (e.g., pumped, slipped, bad beta) on your attempts to generate diagnostic insights.
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {visibleSegments.map((seg) => (
            <View
              key={seg.key}
              className="bg-[#27272F] px-2 py-1 rounded-md border border-[#3A3A46] flex-row items-center gap-1.5"
            >
              <View 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: seg.color }}
              />
              <Text className="text-white text-[12px] font-medium">
                {seg.label}
              </Text>
              <Text className="text-[#8A8A98] text-[10px] font-bold" style={{ fontVariant: ['tabular-nums'] }}>
                {seg.percentage}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
