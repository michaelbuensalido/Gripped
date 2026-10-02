import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

export interface GradePoint {
  date: string;     // e.g. 'Sep 1'
  gradeNum: number; // numeric V-grade 0–16
  gradeRaw: string; // e.g. 'V7'
}

export interface GradeProgressionTimelineProps {
  data?: GradePoint[];
}

// ── Fallback data ─────────────────────────────────────────────────────────────
const FALLBACK: GradePoint[] = [
  { date: 'Apr',  gradeNum: 5,  gradeRaw: 'V5'  },
  { date: 'May',  gradeNum: 5,  gradeRaw: 'V5'  },
  { date: 'Jun',  gradeNum: 6,  gradeRaw: 'V6'  },
  { date: 'Jul',  gradeNum: 7,  gradeRaw: 'V7'  },
  { date: 'Aug',  gradeNum: 7,  gradeRaw: 'V7'  },
  { date: 'Sep',  gradeNum: 8,  gradeRaw: 'V8'  },
];

// Y-axis labels — displayed bottom → top by gifted-charts
const Y_AXIS_LABELS = ['V0', 'V2', 'V4', 'V6', 'V8', 'V10'];

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Convert GradePoint[] → gifted-charts LineChart data format */
function toChartData(points: GradePoint[]) {
  return points.map((p) => ({
    value: p.gradeNum,
    label: p.date,
    dataPointText: p.gradeRaw,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GradeProgressionTimeline({
  data: propData,
}: GradeProgressionTimelineProps) {
  const { width: screenWidth } = useWindowDimensions();
  const data = propData && propData.length > 0 ? propData : FALLBACK;
  const chartData = toChartData(data);

  // Card horizontal padding (16 * 2) + border (1 * 2) + extra safe margin
  const chartWidth = screenWidth - 32 - 2 - 48;

  // Determine Y max: round up to nearest even number ≥ max grade
  const maxGrade = Math.max(...data.map((p) => p.gradeNum));
  const yMax = Math.max(10, Math.ceil(maxGrade / 2) * 2 + 2);

  return (
    <View className="bg-surface border border-border rounded-[20px] p-4">
      {/* Header */}
      <Text className="text-structural text-[10px] uppercase tracking-widest mb-[2px]">
        Progression
      </Text>
      <Text className="text-primary text-base font-bold mb-4">
        Grade High-Watermark
      </Text>

      {/* Chart */}
      <View style={{ marginLeft: -8 }}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={160}
          // Area fill
          areaChart
          startFillColor="rgba(142,124,255,0.3)"
          endFillColor="rgba(142,124,255,0)"
          startOpacity={1}
          endOpacity={0}
          // Line style
          color="#8E7CFF"
          thickness={2}
          // Data point style
          dataPointsColor="#8E7CFF"
          dataPointsRadius={4}
          textColor="#9090A0"
          textFontSize={10}
          // Y-axis
          maxValue={yMax}
          noOfSections={5}
          yAxisLabelTexts={Y_AXIS_LABELS}
          yAxisColor="transparent"
          yAxisTextStyle={{ color: '#555562', fontSize: 10 }}
          yAxisThickness={0}
          // X-axis
          xAxisColor="#27272F"
          xAxisThickness={1}
          xAxisLabelTextStyle={{ color: '#555562', fontSize: 10 }}
          // Grid rules
          hideRules={false}
          rulesColor="#22222A"
          rulesType="solid"
          // Animation
          isAnimated
          animationDuration={600}
          // Curve
          curved
          curvature={0.2}
          // No extra decorators
          hideDataPoints={false}
          showValuesAsDataPointsText
          initialSpacing={16}
          endSpacing={16}
          spacing={(chartWidth - 32) / Math.max(data.length - 1, 1)}
          // Background
          backgroundColor="transparent"
          // Pointer
          focusEnabled
          showStripOnFocus
          stripColor="rgba(142,124,255,0.3)"
          stripWidth={1}
          focusedDataPointRadius={6}
          focusedDataPointColor="#8E7CFF"
        />
      </View>

      {/* Footer: delta indicator */}
      {data.length >= 2 && (() => {
        const first = data[0].gradeNum;
        const last  = data[data.length - 1].gradeNum;
        const delta = last - first;
        const positive = delta >= 0;
        return (
          <View className="flex-row items-center mt-3 pt-3 border-t border-border">
            <Text
              className="text-[12px] font-semibold mr-1"
              style={{ color: positive ? '#6EE756' : '#FF453A' }}
            >
              {positive ? '▲' : '▼'} {Math.abs(delta)} grade{Math.abs(delta) !== 1 ? 's' : ''}
            </Text>
            <Text className="text-secondary text-[12px]">
              over the last {data.length} sessions
            </Text>
          </View>
        );
      })()}
    </View>
  );
}
