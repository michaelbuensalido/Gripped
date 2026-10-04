import React from 'react';
import { Text, View } from 'react-native';
import Svg, {
  Circle,
  Polygon,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';

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
  slab: 0,
  vertical: 0,
  overhang: 0,
  roof: 0,
};

// ── Geometry constants ────────────────────────────────────────────────────────
const SVG_SIZE = 210;
const CENTER = SVG_SIZE / 2; // 105
const RADIUS = 75;

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

const LABEL_PADDING = 16; // extra offset past RADIUS so labels clear the chart

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
  dy: number;
} {
  if (angle === 0)   return { textAnchor: 'start',  dy: 4 };
  if (angle === 90)  return { textAnchor: 'middle', dy: 14 };
  if (angle === 180) return { textAnchor: 'end',    dy: 4 };
  return                    { textAnchor: 'middle', dy: -6 };
}

const RING_RATIOS = [0.25, 0.5, 0.75, 1.0];

export default function WallAngleRadar({ data = DEFAULT_DATA }: WallAngleRadarProps) {
  const { colors, type, space, radius } = useTheme();

  // Build data polygon points
  const dataPoints = AXES.map(({ key, angle }) => {
    const ratio = Math.min(Math.max((data[key] ?? 0) / 100, 0), 1);
    return axisPoint(angle, ratio);
  });
  const dataPolygon = dataPoints.map(({ x, y }) => `${x},${y}`).join(' ');
  const isEmpty = AXES.every(({ key }) => !data[key]);

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
            color: colors.textMuted,
            marginBottom: 2,
          },
        ]}
      >
        Wall Mastery
      </Text>
      <Text style={[type.heading, { color: colors.text, fontSize: 16, marginBottom: space.md }]}>
        Send Rate by Angle
      </Text>

      {/* SVG Chart */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={SVG_SIZE} height={SVG_SIZE}>
          {/* Guide rings using ultra-thin white/10 (inner rings only in zero-state) */}
          {(isEmpty ? RING_RATIOS : [1.0]).map((r) => (
            <Polygon
              key={`ring-${r}`}
              points={ringPoints(r)}
              fill="none"
              stroke={r === 1 ? 'rgba(255, 255, 255, 0.1)' : colors.chartGhost}
              strokeWidth={1}
            />
          ))}

          {/* Axis spokes */}
          {AXES.map(({ angle, key }) => {
            const tip = axisPoint(angle, 1);
            return (
              <Line
                key={`spoke-${key}`}
                x1={CENTER}
                y1={CENTER}
                x2={tip.x}
                y2={tip.y}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={1}
              />
            );
          })}

          {/* Data polygon with glowing Neon Violet */}
          {!isEmpty && (
            <Polygon
              points={dataPolygon}
              fill="rgba(142, 124, 255, 0.1)"
              stroke={colors.accent}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}

          {/* Dots at data points (collapsed to centre when empty) */}
          {dataPoints.map(({ x, y }, i) => (
            <Circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r={isEmpty ? 3 : 4}
              fill={isEmpty ? colors.chartGhostStrong : colors.accent}
            />
          ))}

          {/* Axis labels */}
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
                fill="rgba(255, 255, 255, 0.8)"
                fontSize={11}
                fontWeight="400"
              >
                {label}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* Send rate telemetry summary row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginTop: space.md,
          paddingTop: space.sm,
        }}
      >
        {AXES.map(({ key, label }) => (
          <View key={key} style={{ alignItems: 'center' }}>
            <Text
              style={[
                type.stat,
                {
                  color: colors.textWhitePrimary || colors.text,
                  fontSize: 16,
                  fontWeight: '200',
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {data[key] ?? 0}%
            </Text>
            <Text
              style={[
                type.caption,
                {
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  marginTop: 4,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {isEmpty && (
        <Text style={[type.caption, { color: colors.textWhiteMuted, marginTop: space.md, textAlign: 'center' }]}>
          Tag a wall angle when logging to map your strengths.
        </Text>
      )}
    </View>
  );
}
