export type Outcome = 'flash' | 'send' | 'attempt';

export interface Session {
  id: string;
  startTime: number; // unix ms
  endTime: number | null;
  gymName: string;
  notes: string;
}

export interface BoulderGroup {
  id: string;
  sessionId: string;
  zoneName: string;
  order: number;
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
}

export interface BoulderLogDraft extends Omit<BoulderLog, 'id' | 'timestamp'> {
  id: string;
  timestamp: number;
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
