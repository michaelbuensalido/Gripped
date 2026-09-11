import { useState, useEffect, useRef, useCallback } from 'react';

export interface LandmarkPoint {
  x: number;          // Normalized 0.0 - 1.0 (top-left origin)
  y: number;          // Normalized 0.0 - 1.0 (top-left origin)
  confidence: number; // 0.0 - 1.0
}

export type ClimbingLandmarkName =
  | 'leftWrist'
  | 'rightWrist'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftHip'
  | 'rightHip'
  | 'leftAnkle'
  | 'rightAnkle';

export interface PoseTrackingState {
  hasClimber: boolean;
  landmarks: Record<string, LandmarkPoint>;
  isHandOnHold: boolean;
  activeHoldIntersections: number;
}

export interface TargetHold {
  x: number;
  y: number;
  radius?: number;
  id?: string | number;
}

export interface UseClimbingPoseTrackerOptions {
  enabled?: boolean;
  targetHolds?: TargetHold[];
  contactDistanceThreshold?: number; // Normalized threshold (default: 0.08 ~ 8% of viewport)
  minConfidence?: number;            // Minimum landmark confidence (default: 0.2 — lowered for back-body climbing pose)
  enableSimulatorSimulation?: boolean; // Generates realistic kinematic climber motion in simulator/demo
  onHandContactChange?: (isContacting: boolean, contactCount: number) => void;
}

const DEFAULT_INITIAL_STATE: PoseTrackingState = {
  hasClimber: false,
  landmarks: {},
  isHandOnHold: false,
  activeHoldIntersections: 0,
};

// ── Frame Processor Pipeline Constants ────────────────────────────────────────

/**
 * Process every Nth frame from the camera feed.
 *
 * At 30 FPS, skipping 2 of every 3 frames yields ~10 FPS of ML inference.
 * This prevents buffer starvation and thread lag that cause missed detections.
 *
 * Usage in a worklet frame processor (with react-native-worklets-core):
 *
 *   const frameCount = useSharedValue(0);
 *   const frameProcessor = useFrameProcessor((frame) => {
 *     'worklet';
 *     frameCount.value = (frameCount.value + 1) % FRAME_SKIP_INTERVAL;
 *     if (frameCount.value !== 0) return;   // ← skip 2 of 3 frames
 *     try {
 *       const result = detectClimbingPose(frame);
 *       runOnJS(updatePoseState)(result.landmarks, result.hasClimber);
 *     } catch (e) {
 *       runOnJS(logFrameError)(String(e));
 *     }
 *   }, [frameCount]);
 */
export const FRAME_SKIP_INTERVAL = 3; // Process 1 in 3 frames → ~10 FPS at 30 FPS

/**
 * Recommended camera format constraints for reliable pose detection.
 * 4K buffers saturate the ML thread; 720p is the sweet spot for real-time inference.
 */
export const RECOMMENDED_FRAME_WIDTH  = 720;
export const RECOMMENDED_FRAME_HEIGHT = 1280;

/**
 * JS-thread error logger for frame processor worklet errors.
 * Call via `runOnJS(logFrameProcessorError)(errorMessage)` from inside a worklet.
 *
 * @param message  String-coerced error from the worklet catch block.
 */
export function logFrameProcessorError(message: string): void {
  console.warn('[PoseTracker][FrameProcessor] Native detection error:', message);
}

// Diagnostic log throttle interval: emit once per 2 seconds to avoid flooding the console.
const DIAGNOSTIC_LOG_INTERVAL_MS = 2000;



// Default target holds for climbing wall simulation (Start, Crux, Finish)
const DEFAULT_SIMULATED_HOLDS: TargetHold[] = [
  { x: 0.42, y: 0.72, radius: 0.065 }, // Start Hold Left
  { x: 0.58, y: 0.68, radius: 0.065 }, // Start Hold Right
  { x: 0.48, y: 0.42, radius: 0.070 }, // Crux Hold
  { x: 0.52, y: 0.20, radius: 0.075 }, // Top / Finish Hold
];

/**
 * Calculates Euclidean distance between two normalized 2D points.
 */
export function calculatePointDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Evaluates whether any hand landmarks (leftWrist / rightWrist) intersect with target holds.
 */
