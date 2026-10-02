import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import type { SessionTrendPoint } from '../../db/queries';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface SessionTrendChartProps {
  trends: SessionTrendPoint[];
}

export function SessionTrendChart({ trends }: SessionTrendChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<SessionTrendPoint | null>(null);

  if (!trends || trends.length === 0) {
    return (
      <View className="items-center py-6">
        <Text className="text-secondary text-xs">No session history yet to plot trends</Text>
      </View>
    );
  }

  const stackData = trends.map(t => {
    return {
      stacks: [
        { value: t.sends, color: '#8E7CFF' }, // Sends
        { value: t.attempts, color: '#FF453A', marginBottom: 2 }, // Attempts (fails)
      ],
      label: t.dateLabel,
      labelTextStyle: { color: '#9090A0', fontSize: 10, marginTop: 4 },
      onPress: () => setSelectedPoint(t),
    };
  });

  return (
    <View className="mt-2">
      {/* Interactive Tooltip Inspector */}
      {selectedPoint && (
        <View className="bg-surface border border-send/40 rounded-2xl p-3 mb-4">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-primary font-bold text-sm">
              {selectedPoint.gymName}
            </Text>
            <Text className="text-secondary text-xs">{selectedPoint.fullDate}</Text>
          </View>
          <View className="flex-row items-center justify-between pt-1.5 border-t border-border">
            <Text className="text-secondary text-xs">
              <Text className="text-send font-bold">{selectedPoint.sends}</Text> sends / {selectedPoint.totalClimbs} total
            </Text>
            {selectedPoint.hardestGrade && (
              <View className="bg-send/20 px-2 py-0.5 rounded-full border border-send/40">
                <Text className="text-send text-xs font-black">
                  Top: {selectedPoint.hardestGrade}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <BarChart
        width={SCREEN_WIDTH - 90}
        stackData={stackData}
        barWidth={22}
        spacing={24}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={1}
        xAxisColor="#27272F"
        yAxisThickness={0}
        yAxisTextStyle={{ color: '#9090A0', fontSize: 10 }}
        noOfSections={4}
        maxValue={Math.max(...trends.map(t => t.totalClimbs)) || 10}
        stepHeight={24}
        isAnimated
        animationDuration={400}
      />

      <View className="flex-row items-center justify-between pt-4 mt-2 border-t border-border">
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded-sm bg-send" />
            <Text className="text-secondary text-[11px] font-semibold">Sends</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded-sm bg-alert" />
            <Text className="text-secondary text-[11px] font-semibold">Attempts</Text>
          </View>
        </View>
        <Text className="text-structural text-[10px] italic">Tap bar for stats</Text>
      </View>
    </View>
  );
}
