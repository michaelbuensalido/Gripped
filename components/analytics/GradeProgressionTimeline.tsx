import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/useTheme';

export interface GradePoint {
  date: string;     // e.g. 'Sep 1'
  gradeNum: number; // numeric V-grade 0–16
  gradeRaw: string; // e.g. 'V7'
}

export interface GradeProgressionTimelineProps {
  data?: GradePoint[];
}

// Fallback data
const FALLBACK: GradePoint[] = [
  { date: 'Apr', gradeNum: 5, gradeRaw: 'V5' },
  { date: 'May', gradeNum: 5, gradeRaw: 'V5' },
  { date: 'Jun', gradeNum: 6, gradeRaw: 'V6' },
  { date: 'Jul', gradeNum: 7, gradeRaw: 'V7' },
  { date: 'Aug', gradeNum: 7, gradeRaw: 'V7' },
  { date: 'Sep', gradeNum: 8, gradeRaw: 'V8' },
];

// Y-axis labels — displayed bottom → top by gifted-charts
const Y_AXIS_LABELS = ['V0', 'V2', 'V4', 'V6', 'V8', 'V10'];

export default function GradeProgressionTimeline({
  data: propData,
}: GradeProgressionTimelineProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, type, space, radius } = useTheme();

  const data = propData && propData.length > 0 ? propData : FALLBACK;
  const chartData = data.map((p) => ({
    value: p.gradeNum,
    label: p.date,
    dataPointText: p.gradeRaw,
  }));

  // Card horizontal padding (16 * 2) + border (1 * 2) + safe margin
  const chartWidth = screenWidth - (space.lg * 2) - 2 - 48;

  // Determine Y max: round up to nearest even number ≥ max grade
  const maxGrade = Math.max(...data.map((p) => p.gradeNum));
  const yMax = Math.max(10, Math.ceil(maxGrade / 2) * 2 + 2);

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
      {/* Header */}
      <Text
        style={[
          type.label,
          {
            color: colors.textMuted,
            marginBottom: 2,
          },
        ]}
      >
        Progression
      </Text>
      <Text style={[type.heading, { color: colors.text, fontSize: 16, marginBottom: space.md }]}>
        Grade High-Watermark
      </Text>

      {/* Chart */}
      <View style={{ marginLeft: -8 }}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={160}
          // Area fill with Send Lavender accent
          areaChart
          startFillColor={colors.top}
          endFillColor={colors.top}
          startOpacity={0.28}
          endOpacity={0.0}
          // Line style
          color={colors.top}
          thickness={2.5}
          // Data point style
          dataPointsColor={colors.top}
          dataPointsRadius={4}
          textColor={colors.text}
          textFontSize={10}
          // Y-axis
          maxValue={yMax}
          noOfSections={5}
          yAxisLabelTexts={Y_AXIS_LABELS}
          yAxisColor="transparent"
          yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
          yAxisThickness={0}
          // X-axis
          xAxisColor="#27272F"
          xAxisThickness={1}
          xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '500' }}
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
          stripColor={colors.top + '40'}
          stripWidth={1}
          focusedDataPointRadius={6}
          focusedDataPointColor={colors.top}
        />
      </View>

      {/* Footer: delta indicator */}
      {data.length >= 2 && (() => {
        const first = data[0].gradeNum;
        const last = data[data.length - 1].gradeNum;
        const delta = last - first;
        const positive = delta >= 0;
        return (
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
            <Text
              style={[
                type.caption,
                {
                  color: positive ? colors.flashText : colors.dangerText,
                  fontWeight: '700',
                  marginRight: 6,
                },
              ]}
            >
              {positive ? '▲' : '▼'} {Math.abs(delta)} grade{Math.abs(delta) !== 1 ? 's' : ''}
            </Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>
              over the last {data.length} sessions
            </Text>
          </View>
        );
      })()}
    </View>
  );
}
