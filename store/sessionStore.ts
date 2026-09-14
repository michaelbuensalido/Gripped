import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import type { Session, BoulderGroup, BoulderLog, Outcome, RoutineWithBlocks, FailureReason } from '../types';
import { DEFAULT_GRADE, GRADE_BY_LABEL } from '../constants/grades';
import * as Q from '../db/queries';
import { triggerRestTimerStart } from '../utils/haptics';

interface GroupWithLogs extends BoulderGroup {
  logs: BoulderLog[];
}

interface SessionState {
  // active session data
  activeSession: Session | null;
  groups: GroupWithLogs[];
  // rest timer
  restTimerActive: boolean;
  restTimerSeconds: number;
  restTimerMax: number;
  restTimerTargetTimestampMs: number | null;

  // actions
  startSession: (gymName: string) => void;
  startEmptySession: (gymName?: string) => string;
  startQuickSession: (gymName?: string) => string;
  startSessionFromRoutine: (routine: RoutineWithBlocks, gymName?: string) => string;
  finishSession: () => void;
  completeSession: (params: {
    title: string;
    notes: string;
    gymName: string;
    rpe: number | null;
    mediaUris: string[];
    endTime?: number;
  }) => void;
  discardSession: () => void;
  cancelSession: (sessionId?: string) => void;
  loadSession: (sessionId: string) => void;
  initActiveSession: () => void;

  addGroup: (zoneName?: string, defaultRestSeconds?: number) => void;
  updateGroupName: (groupId: string, zoneName: string) => void;
  updateGroupRestTimer: (groupId: string, seconds: number) => void;
  updateGroupNotes: (groupId: string, notes: string) => void;
  moveGroup: (groupId: string, direction: 'up' | 'down') => void;
  deleteGroup: (groupId: string) => void;

  addLog: (groupId: string) => void;
  updateLog: (groupId: string, log: BoulderLog) => void;
  deleteLog: (groupId: string, logId: string) => void;
  cycleOutcome: (groupId: string, logId: string) => void;
  setOutcome: (groupId: string, logId: string, outcome: Outcome) => void;
  updateGrade: (groupId: string, logId: string, gradeRaw: string) => void;
  updateRpe: (groupId: string, logId: string, rpe: number | null) => void;
  incrementAttempts: (groupId: string, logId: string) => void;
  decrementAttempts: (groupId: string, logId: string) => void;
  updateSetMedia: (
    groupId: string,
    logId: string,
    mediaUri: string | null,
    mediaType: 'video' | 'photo' | null
  ) => void;
  commitSetGrading: (
    groupId: string,
    logId: string,
    data: {
      gradeRaw: string;
      mediaUri: string;
      mediaType: 'video' | 'photo';
      notes?: string;
    }
  ) => void;
  setFailureReason: (
    groupId: string,
    logId: string,
    reason: FailureReason | null
  ) => void;

  triggerRestTimer: (seconds?: number) => void;
  tickRestTimer: () => void;
  syncRestTimer: () => number;
  dismissRestTimer: () => void;
}

const OUTCOME_CYCLE: Outcome[] = ['attempt', 'send', 'flash'];

