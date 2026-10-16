import { useSessionStore } from '../store/sessionStore';
import { getDatabase } from '../db/schema';
import { getActiveSession, completeSessionWrapUp } from '../db/queries';
import { dbEvents } from '../db/events';
import { isSend } from '../utils/isSend';

let _mockNativeModule: any = undefined;
let _mockPlatformOS: string | undefined = undefined;

export function setLiveActivityTestingOverrides(nativeModule?: any, platformOS?: string) {
  _mockNativeModule = nativeModule;
  _mockPlatformOS = platformOS;
}

function getPlatformOS(): string {
  if (_mockPlatformOS !== undefined) return _mockPlatformOS;
  try {
    const { Platform } = require('react-native');
    return Platform?.OS ?? 'ios';
  } catch {
    return 'ios';
  }
}

function getNativeLiveActivities(): any {
  if (_mockNativeModule !== undefined) return _mockNativeModule;
  try {
    const { NativeModules } = require('react-native');
    return NativeModules?.LiveActivities ?? null;
  } catch {
    return null;
  }
}

export function resolveQuickLogGrade(): string {
  try {
    const store = useSessionStore.getState();
    const targetGrade = store.activeProjectTarget?.grade || store.activeProjectTarget?.gradeRaw;
    if (targetGrade && typeof targetGrade === 'string' && targetGrade !== 'V?') {
      return targetGrade;
    }

    const activeSession = getActiveSession();
    if (activeSession) {
      const db = getDatabase();
      const row = db.getFirstSync<{ grade_raw: string }>(
        `SELECT grade_raw FROM climbs WHERE session_id = ? AND deleted_at IS NULL ORDER BY logged_at DESC, created_at DESC, rowid DESC LIMIT 1`,
        [activeSession.id]
      );
      if (row?.grade_raw && row.grade_raw !== 'V?') {
        return row.grade_raw;
      }
    }
  } catch (e) {
    console.warn('[LiveActivity] resolveQuickLogGrade fallback to V0:', e);
  }
  return 'V0';
}

export function getSessionLiveTelemetry(sessionId: string): {
  sendCount: number;
  climbCount: number;
  latestGrade: string | null;
} {
  try {
    const db = getDatabase();
    const rows = db.getAllSync<{ result: string; grade_raw: string }>(
      `SELECT result, grade_raw FROM climbs WHERE session_id = ? AND deleted_at IS NULL ORDER BY logged_at DESC, created_at DESC, rowid DESC`,
      [sessionId]
    );
    const climbCount = rows.length;
    const sendCount = rows.filter((r) => isSend(r.result)).length;
    const latestGrade =
      rows.length > 0 && rows[0].grade_raw && rows[0].grade_raw !== 'V?'
        ? rows[0].grade_raw
        : null;
    return { sendCount, climbCount, latestGrade };
  } catch {
    return { sendCount: 0, climbCount: 0, latestGrade: null };
  }
}

export class LiveActivityManager {
  private isActive = false;
  private currentSessionId: string | null = null;
  private currentSessionStartTime: number | null = null;

  private currentSends = 0;
  private currentClimbs = 0;
  private currentRestTarget: number | null = null;
  private currentZoneName: string | null = null;
  private currentGrade: string | null = null;
  private currentSet = 0;
  private totalSets = 0;
  private isComplete = false;

  private updateTimeout: ReturnType<typeof setTimeout> | null = null;
  private suspendUntil = 0;
  private isSyncingQueue = false;
  private processedEventKeys = new Set<string>();

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    const LiveActivities = getNativeLiveActivities();
    if (getPlatformOS() === 'ios' && LiveActivities) {
      try {
        const { NativeEventEmitter, AppState } = require('react-native');
        const eventEmitter = new NativeEventEmitter(LiveActivities);
        eventEmitter.addListener('onLiveActivityStateChanged', (event: any) => {
          this.handleWidgetEvent(event);
        });

        AppState.addEventListener('change', (nextAppState: string) => {
          if (nextAppState === 'active') {
            this.handleForegroundSync();
          }
        });
      } catch (e) {
        console.warn('[LiveActivity] Failed to attach native listeners:', e);
      }
    }

