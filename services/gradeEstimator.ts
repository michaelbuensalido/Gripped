import { GRADES, GRADE_BY_LABEL } from '../constants/grades';

export type WallCategory =
  | 'Slab / Vertical'
  | 'Slight Overhang'
  | 'Steep Cave / Roof'
  | 'Horizontal Roof';

export interface WallAngleInfo {
  angleDegrees: number;
  category: WallCategory;
  shortBadge: string;
}

export type HoldType = 'start' | 'hand' | 'crux' | 'top' | 'foot';

export interface HoldMarker {
  id: string;
  x: number; // Normalized coordinate [0..1]
  y: number; // Normalized coordinate [0..1]
  type: HoldType;
  order: number;
  label?: string;
  color?: string;
}

export interface RouteAnnotationPayload {
  wallAngleDegrees: number;
  holdCount: number;
  estimatedSpans: number[]; // Relative Euclidean distances [0..1]
  maxSpan: number;
  averageSpan: number;
  startPoint?: HoldMarker;
  topPoint?: HoldMarker;
  markers: HoldMarker[];
  routeColor?: string;
  imageUri: string;
}

export interface RouteGradeEstimation {
  estimatedGrade: string;
  confidence: number;
  tags: string[];
  angleDegrees: number;
  wallCategory: WallCategory;
  wallBadge: string;
  confidenceDescription: string;
  annotationSummary?: {
    holdCount: number;
    maxSpanCm: number;
    averageSpanCm: number;
    hasCrux: boolean;
    routeColor?: string;
  };
}

/**
 * Calculates Euclidean distances between sequentially ordered hold markers
 */
export function calculateDistancesBetweenPoints(markers: HoldMarker[]): number[] {
  if (!markers || markers.length < 2) return [];

  // Sort by sequence order
  const sorted = [...markers].sort((a, b) => a.order - b.order);
  const distances: number[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    distances.push(Math.round(dist * 1000) / 1000);
  }

  return distances;
}

/**
 * Converts a normalized span (0..1) into estimated real-world gym wall reach in centimeters
 * Assuming standard 3.8m vertical gym wall view
 */
export function spanToEstimatedCm(normalizedSpan: number): number {
  const estimatedWallHeightCm = 380;
  return Math.round(normalizedSpan * estimatedWallHeightCm);
}

/**
 * Maps pitch angle in degrees to climbing wall terminology
 * - 0° to 10°: "Slab / Vertical"
 * - 11° to 30°: "Slight Overhang"
 * - 31° to 50°: "Steep Cave / Roof"
 * - > 50°: "Horizontal Roof"
 */
export function getWallAngleCategory(angleDegrees: number): WallAngleInfo {
  const angle = Math.max(0, Math.min(90, Math.round(angleDegrees)));

  if (angle <= 10) {
    return {
      angleDegrees: angle,
      category: 'Slab / Vertical',
      shortBadge: `${angle}° Slab`,
    };
  }

  if (angle <= 30) {
    return {
      angleDegrees: angle,
      category: 'Slight Overhang',
      shortBadge: `${angle}° Overhang`,
    };
  }

  if (angle <= 50) {
    return {
      angleDegrees: angle,
      category: 'Steep Cave / Roof',
      shortBadge: `${angle}° Cave`,
    };
  }

  return {
    angleDegrees: angle,
    category: 'Horizontal Roof',
    shortBadge: `${angle}° Roof`,
  };
}

export interface EstimateRouteGradeParams {
  angleDegrees: number;
  userMedianGrade?: string;
  routeHoldDensity?: 'sparse' | 'normal' | 'dense';
  annotationPayload?: RouteAnnotationPayload;
}

/**
 * AI / Computer Vision Set Grader estimation engine
 * Predicts estimated V-grade, confidence, and hold profile tags
 * based on wall steepness, user median grade pyramid, and route layout.
 */
