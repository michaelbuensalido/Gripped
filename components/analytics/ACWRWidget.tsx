import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { type ACWRData } from '../../services/loadCalculations';
import { useTheme } from '../../theme/useTheme';

interface ACWRWidgetProps {
  data: ACWRData | null;
}

export function ACWRWidget({ data }: ACWRWidgetProps) {
  const { colors, type, space, radius } = useTheme();
  if (!data) return null;

  const ratio = data.ratio;
  let ratioColor = colors.text;
  
  if (ratio > 1.5) {
    ratioColor = colors.danger;
  } else if (ratio >= 0.8 && ratio <= 1.3) {
    ratioColor = colors.flashText;
  } else if (ratio > 1.3 && ratio <= 1.5) {
    ratioColor = colors.attemptText;
  } else {
    ratioColor = colors.textMuted;
  }

  // Chart configuration
  const chartHeight = 80;
  const maxLoad = Math.max(...data.weeklyLoads, data.chronicLoad, 1);
  
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: space.lg,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md }}>
        <View>
          <Text style={[type.label, { color: colors.textMuted, marginBottom: 2 }]}>WORKLOAD RATIO</Text>
          <Text 
            style={[
              type.stat,
              { color: ratioColor, fontSize: 32, fontVariant: ['tabular-nums'] },
            ]}
          >
            {ratio.toFixed(2)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={[type.caption, { color: colors.textMuted }]}>Acute (7d): {data.acuteLoad}</Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>Chronic (28d): {data.chronicLoad.toFixed(0)}</Text>
        </View>
      </View>

      <View style={{ height: chartHeight, marginTop: space.xs }}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          {/* Weekly Bars */}
          {data.weeklyLoads.map((load, i) => {
            const barHeight = (load / maxLoad) * chartHeight;
            const barWidth = 100 / 4; // 4 bars for 4 weeks
            const x = `${(i * barWidth) + (barWidth / 4)}%`;
            const fillOpacity = i === 3 ? "1.0" : "0.5";
            return (
              <Rect
                key={i}
                x={x}
                y={chartHeight - barHeight}
                width={`${barWidth / 2}%`}
                height={barHeight}
                fill={colors.accent}
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
                stroke={colors.border}
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
