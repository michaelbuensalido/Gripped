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

// Zero-state placeholder: flat line at V0 so the chart frame is visible before any sends
const EMPTY_POINTS: GradePoint[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map((date) => ({
  date,
  gradeNum: 0,
  gradeRaw: '',
}));

// Y-axis labels — displayed bottom → top by gifted-charts
const Y_AXIS_LABELS = ['V0', 'V2', 'V4', 'V6', 'V8', 'V10'];

export default function GradeProgressionTimeline({
  data: propData,
}: GradeProgressionTimelineProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, type, space, radius } = useTheme();

  const isEmpty = !propData || propData.length === 0;
  const data = isEmpty ? EMPTY_POINTS : propData!;
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
  const lineColor = isEmpty ? colors.chartGhostStrong : colors.accent;

  return (
    <View
      style={{
        backgroundColor: colors.materialBase,
        borderRadius: radius.lg,
        borderWidth: 0,
        padding: space.lg,
      }}
    >
      {/* Header */}
      <Text
        style={[
          type.label,
          {
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 2,
            fontSize: 10,
          },
        ]}
      >
        Progression
      </Text>
      <Text style={[type.heading, { color: colors.textWhitePrimary || colors.text, fontSize: 16, marginBottom: space.md, fontWeight: '400' }]}>
        Grade High-Watermark
      </Text>

      {/* Chart */}
      <View style={{ marginLeft: -8 }}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={160}
          // Area fill with Send Lavender accent
          areaChart={!isEmpty}
          startFillColor="rgba(142, 124, 255, 0.15)"
          endFillColor="rgba(142, 124, 255, 0)"
          startOpacity={1}
          endOpacity={1}
          // Line style
          color={lineColor}
          thickness={2}
          strokeDashArray={isEmpty ? [4, 6] : undefined}
          // Data point style
          dataPointsColor={lineColor}
          dataPointsRadius={isEmpty ? 3 : 4}
          textColor={colors.textWhitePrimary || colors.text}
          textFontSize={10}
          // Y-axis
          maxValue={yMax}
          noOfSections={5}
          yAxisLabelTexts={Y_AXIS_LABELS}
          yAxisColor="transparent"
          yAxisTextStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}
          yAxisThickness={0}
          // X-axis
          xAxisColor="rgba(255,255,255,0.1)"
          xAxisThickness={1}
          xAxisLabelTextStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '500' }}
          // Grid rules — faint guides in zero-state so the frame reads as a chart
          hideRules={!isEmpty}
          rulesColor={colors.chartGhost}
          rulesType="dashed"
          // Animation
          isAnimated
          animationDuration={600}
          // Curve
          curved
          curvature={0.2}
          hideDataPoints={false}
          showValuesAsDataPointsText={!isEmpty}
          initialSpacing={16}
          endSpacing={16}
          spacing={(chartWidth - 32) / Math.max(data.length - 1, 1)}
          // Background
          backgroundColor="transparent"
          // Pointer
          focusEnabled={!isEmpty}
          showStripOnFocus
          stripColor={colors.accent + '40'}
          stripWidth={1}
          focusedDataPointRadius={6}
          focusedDataPointColor={colors.accent}
        />
      </View>

      {isEmpty && (
        <Text style={[type.caption, { color: colors.textWhiteMuted, marginTop: space.sm }]}>
          Your hardest send each week will plot here.
        </Text>
      )}

      {/* Footer: delta indicator */}
      {!isEmpty && data.length >= 2 && (() => {
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
            <Text style={[type.caption, { color: 'rgba(255,255,255,0.4)' }]}>
              over the last {data.length} sessions
            </Text>
          </View>
        );
      })()}
    </View>
  );
}
