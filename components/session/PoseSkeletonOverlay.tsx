import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  PoseTrackingState,
  LandmarkPoint,
  TargetHold,
} from '../../hooks/useClimbingPoseTracker';

interface PoseSkeletonOverlayProps {
  poseState: PoseTrackingState;
  targetHolds?: TargetHold[];
  width?: number;
  height?: number;
  showHoldZones?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function PoseSkeletonOverlay({
  poseState,
  targetHolds = [],
  width = screenWidth,
  height = screenHeight,
  showHoldZones = true,
}: PoseSkeletonOverlayProps) {
  const { hasClimber, landmarks, isHandOnHold, activeHoldIntersections } = poseState;

  // Transform normalized [0.0, 1.0] coordinates to absolute screen pixels
  const pxLandmarks = useMemo(() => {
    const result: Record<string, { x: number; y: number; confidence: number }> = {};
    for (const [key, pt] of Object.entries(landmarks)) {
      if (pt && pt.confidence > 0.2) {
        result[key] = {
          x: pt.x * width,
          y: pt.y * height,
          confidence: pt.confidence,
        };
      }
    }
    return result;
  }, [landmarks, width, height]);

  // Bone segment definitions
  const bones: [string, string][] = [
    ['leftWrist', 'leftElbow'],
    ['rightWrist', 'rightElbow'],
    ['leftElbow', 'leftHip'],
    ['rightElbow', 'rightHip'],
    ['leftHip', 'rightHip'],
    ['leftHip', 'leftAnkle'],
    ['rightHip', 'rightAnkle'],
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* SVG Canvas for Bones and Landmark Dots */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="contactHalo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#6EE756" stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#6EE756" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#6EE756" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* 1. Target Hold Zones (Start, Crux, Finish) */}
        {showHoldZones &&
          targetHolds.map((hold, idx) => {
            const hx = hold.x * width;
            const hy = hold.y * height;
            const hr = (hold.radius ?? 0.08) * width;
            const isContacted =
              isHandOnHold &&
              ((pxLandmarks.leftWrist &&
                Math.hypot(pxLandmarks.leftWrist.x - hx, pxLandmarks.leftWrist.y - hy) <= hr) ||
                (pxLandmarks.rightWrist &&
                  Math.hypot(pxLandmarks.rightWrist.x - hx, pxLandmarks.rightWrist.y - hy) <= hr));

            return (
              <React.Fragment key={`hold-zone-${idx}`}>
                <Circle
                  cx={hx}
                  cy={hy}
                  r={hr}
                  stroke={isContacted ? '#6EE756' : 'rgba(142, 124, 255, 0.45)'}
                  strokeWidth={isContacted ? 2.5 : 1.5}
                  strokeDasharray={isContacted ? undefined : '4, 4'}
                  fill={isContacted ? 'rgba(110, 231, 86, 0.15)' : 'rgba(142, 124, 255, 0.06)'}
                />
              </React.Fragment>
            );
          })}

        {/* 2. Skeleton Bone Segments */}
        {hasClimber &&
          bones.map(([startKey, endKey], idx) => {
            const p1 = pxLandmarks[startKey];
            const p2 = pxLandmarks[endKey];
            if (!p1 || !p2) return null;

            return (
              <Line
                key={`bone-${idx}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="rgba(142, 124, 255, 0.75)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}

        {/* 3. Landmark Joint Points */}
        {hasClimber &&
          Object.entries(pxLandmarks).map(([key, pt]) => {
            const isHand = key === 'leftWrist' || key === 'rightWrist';
            const handOnHold = isHand && isHandOnHold;

            return (
              <React.Fragment key={`joint-${key}`}>
                {/* Contact halo pulse for hands touching holds */}
                {handOnHold && (
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={26}
                    fill="url(#contactHalo)"
                  />
                )}
                {/* Outer Ring */}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={handOnHold ? 8 : 6}
                  fill={handOnHold ? '#6EE756' : '#8E7CFF'}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              </React.Fragment>
            );
          })}
      </Svg>

      {/* 4. Real-Time Tracking Status HUD Pill */}
      <View style={styles.hudContainer}>
        <View style={[styles.statusChip, hasClimber && styles.statusChipActive]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: hasClimber ? '#6EE756' : '#8A8A98' },
            ]}
          />
          <Text style={[styles.statusText, hasClimber && styles.statusTextActive]}>
            {hasClimber ? 'CLIMBER DETECTED' : 'SEARCHING FOR CLIMBER'}
          </Text>
        </View>

        <View style={[styles.statusChip, isHandOnHold && styles.contactChipActive]}>
          <Text
            style={[
              styles.statusText,
              isHandOnHold ? styles.contactTextActive : { color: '#8A8A98' },
            ]}
          >
            {isHandOnHold
              ? `✋ CONTACT: ${activeHoldIntersections} HOLD${activeHoldIntersections > 1 ? 'S' : ''}`
              : '✋ NO CONTACT'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hudContainer: {
    position: 'absolute',
    top: 104,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 26, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusChipActive: {
    backgroundColor: 'rgba(110, 231, 86, 0.16)',
    borderColor: 'rgba(110, 231, 86, 0.4)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#8A8A98',
  },
  statusTextActive: {
    color: '#6EE756',
  },
  contactChipActive: {
    backgroundColor: 'rgba(110, 231, 86, 0.16)',
    borderColor: 'rgba(110, 231, 86, 0.4)',
  },
  contactTextActive: {
    color: '#6EE756',
    fontWeight: '800',
  },
});