export function estimateRouteGrade({
  angleDegrees,
  userMedianGrade = 'V4',
  routeHoldDensity = 'normal',
  annotationPayload,
}: EstimateRouteGradeParams): RouteGradeEstimation {
  const wallInfo = getWallAngleCategory(angleDegrees);

  // Determine base difficulty from user's current median / target grade
  const baseDef = GRADE_BY_LABEL[userMedianGrade] || GRADE_BY_LABEL['V4'] || GRADES[4];
  let difficulty = baseDef.difficulty;

  // Steepness scaling offset
  if (wallInfo.angleDegrees <= 10) {
    // Slab / vertical: technical balance, slightly lower raw power grade
    difficulty -= 1;
  } else if (wallInfo.angleDegrees <= 30) {
    // Moderate overhang: baseline matching median grade
    difficulty += 0;
  } else if (wallInfo.angleDegrees <= 50) {
    // Steep cave: +1 to +2 difficulty due to core tension & gravity load
    difficulty += wallInfo.angleDegrees >= 40 ? 2 : 1;
  } else {
    // Horizontal roof: +2 to +3 difficulty
    difficulty += 2;
  }

  // Hold density modifier
  if (routeHoldDensity === 'sparse') {
    difficulty += 1;
  } else if (routeHoldDensity === 'dense') {
    difficulty = Math.max(0, difficulty - 1);
  }

  // Process Route Annotation Payload if available
  let maxSpanCm = 0;
  let avgSpanCm = 0;
  let hasCrux = false;
  const extraTags: string[] = [];

  if (annotationPayload && annotationPayload.holdCount > 0) {
    const { holdCount, maxSpan, averageSpan, markers, routeColor } = annotationPayload;
    maxSpanCm = spanToEstimatedCm(maxSpan);
    avgSpanCm = spanToEstimatedCm(averageSpan);
    hasCrux = markers.some((m) => m.type === 'crux');

    // Long reaches / dynos increase difficulty
    if (maxSpan >= 0.22) {
      difficulty += 1;
      extraTags.push('🚀 Dyno / Big Reach');
    } else if (maxSpan <= 0.12 && holdCount >= 6) {
      extraTags.push('🧗 Compression Ladder');
    }

    if (holdCount <= 4 && holdCount >= 2) {
      extraTags.push('💥 Powerful Boulder');
    } else if (holdCount >= 8) {
      extraTags.push('🔋 Power Endurance');
    }

    if (hasCrux) {
      extraTags.push('🎯 Isolated Crux');
    }

    if (routeColor) {
      extraTags.push(`🎨 ${routeColor} Route`);
    }
  }

  // Clamp within V0..V13
  const clampedDifficulty = Math.max(0, Math.min(GRADES.length - 1, difficulty));
  const estimatedGradeDef = GRADES[clampedDifficulty] || GRADES[0];

  // Dynamic confidence calculation
  let confidence: number;
  let confidenceDescription: string;

  if (annotationPayload && annotationPayload.holdCount >= 3) {
    confidence = Math.min(97, Math.round(90 + (wallInfo.angleDegrees / 90) * 5));
    confidenceDescription = `${confidence}% confidence based on ${annotationPayload.holdCount} holds, ~${maxSpanCm}cm crux reach & ${wallInfo.shortBadge}`;
  } else {
    const angleNormalized = Math.min(1, wallInfo.angleDegrees / 60);
    confidence = Math.round(85 + angleNormalized * 7);
    confidenceDescription = `${confidence}% confidence based on steepness & hold distribution`;
  }

  // Contextual hold profile tags
  let baseTags: string[];
  if (wallInfo.angleDegrees >= 35) {
    baseTags = ['🤏 Crimps', '🪨 Volumes', '⚡ High Tension'];
  } else if (wallInfo.angleDegrees >= 15) {
    baseTags = ['🪨 Volumes', '🤏 Pinches', '⚡ High Tension'];
  } else {
    baseTags = ['🦶 Micro Footwork', '🤏 Technical Crimps', '⚖️ Balance Walk'];
  }

  const allTags = Array.from(new Set([...extraTags, ...baseTags]));

  return {
    estimatedGrade: estimatedGradeDef.label,
    confidence,
    tags: allTags,
    angleDegrees: wallInfo.angleDegrees,
    wallCategory: wallInfo.category,
    wallBadge: wallInfo.shortBadge,
    confidenceDescription,
    annotationSummary: annotationPayload && annotationPayload.holdCount > 0 ? {
      holdCount: annotationPayload.holdCount,
      maxSpanCm,
      averageSpanCm: avgSpanCm,
      hasCrux,
      routeColor: annotationPayload.routeColor,
    } : undefined,
  };
}