export const useSessionStore = create<SessionState>()(
  immer((set, get) => ({
    activeSession: null,
    groups: [],
    restTimerActive: false,
    restTimerSeconds: 0,
    restTimerMax: 90,
    restTimerTargetTimestampMs: null,

    startSession: (gymName) => {
      const session: Session = {
        id: uuid(),
        startTime: Date.now(),
        endTime: null,
        gymName,
        notes: '',
      };
      Q.insertSession(session);

      // Create a default group
      const group: BoulderGroup = {
        id: uuid(),
        sessionId: session.id,
        zoneName: 'Main Wall',
        order: 0,
        defaultRestSeconds: 90,
      };
      Q.insertBoulderGroup(group);

      const log: BoulderLog = {
        id: uuid(),
        groupId: group.id,
        gradeRaw: DEFAULT_GRADE.label,
        normalizedDifficulty: DEFAULT_GRADE.difficulty,
        rpe: null,
        attempts: 1,
        outcome: 'attempt',
        timestamp: Date.now(),
        media_uri: null,
        media_type: null,
      };
      Q.insertBoulderLog(log);

      set((state) => {
        state.activeSession = session;
        state.groups = [{ ...group, logs: [log] }];
      });
    },

    startEmptySession: (gymName = 'Freestyle Session') => {
      const session: Session = {
        id: uuid(),
        startTime: Date.now(),
        endTime: null,
        gymName,
        notes: '',
      };
      Q.insertSession(session);

      const group: BoulderGroup = {
        id: uuid(),
        sessionId: session.id,
        zoneName: 'Main Wall',
        order: 0,
        defaultRestSeconds: 90,
      };
      Q.insertBoulderGroup(group);

      const log: BoulderLog = {
        id: uuid(),
        groupId: group.id,
        gradeRaw: DEFAULT_GRADE.label,
        normalizedDifficulty: DEFAULT_GRADE.difficulty,
        rpe: null,
        attempts: 1,
        outcome: 'attempt',
        timestamp: Date.now(),
        media_uri: null,
        media_type: null,
      };
      Q.insertBoulderLog(log);

      set((state) => {
        state.activeSession = session;
        state.groups = [{ ...group, logs: [log] }];
        state.restTimerActive = false;
        state.restTimerSeconds = 0;
        state.restTimerMax = 90;
        state.restTimerTargetTimestampMs = null;
      });

      return session.id;
    },

    startQuickSession: (gymName = 'Quick Session') => {
      return get().startEmptySession(gymName);
    },

    startSessionFromRoutine: (routine, gymName = 'Gym Session') => {
      const session: Session = {
        id: uuid(),
        startTime: Date.now(),
        endTime: null,
        gymName,
        notes: routine.description ? `${routine.title} • ${routine.description}` : routine.title,
      };
      Q.insertSession(session);

      const newGroups: GroupWithLogs[] = [];
      const firstRest = routine.blocks[0]?.defaultRestSeconds ?? 90;

      routine.blocks.forEach((block, bIdx) => {
        const group: BoulderGroup = {
          id: uuid(),
          sessionId: session.id,
          zoneName: block.title,
          order: bIdx,
          defaultRestSeconds: block.defaultRestSeconds,
        };
        Q.insertBoulderGroup(group);

        const logs: BoulderLog[] = [];
        block.boulders.forEach((boulder) => {
          const log: BoulderLog = {
            id: uuid(),
            groupId: group.id,
            gradeRaw: boulder.gradeRaw,
            normalizedDifficulty: boulder.normalizedDifficulty,
            rpe: null,
            attempts: Math.max(boulder.targetAttempts, 1),
            outcome: 'attempt',
            timestamp: Date.now(),
          };
          Q.insertBoulderLog(log);
          logs.push(log);
        });

        newGroups.push({ ...group, logs });
      });

      if (newGroups.length === 0) {
        const group: BoulderGroup = {
          id: uuid(),
          sessionId: session.id,
          zoneName: 'Main Wall',
          order: 0,
          defaultRestSeconds: 90,
        };
        Q.insertBoulderGroup(group);
        newGroups.push({ ...group, logs: [] });
      }

      set((state) => {
        state.activeSession = session;
        state.groups = newGroups;
        state.restTimerActive = false;
        state.restTimerSeconds = 0;
        state.restTimerMax = firstRest;
        state.restTimerTargetTimestampMs = null;
      });

      return session.id;
    },

    finishSession: () => {
      const { activeSession } = get();
      if (!activeSession) return;
      const endTime = Date.now();
      Q.finishSession(activeSession.id, endTime);
      // Clear from store so the mini-bar and home CTA reset immediately
      set((state) => {
        state.activeSession = null;
        state.groups = [];
        state.restTimerActive = false;
        state.restTimerSeconds = 0;
        state.restTimerMax = 90;
        state.restTimerTargetTimestampMs = null;
      });
    },

    completeSession: ({ title, notes, gymName, rpe, mediaUris, endTime }) => {
      const { activeSession } = get();
      if (!activeSession) return;
      const finalEndTime = endTime ?? Date.now();
      Q.completeSessionWrapUp(
        activeSession.id,
        finalEndTime,
        title,
        notes,
        gymName,
        rpe,
        mediaUris
      );
      set((state) => {
        state.activeSession = null;
        state.groups = [];
        state.restTimerActive = false;
        state.restTimerSeconds = 0;
        state.restTimerMax = 90;
        state.restTimerTargetTimestampMs = null;
      });
    },

    discardSession: () => {
      const { activeSession } = get();
      if (activeSession) {
        Q.deleteSession(activeSession.id);
      }
      set((state) => {
        state.activeSession = null;
        state.groups = [];
        state.restTimerActive = false;
        state.restTimerSeconds = 0;
        state.restTimerMax = 90;
        state.restTimerTargetTimestampMs = null;
      });
    },

    cancelSession: (sessionId) => {
      const { activeSession } = get();
      const targetId = sessionId || activeSession?.id;
      if (targetId) {
        Q.deleteSession(targetId);
      }
      set((state) => {
        state.activeSession = null;
        state.groups = [];
        state.restTimerActive = false;
        state.restTimerSeconds = 0;
        state.restTimerMax = 90;
        state.restTimerTargetTimestampMs = null;
      });
    },

    loadSession: (sessionId) => {
      const session = Q.getSessionById(sessionId);
      if (!session) return;
      const dbGroups = Q.getGroupsForSession(sessionId);
      const groups: GroupWithLogs[] = dbGroups.map((g) => ({
        ...g,
        logs: Q.getLogsForGroup(g.id),
      }));
      set((state) => {
        state.activeSession = session;
        state.groups = groups;
      });
    },

    initActiveSession: () => {
      const active = Q.getActiveSession();
      if (active) {
        get().loadSession(active.id);
      }
    },

    addGroup: (zoneName = 'New Zone', defaultRestSeconds = 90) => {
      const { activeSession, groups } = get();
      if (!activeSession) return;
      const group: BoulderGroup = {
        id: uuid(),
        sessionId: activeSession.id,
        zoneName,
        order: groups.length,
        defaultRestSeconds,
      };
      Q.insertBoulderGroup(group);
      set((state) => {
        state.groups.push({ ...group, logs: [] });
      });
    },

    updateGroupName: (groupId, zoneName) => {
      Q.updateGroupZoneName(groupId, zoneName);
      set((state) => {
        const g = state.groups.find((g) => g.id === groupId);
        if (g) g.zoneName = zoneName;
      });
    },

    updateGroupRestTimer: (groupId, seconds) => {
      Q.updateGroupRestSeconds(groupId, seconds);
      set((state) => {
        const g = state.groups.find((g) => g.id === groupId);
        if (g) g.defaultRestSeconds = seconds;
      });
    },

    updateGroupNotes: (groupId, notes) => {
      Q.updateGroupNotes(groupId, notes);
      set((state) => {
        const g = state.groups.find((g) => g.id === groupId);
        if (g) g.notes = notes;
      });
    },

    moveGroup: (groupId, direction) => {
      const { groups } = get();
      const index = groups.findIndex((g) => g.id === groupId);
      if (index === -1) return;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= groups.length) return;

      const currentGroup = groups[index];
      const targetGroup = groups[targetIndex];

      Q.updateGroupOrder(currentGroup.id, targetIndex);
      Q.updateGroupOrder(targetGroup.id, index);

      set((state) => {
        const item = state.groups.splice(index, 1)[0];
        state.groups.splice(targetIndex, 0, item);
        state.groups.forEach((g, idx) => {
          g.order = idx;
        });
      });
    },

    deleteGroup: (groupId) => {
      Q.deleteBoulderGroup(groupId);
      set((state) => {
        state.groups = state.groups.filter((g) => g.id !== groupId);
        state.groups.forEach((g, idx) => {
          g.order = idx;
        });
      });
    },

    addLog: (groupId) => {
      const log: BoulderLog = {
        id: uuid(),
        groupId,
        gradeRaw: DEFAULT_GRADE.label,
        normalizedDifficulty: DEFAULT_GRADE.difficulty,
        rpe: null,
        attempts: 1,
        outcome: 'attempt',
        timestamp: Date.now(),
        media_uri: null,
        media_type: null,
      };
      Q.insertBoulderLog(log);
      set((state) => {
        const g = state.groups.find((g) => g.id === groupId);
        if (g) g.logs.push(log);
      });
    },

    updateLog: (groupId, log) => {
      Q.updateBoulderLog(log);
      set((state) => {
        const g = state.groups.find((g) => g.id === groupId);
        if (!g) return;
        const idx = g.logs.findIndex((l) => l.id === log.id);
        if (idx >= 0) g.logs[idx] = log;
      });
    },

    deleteLog: (groupId, logId) => {
      Q.deleteBoulderLog(logId);
      set((state) => {
        const g = state.groups.find((g) => g.id === groupId);
        if (g) g.logs = g.logs.filter((l) => l.id !== logId);
      });
    },

    cycleOutcome: (groupId, logId) => {
      const { groups } = get();
      const g = groups.find((g) => g.id === groupId);
      if (!g) return;
      const log = g.logs.find((l) => l.id === logId);
      if (!log) return;
      const currentIdx = OUTCOME_CYCLE.indexOf(log.outcome);
      const nextOutcome = OUTCOME_CYCLE[(currentIdx + 1) % OUTCOME_CYCLE.length];
      const updated = { ...log, outcome: nextOutcome };
      Q.updateBoulderLog(updated);
      set((state) => {
        const sg = state.groups.find((g) => g.id === groupId);
        if (!sg) return;
        const idx = sg.logs.findIndex((l) => l.id === logId);
        if (idx >= 0) sg.logs[idx].outcome = nextOutcome;
      });
      if (nextOutcome !== 'attempt') {
        get().triggerRestTimer(g.defaultRestSeconds ?? 90);
      }
    },

    setOutcome: (groupId, logId, outcome) => {
      const { groups } = get();
      const g = groups.find((g) => g.id === groupId);
      if (!g) return;
      const log = g.logs.find((l) => l.id === logId);
      if (!log) return;
      const updated = { ...log, outcome };
      Q.updateBoulderLog(updated);
      set((state) => {
        const sg = state.groups.find((g) => g.id === groupId);
        if (!sg) return;
        const idx = sg.logs.findIndex((l) => l.id === logId);
        if (idx >= 0) sg.logs[idx].outcome = outcome;
      });
      if (outcome !== 'attempt') {
        get().triggerRestTimer(g.defaultRestSeconds ?? 90);
      }
    },

    updateGrade: (groupId, logId, gradeRaw) => {
      const grade = GRADE_BY_LABEL[gradeRaw];
      if (!grade) return;
      const { groups } = get();
      const g = groups.find((g) => g.id === groupId);
      if (!g) return;
      const log = g.logs.find((l) => l.id === logId);
      if (!log) return;
      const updated = { ...log, gradeRaw, normalizedDifficulty: grade.difficulty };
      Q.updateBoulderLog(updated);
      set((state) => {
        const sg = state.groups.find((g) => g.id === groupId);
        if (!sg) return;
        const idx = sg.logs.findIndex((l) => l.id === logId);
        if (idx >= 0) {
          sg.logs[idx].gradeRaw = gradeRaw;
          sg.logs[idx].normalizedDifficulty = grade.difficulty;
        }
      });
    },

    updateRpe: (groupId, logId, rpe) => {
      const { groups } = get();
      const g = groups.find((g) => g.id === groupId);
      if (!g) return;
      const log = g.logs.find((l) => l.id === logId);
      if (!log) return;
      const updated = { ...log, rpe };
      Q.updateBoulderLog(updated);
      set((state) => {
        const sg = state.groups.find((g) => g.id === groupId);
        if (!sg) return;
        const idx = sg.logs.findIndex((l) => l.id === logId);
        if (idx >= 0) sg.logs[idx].rpe = rpe;
      });
    },

    incrementAttempts: (groupId, logId) => {
      const { groups } = get();
      const g = groups.find((g) => g.id === groupId);
      if (!g) return;
      const log = g.logs.find((l) => l.id === logId);
      if (!log) return;
      const updated = { ...log, attempts: log.attempts + 1 };
      Q.updateBoulderLog(updated);
      set((state) => {
        const sg = state.groups.find((g) => g.id === groupId);
        if (!sg) return;
        const idx = sg.logs.findIndex((l) => l.id === logId);
        if (idx >= 0) sg.logs[idx].attempts += 1;
      });
    },

    decrementAttempts: (groupId, logId) => {
      const { groups } = get();
      const g = groups.find((g) => g.id === groupId);
      if (!g) return;
      const log = g.logs.find((l) => l.id === logId);
      if (!log || log.attempts <= 1) return;
      const updated = { ...log, attempts: log.attempts - 1 };
      Q.updateBoulderLog(updated);
      set((state) => {
        const sg = state.groups.find((g) => g.id === groupId);
        if (!sg) return;
        const idx = sg.logs.findIndex((l) => l.id === logId);
        if (idx >= 0) sg.logs[idx].attempts -= 1;
      });
    },

    updateSetMedia: (groupId, logId, mediaUri, mediaType) => {
      Q.updateBoulderLogMedia(logId, mediaUri, mediaType);
      set((state) => {
        const sg = state.groups.find((g) => g.id === groupId);
        if (!sg) return;
        const log = sg.logs.find((l) => l.id === logId);
        if (log) {
          log.media_uri = mediaUri;
          log.media_type = mediaType;
        }
      });
    },

    commitSetGrading: (groupId, logId, data) => {
      const grade = GRADE_BY_LABEL[data.gradeRaw] || DEFAULT_GRADE;
      Q.updateBoulderLogGradeAndMedia(
        logId,
        data.gradeRaw,
        grade.difficulty,
        data.mediaUri,
        data.mediaType,
        data.notes
      );
      set((state) => {
        const sg = state.groups.find((g) => g.id === groupId);
        if (!sg) return;
        const log = sg.logs.find((l) => l.id === logId);
        if (log) {
          log.gradeRaw = data.gradeRaw;
          log.normalizedDifficulty = grade.difficulty;
          log.media_uri = data.mediaUri;
          log.media_type = data.mediaType;
          log.notes = data.notes ?? log.notes;
        }
      });
    },

    setFailureReason: (groupId, logId, reason) => {
      Q.updateBoulderLogFailureReason(logId, reason);
      set((state) => {
        const sg = state.groups.find((g) => g.id === groupId);
        if (!sg) return;
        const log = sg.logs.find((l) => l.id === logId);
        if (log) {
          log.failureReason = reason;
          log.failure_reason = reason;
        }
      });
    },

    triggerRestTimer: (seconds = 90) => {
      triggerRestTimerStart().catch(() => {});
      set((state) => {
        state.restTimerActive = true;
        state.restTimerSeconds = seconds;
        state.restTimerMax = seconds;
        state.restTimerTargetTimestampMs = Date.now() + seconds * 1000;
      });
    },

    tickRestTimer: () => {
      set((state) => {
        if (!state.restTimerActive || !state.restTimerTargetTimestampMs) {
          if (state.restTimerSeconds > 0) {
            state.restTimerSeconds -= 1;
          } else {
            state.restTimerActive = false;
          }
          return;
        }

        const remaining = Math.max(
          0,
          Math.ceil((state.restTimerTargetTimestampMs - Date.now()) / 1000)
        );
        state.restTimerSeconds = remaining;
        if (remaining <= 0) {
          state.restTimerActive = false;
          state.restTimerTargetTimestampMs = null;
        }
      });
    },

    syncRestTimer: () => {
      let remaining = 0;
      set((state) => {
        if (!state.restTimerActive || !state.restTimerTargetTimestampMs) {
          remaining = state.restTimerSeconds;
          return;
        }
        remaining = Math.max(
          0,
          Math.ceil((state.restTimerTargetTimestampMs - Date.now()) / 1000)
        );
        if (state.restTimerSeconds !== remaining) {
          state.restTimerSeconds = remaining;
        }
        if (remaining <= 0) {
          state.restTimerActive = false;
          state.restTimerTargetTimestampMs = null;
        }
      });
      return remaining;
    },

    dismissRestTimer: () => {
      set((state) => {
        state.restTimerActive = false;
        state.restTimerSeconds = 0;
        state.restTimerTargetTimestampMs = null;
      });
    },
  }))
);

// Computed selectors
export const selectTotalSends = (state: SessionState) =>
  state.groups.reduce(
    (acc, g) =>
      acc + g.logs.filter((l) => l.outcome === 'send' || l.outcome === 'flash').length,
    0
  );
