import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle, G, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import type { RecentOutcomesSummaryData, OutcomeSegmentData } from '../../db/queries';
import { triggerHaptic } from '../../utils/haptics';

export interface OutcomeRingGaugeProps {
  data: RecentOutcomesSummaryData;
  onPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = Math.min(Math.round(SCREEN_WIDTH * 0.46), 190);
const STROKE_WIDTH = 20;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = RING_SIZE / 2;

export function OutcomeRingGauge({ data, onPress }: OutcomeRingGaugeProps) {
  const { segments, averageGrade, totalLogs } = data;
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  // Calculate Dasharray & Offsets for continuous contiguous multi-segment ring
  const totalCount = segments.reduce((sum, s) => sum + (s.count || 0), 0);
  const totalPct = segments.reduce((sum, s) => sum + (s.percentage || 0), 0);

  let accumulatedLength = 0;
  const activeSlices = segments.filter((s) =>
    totalCount > 0 ? (s.count || 0) > 0 : (s.percentage || 0) > 0
  );

  const rings = activeSlices.map((segment) => {
    const sliceFraction =
      totalCount > 0
        ? (segment.count || 0) / totalCount
        : totalPct > 0
        ? (segment.percentage || 0) / totalPct
        : 0.25;

    const sliceLength = sliceFraction * CIRCUMFERENCE;
    const strokeDashoffset = -accumulatedLength;
    accumulatedLength += sliceLength;

    return {
      ...segment,
      sliceFraction,
      sliceLength,
      strokeDasharray: [sliceLength, CIRCUMFERENCE] as [number, number],
      strokeDashoffset,
    };
  });

  const activeItem = segments.find((s) => s.label === activeSegment);

  const handleSegmentPress = (label: string) => {
    triggerHaptic('light');
    setActiveSegment((prev) => (prev === label ? null : label));
  };

  const sampleCount = totalLogs > 0 ? totalLogs : 20;

  return (
    <View style={styles.cardContainer}>
      {/* ── Subtle Radial Glow Overlay ───────────────────────── */}
      <View style={styles.glowOverlay} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="outcomeGlow"
              cx="35%"
              cy="50%"
              rx="60%"
              ry="60%"
              fx="35%"
              fy="50%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#6EE756" stopOpacity="0.08" />
              <Stop offset="45%" stopColor="#8E7CFF" stopOpacity="0.03" />
              <Stop offset="100%" stopColor="#1E1E24" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#outcomeGlow)" />
        </Svg>
      </View>

      {/* ── Header: Clean bold title without decorative icons ──── */}
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Send Efficiency</Text>
      </View>

      {/* ── Content Row: Ring Gauge (Left) + Legend (Right) ─── */}
      <View style={styles.contentRow}>
        {/* Circular Donut Ring */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (activeSegment) {
              triggerHaptic('light');
              setActiveSegment(null);
            }
          }}
          style={{ width: RING_SIZE, height: RING_SIZE }}
        >
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background circular track */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke="#25252E"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />

            {/* Colored Outcome Arc Segments */}
            <G rotation={-90} origin={`${CENTER}, ${CENTER}`}>
              {rings.map((ring) => {
                const isSelected = activeSegment === ring.label;
                const isFaded = activeSegment !== null && !isSelected;

                return (
                  <Circle
                    key={ring.label}
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    stroke={ring.color}
                    strokeWidth={isSelected ? STROKE_WIDTH + 2 : STROKE_WIDTH}
                    strokeDasharray={ring.strokeDasharray}
                    strokeDashoffset={ring.strokeDashoffset}
                    strokeLinecap="butt"
                    opacity={isFaded ? 0.35 : 1}
                    fill="none"
                  />
                );
              })}
            </G>
          </Svg>

          {/* Center Typography Overlay */}
          <View style={styles.centerTextOverlay} pointerEvents="none">
            <Text style={styles.gradeText}>
              {activeItem ? `${activeItem.percentage}%` : averageGrade}
            </Text>
            <Text style={styles.subtitleText}>
              {activeItem ? (
                `${activeItem.count} ${activeItem.label}s`
              ) : (
                'Average of last 20 routes'
              )}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── Legend on the Right ─────────────────────────────── */}
        <View style={styles.legendContainer}>
          {segments.map((segment) => {
            const isSelected = activeSegment === segment.label;
            const isFaded = activeSegment !== null && !isSelected;

            return (
              <TouchableOpacity
                key={segment.label}
                activeOpacity={0.7}
                onPress={() => handleSegmentPress(segment.label)}
                style={[
                  styles.legendRow,
                  isFaded && { opacity: 0.4 },
                ]}
              >
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: segment.color,
                      shadowColor: segment.color,
                    },
                    isSelected && styles.legendDotSelected,
                  ]}
                />
                <Text
                  style={[
                    styles.legendLabel,
                    isSelected && { color: segment.color, fontWeight: '700' },
                  ]}
                >
                  {segment.label}
                </Text>
                <Text
                  style={[
                    styles.legendPercentage,
                    isSelected && { color: segment.color, fontWeight: '700' },
                  ]}
                >
                  {segment.percentage}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2C2C35',
    position: 'relative',
    overflow: 'hidden',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
  },
  headerRow: {
    marginBottom: 14,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 2,
  },
  centerTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  gradeText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitleText: {
    color: '#8A8A98',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 2,
  },
  legendContainer: {
    gap: 14,
    paddingLeft: 12,
    justifyContent: 'center',
    minWidth: 120,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  legendDotSelected: {
    transform: [{ scale: 1.5 }],
  },
  legendLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  legendPercentage: {
    color: '#8A8A98',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 'auto',
  },
});