export function evaluateHoldContacts(
  landmarks: Record<string, LandmarkPoint>,
  targetHolds: TargetHold[],
  threshold: number = 0.08,
  minConfidence: number = 0.25
): { isHandOnHold: boolean; activeHoldIntersections: number; contactingHoldIds: (string | number)[] } {
  let isHandOnHold = false;
  let activeHoldIntersections = 0;
  const contactingHoldIds: (string | number)[] = [];

  const rawHands = [landmarks.leftWrist, landmarks.rightWrist];
  const hands: LandmarkPoint[] = rawHands.filter(
    (h): h is LandmarkPoint => h !== undefined && h.confidence >= minConfidence
  );

  if (hands.length === 0 || targetHolds.length === 0) {
    return { isHandOnHold: false, activeHoldIntersections: 0, contactingHoldIds: [] };
  }

  for (const hold of targetHolds) {
    const contactRadius = hold.radius ?? threshold;
    let holdTouched = false;

    for (const hand of hands) {
      const dist = calculatePointDistance(hand, hold);
      if (dist <= contactRadius) {
        isHandOnHold = true;
        holdTouched = true;
        break;
      }
    }

    if (holdTouched) {
      activeHoldIntersections += 1;
      if (hold.id !== undefined) contactingHoldIds.push(hold.id);
    }
  }

  return { isHandOnHold, activeHoldIntersections, contactingHoldIds };
}

/**
 * Custom Hook: Real-Time On-Device Climbing Pose & Hand-Hold Contact Tracker.
 *
 * Consumes native frame processor frames (Apple Vision on iOS, Google ML Kit on Android)
 * via react-native-vision-camera, or runs kinematic simulation in development/simulator environments.
 */
