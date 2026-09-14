import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import type { GradePyramidRow } from '../../db/queries';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_H = 26;
const LABEL_W = 38;
const COUNT_W = 32;
// Inside card with mx-4 (32) and card p-4 (32)
const BAR_AREA = SCREEN_WIDTH - 64 - LABEL_W - COUNT_W;

interface SessionPyramidChartProps {
  pyramid: GradePyramidRow[];
}

export function SessionPyramidChart({ pyramid }: SessionPyramidChartProps) {
  if (!pyramid || pyramid.length === 0) {
    return (
      <View
        style={{
          backgroundColor: '#1E1E24',
          borderColor: '#2C2C35',
          borderWidth: 1,
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          alignItems: 'center',
        }}
      >
        <Text className="text-muted text-xs">No grade data recorded for this session</Text>
      </View>
    );
  }

  const maxTotal = pyramid.reduce((max, r) => {
    const t = r.flashes + r.sends + r.attempts;
    return Math.max(max, t);
  }, 1);

  return (
    <View
      style={{
        backgroundColor: '#1E1E24',
        borderColor: '#2C2C35',
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text
          style={{
            color: '#8A8A98',
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.8,
          }}
          className="uppercase"
        >
          SESSION GRADE PYRAMID
        </Text>
        <Text style={{ color: '#8A8A98', fontSize: 12 }}>Volume per grade</Text>
      </View>

      {/* Rows */}
      {pyramid.map((row) => {
        const total = row.flashes + row.sends + row.attempts;
        const scaleF = total > 0 ? BAR_AREA / Math.max(maxTotal, 1) : 0;
        const flashW = row.flashes * scaleF;
        const sendW = row.sends * scaleF;
        const attemptW = row.attempts * scaleF;

        return (
          <View key={row.gradeRaw} className="flex-row items-center mb-2">
            <Text style={{ width: LABEL_W }} className="text-[#9A9AA6] text-xs font-black">
              {row.gradeRaw}
            </Text>

            <Svg width={BAR_AREA} height={CHART_H}>
              {/* Background track */}
              <Rect x={0} y={3} width={BAR_AREA} height={CHART_H - 6} fill="#16161C" rx={5} />

              {/* Flash segment (Green) */}
              {row.flashes > 0 && (
                <Rect x={0} y={3} width={flashW} height={CHART_H - 6} fill="#6EE756" rx={5} />
              )}

              {/* Send segment (Lavender) */}
              {row.sends > 0 && (
                <Rect
                  x={flashW}
                  y={3}
                  width={sendW}
                  height={CHART_H - 6}
                  fill="#8E7CFF"
                  rx={row.flashes > 0 ? 0 : 5}
                />
              )}

              {/* Attempt segment (Muted) */}
              {row.attempts > 0 && (
                <Rect
                  x={flashW + sendW}
                  y={3}
                  width={attemptW}
                  height={CHART_H - 6}
                  fill="#484852"
                  rx={row.flashes === 0 && row.sends === 0 ? 5 : 0}
                />
              )}
            </Svg>

            <Text style={{ width: COUNT_W }} className="text-[#9A9AA6] text-xs font-semibold text-right">
              {total}
            </Text>
          </View>
        );
      })}

      {/* Legend */}
      <View className="flex-row items-center justify-center gap-5 mt-3 pt-3 border-t border-[#2C2C35]">
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-sm bg-[#6EE756]" />
          <Text className="text-[#9A9AA6] text-[11px] font-semibold">Flash</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-sm bg-[#8E7CFF]" />
          <Text className="text-[#9A9AA6] text-[11px] font-semibold">Top</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-2.5 rounded-sm bg-[#484852]" />
          <Text className="text-[#9A9AA6] text-[11px] font-semibold">Attempt</Text>
        </View>
      </View>
    </View>
  );
}
