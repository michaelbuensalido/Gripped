import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { triggerHaptic } from '../../utils/haptics';
import { Zap, Check, X } from 'lucide-react-native';
import type { GradePyramidRow } from '../../db/queries';
import { GRADE_BY_LABEL } from '../../constants/grades';
import { THEME_COLORS } from '../../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_H = 26;
const LABEL_W = 40;
const COUNT_W = 36;
// Screen width minus mx-4 (32) and card p-4 (32)
const BAR_AREA = SCREEN_WIDTH - 64 - LABEL_W - COUNT_W;

interface InteractiveGradePyramidProps {
  pyramid: GradePyramidRow[];
}

export function InteractiveGradePyramid({ pyramid }: InteractiveGradePyramidProps) {
  const [selectedRow, setSelectedRow] = useState<GradePyramidRow | null>(null);

  if (!pyramid || pyramid.length === 0) {
    return (
      <View className="items-center py-10">
        <Text className="text-3xl mb-2">🧗</Text>
        <Text className="text-white font-bold text-base mb-1">No climbs logged yet</Text>
        <Text className="text-muted text-xs text-center px-4">
          Log workouts to generate your grade distribution pyramid.
        </Text>
      </View>
    );
  }

  const maxTotal = pyramid.reduce((max, r) => {
    const t = r.flashes + r.sends + r.attempts;
    return Math.max(max, t);
  }, 1);

  const handleRowPress = (row: GradePyramidRow) => {
    triggerHaptic('selection');
    if (selectedRow?.gradeRaw === row.gradeRaw) {
      setSelectedRow(null);
    } else {
      setSelectedRow(row);
    }
  };

  return (
    <View>
      {/* Interactive Tooltip Inspector Card */}
      {selectedRow ? (
        <View
          style={{
            backgroundColor: THEME_COLORS.cardSurface,
            borderColor: 'rgba(142, 124, 255, 0.4)',
            borderTopColor: 'rgba(255, 255, 255, 0.16)',
            borderWidth: 1,
            borderRadius: 14,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <View className="flex-row items-center justify-between mb-2 pb-1.5 border-b border-[#2C2C35]">
            <View className="flex-row items-center gap-2">
              <View
                style={{
                  backgroundColor: GRADE_BY_LABEL[selectedRow.gradeRaw]?.color ?? '#484852',
                }}
                className="rounded-full px-2 py-0.5"
              >
                <Text
                  style={{
                    color: GRADE_BY_LABEL[selectedRow.gradeRaw]?.textColor ?? '#fff',
                  }}
                  className="text-xs font-black"
                >
                  {selectedRow.gradeRaw}
                </Text>
              </View>
              <Text className="text-white font-bold text-sm">Grade Details</Text>
            </View>

            <TouchableOpacity onPress={() => setSelectedRow(null)} className="p-1">
              <X size={14} color="#9A9AA6" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="items-center flex-1">
              <Text className="text-flash text-base font-black">
                {selectedRow.flashes}
              </Text>
              <View className="flex-row items-center gap-1">
                <Zap size={10} color="#6EE756" fill="#6EE756" />
                <Text className="text-muted text-[10px] uppercase font-bold">Flash</Text>
              </View>
            </View>

            <View className="items-center flex-1 border-x border-[#2C2C35]">
              <Text className="text-send text-base font-black">
                {selectedRow.sends}
              </Text>
              <View className="flex-row items-center gap-1">
                <Check size={10} color="#8E7CFF" strokeWidth={3} />
                <Text className="text-muted text-[10px] uppercase font-bold">Top</Text>
              </View>
            </View>

            <View className="items-center flex-1 border-r border-[#2C2C35]">
              <Text className="text-secondary text-base font-black">
                {selectedRow.attempts}
              </Text>
              <Text className="text-muted text-[10px] uppercase font-bold">Attempts</Text>
            </View>

            <View className="items-center flex-1">
              {(() => {
                const totalCompleted = selectedRow.flashes + selectedRow.sends;
                const totalBurns = totalCompleted + selectedRow.attempts;
                const conversion =
                  totalBurns > 0 ? Math.round((totalCompleted / totalBurns) * 100) : 0;
                return (
                  <>
                    <Text className="text-white text-base font-black">{conversion}%</Text>
                    <Text className="text-muted text-[10px] uppercase font-bold">Send Rate</Text>
                  </>
                );
              })()}
            </View>
          </View>
        </View>
      ) : null}

      {/* Pyramid Stacked Bars */}
      {pyramid.map((row) => {
        const total = row.flashes + row.sends + row.attempts;
        const scaleF = total > 0 ? BAR_AREA / Math.max(maxTotal, 1) : 0;
        const flashW = row.flashes * scaleF;
        const sendW = row.sends * scaleF;
        const attemptW = row.attempts * scaleF;
        const isSelected = selectedRow?.gradeRaw === row.gradeRaw;

        return (
          <TouchableOpacity
            key={row.gradeRaw}
            onPress={() => handleRowPress(row)}
            activeOpacity={0.75}
            className={`flex-row items-center mb-1.5 py-1 px-1 rounded-lg ${
              isSelected ? 'bg-surface/80 border border-accent/40' : ''
            }`}
          >
            {/* Grade Label */}
            <Text
              style={{ width: LABEL_W }}
              className={`text-xs font-black ${
                isSelected ? 'text-accent' : 'text-secondary'
              }`}
            >
              {row.gradeRaw}
            </Text>

            {/* SVG Stacked Bar */}
            <Svg width={BAR_AREA} height={CHART_H}>
              {/* Background Track */}
              <Rect
                x={0}
                y={3}
                width={BAR_AREA}
                height={CHART_H - 6}
                fill={isSelected ? '#202026' : '#16161C'}
                rx={5}
              />

              {/* Flash segment */}
              {row.flashes > 0 && (
                <Rect
                  x={0}
                  y={3}
                  width={flashW}
                  height={CHART_H - 6}
                  fill="#6EE756"
                  rx={5}
                />
              )}

              {/* Send segment */}
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

              {/* Attempt segment */}
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

            {/* Total Count */}
            <Text
              style={{ width: COUNT_W }}
              className={`text-xs font-bold text-right ${
                isSelected ? 'text-white' : 'text-secondary'
              }`}
            >
              {total}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Legend & Tip */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-[#2C2C35]">
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-sm bg-[#6EE756]" />
            <Text className="text-secondary text-[11px] font-semibold">Flash</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-sm bg-[#8E7CFF]" />
            <Text className="text-secondary text-[11px] font-semibold">Top</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-sm bg-[#484852]" />
            <Text className="text-secondary text-[11px] font-semibold">Attempt</Text>
          </View>
        </View>

        <Text className="text-muted text-[10px] italic">Tap bar to inspect</Text>
      </View>
    </View>
  );
}