export function useClimbingPoseTracker({
  enabled = true,
  targetHolds = DEFAULT_SIMULATED_HOLDS,
  contactDistanceThreshold = 0.08,
  minConfidence = 0.2,  // Matches native plugin kMinJointConfidence / kMinLandmarkConfidence
  enableSimulatorSimulation = false,
  onHandContactChange,
}: UseClimbingPoseTrackerOptions = {}) {
  const [poseState, setPoseState] = useState<PoseTrackingState>(DEFAULT_INITIAL_STATE);
  const previousContactRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  // Tracks the last time we emitted a diagnostic console log (throttled to 1 per 2s)
  const lastDiagnosticLogRef = useRef<number>(0);

  // Synchronous update handler with change detection
  const updatePoseState = useCallback(
    (
      rawLandmarks: Record<string, LandmarkPoint>,
      hasClimber: boolean
    ) => {
      const validLandmarksCount = Object.values(rawLandmarks).filter(
        (pt) => pt && pt.confidence >= minConfidence
      ).length;
      const verifiedClimber = hasClimber && validLandmarksCount >= 2;

      const { isHandOnHold, activeHoldIntersections } = evaluateHoldContacts(
        rawLandmarks,
        targetHolds,
        contactDistanceThreshold,
        minConfidence
      );

      // ── Throttled diagnostic logging ──────────────────────────────────────────
      // Emits once every 2 seconds so the console stays readable during 60fps processing.
      const now = Date.now();
      if (now - lastDiagnosticLogRef.current >= DIAGNOSTIC_LOG_INTERVAL_MS) {
        lastDiagnosticLogRef.current = now;
        console.log(
          '[PoseTracker] Tracked joints count:',
          Object.keys(rawLandmarks).length,
          '| Confident joints:',
          validLandmarksCount,
          '| HasClimber:',
          verifiedClimber,
          '| HandOnHold:',
          verifiedClimber ? isHandOnHold : false
        );
      }

      setPoseState({
        hasClimber: verifiedClimber,
        landmarks: rawLandmarks,
        isHandOnHold: verifiedClimber ? isHandOnHold : false,
        activeHoldIntersections: verifiedClimber ? activeHoldIntersections : 0,
      });

      if (previousContactRef.current !== (verifiedClimber ? isHandOnHold : false)) {
        previousContactRef.current = verifiedClimber ? isHandOnHold : false;
        onHandContactChange?.(
          verifiedClimber ? isHandOnHold : false,
          verifiedClimber ? activeHoldIntersections : 0
        );
      }
    },
    [targetHolds, contactDistanceThreshold, minConfidence, onHandContactChange]
  );

  // ── Simulator / Demo Kinematic Simulation Loop ─────────────────────────────
  // Simulates realistic climbing movement when hardware camera is unavailable or in simulator
  useEffect(() => {
    if (!enabled || !enableSimulatorSimulation) {
      setPoseState(DEFAULT_INITIAL_STATE);
      return;
    }

    let startTime = Date.now();

    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Cycle a climbing movement burn every 6 seconds:
      // Phase 1 (0-2s): Mount wall & grasp start holds
      // Phase 2 (2-4s): Reach up to crux hold
      // Phase 3 (4-6s): Match and top out
      const cycle = elapsed % 6.0;
      const progress = cycle / 6.0;

      // Base body position climbing upward
      const baseY = 0.70 - progress * 0.38;
      const sway = Math.sin(cycle * 2.2) * 0.035;

      const hipX = 0.50 + sway;
      const hipY = baseY;

      // Left & right hips
      const leftHip: LandmarkPoint = {
        x: Math.max(0.1, Math.min(0.9, hipX - 0.08)),
        y: hipY,
        confidence: 0.95,
      };
      const rightHip: LandmarkPoint = {
        x: Math.max(0.1, Math.min(0.9, hipX + 0.08)),
        y: hipY,
        confidence: 0.95,
      };

      // Ankles placed on wall holds below hips
      const leftAnkle: LandmarkPoint = {
        x: Math.max(0.1, Math.min(0.9, leftHip.x - 0.05 + Math.sin(cycle * 1.5) * 0.02)),
        y: Math.min(0.92, hipY + 0.22),
        confidence: 0.90,
      };
      const rightAnkle: LandmarkPoint = {
        x: Math.max(0.1, Math.min(0.9, rightHip.x + 0.05 - Math.sin(cycle * 1.5) * 0.02)),
        y: Math.min(0.94, hipY + 0.24),
        confidence: 0.90,
      };

      // Hands reaching between holds
      let leftHandTarget = { x: 0.42, y: 0.72 }; // Start
      let rightHandTarget = { x: 0.58, y: 0.68 }; // Start

      if (cycle >= 2.0 && cycle < 4.2) {
        // Reaching for crux
        const reachT = (cycle - 2.0) / 2.2;
        rightHandTarget = {
          x: 0.58 + (0.48 - 0.58) * Math.min(1.0, reachT * 1.3),
          y: 0.68 + (0.42 - 0.68) * Math.min(1.0, reachT * 1.3),
        };
      } else if (cycle >= 4.2) {
        // Reaching for finish hold
        const finishT = (cycle - 4.2) / 1.8;
        leftHandTarget = {
          x: 0.42 + (0.50 - 0.42) * Math.min(1.0, finishT * 1.2),
          y: 0.72 + (0.22 - 0.72) * Math.min(1.0, finishT * 1.2),
        };
        rightHandTarget = {
          x: 0.48 + (0.54 - 0.48) * Math.min(1.0, finishT * 1.2),
          y: 0.42 + (0.20 - 0.42) * Math.min(1.0, finishT * 1.2),
        };
      }

      const leftWrist: LandmarkPoint = {
        x: leftHandTarget.x + Math.sin(cycle * 4) * 0.008,
        y: leftHandTarget.y + Math.cos(cycle * 4) * 0.008,
        confidence: 0.96,
      };
      const rightWrist: LandmarkPoint = {
        x: rightHandTarget.x + Math.cos(cycle * 4) * 0.008,
        y: rightHandTarget.y + Math.sin(cycle * 4) * 0.008,
        confidence: 0.96,
      };

      // Elbows anatomically between hands and shoulders/hips
      const leftElbow: LandmarkPoint = {
        x: (leftWrist.x + leftHip.x) / 2 - 0.06,
        y: (leftWrist.y + leftHip.y) / 2 + 0.04,
        confidence: 0.92,
      };
      const rightElbow: LandmarkPoint = {
        x: (rightWrist.x + rightHip.x) / 2 + 0.06,
        y: (rightWrist.y + rightHip.y) / 2 + 0.04,
        confidence: 0.92,
      };

      const landmarks: Record<string, LandmarkPoint> = {
        leftWrist,
        rightWrist,
        leftElbow,
        rightElbow,
        leftHip,
        rightHip,
        leftAnkle,
        rightAnkle,
      };

      updatePoseState(landmarks, true);
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, enableSimulatorSimulation, updatePoseState]);

  const resetTracker = useCallback(() => {
    setPoseState(DEFAULT_INITIAL_STATE);
    previousContactRef.current = false;
  }, []);

  return {
    poseState,
    updatePoseState,
    resetTracker,
  };
}
