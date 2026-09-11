import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Zap, Check, RotateCcw } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_WIDTH = SCREEN_WIDTH - 64; // inside mx-4 and card p-4
const BAR_HEIGHT = 16;

interface OutcomeBreakdown {
  flashes: number;
  sends: number;
  attempts: number;
  flashPct: number;
  sendPct: number;
  attemptPct: number;
}

interface OutcomeDistributionBarProps {
  breakdown: OutcomeBreakdown;
  totalClimbs: number;
}

export function OutcomeDistributionBar({
  breakdown,
  totalClimbs,
}: OutcomeDistributionBarProps) {
  if (totalClimbs === 0) {
    return (
      <View className="items-center py-4">
        <Text className="text-muted text-xs">No outcome data available</Text>
      </View>
    );
  }

  const { flashes, sends, attempts, flashPct, sendPct, attemptPct } = breakdown;
  const flashW = (flashPct / 100) * BAR_WIDTH;
  const sendW = (sendPct / 100) * BAR_WIDTH;
  const attemptW = Math.max(0, BAR_WIDTH - flashW - sendW);

  return (
    <View>
      {/* Visual Proportional Bar */}
      <View className="mb-3">
        <Svg width={BAR_WIDTH} height={BAR_HEIGHT}>
          {/* Background Track */}
          <Rect x={0} y={0} width={BAR_WIDTH} height={BAR_HEIGHT} fill="#16161C" rx={8} />

          {/* Flash Segment */}
          {flashW > 0 && (
            <Rect x={0} y={0} width={flashW} height={BAR_HEIGHT} fill="#6EE756" rx={8} />
          )}

          {/* Send Segment */}
          {sendW > 0 && (
            <Rect
              x={flashW}
              y={0}
              width={sendW}
              height={BAR_HEIGHT}
              fill="#8E7CFF"
              rx={flashW > 0 ? 0 : 8}
            />
          )}

          {/* Attempt Segment */}
          {attemptW > 0 && (
            <Rect
              x={flashW + sendW}
              y={0}
              width={attemptW}
              height={BAR_HEIGHT}
              fill="#484852"
              rx={flashW === 0 && sendW === 0 ? 8 : 0}
            />
          )}
        </Svg>
      </View>

      {/* Breakdown Metrics Grid */}
      <View className="flex-row items-center justify-between">
        {/* Flash */}
        <View className="flex-1 items-center bg-[#16161C] py-2.5 px-1 rounded-xl border border-[#2C2C35] mr-1.5">
          <View className="flex-row items-center gap-1 mb-0.5">
            <Zap size={11} color="#6EE756" fill="#6EE756" />
            <Text className="text-flash text-xs font-black">{flashPct}%</Text>
          </View>
          <Text className="text-secondary text-[11px] font-semibold">{flashes} Flashes</Text>
        </View>

        {/* Redpoint Send */}
        <View className="flex-1 items-center bg-[#16161C] py-2.5 px-1 rounded-xl border border-[#2C2C35] mr-1.5">
          <View className="flex-row items-center gap-1 mb-0.5">
            <Check size={11} color="#8E7CFF" strokeWidth={3} />
            <Text className="text-send text-xs font-black">{sendPct}%</Text>
          </View>
          <Text className="text-secondary text-[11px] font-semibold">{sends} Sends</Text>
        </View>

        {/* Attempts */}
        <View className="flex-1 items-center bg-[#16161C] py-2.5 px-1 rounded-xl border border-[#2C2C35]">
          <View className="flex-row items-center gap-1 mb-0.5">
            <RotateCcw size={11} color="#9A9AA6" />
            <Text className="text-muted text-xs font-black">{attemptPct}%</Text>
          </View>
          <Text className="text-secondary text-[11px] font-semibold">{attempts} Attempts</Text>
        </View>
      </View>
    </View>
  );
}
