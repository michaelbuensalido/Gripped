import { create } from 'zustand';
import * as Q from '../db/queries';

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

  // Actions
  
  createProject: (data: any) => string;
  updateProjectStatus: (id: string, status: any) => void;
  updateProjectHighWaterMark: (id: string, moves: number) => void;
  logGenericAscent: (payload: any) => string;
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
  setActiveProjectTarget: (project) => set({ activeProjectTarget: project }),

  startQuickSession: (gymName = 'Local Gym') => {
    const id = `session_${Date.now()}`;
    Q.insertSession({
      id,
      gymName,
      startTime: Date.now(),
      notes: '',
      title: 'Quick Session',
      rpe: null,
      mediaUris: [],
      skinState: null,
      fingerFatigue: null,
    });
    set({ activeSessionId: id });
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

  logGenericAscent: (payload) => {
    const activeSession = Q.getActiveSession();
    const activeId = activeSession ? activeSession.id : null;
    if (!activeId) return ''; // should not happen
    const attemptId = `att_${Date.now()}`;
    const difficulty = Q.gradeToNumeric(payload.gradeRaw);

    Q.insertAttempt({
      id: attemptId,
      sessionId: activeId,
      projectId: payload.projectId ?? null,
      gradeRaw: payload.gradeRaw,
      normalizedDifficulty: difficulty,
      wallAngle: payload.wallAngle,
      holdType: payload.holdType,
      outcome: payload.outcome,
      failureReason: payload.failureReason ?? null,
      attemptNumber: payload.movesLinked ?? 0,
      timestamp: Date.now(),
    });

    if (payload.projectId) {
      if (payload.outcome === 'send' || payload.outcome === 'flash') {
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