    dbEvents.subscribe(() => {
      this.syncFromDatabase();
    });
  }

  public async handleWidgetEvent(event: any) {
    if (!event || !event.action) return;
    const LiveActivities = getNativeLiveActivities();
    const store = useSessionStore.getState();

    if (event.action === 'AdjustRest') {
      const targetMs = event.restEndDate && event.restEndDate > 0 ? Math.round(event.restEndDate * 1000) : null;
      const isRunning = targetMs !== null && targetMs > Date.now();
      this.currentRestTarget = isRunning ? targetMs : null;
      store.setRestTimer(isRunning ? targetMs : null, isRunning, { fromLiveActivity: true });
      if (LiveActivities?.clearActiveRestAction) {
        LiveActivities.clearActiveRestAction().catch(() => {});
      }
    } else if (event.action === 'SkipRest') {
      this.suspendUpdates(1200);
      this.currentRestTarget = null;
      store.setRestTimer(null, false, { fromLiveActivity: true });
      if (LiveActivities?.clearActiveRestAction) {
        LiveActivities.clearActiveRestAction().catch(() => {});
      }
    } else if (event.action === 'SEND' || event.action === 'ATTEMPT') {
      this.suspendUpdates(1200);
      const consumedFromQueue = await this.consumePendingOfflineAscents();
      if (!consumedFromQueue) {
        this.logQuickAscentFromWidget(event.action);
      }
      if (LiveActivities?.clearActiveRestAction) {
        LiveActivities.clearActiveRestAction().catch(() => {});
      }
    } else if (event.action === 'FINISH_SESSION') {
      const activeSession = getActiveSession();
      const sessionId = store.activeSessionId || activeSession?.id;
      if (sessionId) {
        completeSessionWrapUp(
          sessionId,
          Date.now(),
          activeSession?.title || 'Session',
          activeSession?.notes || '',
          activeSession?.gymName || 'Local Gym',
          null,
          []
        );
        store.setActiveSessionId(null);
      }
      if (LiveActivities?.clearPendingOfflineAscents) {
        LiveActivities.clearPendingOfflineAscents().catch(() => {});
      }
    }
  }

  private logQuickAscentFromWidget(status: 'SEND' | 'ATTEMPT') {
    const store = useSessionStore.getState();
    const gradeRaw = resolveQuickLogGrade();
    const targetProj = store.activeProjectTarget;

    store.logGenericAscent({
      gradeRaw,
      outcome: status === 'SEND' ? 'send' : 'attempt',
      movesLinked: 1,
      projectId: targetProj ? targetProj.id : undefined,
      wallAngle: targetProj ? targetProj.wallAngle : undefined,
      holdType: targetProj ? targetProj.holdType : undefined,
    });
  }

  public async consumePendingOfflineAscents(): Promise<boolean> {
    const LiveActivities = getNativeLiveActivities();
    if (!LiveActivities?.getPendingOfflineAscents) return false;
    if (this.isSyncingQueue) return true;

    this.isSyncingQueue = true;
    let loggedAny = false;

    try {
      const pendingStr = await LiveActivities.getPendingOfflineAscents();
      if (pendingStr && pendingStr.trim() !== '') {
        if (LiveActivities.clearPendingOfflineAscents) {
          await LiveActivities.clearPendingOfflineAscents();
        }
        const events = pendingStr.split(',');
        for (const rawEvent of events) {
          const trimmed = rawEvent.trim();
          if (!trimmed || this.processedEventKeys.has(trimmed)) continue;
          const parts = trimmed.split('|');
          if (parts.length === 2) {
            const status = parts[1];
            if (status === 'SEND' || status === 'ATTEMPT') {
              this.processedEventKeys.add(trimmed);
              this.logQuickAscentFromWidget(status);
              loggedAny = true;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[LiveActivity] consumePendingOfflineAscents failed:', e);
    } finally {
      this.isSyncingQueue = false;
    }

    return loggedAny;
  }

  public async handleForegroundSync() {
    const LiveActivities = getNativeLiveActivities();
    if (getPlatformOS() !== 'ios' || !LiveActivities) return;

    try {
      await this.consumePendingOfflineAscents();

      if (LiveActivities.getPendingWidgetAction) {
        const result = await LiveActivities.getPendingWidgetAction();
        const action: string = result?.action ?? '';
        const store = useSessionStore.getState();

        if (action === 'SkipRest') {
          this.currentRestTarget = null;
          store.setRestTimer(null, false, { fromLiveActivity: true });
          if (LiveActivities.clearActiveRestAction) {
            await LiveActivities.clearActiveRestAction();
          }
          return;
        }

        if (action === 'AdjustRest') {
          if (LiveActivities.clearActiveRestAction) {
            await LiveActivities.clearActiveRestAction();
          }
        }
      }

      if (LiveActivities.getActiveRestEndTimestamp) {
        const timestampSeconds = await LiveActivities.getActiveRestEndTimestamp();
        const store = useSessionStore.getState();
        if (timestampSeconds && timestampSeconds > 0) {
          const targetMs = Math.round(timestampSeconds * 1000);
          if (targetMs > Date.now()) {
            this.currentRestTarget = targetMs;
            if (
              !store.isRestTimerRunning ||
              Math.abs((store.restTimerEndTime ?? 0) - targetMs) > 1500
            ) {
              store.setRestTimer(targetMs, true, { fromLiveActivity: true });
            }
          } else if (store.isRestTimerRunning) {
            this.currentRestTarget = null;
            store.setRestTimer(null, false, { fromLiveActivity: true });
          }
        }
      }

      this.syncFromDatabase();
    } catch (e) {
      console.warn('[LiveActivity] AppState foreground handler failed:', e);
    }
  }

  public syncFromDatabase() {
    const LiveActivities = getNativeLiveActivities();
    if (getPlatformOS() !== 'ios' || !LiveActivities) return;

    try {
      const activeSession = getActiveSession();
      if (!activeSession) {
        if (this.isActive) {
          this.endSession();
        }
        return;
      }

      const { sendCount, climbCount, latestGrade } = getSessionLiveTelemetry(activeSession.id);
      const store = useSessionStore.getState();
      const targetGrade =
        store.activeProjectTarget?.grade ||
        store.activeProjectTarget?.gradeRaw ||
        latestGrade ||
        'V0';

      if (!this.isActive || this.currentSessionId !== activeSession.id) {
        this.startSession(
          activeSession.id,
          activeSession.gymName || 'Local Gym',
          activeSession.startTime,
          sendCount,
          climbCount,
          targetGrade
        );
      } else {
        this.updateCounts(sendCount, climbCount, targetGrade);
      }
    } catch (e) {
      console.warn('[LiveActivity] syncFromDatabase failed:', e);
    }
  }

  public startSession(
    sessionId: string,
    sessionName: string,
    startTimeMs?: number,
    initialSends = 0,
    initialClimbs = 0,
    initialGrade: string | null = 'V0'
  ) {
    if (getPlatformOS() !== 'ios') return;
    const LiveActivities = getNativeLiveActivities();
    if (!LiveActivities) {
      return;
    }

    if (this.isActive && this.currentSessionId === sessionId) {
      this.currentSends = initialSends;
      this.currentClimbs = initialClimbs;
      if (initialGrade !== undefined) this.currentGrade = initialGrade;
      this.pushState();
      return;
    }

    this.isActive = true;
    this.currentSessionId = sessionId;
    this.currentSessionStartTime = startTimeMs ?? Date.now();
    this.currentSends = initialSends;
    this.currentClimbs = initialClimbs;
    this.currentRestTarget = null;
    this.currentZoneName = null;
    this.currentGrade = initialGrade;
    this.currentSet = 0;
    this.totalSets = 0;
    this.isComplete = false;

    try {
      LiveActivities.startActivity(
        sessionName || 'Local Gym',
        sessionId,
        this.currentSessionStartTime / 1000,
        initialSends,
        initialClimbs
      );
      if (initialGrade || initialSends > 0 || initialClimbs > 0) {
        this.pushState();
      }
    } catch (e) {
      console.warn('[LiveActivity] startActivity failed', e);
    }
  }

  public updateCounts(sendCount: number, climbCount: number, grade?: string | null) {
    if (getPlatformOS() !== 'ios' || !getNativeLiveActivities()) return;
    this.isActive = true;
    this.currentSends = sendCount;
    this.currentClimbs = climbCount;
    if (grade !== undefined) {
      this.currentGrade = grade;
    }
    this.pushState();
  }

  public updateSends(sendCount: number, climbCount?: number) {
    if (getPlatformOS() !== 'ios' || !getNativeLiveActivities()) return;
    this.isActive = true;
    this.currentSends = sendCount;
    if (typeof climbCount === 'number') {
      this.currentClimbs = climbCount;
    }
    this.pushState();
  }

  public updateRest(targetTimestampMs: number | null) {
    if (getPlatformOS() !== 'ios' || !getNativeLiveActivities()) return;
    this.isActive = true;
    this.currentRestTarget = targetTimestampMs;
    this.pushState();
  }

  public updateZoneContext(
    zoneName: string | null,
    grade: string | null,
    currentSet: number,
    totalSets: number,
    isComplete: boolean
  ) {
    if (getPlatformOS() !== 'ios' || !getNativeLiveActivities()) return;
    this.isActive = true;
    this.currentZoneName = zoneName;
    this.currentGrade = grade;
    this.currentSet = currentSet;
    this.totalSets = totalSets;
    this.isComplete = isComplete;
    this.pushState();
  }

  public suspendUpdates(ms: number) {
    this.suspendUntil = Date.now() + ms;
  }

  private pushState() {
    if (!this.isActive) return;

    const delay = Math.max(0, this.suspendUntil - Date.now());
    if (this.updateTimeout) clearTimeout(this.updateTimeout);

    if (delay > 0) {
      this.updateTimeout = setTimeout(() => this.executeNativeUpdate(), delay);
    } else {
      this.executeNativeUpdate();
    }
  }

  private executeNativeUpdate() {
    const LiveActivities = getNativeLiveActivities();
    if (!LiveActivities) return;
    try {
      const restTarget =
        this.currentRestTarget && this.currentRestTarget > Date.now()
          ? this.currentRestTarget / 1000
          : 0;
      LiveActivities.updateActivity(
        this.currentSends,
        this.currentClimbs,
        restTarget,
        this.currentZoneName || '',
        this.currentGrade || '',
        this.currentSet,
        this.totalSets,
        this.isComplete
      );
    } catch (e) {
      console.warn('[LiveActivity] updateActivity failed', e);
    }
  }

  public endSession() {
    const LiveActivities = getNativeLiveActivities();
    if (getPlatformOS() !== 'ios' || !LiveActivities || !this.isActive) {
      this.isActive = false;
      this.currentSessionId = null;
      this.currentSessionStartTime = null;
      return;
    }

    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }

    try {
      LiveActivities.endActivity();
    } catch (e) {
      console.warn('[LiveActivity] endActivity failed', e);
    }
    this.isActive = false;
    this.currentSessionId = null;
    this.currentSessionStartTime = null;
    this.currentRestTarget = null;
  }
}

export const liveActivityManager = new LiveActivityManager();
