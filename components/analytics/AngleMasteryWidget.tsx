import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import type { AngleMasteryItem } from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';

export interface AngleMasteryWidgetProps {
  data?: AngleMasteryItem[];
}

export function AngleMasteryWidget({ data }: AngleMasteryWidgetProps) {
  const items: AngleMasteryItem[] = data && data.length > 0
    ? data
    : [
        { angle: 'Overhang', sendRate: 0, totalSends: 0, totalAttempts: 0, color: '#8E7CFF' },
        { angle: 'Slab', sendRate: 0, totalSends: 0, totalAttempts: 0, color: '#8E7CFF' },
        { angle: 'Vertical', sendRate: 0, totalSends: 0, totalAttempts: 0, color: '#8E7CFF' },
      ];

  return (
    <View className="bg-[#19191D] border border-[#27272F] rounded-xl p-4 mt-4">
      {/* Header */}
      <View className="mb-3">
        <Text className="text-white text-[15px] font-bold tracking-[-0.2px]">Terrain & Angle Mastery</Text>
        <Text className="text-[#8A8A98] text-[12px] font-medium mt-1">Send completion rate by wall profile</Text>
      </View>

      {/* Rows */}
      <View className="gap-3.5">
        {items.map((item) => {
          // Force strict 0% if 0 attempts, ignore upstream hallucination
          const trueRate = item.totalAttempts > 0 ? Math.round((item.totalSends / item.totalAttempts) * 100) : 0;

          return (
            <TouchableOpacity
              key={item.angle}
              activeOpacity={0.8}
              onPress={() => triggerHaptic('light')}
              className="flex-row items-center"
            >
              {/* Profile Label */}
              <View className="w-[75px]">
                <Text className="text-white text-[14px] font-semibold">{item.angle}</Text>
              </View>

              {/* Progress Track */}
              <View className="flex-1 h-[8px] bg-[#141417] border border-[#22222A] rounded-full overflow-hidden mx-3">
                <View
                  className="h-full rounded-full bg-[#8E7CFF]"
                  style={{ width: `${Math.max(0, trueRate)}%` }}
                />
              </View>

              {/* Metric Text */}
              <View className="items-end min-w-[110px]">
                <Text className="text-[12px]" style={{ fontVariant: ['tabular-nums'] }}>
                  <Text className="text-white font-bold">{trueRate}%</Text>
                  <Text className="text-[#8A8A98] font-medium">
                    {' • '}
                    {item.totalSends}/{item.totalAttempts} sends
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
