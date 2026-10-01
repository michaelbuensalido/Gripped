import React from 'react';
import { Text, View } from 'react-native';
import Svg, {
  Circle,
  Polygon,
  Line,
  Text as SvgText,
} from 'react-native-svg';

export interface WallAngleData {
  slab: number;     // 0-100 send rate
  vertical: number;
  overhang: number;
  roof: number;
}

export interface WallAngleRadarProps {
  data?: WallAngleData;
}

const DEFAULT_DATA: WallAngleData = {
  slab: 72,
  vertical: 55,
  overhang: 38,
  roof: 20,
};

// ── Geometry constants ────────────────────────────────────────────────────────
const SVG_SIZE  = 200;
const CENTER    = SVG_SIZE / 2;   // 100
const RADIUS    = 80;

/** Degrees → radians */
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * 4 axes at: top=270°, right=0°, bottom=90°, left=180°
 * Order matches WallAngleData key order: slab, vertical, overhang, roof
 */
const AXES: { key: keyof WallAngleData; angle: number; label: string }[] = [
  { key: 'slab',     angle: 270, label: 'Slab' },
  { key: 'vertical', angle: 0,   label: 'Vertical' },
  { key: 'overhang', angle: 90,  label: 'Overhang' },
  { key: 'roof',     angle: 180, label: 'Roof' },
];

const LABEL_PADDING = 14; // extra offset past RADIUS so labels clear the chart

/** Compute a point on a given axis at a given ratio (0–1) */
function axisPoint(angle: number, ratio: number): { x: number; y: number } {
  return {
    x: CENTER + ratio * RADIUS * Math.cos(toRad(angle)),
    y: CENTER + ratio * RADIUS * Math.sin(toRad(angle)),
  };
}

/** Build a polygon points string for a given ratio ring */
function ringPoints(ratio: number): string {
  return AXES.map(({ angle }) => {
    const { x, y } = axisPoint(angle, ratio);
    return `${x},${y}`;
  }).join(' ');
}

/** Compute text anchor + dominant-baseline based on axis angle */
function labelProps(angle: number): {
  textAnchor: 'start' | 'middle' | 'end';
  dy: number; // rough vertical nudge
} {
  // right (0°)
  if (angle === 0)   return { textAnchor: 'start',  dy: 4 };
  // bottom (90°)
  if (angle === 90)  return { textAnchor: 'middle', dy: 14 };
  // left (180°)
  if (angle === 180) return { textAnchor: 'end',    dy: 4 };
  // top (270°)
  return                    { textAnchor: 'middle', dy: -6 };
}

const RING_RATIOS = [0.25, 0.5, 0.75, 1.0];

// ── Component ─────────────────────────────────────────────────────────────────
export default function WallAngleRadar({ data = DEFAULT_DATA }: WallAngleRadarProps) {
  // Build data polygon points
  const dataPoints = AXES.map(({ key, angle }) => {
    const ratio = Math.min(Math.max((data[key] ?? 0) / 100, 0), 1);
    return axisPoint(angle, ratio);
  });
  const dataPolygon = dataPoints.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <View className="bg-surface border border-border rounded-[20px] p-4">
      {/* Header */}
      <Text className="text-structural text-[10px] uppercase tracking-widest mb-[2px]">
        Wall Mastery
      </Text>
      <Text className="text-primary text-base font-bold mb-4">
        Send Rate by Angle
      </Text>

      {/* SVG Chart */}
      <View className="items-center">
        <Svg width={SVG_SIZE} height={SVG_SIZE}>
          {/* ── Background rings ── */}
          {RING_RATIOS.map((ratio) => (
            <Polygon
              key={`ring-${ratio}`}
              points={ringPoints(ratio)}
              fill="none"
              stroke="#27272F"
              strokeWidth={1}
            />
          ))}

          {/* ── Axis spokes ── */}
          {AXES.map(({ angle, key }) => {
            const tip = axisPoint(angle, 1);
            return (
              <Line
                key={`spoke-${key}`}
                x1={CENTER}
                y1={CENTER}
                x2={tip.x}
                y2={tip.y}
                stroke="#27272F"
                strokeWidth={1}
              />
            );
          })}

          {/* ── Data polygon ── */}
          <Polygon
            points={dataPolygon}
            fill="rgba(142,124,255,0.2)"
            stroke="#8E7CFF"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* ── Dots at data points ── */}
          {dataPoints.map(({ x, y }, i) => (
            <Circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r={4}
              fill="#8E7CFF"
            />
          ))}

          {/* ── Axis labels ── */}
          {AXES.map(({ angle, label, key }) => {
            const labelRatio = 1 + LABEL_PADDING / RADIUS;
            const pos = axisPoint(angle, labelRatio);
            const { textAnchor, dy } = labelProps(angle);
            return (
              <SvgText
                key={`label-${key}`}
                x={pos.x}
                y={pos.y + dy}
                textAnchor={textAnchor}
                fill="#9090A0"
                fontSize={11}
                fontWeight="500"
              >
                {label}
              </SvgText>
            );
          })}

          {/* ── Percentage labels on axes (25%, 50%, 75%) ── */}
          {[0.25, 0.5, 0.75].map((ratio) => {
            // Place along the top axis (270°), slightly right of center
            const pos = axisPoint(270, ratio);
            return (
              <SvgText
                key={`pct-${ratio}`}
                x={pos.x + 4}
                y={pos.y}
                textAnchor="start"
                fill="#555562"
                fontSize={8}
              >
                {ratio * 100}%
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* Send rate summary row */}
      <View className="flex-row justify-around mt-2">
        {AXES.map(({ key, label }) => (
          <View key={key} className="items-center">
            <Text className="text-send text-sm font-bold">{data[key] ?? 0}%</Text>
            <Text className="text-structural text-[10px] mt-[1px]">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
