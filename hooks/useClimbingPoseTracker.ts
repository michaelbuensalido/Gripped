import { useState, useEffect, useRef, useCallback, DependencyList } from 'react';
import { Platform } from 'react-native';
import {
  VisionCameraProxy,
  Frame,
  useFrameProcessor,
  type ReadonlyFrameProcessor,
} from 'react-native-vision-camera';
import {
  Worklets,
  useSharedValue as useWorkletsSharedValue,
  useRunOnJS as useWorkletsRunOnJS,
} from 'react-native-worklets-core';

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
 * At 30 FPS, skipping 2 of every 3 frames yields ~10 FPS of ML inference.
 * This prevents buffer starvation, overheating, and frame processor thread lag.
 */
export const FRAME_SKIP_INTERVAL = 3; // 1 in 3 frames -> ~10 FPS at 30 FPS input

export const RECOMMENDED_FRAME_WIDTH  = 720;
export const RECOMMENDED_FRAME_HEIGHT = 1280;

/**
 * Recommended camera format & pipeline settings for real-time vision processing.
 * - pixelFormat: 'yuv' on Android, 'rgb' or 'native' on iOS.
 * - enableBufferCompression: true (keeps memory bandwidth minimal).
 */
export const RECOMMENDED_CAMERA_CONFIG = {
  pixelFormat: Platform.OS === 'android' ? ('yuv' as const) : ('native' as const),
  enableBufferCompression: true,
  fps: 30,
  targetWidth: RECOMMENDED_FRAME_WIDTH,
  targetHeight: RECOMMENDED_FRAME_HEIGHT,
};

// Diagnostic log throttle interval: emit once per 2 seconds to avoid flooding the console.
const DIAGNOSTIC_LOG_INTERVAL_MS = 2000;

// Default target holds for climbing wall simulation (Start, Crux, Finish)
const DEFAULT_SIMULATED_HOLDS: TargetHold[] = [
  { x: 0.42, y: 0.72, radius: 0.065 }, // Start Hold Left
  { x: 0.58, y: 0.68, radius: 0.065 }, // Start Hold Right
  { x: 0.48, y: 0.42, radius: 0.070 }, // Crux Hold
  { x: 0.52, y: 0.20, radius: 0.075 }, // Top / Finish Hold
];

// ── Native Frame Processor Plugin Initialization ──────────────────────────────
let nativePosePlugin: any = null;
try {
  if (VisionCameraProxy?.initFrameProcessorPlugin) {
    nativePosePlugin = VisionCameraProxy.initFrameProcessorPlugin('detectClimbingPose', {});
  }
} catch {
  // Gracefully handle environments where VisionCamera native JSI bindings are not loaded (e.g. Expo Go)
  nativePosePlugin = null;
}

/**
 * Direct worklet invocation of the native ClimbingPoseTrackerPlugin.
 */
export function detectClimbingPose(frame: Frame): {
  hasClimber: boolean;
  landmarks: Record<string, LandmarkPoint>;
} {
  'worklet';
  if (nativePosePlugin == null) {
    throw new Error('Native Frame Processor Plugin "detectClimbingPose" is not loaded.');
  }
  return nativePosePlugin.call(frame) as {
    hasClimber: boolean;
    landmarks: Record<string, LandmarkPoint>;
  };
}

/**
 * JS-thread error logger for frame processor worklet errors.
 */
export function logFrameProcessorError(message: string): void {
  console.warn('[PoseTracker][FrameProcessor] Native detection error:', message);
}

// ── Worklet Fallback Helpers for Expo Go / Simulator ──────────────────────────
const isWorkletsNative = typeof globalThis !== 'undefined' && (globalThis as any).Worklets != null;

function useSafeSharedValue<T>(initialValue: T) {
  const fallbackRef = useRef({ value: initialValue });
  if (isWorkletsNative) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useWorkletsSharedValue(initialValue);
  }
  return fallbackRef.current;
}

function useSafeRunOnJS<T extends (...args: any[]) => any>(callback: T, deps: DependencyList) {
  if (isWorkletsNative) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useWorkletsRunOnJS(callback, deps);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps);
}

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
  minConfidence: number = 0.20
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
  minConfidence = 0.2, // Matches native plugin kMinJointConfidence / kMinLandmarkConfidence
  enableSimulatorSimulation = false,
  onHandContactChange,
}: UseClimbingPoseTrackerOptions = {}) {
  const [poseState, setPoseState] = useState<PoseTrackingState>(DEFAULT_INITIAL_STATE);
  const previousContactRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
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

  // ── Throttled Worklet Frame Processor Pipeline ──────────────────────────────
  // Frame skipping: processes ~10-12 FPS (1 in 3 frames) to prevent ML buffer starvation
  const frameCount = useSafeSharedValue(0);

  const safeRunUpdate = useSafeRunOnJS(
    (landmarks: Record<string, LandmarkPoint>, climberPresent: boolean) => {
      updatePoseState(landmarks, climberPresent);
    },
    [updatePoseState]
  );

  const safeRunError = useSafeRunOnJS((msg: string) => {
    logFrameProcessorError(msg);
  }, []);

  const frameProcessor: ReadonlyFrameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';
      if (!enabled) return;

      // Throttle: process 1 in 3 frames (~10-12 FPS)
      frameCount.value = (frameCount.value + 1) % FRAME_SKIP_INTERVAL;
      if (frameCount.value !== 0) return;

      try {
        if (nativePosePlugin != null) {
          const result = nativePosePlugin.call(frame) as {
            hasClimber: boolean;
            landmarks: Record<string, LandmarkPoint>;
          };
          if (result && result.landmarks) {
            safeRunUpdate(result.landmarks, Boolean(result.hasClimber));
          }
        }
      } catch (err: any) {
        safeRunError(err?.message ?? String(err));
      }
    },
    [enabled, frameCount, safeRunUpdate, safeRunError]
  );

  // ── Simulator / Demo Kinematic Simulation Loop ─────────────────────────────
  useEffect(() => {
    if (!enabled || !enableSimulatorSimulation) {
      if (!enabled) {
        setPoseState(DEFAULT_INITIAL_STATE);
      }
      return;
    }

    let startTime = Date.now();

    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const cycle = elapsed % 6.0;
      const progress = cycle / 6.0;

      const baseY = 0.70 - progress * 0.38;
      const sway = Math.sin(cycle * 2.2) * 0.035;

      const hipX = 0.50 + sway;
      const hipY = baseY;

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

      let leftHandTarget = { x: 0.42, y: 0.72 };
      let rightHandTarget = { x: 0.58, y: 0.68 };

      if (cycle >= 2.0 && cycle < 4.2) {
        const reachT = (cycle - 2.0) / 2.2;
        rightHandTarget = {
          x: 0.58 + (0.48 - 0.58) * Math.min(1.0, reachT * 1.3),
          y: 0.68 + (0.42 - 0.68) * Math.min(1.0, reachT * 1.3),
        };
      } else if (cycle >= 4.2) {
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
    frameProcessor,
    cameraConfig: RECOMMENDED_CAMERA_CONFIG,
  };
}
