// ─── Beta (move sequences, key tips, video) ───────────────────────────────────
// Local-only entities. See docs/MVP_SPEC.md "Beta" section.

export type Limb = 'LH' | 'RH' | 'LF' | 'RF';

export const LIMBS: readonly Limb[] = ['LH', 'RH', 'LF', 'RF'] as const;

export interface Beta {
  id: string;
  projectId: string;
  version: number;
  label: string;
  isCurrent: boolean;
  keyTip: string | null;
  cruxMoveId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface BetaMove {
  id: string;
  betaId: string;
  order: number;
  text: string;
  limb: Limb | null;
}

export interface BetaVideo {
  id: string;
  projectId: string;
  /** Extension point for attempt-linked beta. No UI uses it yet. */
  attemptId: string | null;
  localUri: string;
  durationSec: number;
  sizeBytes: number;
  createdAt: number;
}

export interface VideoNote {
  id: string;
  videoId: string;
  timestampSec: number;
  text: string;
}

/** Maximum length of a recorded or picked clip. */
export const MAX_VIDEO_SECONDS = 60;
