import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import type { Session, BoulderGroup, BoulderLog, Outcome, RoutineWithBlocks, FailureReason } from '../types';
import { DEFAULT_GRADE, GRADE_BY_LABEL } from '../constants/grades';
import * as Q from '../db/queries';
import { triggerRestTimerStart } from '../utils/haptics';
import { insertAscent, getAscentsForSession } from '../services/database';
import { liveActivityManager } from '../services/liveActivity';
import { notificationEngine } from '../services/notificationEngine';

export interface Ascent {
  id: string;
  sessionId: string;
  gradeScalar: number;
  status: 'SEND' | 'ATTEMPT' | 'FLASH';
  timestamp: number;
  isSynced: number;
}

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
  restNotificationId?: string | null;

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
    skinState?: string | null;
    fingerFatigue?: string | null;
  }) => void;
  discardSession: () => void;
  cancelSession: (sessionId?: string) => void;
  loadSession: (sessionId: string) => void;
  initActiveSession: () => void;

  addGroup: (zoneName?: string, defaultRestSeconds?: number) => void;
  updateGroupName: (groupId: string, zoneName: string) => void;
  updateGroupRestTimer: (groupId: string, seconds: number) => void;
  updateGroupNotes: (groupId: string, notes: string) => void;
  toggleGroupCompletion: (groupId: string) => void;
  moveGroup: (groupId: string, direction: 'up' | 'down') => void;
  reorderGroups: (groupIds: string[]) => void;
  deleteGroup: (groupId: string) => void;

  addLog: (groupId: string) => void;
  updateLog: (groupId: string, log: BoulderLog) => void;
  deleteLog: (groupId: string, logId: string) => void;
  cycleOutcome: (groupId: string, logId: string) => void;
  setOutcome: (groupId: string, logId: string, outcome: Outcome) => void;
  updateGrade: (groupId: string, logId: string, gradeRaw: string) => void;
  updateWallAngle: (groupId: string, logId: string, angle: BoulderLog['wallAngle']) => void;
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

  conditions: string[];
  setSessionConditions: (conditions: string[]) => void;

  triggerRestTimer: (seconds?: number) => void;
  tickRestTimer: () => void;
  syncRestTimer: () => number;
  dismissRestTimer: () => void;
  updateRestTimerTarget: (targetMs: number | null) => void;

  // ─── Phase 1: Zero-latency ascent logging (Ascents table) ──────────────────
  ascents: Ascent[];
  logAscent: (gradeScalar: number, status: 'SEND' | 'ATTEMPT' | 'FLASH') => void;
  clearAscents: () => void;
  logWidgetAscent: (status: 'SEND' | 'ATTEMPT') => void;
}

const OUTCOME_CYCLE: Outcome[] = ['attempt', 'send', 'flash'];

