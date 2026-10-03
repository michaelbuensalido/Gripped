import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/useTheme';

export interface PyramidRow {
  grade: string;
  flashes: number;
  sends: number;
  attempts: number;
}

export interface AscentPyramidProps {
  data?: PyramidRow[];
}

// Fallback data
const FALLBACK: PyramidRow[] = [
  { grade: 'V4', flashes: 5, sends: 8, attempts: 15 },
  { grade: 'V5', flashes: 3, sends: 6, attempts: 12 },
  { grade: 'V6', flashes: 2, sends: 4, attempts: 10 },
  { grade: 'V7', flashes: 1, sends: 2, attempts: 8 },
  { grade: 'V8', flashes: 0, sends: 1, attempts: 6 },
  { grade: 'V9', flashes: 0, sends: 0, attempts: 3 },
];

function LegendItem({ color, label }: { color: string; label: string }) {
  const { colors, type, space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: space.md }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: color,
          marginRight: 6,
        }}
      />
      <Text style={[type.caption, { color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 10 }]}>{label}</Text>
    </View>
  );
}

export default function AscentPyramid({ data: propData }: AscentPyramidProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, type, space, radius } = useTheme();
  
  const data = propData && propData.length > 0 ? propData : FALLBACK;

  const stackData = data.map((row) => ({
    label: row.grade,
    stacks: [
      { value: row.flashes, color: colors.flash, marginBottom: 0 },
      { value: row.sends, color: colors.top, marginBottom: 2 }, // Send Lavender
      { value: row.attempts, color: colors.fail, marginBottom: 2 },
    ],
    barBorderRadius: 4,
  }));

  // Card horizontal padding (16*2) + border (1*2) + y-axis label space
  const chartWidth = screenWidth - (space.lg * 2) - 2 - 44;

  const maxTotal = Math.max(
    ...data.map((r) => r.flashes + r.sends + r.attempts),
  );
  const yMax = Math.ceil(maxTotal / 5) * 5 || 20;

  const barWidth = 26;
  const spacing = Math.max(
    8,
    Math.floor((chartWidth - barWidth * data.length) / data.length),
  );

  return (
    <View
      style={{
        backgroundColor: colors.materialBase,
        borderRadius: radius.lg,
        borderWidth: 0,
        borderColor: colors.border,
        padding: space.lg,
      }}
    >
      {/* Header */}
      <Text
        style={[
          type.label,
          {
            color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 10,
            marginBottom: 2,
          },
        ]}
      >
        Ascent Pyramid
      </Text>
      <Text style={[type.heading, { color: colors.textWhitePrimary || colors.text, fontSize: 16, fontWeight: '400', marginBottom: space.md }]}>
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
          yAxisTextStyle={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 10 }}
          // X-axis
          xAxisColor="rgba(255,255,255,0.1)"
          xAxisThickness={1}
          xAxisLabelTextStyle={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 10, fontWeight: '500' }}
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
          hideYAxisText={false}
          showValuesAsTopLabel={false}
          initialSpacing={12}
          endSpacing={8}
        />
      </View>

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: space.sm,
          paddingTop: space.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <LegendItem color={colors.flash} label="Flash" />
        <LegendItem color={colors.top} label="Send" />
        <LegendItem color={colors.fail} label="Attempt" />
      </View>
    </View>
  );
}
