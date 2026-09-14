import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
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
// NEON PALETTE
// ─────────────────────────────────────────────────────────────────────────────
const NEON_LAVENDER  = '#8E7CFF'; // default joint / bone
const NEON_LIME      = '#6EE756'; // contact / hold active
const NEON_BONE_RGBA = 'rgba(142, 124, 255, 0.80)';
const NEON_BONE_DIM  = 'rgba(142, 124, 255, 0.40)';

interface PoseSkeletonOverlayProps {
  poseState: PoseTrackingState;
  targetHolds?: TargetHold[];
  width?: number;
  height?: number;
  showHoldZones?: boolean;
  /** Is the front-facing (selfie) camera active? Mirrors X coordinates. */
  isFrontCamera?: boolean;
  /**
   * Native camera frame pixel dimensions. Used to correct for cover-crop
   * when the viewfinder aspect ratio differs from the sensor aspect ratio.
   * Defaults to 720 × 1280 (recommended format for pose detection).
   */
  frameWidth?: number;
  frameHeight?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ─── Bone Segment Definitions ─────────────────────────────────────────────────
// Each tuple: [fromJoint, toJoint, isUpperBody]
// isUpperBody controls stroke weight/brightness — arms brighter than legs.
const BONE_SEGMENTS: [string, string, boolean][] = [
  ['leftWrist',  'leftElbow',  true],
  ['rightWrist', 'rightElbow', true],
  ['leftElbow',  'leftHip',    true],
  ['rightElbow', 'rightHip',   true],
  ['leftHip',    'rightHip',   false],
  ['leftHip',    'leftAnkle',  false],
  ['rightHip',   'rightAnkle', false],
];

// ─── Joint Role Classification ────────────────────────────────────────────────
const WRIST_KEYS = new Set(['leftWrist', 'rightWrist']);
const HIP_KEYS   = new Set(['leftHip',  'rightHip']);

export function PoseSkeletonOverlay({
  poseState,
  targetHolds = [],
  width  = screenWidth,
  height = screenHeight,
  showHoldZones = true,
  isFrontCamera  = false,
  frameWidth  = RECOMMENDED_FRAME_WIDTH,
  frameHeight = RECOMMENDED_FRAME_HEIGHT,
}: PoseSkeletonOverlayProps) {
  const { hasClimber, landmarks, isHandOnHold, activeHoldIntersections } = poseState;

  // ── Map every confident landmark to screen-space pixels ─────────────────────
  // Uses the cover-crop-aware coordinate transformer so joints render at the
  // correct position even when the camera sensor aspect ≠ view aspect.
  const pxLandmarks = useMemo<Record<string, ScreenPoint & { confidence: number }>>(() => {
    const result: Record<string, ScreenPoint & { confidence: number }> = {};
    for (const [key, pt] of Object.entries(landmarks) as [string, LandmarkPoint][]) {
      if (pt && pt.confidence >= 0.2) {
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
  }, [landmarks, width, height, frameWidth, frameHeight, isFrontCamera]);

  const jointCount = Object.keys(pxLandmarks).length;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── SVG: Bones, Joints, Hold Zones, Contact Halos ─────────────────── */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Radial halo for hand-on-hold contact */}
          <RadialGradient id="contactHalo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={NEON_LIME} stopOpacity="0.85" />
            <Stop offset="55%"  stopColor={NEON_LIME} stopOpacity="0.30" />
            <Stop offset="100%" stopColor={NEON_LIME} stopOpacity="0"    />
          </RadialGradient>

          {/* Soft radial glow around every joint */}
          <RadialGradient id="jointGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={NEON_LAVENDER} stopOpacity="0.50" />
            <Stop offset="100%" stopColor={NEON_LAVENDER} stopOpacity="0"    />
          </RadialGradient>

          {/* Glow for contacted holds */}
          <RadialGradient id="holdGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={NEON_LIME} stopOpacity="0.40" />
            <Stop offset="100%" stopColor={NEON_LIME} stopOpacity="0"    />
          </RadialGradient>
        </Defs>

        {/* ── 1. Target Hold Zones ─────────────────────────────────────────── */}
        {showHoldZones &&
          targetHolds.map((hold, idx) => {
            // Hold zones are in normalised space — scale by view dimensions directly
            // (hold zones are defined relative to the view, not the raw frame).
            const hx = hold.x * width;
            const hy = hold.y * height;
            const hr = (hold.radius ?? 0.08) * Math.min(width, height);

            const isContacted =
              isHandOnHold &&
              (
                (pxLandmarks.leftWrist  && Math.hypot(pxLandmarks.leftWrist.x  - hx, pxLandmarks.leftWrist.y  - hy) <= hr) ||
                (pxLandmarks.rightWrist && Math.hypot(pxLandmarks.rightWrist.x - hx, pxLandmarks.rightWrist.y - hy) <= hr)
              );

            return (
              <React.Fragment key={`hold-zone-${idx}`}>
                {/* Soft glow backdrop when contacted */}
                {isContacted && (
                  <Circle cx={hx} cy={hy} r={hr * 1.6} fill="url(#holdGlow)" />
                )}
                <Circle
                  cx={hx}
                  cy={hy}
                  r={hr}
                  stroke={isContacted ? NEON_LIME : 'rgba(142, 124, 255, 0.45)'}
                  strokeWidth={isContacted ? 2.5 : 1.5}
                  strokeDasharray={isContacted ? undefined : '5, 5'}
                  fill={isContacted ? 'rgba(110, 231, 86, 0.14)' : 'rgba(142, 124, 255, 0.05)'}
                />
              </React.Fragment>
            );
          })}

        {/* ── 2. Neon Skeleton Bone Segments ──────────────────────────────── */}
        {hasClimber &&
          BONE_SEGMENTS.map(([fromKey, toKey, isUpper], idx) => {
            const p1 = pxLandmarks[fromKey];
            const p2 = pxLandmarks[toKey];
            if (!p1 || !p2) return null;

            // Confidence-weighted opacity: dim low-confidence bones
            const avgConf = (p1.confidence + p2.confidence) / 2;
            const opacity = Math.min(1, 0.3 + avgConf * 0.7);
            const strokeColor = isUpper
              ? `rgba(142, 124, 255, ${opacity.toFixed(2)})`
              : `rgba(110, 231, 86, ${(opacity * 0.7).toFixed(2)})`;

            return (
              <React.Fragment key={`bone-${idx}`}>
                {/* Glowing wider stroke underneath for neon effect */}
                <Line
                  x1={p1.x} y1={p1.y}
                  x2={p2.x} y2={p2.y}
                  stroke={isUpper ? NEON_BONE_DIM : 'rgba(110, 231, 86, 0.20)'}
                  strokeWidth={7}
                  strokeLinecap="round"
                />
                {/* Bright inner stroke */}
                <Line
                  x1={p1.x} y1={p1.y}
                  x2={p2.x} y2={p2.y}
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </React.Fragment>
            );
          })}

        {/* ── 3. Joint Landmark Dots ───────────────────────────────────────── */}
        {hasClimber &&
          Object.entries(pxLandmarks).map(([key, pt]) => {
            const isWrist = WRIST_KEYS.has(key);
            const isHip   = HIP_KEYS.has(key);
            const onHold  = isWrist && isHandOnHold;

            const outerR = onHold ? 9 : isWrist ? 7 : isHip ? 6 : 5;
            const fillColor = onHold ? NEON_LIME : NEON_LAVENDER;

            return (
              <React.Fragment key={`joint-${key}`}>
                {/* Soft glow ring */}
                <Circle
                  cx={pt.x} cy={pt.y}
                  r={outerR + 8}
                  fill={onHold ? 'url(#holdGlow)' : 'url(#jointGlow)'}
                />
                {/* Contact halo pulse for hands on holds */}
                {onHold && (
                  <Circle cx={pt.x} cy={pt.y} r={30} fill="url(#contactHalo)" />
                )}
                {/* White outer ring for contrast */}
                <Circle
                  cx={pt.x} cy={pt.y}
                  r={outerR + 1.5}
                  fill="rgba(255,255,255,0.15)"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={1}
                />
                {/* Coloured core dot */}
                <Circle
                  cx={pt.x} cy={pt.y}
                  r={outerR}
                  fill={fillColor}
                />
              </React.Fragment>
            );
          })}
      </Svg>

      {/* ── 4. Real-Time HUD Status Chips ─────────────────────────────────── */}
      <View style={styles.hudContainer}>
        {/* Climber detection chip */}
        <View style={[styles.statusChip, hasClimber && styles.statusChipActive]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: hasClimber ? NEON_LIME : '#8A8A98' },
            ]}
          />
          <Text style={[styles.statusText, hasClimber && styles.statusTextActive]}>
            {hasClimber
              ? `CLIMBER  •  ${jointCount} PTS`
              : 'SEARCHING…'}
          </Text>
        </View>

        {/* Hand-on-hold contact chip */}
        <View style={[styles.statusChip, isHandOnHold && styles.contactChipActive]}>
          <Text
            style={[
              styles.statusText,
              isHandOnHold ? styles.contactTextActive : { color: '#8A8A98' },
            ]}
          >
            {isHandOnHold
              ? `✋ ${activeHoldIntersections} HOLD${activeHoldIntersections > 1 ? 'S' : ''}`
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
    backgroundColor: 'rgba(14, 14, 20, 0.80)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    gap: 6,
  },
  statusChipActive: {
    backgroundColor: 'rgba(110, 231, 86, 0.12)',
    borderColor: 'rgba(110, 231, 86, 0.45)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#8A8A98',
  },
  statusTextActive: {
    color: NEON_LIME,
  },
  contactChipActive: {
    backgroundColor: 'rgba(110, 231, 86, 0.12)',
    borderColor: 'rgba(110, 231, 86, 0.45)',
  },
  contactTextActive: {
    color: NEON_LIME,
    fontWeight: '800',
  },
});

export { ClimberSkeletonOverlay } from './ClimberSkeletonOverlay';

