import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

export interface BentoMetricRowProps {
  peakGrade?: string | null;
  flashRate?: number;
  sparklineData?: number[];
  onPeakGradePress?: () => void;
  onFlashRatePress?: () => void;
}

export function BentoMetricRow({
  peakGrade,
  flashRate = 38,
  sparklineData = [],
  onPeakGradePress,
  onFlashRatePress,
}: BentoMetricRowProps) {
  const displayPeak = peakGrade || 'V7';
  const displayRate = `${Math.round(flashRate)}%`;

  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) {
      return (
        <View className="flex-row items-end gap-1 h-7 pb-0.5">
          <View className="w-[5px] h-[12px] rounded-full bg-flash" />
          <View className="w-[5px] h-[24px] rounded-full bg-flash" />
          <View className="w-[5px] h-[16px] rounded-full bg-flash" />
        </View>
      );
    }

    const width = 48;
    const height = 24;
    const maxVal = Math.max(...sparklineData);
    const minVal = Math.min(...sparklineData);
    const range = maxVal - minVal || 1;

    const points = sparklineData.map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((val - minVal) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <View className="w-[48px] h-[24px] justify-center">
        <Svg width={width} height={height} viewBox={`0 -2 ${width} ${height + 4}`}>
          <Polyline
            points={points}
            fill="none"
            stroke="#6EE756"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  };

  return (
    <View className="flex-row gap-3 mt-3">
      {/* ── Left Card: Peak Grade ────────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPeakGradePress}
        className="flex-1 bg-surface border border-border rounded-[20px] p-4 justify-between"
      >
        <Text className="text-secondary text-[11px] font-bold tracking-[0.8px] uppercase mb-2">PEAK GRADE</Text>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-primary text-[28px] font-extrabold tracking-[-0.6px]">{displayPeak}</Text>
          {renderSparkline()}
        </View>

        <Text className="text-structural text-[11px] font-semibold">Hardest Send</Text>
      </TouchableOpacity>

      {/* ── Right Card: Flash Efficiency ─────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onFlashRatePress}
        className="flex-1 bg-surface border border-border rounded-[20px] p-4 justify-between"
      >
        <Text className="text-secondary text-[11px] font-bold tracking-[0.8px] uppercase mb-2">FLASH RATE</Text>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-primary text-[28px] font-extrabold tracking-[-0.6px]">{displayRate}</Text>
        </View>

        {/* Horizontal capsule progress bar on bottom */}
        <View className="h-2 rounded-full bg-recessed border border-borderRecessed overflow-hidden mt-1">
          <View
            className="h-full rounded-full bg-flash"
            style={{ width: `${Math.min(100, Math.max(10, flashRate))}%` }}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}
