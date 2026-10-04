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

// Zero-state rows: grade axis is visible with empty bars before any climbs are logged
const EMPTY_ROWS: PyramidRow[] = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5'].map((grade) => ({
  grade,
  flashes: 0,
  sends: 0,
  attempts: 0,
}));

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
  
  const isEmpty = !propData || propData.length === 0;
  const data = isEmpty ? EMPTY_ROWS : propData!;

  const stackData = data.map((row) => ({
    label: row.grade,
    stacks: isEmpty
      ? [{ value: 0.4, color: colors.chartGhostStrong, marginBottom: 0 }]
      : [
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

      {isEmpty && (
        <Text style={[type.caption, { color: colors.textWhiteMuted, marginTop: space.sm }]}>
          Flashes, sends and attempts per grade will stack here.
        </Text>
      )}

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
