export interface Keypoint {
  name: string;
  x: number; // Normalized [0.0, 1.0]
  y: number; // Normalized [0.0, 1.0]
  score: number; // Confidence [0.0, 1.0]
}

export interface FramePoseSample {
  timestampMs: number;
  keypoints: Keypoint[];
}

export interface GradingEvaluationResult {
  isValidClimb: boolean;
  rejectionReason?: 'NO_HUMAN_DETECTED' | 'NO_VERTICAL_DISPLACEMENT' | 'INSUFFICIENT_DURATION';
  confidenceScore: number;
  peakElevationDelta: number;
  cruxTimestampMs?: number;
  metrics?: {
    totalFramesAnalyzed: number;
    validHumanFrames: number;
    hangTimeSeconds: number;
  };
}

const MIN_KEYPOINT_CONFIDENCE = 0.60;
const REQUIRED_HUMAN_FRAME_RATIO = 0.65;
const MIN_CLIMBING_DISPLACEMENT_Y = 0.18; // >18% frame vertical translation
const MIN_CLIMBING_DURATION_MS = 2500;

export class VideoGradingService {
  public static evaluateClimbValidity(samples: FramePoseSample[], actualDurationMs?: number): GradingEvaluationResult {
    const effectiveDurationMs = actualDurationMs ?? (
      samples && samples.length >= 2 
        ? samples[samples.length - 1].timestampMs - samples[0].timestampMs 
        : 0
    );

    if (effectiveDurationMs < MIN_CLIMBING_DURATION_MS) {
      return {
        isValidClimb: false,
        rejectionReason: 'INSUFFICIENT_DURATION',
        confidenceScore: 0,
        peakElevationDelta: 0,
      };
    }

    if (!samples || samples.length < 4) {
      return {
        isValidClimb: false,
        rejectionReason: 'NO_HUMAN_DETECTED',
        confidenceScore: 0,
        peakElevationDelta: 0,
      };
    }

    const totalFrames = samples.length;
    let validHumanFrames = 0;
    const hipElevations: { time: number; y: number }[] = [];

    // Gate 1: Anatomical human presence validation
    for (const frame of samples) {
      const validPoints = frame.keypoints.filter((kp) => kp.score >= MIN_KEYPOINT_CONFIDENCE);

      const hasTorso =
        validPoints.some((p) => p.name.includes('shoulder')) &&
        validPoints.some((p) => p.name.includes('hip'));

      const limbCount = validPoints.filter((p) =>
        p.name.includes('wrist') ||
        p.name.includes('ankle') ||
        p.name.includes('knee') ||
        p.name.includes('elbow')
      ).length;

      if (hasTorso && limbCount >= 3 && validPoints.length >= 8) {
        validHumanFrames++;
        const hips = validPoints.filter((p) => p.name.includes('hip'));
        const avgHipY = hips.reduce((acc, h) => acc + h.y, 0) / hips.length;
        hipElevations.push({ time: frame.timestampMs, y: avgHipY });
      }
    }

    const humanRatio = validHumanFrames / totalFrames;
    if (humanRatio < REQUIRED_HUMAN_FRAME_RATIO) {
      return {
        isValidClimb: false,
        rejectionReason: 'NO_HUMAN_DETECTED',
        confidenceScore: Number(humanRatio.toFixed(2)),
        peakElevationDelta: 0,
      };
    }

    // Gate 2: Bouldering Kinematics Validation (Vertical Ascent)
    if (hipElevations.length < 5) {
      return {
        isValidClimb: false,
        rejectionReason: 'NO_VERTICAL_DISPLACEMENT',
        confidenceScore: Number(humanRatio.toFixed(2)),
        peakElevationDelta: 0,
      };
    }

    const lowestY = Math.max(...hipElevations.map((h) => h.y));
    const highestY = Math.min(...hipElevations.map((h) => h.y));
    const verticalDelta = lowestY - highestY;
    const cruxPoint = hipElevations.find((h) => h.y === highestY);

    if (effectiveDurationMs < MIN_CLIMBING_DURATION_MS) {
      return {
        isValidClimb: false,
        rejectionReason: 'INSUFFICIENT_DURATION',
        confidenceScore: Number(humanRatio.toFixed(2)),
        peakElevationDelta: Number(verticalDelta.toFixed(2)),
      };
    }

    if (verticalDelta < MIN_CLIMBING_DISPLACEMENT_Y) {
      return {
        isValidClimb: false,
        rejectionReason: 'NO_VERTICAL_DISPLACEMENT',
        confidenceScore: Number(humanRatio.toFixed(2)),
        peakElevationDelta: Number(verticalDelta.toFixed(2)),
      };
    }

    return {
      isValidClimb: true,
      confidenceScore: Number(humanRatio.toFixed(2)),
      peakElevationDelta: Number(verticalDelta.toFixed(2)),
      cruxTimestampMs: cruxPoint?.time,
      metrics: {
        totalFramesAnalyzed: totalFrames,
        validHumanFrames,
        hangTimeSeconds: Number((effectiveDurationMs / 1000).toFixed(1)),
      },
    };
  }
}
