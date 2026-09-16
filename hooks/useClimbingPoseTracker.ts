import { useState, useEffect, useRef, useCallback, useMemo, DependencyList } from 'react';
import { Platform } from 'react-native';
import type {
  Frame,
  ReadonlyFrameProcessor,
} from 'react-native-vision-camera';

export interface LandmarkPoint {
  x: number;          // Normalized 0.0 - 1.0 (top-left origin)
  y: number;          // Normalized 0.0 - 1.0 (top-left origin)
  confidence: number; // 0.0 - 1.0
}

export type ClimbingLandmarkName =
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftWrist'
  | 'rightWrist'
  | 'leftHip'
  | 'rightHip'
  | 'leftKnee'
  | 'rightKnee'
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
  minConfidence?: number;            // Minimum landmark confidence (default: 0.25 — lowered for contorted climbers facing wall)
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

// ── Safe Dynamic Module Resolution for Expo Go vs. Dev Client ─────────────────
// react-native-vision-camera and react-native-worklets-core contain C++ native JSI modules.
// If statically imported in Expo Go, they throw uncaught exceptions at module evaluation time.
// We safely detect if custom native modules are available before loading them.
const isExpoGo =
  typeof globalThis !== 'undefined' &&
  (globalThis as any).expo?.modules?.ExponentConstants?.appOwnership === 'expo';

let visionCameraModule: typeof import('react-native-vision-camera') | null = null;
let workletsModule: typeof import('react-native-worklets-core') | null = null;
let nativePosePlugin: any = null;

if (!isExpoGo) {
  try {
    visionCameraModule = require('react-native-vision-camera');
  } catch {
    visionCameraModule = null;
  }

  try {
    workletsModule = require('react-native-worklets-core');
  } catch {
    workletsModule = null;
  }

  if (visionCameraModule?.VisionCameraProxy?.initFrameProcessorPlugin) {
    try {
      nativePosePlugin = visionCameraModule.VisionCameraProxy.initFrameProcessorPlugin(
        'detectClimbingPose',
        {}
      );
    } catch {
      nativePosePlugin = null;
    }
  }
}

const hasNativeVisionPipeline = Boolean(
  visionCameraModule?.useFrameProcessor &&
  workletsModule?.useSharedValue &&
  workletsModule?.useRunOnJS
);

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

// ── Native Vision Frame Processor Hook Implementation ─────────────────────────
function useClimbingPoseTrackerNative({
  enabled = true,
  targetHolds = DEFAULT_SIMULATED_HOLDS,
  contactDistanceThreshold = 0.08,
  minConfidence = 0.25,
  enableSimulatorSimulation = false,
  onHandContactChange,
}: UseClimbingPoseTrackerOptions = {}) {
  const [poseState, setPoseState] = useState<PoseTrackingState>(DEFAULT_INITIAL_STATE);
  const previousContactRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastDiagnosticLogRef = useRef<number>(0);

  const updatePoseState = useCallback(
    (rawLandmarks: Record<string, LandmarkPoint>, hasClimber: boolean) => {
      // 1. Strict confidence & stale state check
      const validLandmarksCount = Object.values(rawLandmarks).filter(
        (pt) => pt && pt.confidence >= minConfidence
      ).length;
      
      // 2. Minimum Keypoints Requirement (require at least 6 joints to render a skeleton)
      let verifiedClimber = hasClimber && validLandmarksCount >= 6;
      
      // Strict Core Anatomical Gate (prevent hallucinating skeletons on random walls)
      if (verifiedClimber) {
        const lS = rawLandmarks.leftShoulder?.confidence >= 0.50;
        const rS = rawLandmarks.rightShoulder?.confidence >= 0.50;
        const lH = rawLandmarks.leftHip?.confidence >= 0.50;
        const rH = rawLandmarks.rightHip?.confidence >= 0.50;
        
        // Must detect a stable torso (at least one shoulder and one hip with solid confidence)
        if (!(lS || rS) || !(lH || rH)) {
          verifiedClimber = false;
        }
      }

      // 3. IMMEDIATELY clear state if no verified climber is found
      if (!verifiedClimber || Object.keys(rawLandmarks).length === 0) {
        setPoseState({
          hasClimber: false,
          landmarks: {},
          isHandOnHold: false,
          activeHoldIntersections: 0,
        });
        
        if (previousContactRef.current !== false) {
          previousContactRef.current = false;
          onHandContactChange?.(false, 0);
        }
        return;
      }

      const { isHandOnHold, activeHoldIntersections } = evaluateHoldContacts(
        rawLandmarks,
        targetHolds,
        contactDistanceThreshold,
        minConfidence
      );

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

  // Native Worklets frame skipping
  const frameCount = workletsModule!.useSharedValue(0);

  const safeRunUpdate = workletsModule!.useRunOnJS(
    (landmarks: Record<string, LandmarkPoint>, climberPresent: boolean) => {
      updatePoseState(landmarks, climberPresent);
    },
    [updatePoseState]
  );

  const safeRunError = workletsModule!.useRunOnJS((msg: string) => {
    logFrameProcessorError(msg);
  }, []);

  const frameProcessor = visionCameraModule!.useFrameProcessor(
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
          if (!result || !result.hasClimber || !result.landmarks || Object.keys(result.landmarks).length === 0) {
            safeRunUpdate({}, false);
          } else {
            safeRunUpdate(result.landmarks, true);
          }
        }
      } catch (err: any) {
        safeRunError(err?.message ?? String(err));
      }
    },
    [enabled, frameCount, safeRunUpdate, safeRunError]
  );

  // Simulation loop fallback if requested
  useSimulatorSimulation(
    enabled && enableSimulatorSimulation,
    updatePoseState,
    setPoseState,
    animationFrameRef
  );

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

