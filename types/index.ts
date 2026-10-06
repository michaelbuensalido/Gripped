export type Outcome = 'flash' | 'send' | 'attempt' | 'fall' | 'zone';

// Root-cause failure taxonomy — mirrors `attempts.failure_reason` column values
export type FailureReason =
  | 'pump'         // Forearm pump / endurance failure
  | 'foot_slip'    // Foot cut or smear failure
  | 'power'        // Insufficient contact / raw strength
  | 'beta_error'   // Wrong sequence / movement mistake
  | 'fear'         // Mental / commitment failure
  // Legacy values — kept for backward-compat with existing boulder_logs rows
  | 'pumped'
  | 'reach_span'
  | 'grip_strength';

export type HoldType = 'crimps' | 'slopers' | 'pinches' | 'pockets' | 'volumes';
export type WallAngle = 'slab' | 'vertical' | 'overhang' | 'roof';
export type RouteStatus = 'unattempted' | 'attempted' | 'sent' | 'flashed' | 'project';

// ─── Sectors ──────────────────────────────────────────────────────────────────
export interface Sector {
  id: string;
  name: string;
  gymName: string;
  description?: string | null;
  createdAt: number;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export interface Route {
  id: string;
  sectorId: string;
  setterGrade: string;        // Gym-set grade e.g. "V5"
  holdColor: string;          // e.g. "blue", "yellow"
  holdType?: HoldType | null;
  wallAngle?: WallAngle | null;
  status: RouteStatus;
  createdAt: number;
}

export type ProjectStatus = 'in_progress' | 'sent' | 'abandoned';

// ─── Projects (Personal Hit-List) ─────────────────────────────────────────────
export interface Project {
  id: string;
  title: string;
  gradeRaw: string;
  normalizedDifficulty: number;
  wallAngle: WallAngle;
  holdType: HoldType;
  status: ProjectStatus;
  highWaterMarkMoves: number;
  totalMoves?: number | null;
  microBeta?: string | null;
  gymName?: string | null;
  zone?: string | null;
  setDate?: string | null;
  mediaUri?: string | null;
  createdAt: number;
  updatedAt: number;
}

// ─── Generic Ascents ──────────────────────────────────────────────────────────
export interface GenericAscentPayload {
  gradeRaw: string;
  wallAngle: WallAngle;
  holdType: HoldType;
  outcome: Outcome;
  failureReason?: FailureReason | null;
  movesLinked?: number;
  projectId?: string | null;
}

// ─── Attempts ─────────────────────────────────────────────────────────────────
export interface Attempt {
  id: string;
  sessionId: string;
  projectId?: string | null;
  routeId?: string | null;     // Legacy support
  gradeRaw: string;
  normalizedDifficulty: number;
  wallAngle: WallAngle;
  holdType: HoldType;
  outcome: Outcome;
  failureReason?: FailureReason | null;
  movesLinked?: number;
  attemptNumber: number;
  timestamp: number;          // unix ms
  restDurationSeconds?: number | null;
}

export interface Session {
  id: string;
  startTime: number; // unix ms
  endTime: number | null;
  gymName: string;
  notes: string;
  title?: string;
  rpe?: number | null;
  mediaUris?: string[];
  skinState?: string | null;
  fingerFatigue?: string | null;
}

export interface BoulderGroup {
  id: string;
  sessionId: string;
  zoneName: string;
  order: number;
  defaultRestSeconds?: number;
  notes?: string;
  isCompleted?: boolean;
}

export interface BoulderLog {
  id: string;
  groupId: string;
  gradeRaw: string;          // e.g. "V5"
  normalizedDifficulty: number; // 0–13
  rpe: number | null;        // Rate of Perceived Exertion 1–10, nullable
  attempts: number;
  outcome: Outcome;          // 'flash' | 'send' | 'attempt'
  timestamp: number;         // unix ms
  media_uri?: string | null;
  media_type?: 'video' | 'photo' | null;
  notes?: string | null;
  failureReason?: FailureReason | null;
  failure_reason?: FailureReason | null;
  wallAngle?: 'SLAB' | 'VERT' | 'OVERHANG' | 'CAVE' | null;
}

export interface BoulderGroupWithLogs extends BoulderGroup {
  logs: BoulderLog[];
}

// ─── Routines & Workout Templates ─────────────────────────────────────────────

export type RoutineCategory =
  | 'Strength'
  | 'Power Endurance'
  | 'Volume'
  | 'Technique'
  | 'Projecting'
  | 'Other';

export interface PlannedBoulder {
  id: string;
  blockId: string;
  gradeRaw: string;
  normalizedDifficulty: number;
  targetAttempts: number;
  styleTags: string[]; // e.g. ["Overhang", "Crimpy"]
  order: number;
}

export interface RoutineBlock {
  id: string;
  routineId: string;
  title: string;
  defaultRestSeconds: number; // e.g. 30, 60, 90, 180
  order: number;
  boulders: PlannedBoulder[];
}

export interface Routine {
  id: string;
  title: string;
  description: string;
  category: RoutineCategory;
  isCustom: boolean; // false for default templates, true for user-created
  estimatedMinutes: number;
  createdAt: number;
  updatedAt: number;
}

export interface RoutineWithBlocks extends Routine {
  blocks: RoutineBlock[];
}