export const useSessionStore = create<SessionState>()(
  immer((set, get) => ({
    activeSession: null,
    groups: [],
    conditions: [],
    ascents: [],
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

      // ─── Launch iOS Dynamic Island / Live Activity ───
      liveActivityManager.startSession(session.id, gymName);

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

      liveActivityManager.startSession(session.id, gymName);

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

      get().dismissRestTimer();
      set((state) => {
        state.activeSession = session;
        state.groups = [{ ...group, logs: [log] }];
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

      liveActivityManager.startSession(session.id, gymName);

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

      get().dismissRestTimer();
      set((state) => {
        state.activeSession = session;
        state.groups = newGroups;
        state.restTimerMax = firstRest;
      });

      return session.id;
    },

    finishSession: () => {
      const { activeSession } = get();
      if (!activeSession) return;
      const endTime = Date.now();
      Q.finishSession(activeSession.id, endTime);
      get().dismissRestTimer();
      liveActivityManager.endSession();
      // Clear from store so the mini-bar and home CTA reset immediately
      set((state) => {
        state.activeSession = null;
        state.groups = [];
      });
    },

    completeSession: ({ title, notes, gymName, rpe, mediaUris, endTime, skinState, fingerFatigue }) => {
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
        mediaUris,
        skinState,
        fingerFatigue
      );
      get().dismissRestTimer();
      liveActivityManager.endSession();
      set((state) => {
        state.activeSession = null;
        state.groups = [];
      });
    },

    discardSession: () => {
      const { activeSession } = get();
      if (activeSession) {
        Q.deleteSession(activeSession.id);
      }
      get().dismissRestTimer();
      liveActivityManager.endSession();
      set((state) => {
        state.activeSession = null;
        state.groups = [];
      });
    },

    cancelSession: (sessionId) => {
      const { activeSession } = get();
      const targetId = sessionId || activeSession?.id;
      if (targetId) {
        Q.deleteSession(targetId);
      }
      get().dismissRestTimer();
      liveActivityManager.endSession();
      set((state) => {
        state.activeSession = null;
        state.groups = [];
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
      let ascents: Ascent[] = [];
      try {
        ascents = getAscentsForSession(sessionId);
      } catch(e) {
        console.error('[sessionStore] loadSession getAscentsForSession failed:', e);
      }
      
      if (!session.endTime) {
        liveActivityManager.startSession(session.id, session.gymName);
      }

      const globalSends = ascents.filter(a => a.status === 'SEND' || a.status === 'FLASH').length;
      const groupSends = groups.reduce((acc, g) => acc + g.logs.filter(l => l.outcome === 'send' || l.outcome === 'flash').length, 0);
      liveActivityManager.updateSends(globalSends + groupSends);

      set((state) => {
        state.activeSession = session;
        state.groups = groups;
        state.ascents = ascents;
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

    toggleGroupCompletion: (groupId) => {
      set((state) => {
        const g = state.groups.find((g) => g.id === groupId);
        if (g) {
          g.isCompleted = !g.isCompleted;
          Q.updateGroupCompletion(groupId, g.isCompleted);
        }
      });
    },

    reorderGroups: (groupIds) => {
      set((state) => {
        const newGroups = groupIds.map((id, index) => {
          const group = state.groups.find((g) => g.id === id)!;
          group.order = index;
          Q.updateGroupOrder(id, index);
          return group;
        });
        state.groups = newGroups;
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
        if (idx >= 0) {
          sg.logs[idx].outcome = nextOutcome;
        }
        
        // Auto-complete the block if all logs are sent/flashed
        const allCompleted = sg.logs.length > 0 && sg.logs.every(l => l.outcome === 'send' || l.outcome === 'flash');
        if (allCompleted && !sg.isCompleted) {
          sg.isCompleted = true;
          Q.updateGroupCompletion(groupId, true);
        } else if (!allCompleted && sg.isCompleted) {
          sg.isCompleted = false;
          Q.updateGroupCompletion(groupId, false);
        }
      });
      
      const state = get();
      const globalSends = state.ascents.filter(a => a.status === 'SEND' || a.status === 'FLASH').length;
      const groupSends = state.groups.reduce((acc, g) => acc + g.logs.filter(l => l.outcome === 'send' || l.outcome === 'flash').length, 0);
      liveActivityManager.updateSends(globalSends + groupSends);

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
        if (idx >= 0) {
          sg.logs[idx].outcome = outcome;
        }

        // Auto-complete the block if all logs are sent/flashed
        const allCompleted = sg.logs.length > 0 && sg.logs.every(l => l.outcome === 'send' || l.outcome === 'flash');
        if (allCompleted && !sg.isCompleted) {
          sg.isCompleted = true;
          Q.updateGroupCompletion(groupId, true);
        } else if (!allCompleted && sg.isCompleted) {
          sg.isCompleted = false;
          Q.updateGroupCompletion(groupId, false);
        }
      });
      
      const state = get();
      const globalSends = state.ascents.filter(a => a.status === 'SEND' || a.status === 'FLASH').length;
      const groupSends = state.groups.reduce((acc, g) => acc + g.logs.filter(l => l.outcome === 'send' || l.outcome === 'flash').length, 0);
      liveActivityManager.updateSends(globalSends + groupSends);

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

    updateWallAngle: (groupId, logId, angle) => {
      const { groups } = get();
      const g = groups.find((g) => g.id === groupId);
      if (!g) return;
      const log = g.logs.find((l) => l.id === logId);
      if (!log) return;
      const updated = { ...log, wallAngle: angle };
      Q.updateBoulderLog(updated);
      set((state) => {
        const sg = state.groups.find((g) => g.id === groupId);
        if (!sg) return;
        const idx = sg.logs.findIndex((l) => l.id === logId);
        if (idx >= 0) sg.logs[idx].wallAngle = angle;
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
      get().triggerRestTimer(g.defaultRestSeconds ?? 90);
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
      const target = Date.now() + seconds * 1000;
      
      const prevNotifId = get().restNotificationId;
      if (prevNotifId) {
        notificationEngine.cancelRestNotification(prevNotifId);
      }
      
      set((state) => {
        state.restTimerActive = true;
        state.restTimerSeconds = seconds;
        state.restTimerMax = seconds;
        state.restTimerTargetTimestampMs = target;
      });
      
      liveActivityManager.updateRest(target);
      
      notificationEngine.scheduleRestNotification(seconds).then((notifId) => {
        set((state) => {
          state.restNotificationId = notifId;
        });
      });
    },

    tickRestTimer: () => {
      let expired = false;
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
          state.restNotificationId = null;
          expired = true;
        }
      });
      if (expired) liveActivityManager.updateRest(null);
    },

    syncRestTimer: () => {
      let remaining = 0;
      let expired = false;
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
          state.restNotificationId = null;
          expired = true;
        }
      });
      if (expired) liveActivityManager.updateRest(null);
      return remaining;
    },

    dismissRestTimer: () => {
      const prevNotifId = get().restNotificationId;
      if (prevNotifId) {
        notificationEngine.cancelRestNotification(prevNotifId);
      }
      set((state) => {
        state.restTimerActive = false;
        state.restTimerSeconds = 0;
        state.restTimerTargetTimestampMs = null;
        state.restNotificationId = null;
      });
      liveActivityManager.updateRest(null);
    },
    
    updateRestTimerTarget: (targetMs: number | null) => {
      if (!targetMs) {
        get().dismissRestTimer();
        return;
      }
      const now = Date.now();
      if (targetMs <= now) {
        get().dismissRestTimer();
        return;
      }
      const secondsRemaining = Math.ceil((targetMs - now) / 1000);
      set((state) => {
        state.restTimerActive = true;
        state.restTimerTargetTimestampMs = targetMs;
        state.restTimerSeconds = secondsRemaining;
      });
      // We don't call liveActivityManager.updateRest here because this was triggered FROM the Live Activity.
      // Though we could reschedule the notification if we wanted to.
    },

    setSessionConditions: (conditions: string[]) => {
      set((state) => {
        state.conditions = conditions;
      });
      const sessionId = get().activeSession?.id;
      if (sessionId) {
        Q.updateSessionConditions(sessionId, conditions);
      }
    },

    // ─── Phase 1: Zero-latency ascent logging ──────────────────────────────────
    logAscent: (gradeScalar, status) => {
      const { activeSession } = get();
      if (!activeSession) return;

      const id = uuid();
      const timestamp = Date.now();

      // Synchronously write to Ascents table (zero-latency, no awaiting)
      try {
        insertAscent(id, activeSession.id, gradeScalar, status, timestamp);
      } catch (e) {
        console.warn('[logAscent] DB write failed:', e);
      }

      // Immediately update Zustand so UI re-renders without any network round-trip
      set((state) => {
        state.ascents.push({ id, sessionId: activeSession.id, gradeScalar, status, timestamp, isSynced: 0 });
      });

      // Sync the unified sends total to Live Activity
      const state = get();
      const globalSends = state.ascents.filter(a => a.status === 'SEND' || a.status === 'FLASH').length;
      const groupSends = state.groups.reduce((acc, g) => acc + g.logs.filter(l => l.outcome === 'send' || l.outcome === 'flash').length, 0);
      liveActivityManager.updateSends(globalSends + groupSends);
    },

    logWidgetAscent: (status) => {
      const state = get();
      const { groups } = state;
      const uncompleted = groups.filter((g) => !g.isCompleted);
      const candidates = uncompleted.length > 0 ? uncompleted : groups;
      const activeGroup = candidates[0];
      if (activeGroup) {
        const currentLog = activeGroup.logs.find(
          (l) => l.outcome !== 'send' && l.outcome !== 'flash'
        ) ?? activeGroup.logs[activeGroup.logs.length - 1];
        if (currentLog) {
          if (status === 'SEND') {
            get().setOutcome(activeGroup.id, currentLog.id, 'send');
          } else if (status === 'ATTEMPT') {
            get().incrementAttempts(activeGroup.id, currentLog.id);
          }
          // Optionally trigger haptics
          try {
            const { triggerLogAction } = require('../utils/haptics');
            triggerLogAction();
          } catch (e) { }
        }
      }
    },

    clearAscents: () => {
      liveActivityManager.endSession();
      set((state) => { state.ascents = []; });
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


useSessionStore.subscribe((state, prevState) => {
  if (state.groups !== prevState.groups || state.ascents !== prevState.ascents) {
    if (state.groups.length > 0) {
      // Find candidate groups: prefer uncompleted blocks.
      // Since groups are ordered, the first uncompleted group is the 'next' block.
      const uncompletedGroups = state.groups.filter((g) => !g.isCompleted);
      const candidateGroups = uncompletedGroups.length > 0 ? uncompletedGroups : state.groups;

      // Ensure we are selecting the correct sequential block
      let activeGroup = candidateGroups[0];

      const isComplete = uncompletedGroups.length === 0;
      const totalSets = activeGroup.logs.length;

      if (totalSets > 0) {
        // Current set is the first set that is not yet sent or flashed
        const firstUncompletedIndex = activeGroup.logs.findIndex(
          (l) => l.outcome !== 'send' && l.outcome !== 'flash'
        );
        const currentSet = firstUncompletedIndex >= 0 ? firstUncompletedIndex + 1 : totalSets;
        const activeLog = activeGroup.logs[currentSet - 1] ?? activeGroup.logs[totalSets - 1];
        const grade = activeLog ? activeLog.gradeRaw : 'V?';

        liveActivityManager.updateZoneContext(activeGroup.zoneName, grade, currentSet, totalSets, isComplete);
      } else {
        liveActivityManager.updateZoneContext(activeGroup.zoneName, 'V?', 0, 0, isComplete);
      }
    } else {
      liveActivityManager.updateZoneContext(null, null, 0, 0, false);
    }
  }
});