// ── Expo Go / Web / Simulator Hook Implementation ─────────────────────────────
function useClimbingPoseTrackerExpoGo({
  enabled = true,
  targetHolds = DEFAULT_SIMULATED_HOLDS,
  contactDistanceThreshold = 0.08,
  minConfidence = 0.25,
  enableSimulatorSimulation = false,
  onHandContactChange,
}: UseClimbingPoseTrackerOptions = {}) {
  const [poseState, setPoseState] = useState<PoseTrackingState>(DEFAULT_INITIAL_STATE);
  const previousContactRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastDiagnosticLogRef = useRef<number>(0);

  const updatePoseState = useCallback(
    (rawLandmarks: Record<string, LandmarkPoint>, hasClimber: boolean) => {
      // 1. Strict confidence & stale state check
      const validLandmarksCount = Object.values(rawLandmarks).filter(
        (pt) => pt && pt.confidence >= minConfidence
      ).length;
      
      // 2. Minimum Keypoints Requirement (require at least 6 joints to render a skeleton)
      let verifiedClimber = hasClimber && validLandmarksCount >= 6;
      
      // Strict Core Anatomical Gate (prevent hallucinating skeletons on random walls)
      if (verifiedClimber) {
        const lS = rawLandmarks.leftShoulder?.confidence >= 0.50;
        const rS = rawLandmarks.rightShoulder?.confidence >= 0.50;
        const lH = rawLandmarks.leftHip?.confidence >= 0.50;
        const rH = rawLandmarks.rightHip?.confidence >= 0.50;
        
        // Must detect a stable torso (at least one shoulder and one hip with solid confidence)
        if (!(lS || rS) || !(lH || rH)) {
          verifiedClimber = false;
        }
      }

      // 3. IMMEDIATELY clear state if no verified climber is found
      if (!verifiedClimber || Object.keys(rawLandmarks).length === 0) {
        setPoseState({
          hasClimber: false,
          landmarks: {},
          isHandOnHold: false,
          activeHoldIntersections: 0,
        });
        
        if (previousContactRef.current !== false) {
          previousContactRef.current = false;
          onHandContactChange?.(false, 0);
        }
        return;
      }

      const { isHandOnHold, activeHoldIntersections } = evaluateHoldContacts(
        rawLandmarks,
        targetHolds,
        contactDistanceThreshold,
        minConfidence
      );

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

  // Safe dummy frame processor for Expo Go
  const dummyFrameProcessor = useMemo<ReadonlyFrameProcessor>(
    () => ({
      frameProcessor: () => {},
      type: 'readonly' as const,
    }),
    []
  );

  // Simulation loop for testing & demo in Expo Go / simulator
  useSimulatorSimulation(
    enabled && enableSimulatorSimulation,
    updatePoseState,
    setPoseState,
    animationFrameRef
  );

  const resetTracker = useCallback(() => {
    setPoseState(DEFAULT_INITIAL_STATE);
    previousContactRef.current = false;
  }, []);

  return {
    poseState,
    updatePoseState,
    resetTracker,
    frameProcessor: dummyFrameProcessor,
    cameraConfig: RECOMMENDED_CAMERA_CONFIG,
  };
}

// ── Reusable Kinematic Climber Simulation ──────────────────────────────────────
function useSimulatorSimulation(
  active: boolean,
  updatePoseState: (landmarks: Record<string, LandmarkPoint>, hasClimber: boolean) => void,
  setPoseState: React.Dispatch<React.SetStateAction<PoseTrackingState>>,
  animationFrameRef: React.MutableRefObject<number | null>
) {
  useEffect(() => {
    if (!active) {
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

      const leftShoulder: LandmarkPoint = {
        x: Math.max(0.1, Math.min(0.9, leftHip.x - 0.04)),
        y: Math.max(0.1, hipY - 0.22),
        confidence: 0.94,
      };
      const rightShoulder: LandmarkPoint = {
        x: Math.max(0.1, Math.min(0.9, rightHip.x + 0.04)),
        y: Math.max(0.1, hipY - 0.22),
        confidence: 0.94,
      };

      const leftKnee: LandmarkPoint = {
        x: (leftHip.x + leftAnkle.x) / 2 - 0.02,
        y: (leftHip.y + leftAnkle.y) / 2,
        confidence: 0.92,
      };
      const rightKnee: LandmarkPoint = {
        x: (rightHip.x + rightAnkle.x) / 2 + 0.02,
        y: (rightHip.y + rightAnkle.y) / 2,
        confidence: 0.92,
      };

      const leftElbow: LandmarkPoint = {
        x: (leftWrist.x + leftShoulder.x) / 2 - 0.04,
        y: (leftWrist.y + leftShoulder.y) / 2 + 0.03,
        confidence: 0.92,
      };
      const rightElbow: LandmarkPoint = {
        x: (rightWrist.x + rightShoulder.x) / 2 + 0.04,
        y: (rightWrist.y + rightShoulder.y) / 2 + 0.03,
        confidence: 0.92,
      };

      const landmarks: Record<string, LandmarkPoint> = {
        leftShoulder,
        rightShoulder,
        leftElbow,
        rightElbow,
        leftWrist,
        rightWrist,
        leftHip,
        rightHip,
        leftKnee,
        rightKnee,
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
  }, [active, updatePoseState]);
}

// ── Exported Custom Hook ──────────────────────────────────────────────────────
const useClimbingPoseTrackerSelected = hasNativeVisionPipeline
  ? useClimbingPoseTrackerNative
  : useClimbingPoseTrackerExpoGo;

export function useClimbingPoseTracker(options?: UseClimbingPoseTrackerOptions) {
  return useClimbingPoseTrackerSelected(options);
}
