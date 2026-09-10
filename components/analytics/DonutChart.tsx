import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_SIZE = Math.min(SCREEN_WIDTH * 0.49, 196);
const STROKE_WIDTH = 18;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = CHART_SIZE / 2;

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel?: string;
  centerSubLabel?: string;
}

export function DonutChart({
  segments,
  centerLabel = 'V7',
  centerSubLabel = 'Average of last 20 routes',
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  // If all segment values are 0, supply mockup default distribution:
  // Flash (42%), Top (28%), Attempt (18%), Fail (12%)
  const effectiveSegments: DonutSegment[] =
    total > 0
      ? segments
      : [
          { label: 'Flash', value: 42, color: '#6EE756' },
          { label: 'Top', value: 28, color: '#8E7CFF' },
          { label: 'Attempt', value: 18, color: '#E8DEB5' },
          { label: 'Fail', value: 12, color: '#484852' },
        ];

  const effectiveTotal = effectiveSegments.reduce((sum, s) => sum + s.value, 0);

  // Build the ring segments
  let cumulativeOffset = 0;
  const rings = effectiveSegments
    .filter((s) => s.value > 0)
    .map((segment) => {
      const pct = segment.value / effectiveTotal;
      const strokeDasharray = `${pct * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
      const rotation = cumulativeOffset * 360 - 90; // start at 12 o'clock
      cumulativeOffset += pct;
      return {
        ...segment,
        strokeDasharray,
        rotation,
        pct,
      };
    });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
      {/* Donut ring */}
      <View style={{ width: CHART_SIZE, height: CHART_SIZE }}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          {/* Background track */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke="#26262E"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Colored segments with 18pt stroke */}
          {rings.map((ring) => (
            <G
              key={ring.label}
              rotation={ring.rotation}
              origin={`${CENTER}, ${CENTER}`}
            >
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke={ring.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={ring.strokeDasharray}
                strokeLinecap="round"
                fill="none"
              />
            </G>
          ))}
        </Svg>

        {/* Center text overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CHART_SIZE,
            height: CHART_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* "V7": Font size 44pt, FontWeight: Bold / 700, color: #FFFFFF */}
          <Text
            style={{
              fontSize: 44,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: -0.5,
            }}
          >
            {centerLabel}
          </Text>
          {/* "Average of last 20 routes": Font size 12pt, medium tracking, centered, color: #8A8A96 */}
          <Text
            style={{
              fontSize: 12,
              color: '#8A8A96',
              textAlign: 'center',
              lineHeight: 15,
              marginTop: 2,
              paddingHorizontal: 12,
            }}
          >
            {centerSubLabel}
          </Text>
        </View>
      </View>

      {/* Legend on the Right: 15pt text-base, 500 weight, 10px dots with 10px gap, 12pt vertical spacing */}
      <View style={{ gap: 12, paddingRight: 10 }}>
        {effectiveSegments.map((segment) => (
          <View
            key={segment.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: segment.color,
                shadowColor: segment.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 3,
              }}
            />
            <Text
              style={{
                fontSize: 15,
                fontWeight: '500',
                color: '#FFFFFF',
              }}
            >
              {segment.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
