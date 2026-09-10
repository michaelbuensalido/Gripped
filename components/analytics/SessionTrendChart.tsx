import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import type { SessionTrendPoint } from '../../db/queries';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTAINER_WIDTH = SCREEN_WIDTH - 64; // inside mx-4 (32) and card p-4 (32)
const MAX_CHART_HEIGHT = 110;

interface SessionTrendChartProps {
  trends: SessionTrendPoint[];
}

export function SessionTrendChart({ trends }: SessionTrendChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<SessionTrendPoint | null>(null);

  if (!trends || trends.length === 0) {
    return (
      <View className="items-center py-6">
        <Text className="text-muted text-xs">No session history yet to plot trends</Text>
      </View>
    );
  }

  const maxClimbs = trends.reduce((max, t) => Math.max(max, t.totalClimbs), 1);
  const columnWidth = Math.max(22, Math.min(36, (CONTAINER_WIDTH - (trends.length - 1) * 10) / trends.length));

  const handlePointPress = (pt: SessionTrendPoint) => {
    Haptics.selectionAsync();
    if (selectedPoint?.sessionId === pt.sessionId) {
      setSelectedPoint(null);
    } else {
      setSelectedPoint(pt);
    }
  };

  return (
    <View>
      {/* Interactive Tooltip Inspector */}
      {selectedPoint ? (
        <View className="bg-surface rounded-xl p-3 mb-4 border border-accent/40">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-white font-bold text-sm">
              {selectedPoint.gymName}
            </Text>
            <Text className="text-muted text-xs">{selectedPoint.fullDate}</Text>
          </View>
          <View className="flex-row items-center justify-between pt-1.5 border-t border-border/40">
            <Text className="text-secondary text-xs">
              <Text className="text-send font-bold">{selectedPoint.sends}</Text> sends / {selectedPoint.totalClimbs} total
            </Text>
            {selectedPoint.hardestGrade && (
              <View className="bg-accent/20 px-2 py-0.5 rounded-full border border-accent/40">
                <Text className="text-accent text-xs font-black">
                  Top: {selectedPoint.hardestGrade}
                </Text>
              </View>
            )}
            <Text className="text-secondary text-xs">
              ⏱ {selectedPoint.durationMinutes}m
              {selectedPoint.avgRpe != null ? ` • RPE ${selectedPoint.avgRpe}` : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Columns Chart */}
      <View className="flex-row items-end justify-between pt-6 pb-2" style={{ height: MAX_CHART_HEIGHT + 36 }}>
        {trends.map((point) => {
          const isSelected = selectedPoint?.sessionId === point.sessionId;
          const colHeight = Math.max(16, (point.totalClimbs / maxClimbs) * MAX_CHART_HEIGHT);
          const sendsRatio = point.totalClimbs > 0 ? point.sends / point.totalClimbs : 0;
          const sendsHeight = colHeight * sendsRatio;
          const attemptsHeight = Math.max(0, colHeight - sendsHeight);

          return (
            <TouchableOpacity
              key={point.sessionId}
              onPress={() => handlePointPress(point)}
              activeOpacity={0.75}
              className="items-center"
              style={{ width: columnWidth }}
            >
              {/* Top Grade Tag */}
              {point.hardestGrade ? (
                <Text
                  className="text-[9px] font-black text-accent mb-1 text-center"
                  numberOfLines={1}
                >
                  {point.hardestGrade}
                </Text>
              ) : (
                <View style={{ height: 14 }} />
              )}

              {/* Stacked Column SVG */}
              <Svg width={columnWidth} height={colHeight}>
                {/* Background Track */}
                <Rect
                  x={0}
                  y={0}
                  width={columnWidth}
                  height={colHeight}
                  fill={isSelected ? '#2A2A2A' : '#1E1E1E'}
                  rx={6}
                />

                {/* Attempts Segment (Top) */}
                {attemptsHeight > 0 && (
                  <Rect
                    x={0}
                    y={0}
                    width={columnWidth}
                    height={attemptsHeight}
                    fill="#374151"
                    rx={6}
                  />
                )}

                {/* Sends Segment (Bottom) */}
                {sendsHeight > 0 && (
                  <Rect
                    x={0}
                    y={attemptsHeight}
                    width={columnWidth}
                    height={sendsHeight}
                    fill="#A78BFA"
                    rx={attemptsHeight === 0 ? 6 : 0}
                  />
                )}
              </Svg>

              {/* X-Axis Date Label */}
              <Text
                className={`text-[10px] font-semibold mt-1.5 ${
                  isSelected ? 'text-accent font-bold' : 'text-muted'
                }`}
              >
                {point.dateLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Axis Baseline & Legend */}
      <View className="flex-row items-center justify-between pt-2 border-t border-border/50">
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded-sm bg-send" />
            <Text className="text-secondary text-[11px] font-semibold">Sends</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2.5 h-2.5 rounded-sm bg-[#374151]" />
            <Text className="text-secondary text-[11px] font-semibold">Attempts</Text>
          </View>
        </View>

        <Text className="text-muted text-[10px] italic">Tap session for stats</Text>
      </View>
    </View>
  );
}
