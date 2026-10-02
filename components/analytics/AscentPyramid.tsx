import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export interface PyramidRow {
  grade: string;
  flashes: number;
  sends: number;
  attempts: number;
}

export interface AscentPyramidProps {
  data?: PyramidRow[];
}

// ── Palette tokens (matching design system) ───────────────────────────────────
const COLOR_FLASH   = '#6EE756';
const COLOR_SEND    = '#8E7CFF';
const COLOR_ATTEMPT = '#3E3E48';

// ── Fallback data ─────────────────────────────────────────────────────────────
const FALLBACK: PyramidRow[] = [
  { grade: 'V4', flashes: 5, sends: 8,  attempts: 15 },
  { grade: 'V5', flashes: 3, sends: 6,  attempts: 12 },
  { grade: 'V6', flashes: 2, sends: 4,  attempts: 10 },
  { grade: 'V7', flashes: 1, sends: 2,  attempts: 8  },
  { grade: 'V8', flashes: 0, sends: 1,  attempts: 6  },
  { grade: 'V9', flashes: 0, sends: 0,  attempts: 3  },
];

// ── Legend item ───────────────────────────────────────────────────────────────
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center mr-4">
      <View
        className="rounded-[2px] mr-[6px]"
        style={{ width: 10, height: 10, backgroundColor: color }}
      />
      <Text className="text-secondary text-[11px]">{label}</Text>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Convert PyramidRow[] → gifted-charts stackData format.
 * Each bar is [flash, send, attempt] stacked bottom-up.
 */
function toStackData(rows: PyramidRow[]) {
  return rows.map((row) => ({
    label: row.grade,
    stacks: [
      { value: row.flashes,  color: COLOR_FLASH,   marginBottom: 0 },
      { value: row.sends,    color: COLOR_SEND,    marginBottom: 2 },
      { value: row.attempts, color: COLOR_ATTEMPT, marginBottom: 2 },
    ],
    // gifted-charts uses barBorderRadius per bar
    barBorderRadius: 4,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AscentPyramid({ data: propData }: AscentPyramidProps) {
  const { width: screenWidth } = useWindowDimensions();
  const data = propData && propData.length > 0 ? propData : FALLBACK;
  const stackData = toStackData(data);

  // Card horizontal padding (16*2) + border (1*2) + y-axis label area
  const chartWidth = screenWidth - 32 - 2 - 40;

  // Max Y: highest total ascent count, rounded up
  const maxTotal = Math.max(
    ...data.map((r) => r.flashes + r.sends + r.attempts),
  );
  const yMax = Math.ceil(maxTotal / 5) * 5 || 20;

  const barWidth  = 28;
  const spacing   = Math.max(
    8,
    Math.floor((chartWidth - barWidth * data.length) / data.length),
  );

  return (
    <View className="bg-surface border border-border rounded-[20px] p-4">
      {/* Header */}
      <Text className="text-structural text-[10px] uppercase tracking-widest mb-[2px]">
        Ascent Pyramid
      </Text>
      <Text className="text-primary text-base font-bold mb-4">
        Volume by Grade
      </Text>

      {/* Stacked bar chart */}
      <View style={{ marginLeft: -8 }}>
        <BarChart
          stackData={stackData}
          width={chartWidth}
          height={180}
          barWidth={barWidth}
          spacing={spacing}
          // Y-axis
          maxValue={yMax}
          noOfSections={5}
          yAxisThickness={0}
          yAxisTextStyle={{ color: '#555562', fontSize: 10 }}
          // X-axis
          xAxisColor="#27272F"
          xAxisThickness={1}
          xAxisLabelTextStyle={{ color: '#555562', fontSize: 10 }}
          // Rules
          rulesColor="#22222A"
          rulesType="solid"
          // Animation
          isAnimated
          animationDuration={500}
          // Background
          backgroundColor="transparent"
          // Rounded tops
          roundedTop
          roundedBottom={false}
          // Hide bar values (too cluttered on stacked)
          hideYAxisText={false}
          showValuesAsTopLabel={false}
          // Spacing
          initialSpacing={12}
          endSpacing={8}
        />
      </View>

      {/* Legend */}
      <View className="flex-row items-center mt-3 pt-3 border-t border-border">
        <LegendItem color={COLOR_FLASH}   label="Flash"     />
        <LegendItem color={COLOR_SEND}    label="Redpoint"  />
        <LegendItem color={COLOR_ATTEMPT} label="Attempt"   />
      </View>
    </View>
  );
}
