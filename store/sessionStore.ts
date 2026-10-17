import { create } from 'zustand';
import * as Q from '../db/queries';
import { getDatabase } from '../db/schema';
import { notificationEngine } from '../services/notificationEngine';

interface SessionState {
  lastTab: string;
  setLastTab: (tab: string) => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  
  isLogSheetOpen: boolean;
  setLogSheetOpen: (open: boolean) => void;

  pendingFailureLogId: string | null;
  setPendingFailureLogId: (id: string | null) => void;
  
  pendingAttemptId: string | null;
  setPendingAttemptId: (id: string | null) => void;

  activeProjectTarget: any | null;
  setActiveProjectTarget: (project: any | null) => void;

  restTimerEndTime: number | null;
  isRestTimerRunning: boolean;
  restNotificationId: string | null;
  setRestTimer: (
    endTime: number | null,
    isRunning: boolean,
    options?: { fromLiveActivity?: boolean }
  ) => void;
  addRestTimerSeconds: (seconds: number) => void;

  // Actions
  
  startQuickSession: (gymName?: string) => string;
  createProject: (data: any) => string;
  updateProjectStatus: (id: string, status: any) => void;
  updateProjectHighWaterMark: (id: string, moves: number) => void;
  logGenericAscent: (payload: any) => string;
  undoLastClimb: () => void;
  setAttemptFailureReason: (attemptId: string, reason: string) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  lastTab: '/',
  setLastTab: (tab) => set({ lastTab: tab }),

  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),

  isLogSheetOpen: false,
  setLogSheetOpen: (open) => set({ isLogSheetOpen: open }),

  pendingFailureLogId: null,
  setPendingFailureLogId: (id) => set({ pendingFailureLogId: id }),
  
  pendingAttemptId: null,
  setPendingAttemptId: (id) => set({ pendingAttemptId: id }),

  activeProjectTarget: null,
  setActiveProjectTarget: (project) => {
    set({ activeProjectTarget: project });
    try {
      require('../services/liveActivity').liveActivityManager.syncFromDatabase();
    } catch {}
  },

  restTimerEndTime: null,
  isRestTimerRunning: false,
  restNotificationId: null,
  setRestTimer: (endTime, isRunning, options) => {
    const prevNotifId = get().restNotificationId;
    if (prevNotifId) {
      notificationEngine.cancelRestNotification(prevNotifId).catch(() => {});
    }

    if (isRunning && endTime && endTime > Date.now()) {
      const seconds = Math.max(1, Math.round((endTime - Date.now()) / 1000));
      notificationEngine.scheduleRestNotification(seconds)
        .then((notifId) => {
          if (notifId) set({ restNotificationId: notifId });
        })
        .catch(() => {});
    }

    set({
      restTimerEndTime: endTime,
      isRestTimerRunning: isRunning,
      restNotificationId: null,
    });

    if (!options?.fromLiveActivity) {
      try {
        const { liveActivityManager } = require('../services/liveActivity');
        liveActivityManager.updateRest(
          isRunning && endTime && endTime > Date.now() ? endTime : null
        );
      } catch {}
    }
  },
  addRestTimerSeconds: (seconds) => {
    const current = get();
    if (!current.restTimerEndTime) return;
    const newEndTime = current.restTimerEndTime + seconds * 1000;
    current.setRestTimer(newEndTime, current.isRestTimerRunning);
  },

  startQuickSession: (gymName = 'Local Gym') => {
    const id = `session_${Date.now()}`;
    const startTime = Date.now();
    Q.insertSession({
      id,
      gymName,
      startTime,
      notes: '',
      title: 'Quick Session',
      rpe: null,
      mediaUris: [],
      skinState: null,
      fingerFatigue: null,
    });
    set({ activeSessionId: id });
    try {
      const { liveActivityManager } = require('../services/liveActivity');
      liveActivityManager.startSession(id, gymName, startTime, 0, 0, 'V0');
    } catch {}
    return id;
  },

  createProject: (data) => {
    const id = `proj_${Date.now()}`;
    Q.insertProject({
      ...data,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  },

  updateProjectStatus: (id, status) => {
    Q.updateProjectStatus(id, status);
  },

  updateProjectHighWaterMark: (id, moves) => {
    Q.updateProjectHighWaterMark(id, moves);
  },

  
  undoLastClimb: () => {
    const activeSession = Q.getActiveSession();
    if (!activeSession) return;
    const db = getDatabase();
    
    // Find the most recent climb for this session
    const lastClimb = db.getFirstSync<any>("SELECT id, project_id FROM climbs WHERE session_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1", [activeSession.id]);
    
    if (lastClimb) {
      db.runSync("UPDATE climbs SET deleted_at = ? WHERE id = ?", [Date.now(), lastClimb.id]);
      
      // If it was a project climb, we also need to update the project status appropriately, but for MVP soft-deleting the climb is sufficient to undo it from the session stats
      require('../db/events').dbEvents.emit();
    }
  },

  logGenericAscent: (payload) => {
    const activeSession = Q.getActiveSession();
    const activeId = activeSession ? activeSession.id : null;
    if (!activeId) return ''; // should not happen
    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const difficulty = Q.gradeToNumeric(payload.gradeRaw);

    let outcome = payload.outcome;
    const movesLinked = payload.movesLinked ?? 0;
    // Flash rule: flash is strictly allowed only on attempt #1
    if (outcome === 'flash' && movesLinked > 1) {
      outcome = 'send';
    }
    // In-project logging: if project has prior attempts, flash is impossible
    if (payload.projectId && outcome === 'flash') {
      const db = getDatabase();
      const priorRow = db.getFirstSync<any>(
        `SELECT COUNT(*) as c FROM climbs WHERE project_id = ? AND deleted_at IS NULL`,
        [payload.projectId]
      );
      const priorCount = priorRow?.c ?? 0;
      if (priorCount > 0) {
        outcome = 'send';
      }
    }

    Q.insertAttempt({
      id: attemptId,
      sessionId: activeId,
      projectId: payload.projectId ?? null,
      gradeRaw: payload.gradeRaw,
      normalizedDifficulty: difficulty,
      wallAngle: payload.wallAngle,
      holdType: payload.holdType,
      outcome,
      notes: payload.notes ?? null,
      failureReason: payload.failureReason ?? null,
      attemptNumber: movesLinked,
      timestamp: Date.now(),
    });

    if (payload.projectId) {
      if (outcome === 'send' || outcome === 'flash') {
        Q.updateProjectStatus(payload.projectId, 'sent');
      } else if (payload.movesLinked) {
        Q.updateProjectHighWaterMark(payload.projectId, payload.movesLinked);
      }
    }

    if (payload.outcome === 'fall' || payload.outcome === 'attempt') {
      set({ pendingAttemptId: attemptId });
    }

    return attemptId;
  },

  setAttemptFailureReason: (attemptId, reason) => {
    Q.updateAttemptFailureReason(attemptId, reason);
    set({ pendingAttemptId: null });
  },
}));

export const selectTotalSends = () => 0; // Stub for old components
