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
          <Rect x={0} y={0} width={BAR_WIDTH} height={BAR_HEIGHT} fill="#1E1E1E" rx={8} />

          {/* Flash Segment */}
          {flashW > 0 && (
            <Rect x={0} y={0} width={flashW} height={BAR_HEIGHT} fill="#22C55E" rx={8} />
          )}

          {/* Send Segment */}
          {sendW > 0 && (
            <Rect
              x={flashW}
              y={0}
              width={sendW}
              height={BAR_HEIGHT}
              fill="#A78BFA"
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
              fill="#374151"
              rx={flashW === 0 && sendW === 0 ? 8 : 0}
            />
          )}
        </Svg>
      </View>

      {/* Breakdown Metrics Grid */}
      <View className="flex-row items-center justify-between">
        {/* Flash */}
        <View className="flex-1 items-center bg-surface/50 py-2.5 px-1 rounded-xl border border-border/40 mr-1.5">
          <View className="flex-row items-center gap-1 mb-0.5">
            <Zap size={11} color="#22C55E" fill="#22C55E" />
            <Text className="text-flash text-xs font-black">{flashPct}%</Text>
          </View>
          <Text className="text-secondary text-[11px] font-semibold">{flashes} Flashes</Text>
        </View>

        {/* Redpoint Send */}
        <View className="flex-1 items-center bg-surface/50 py-2.5 px-1 rounded-xl border border-border/40 mr-1.5">
          <View className="flex-row items-center gap-1 mb-0.5">
            <Check size={11} color="#A78BFA" strokeWidth={3} />
            <Text className="text-send text-xs font-black">{sendPct}%</Text>
          </View>
          <Text className="text-secondary text-[11px] font-semibold">{sends} Sends</Text>
        </View>

        {/* Attempts */}
        <View className="flex-1 items-center bg-surface/50 py-2.5 px-1 rounded-xl border border-border/40">
          <View className="flex-row items-center gap-1 mb-0.5">
            <RotateCcw size={11} color="#9CA3AF" />
            <Text className="text-muted text-xs font-black">{attemptPct}%</Text>
          </View>
          <Text className="text-secondary text-[11px] font-semibold">{attempts} Attempts</Text>
        </View>
      </View>
    </View>
  );
}
