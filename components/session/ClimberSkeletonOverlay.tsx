import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  PoseTrackingState,
  LandmarkPoint,
  TargetHold,
  RECOMMENDED_FRAME_WIDTH,
  RECOMMENDED_FRAME_HEIGHT,
} from '../../hooks/useClimbingPoseTracker';
import {
  mapLandmarkToScreen,
  ScreenPoint,
} from '../../utils/poseCoordinates';

// ─────────────────────────────────────────────────────────────────────────────
// STYLING CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const LAVENDER_STROKE = '#8E7CFF';
const CONTACT_LIME    = '#6EE756';
const JOINT_FILL      = '#FFFFFF';
const JOINT_RADIUS    = 6; // 6pt circular joints

export interface ClimberSkeletonOverlayProps {
  poseState: PoseTrackingState;
  targetHolds?: TargetHold[];
  width?: number;
  height?: number;
  showHoldZones?: boolean;
  isFrontCamera?: boolean;
  frameWidth?: number;
  frameHeight?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ─── Connected Bone Segments ──────────────────────────────────────────────────
// - Shoulders -> Elbows -> Wrists
// - Shoulders -> Hips -> Knees -> Ankles
// - Torso perimeter box: Shoulder-to-Shoulder, Hip-to-Hip, Shoulder-to-Hip
const SKELETON_BONES: [string, string][] = [
  // Arms: Shoulders -> Elbows -> Wrists
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],

  // Torso Perimeter Box
  ['leftShoulder', 'rightShoulder'],
  ['rightShoulder', 'rightHip'],
  ['rightHip', 'leftHip'],
  ['leftHip', 'leftShoulder'],

  // Legs: Hips -> Knees -> Ankles
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
];

const WRIST_KEYS = new Set(['leftWrist', 'rightWrist']);

export function ClimberSkeletonOverlay({
  poseState,
  targetHolds = [],
  width = screenWidth,
  height = screenHeight,
  showHoldZones = true,
  isFrontCamera = false,
  frameWidth = RECOMMENDED_FRAME_WIDTH,
  frameHeight = RECOMMENDED_FRAME_HEIGHT,
}: ClimberSkeletonOverlayProps) {
  const { hasClimber, landmarks, isHandOnHold, activeHoldIntersections } = poseState;

  // Transform normalized [0, 1] landmark coordinates to screen pixels
  const pxLandmarks = useMemo<Record<string, ScreenPoint & { confidence: number }>>(() => {
    const result: Record<string, ScreenPoint & { confidence: number }> = {};
    for (const [key, pt] of Object.entries(landmarks) as [string, LandmarkPoint][]) {
      if (pt && pt.confidence >= 0.25) {
        const screen = mapLandmarkToScreen(
          { x: pt.x, y: pt.y },
          width,
          height,
          isFrontCamera,
          frameWidth,
          frameHeight
        );
        result[key] = { ...screen, confidence: pt.confidence };
      }
    }
    return result;
  }, [landmarks, width, height, isFrontCamera, frameWidth, frameHeight]);

  const jointCount = Object.keys(pxLandmarks).length;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* SVG Canvas for Bones and Joints */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="handContactGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={CONTACT_LIME} stopOpacity="0.85" />
            <Stop offset="60%" stopColor={CONTACT_LIME} stopOpacity="0.30" />
            <Stop offset="100%" stopColor={CONTACT_LIME} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* 1. Target Hold Zones (if provided) */}
        {showHoldZones &&
          targetHolds.map((hold, idx) => {
            const hx = hold.x * width;
            const hy = hold.y * height;
            const hr = (hold.radius ?? 0.08) * Math.min(width, height);

            const isContacted =
              isHandOnHold &&
              ((pxLandmarks.leftWrist &&
                Math.hypot(pxLandmarks.leftWrist.x - hx, pxLandmarks.leftWrist.y - hy) <= hr) ||
                (pxLandmarks.rightWrist &&
                  Math.hypot(pxLandmarks.rightWrist.x - hx, pxLandmarks.rightWrist.y - hy) <= hr));

            return (
              <Circle
                key={`hold-zone-${idx}`}
                cx={hx}
                cy={hy}
                r={hr}
                stroke={isContacted ? CONTACT_LIME : 'rgba(142, 124, 255, 0.45)'}
                strokeWidth={isContacted ? 2.5 : 1.5}
                strokeDasharray={isContacted ? undefined : '5, 5'}
                fill={isContacted ? 'rgba(110, 231, 86, 0.15)' : 'rgba(142, 124, 255, 0.05)'}
              />
            );
          })}

        {/* 2. Connected Bone Segments (Lavender #8E7CFF, opacity: 0.8, strokeWidth: 2.5) */}
        {hasClimber &&
          SKELETON_BONES.map(([fromKey, toKey], idx) => {
            const p1 = pxLandmarks[fromKey];
            const p2 = pxLandmarks[toKey];
            if (!p1 || !p2) return null;

            return (
              <Line
                key={`bone-${idx}-${fromKey}-${toKey}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={LAVENDER_STROKE}
                strokeOpacity={0.8}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            );
          })}

        {/* 3. 6pt Circular Joints (#FFFFFF fill, #8E7CFF outline, highlight hands in Lime Green) */}
        {hasClimber &&
          Object.entries(pxLandmarks).map(([key, pt]) => {
            const isHand = WRIST_KEYS.has(key);
            const isContactActive = isHand && isHandOnHold;

            return (
              <React.Fragment key={`joint-${key}`}>
                {/* Active contact halo pulse for hands */}
                {isContactActive && (
                  <Circle cx={pt.x} cy={pt.y} r={28} fill="url(#handContactGlow)" />
                )}

                {/* 6pt circular joint point */}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={JOINT_RADIUS}
                  fill={isContactActive ? CONTACT_LIME : JOINT_FILL}
                  stroke={isContactActive ? '#FFFFFF' : LAVENDER_STROKE}
                  strokeWidth={1.5}
                />
              </React.Fragment>
            );
          })}
      </Svg>

      {/* 4. Floating Diagnostic Pill at Top: Climber: {count} joints | Tracked: {boolean} */}
      <View style={styles.topHudContainer}>
        <View style={[styles.diagnosticPill, hasClimber && styles.diagnosticPillActive]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: hasClimber ? CONTACT_LIME : '#8A8A98' },
            ]}
          />
          <Text style={[styles.diagnosticText, hasClimber && styles.diagnosticTextActive]}>
            Climber: {jointCount} joints | Tracked: {hasClimber ? 'true' : 'false'}
          </Text>
        </View>

        {isHandOnHold && (
          <View style={styles.contactPill}>
            <Text style={styles.contactText}>
              ✋ {activeHoldIntersections} HOLD{activeHoldIntersections > 1 ? 'S' : ''} CONTACT
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topHudContainer: {
    position: 'absolute',
    top: 104,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagnosticPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 14, 20, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 6,
  },
  diagnosticPillActive: {
    backgroundColor: 'rgba(142, 124, 255, 0.18)',
    borderColor: 'rgba(142, 124, 255, 0.50)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  diagnosticText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#8A8A98',
  },
  diagnosticTextActive: {
    color: '#FFFFFF',
  },
  contactPill: {
    backgroundColor: 'rgba(110, 231, 86, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 86, 0.50)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contactText: {
    color: CONTACT_LIME,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
