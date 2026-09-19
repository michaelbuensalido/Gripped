import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { type ACWRData } from '../../services/loadCalculations';

interface ACWRWidgetProps {
  data: ACWRData | null;
}

export function ACWRWidget({ data }: ACWRWidgetProps) {
  if (!data) return null;

  const ratio = data.ratio;
  let ratioColor = '#FFFFFF';
  
  if (ratio > 1.5) {
    ratioColor = '#FF453A';
  } else if (ratio >= 0.8 && ratio <= 1.3) {
    ratioColor = '#FFFFFF';
  } else if (ratio > 1.3 && ratio <= 1.5) {
    ratioColor = '#FFD60A'; // Warning color for between sweet spot and danger
  } else {
    ratioColor = '#8A8A98'; // Under-training
  }

  // Chart configuration
  const chartHeight = 80;
  const maxLoad = Math.max(...data.weeklyLoads, data.chronicLoad, 1);
  
  return (
    <View className="bg-[#19191D] border border-[#27272F] rounded-xl p-4">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-[#8A8A98] text-xs font-bold tracking-[1px] mb-1">WORKLOAD RATIO</Text>
          <Text 
            className="text-[32px] font-bold tracking-[-1px]"
            style={{ color: ratioColor, fontVariant: ['tabular-nums'] }}
          >
            {ratio.toFixed(2)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[#8A8A98] text-[11px] font-medium">Acute (7d): {data.acuteLoad}</Text>
          <Text className="text-[#8A8A98] text-[11px] font-medium">Chronic (28d): {data.chronicLoad.toFixed(0)}</Text>
        </View>
      </View>

      <View style={{ height: chartHeight, marginTop: 8 }}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          {/* Weekly Bars */}
          {data.weeklyLoads.map((load, i) => {
            const barHeight = (load / maxLoad) * chartHeight;
            const barWidth = 100 / 4; // 4 bars for 4 weeks
            const x = `${(i * barWidth) + (barWidth / 4)}%`;
            // Make the latest week (index 3) a brighter color if needed, or all same
            const fillOpacity = i === 3 ? "1.0" : "0.5";
            return (
              <Rect
                key={i}
                x={x}
                y={chartHeight - barHeight}
                width={`${barWidth / 2}%`}
                height={barHeight}
                fill="#8E7CFF"
                fillOpacity={fillOpacity}
                rx={4}
              />
            );
          })}
          
          {/* Chronic Baseline Dashed Line */}
          {(() => {
            const lineY = chartHeight - ((data.chronicLoad / maxLoad) * chartHeight);
            return (
              <Line
                x1="0"
                y1={lineY}
                x2="100%"
                y2={lineY}
                stroke="#555562"
                strokeWidth="2"
                strokeDasharray="6, 6"
              />
            );
          })()}
        </Svg>
      </View>
    </View>
  );
}
