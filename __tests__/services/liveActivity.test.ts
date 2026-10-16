import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getDatabase } from '../../db/schema';
import * as Q from '../../db/queries';
import { useSessionStore } from '../../store/sessionStore';
import {
  liveActivityManager,
  resolveQuickLogGrade,
  getSessionLiveTelemetry,
  setLiveActivityTestingOverrides,
} from '../../services/liveActivity';

describe('Dynamic Island & Lock Screen LiveActivityManager', () => {
  let db: any;
  let mockNativeLiveActivities: {
    startActivity: ReturnType<typeof jest.fn>;
    updateActivity: ReturnType<typeof jest.fn>;
    endActivity: ReturnType<typeof jest.fn>;
    getPendingOfflineAscents: ReturnType<typeof jest.fn>;
    clearPendingOfflineAscents: ReturnType<typeof jest.fn>;
    getPendingWidgetAction: ReturnType<typeof jest.fn>;
    getActiveRestEndTimestamp: ReturnType<typeof jest.fn>;
    clearActiveRestAction: ReturnType<typeof jest.fn>;
    addListener: ReturnType<typeof jest.fn>;
    removeListeners: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    mockNativeLiveActivities = {
      startActivity: jest.fn(),
      updateActivity: jest.fn(),
      endActivity: jest.fn(),
      getPendingOfflineAscents: jest.fn(async () => ''),
      clearPendingOfflineAscents: jest.fn(async () => true),
      getPendingWidgetAction: jest.fn(async () => ({ action: '', sendCount: 0, climbCount: 0 })),
      getActiveRestEndTimestamp: jest.fn(async () => 0),
      clearActiveRestAction: jest.fn(async () => true),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    };
    setLiveActivityTestingOverrides(mockNativeLiveActivities, 'ios');

    liveActivityManager.endSession();
    liveActivityManager.suspendUpdates(0);
    mockNativeLiveActivities.startActivity.mockClear();
    mockNativeLiveActivities.updateActivity.mockClear();
    mockNativeLiveActivities.endActivity.mockClear();

    db = getDatabase();
    db.execSync(`
      DELETE FROM outbox;
      DELETE FROM climbs;
      DELETE FROM projects;
      DELETE FROM sessions;
    `);

    useSessionStore.setState({
      activeSessionId: null,
      activeProjectTarget: null,
      restTimerEndTime: null,
      isRestTimerRunning: false,
      restNotificationId: null,
    });
  });

  it('starts Live Activity when a quick session starts and updates sends/climbs on log', () => {
    const store = useSessionStore.getState();
    const sessionId = store.startQuickSession('Brooklyn Boulders');

    expect(mockNativeLiveActivities.startActivity).toHaveBeenCalledWith(
      'Brooklyn Boulders',
      sessionId,
      expect.any(Number),
      0,
      0
    );

    // Log a V4 send
    store.logGenericAscent({
      gradeRaw: 'V4',
      outcome: 'send',
      movesLinked: 2,
    });

    const telemetry = getSessionLiveTelemetry(sessionId);
    expect(telemetry.sendCount).toBe(1);
    expect(telemetry.climbCount).toBe(1);
    expect(telemetry.latestGrade).toBe('V4');

    expect(mockNativeLiveActivities.updateActivity).toHaveBeenLastCalledWith(
      1,    // sendCount
      1,    // climbCount
      0,    // restTarget
      '',   // zoneName
      'V4', // currentGrade
      0,
      0,
      false
    );

    // Log a V5 attempt
    store.logGenericAscent({
      gradeRaw: 'V5',
      outcome: 'attempt',
      movesLinked: 1,
    });

    expect(mockNativeLiveActivities.updateActivity).toHaveBeenLastCalledWith(
      1,    // sendCount stays 1
      2,    // climbCount increments to 2
      0,
      '',
      'V5', // latestGrade updates to V5
      0,
      0,
      false
    );
  });

  it('resolves quick-log grade in priority order: activeProjectTarget -> last session climb -> V0', () => {
    const store = useSessionStore.getState();
    store.startQuickSession('Movement Gym');

    // 1. No climbs and no project targeted -> fallback to V0
    expect(resolveQuickLogGrade()).toBe('V0');

    // 2. Log a V3 climb -> resolves to V3
    store.logGenericAscent({
      gradeRaw: 'V3',
      outcome: 'send',
      movesLinked: 1,
    });
    expect(resolveQuickLogGrade()).toBe('V3');

    // 3. Target a V6 project -> resolves to V6
    store.setActiveProjectTarget({
      id: 'proj_1',
      title: 'Crimpy Arete',
      grade: 'V6',
      wallAngle: 'overhang',
      holdType: 'crimps',
    });
    expect(resolveQuickLogGrade()).toBe('V6');
  });

  it('logs climbs from Lock Screen / Dynamic Island quick-log (SEND & ATTEMPT) without double counting', async () => {
    const store = useSessionStore.getState();
    const sessionId = store.startQuickSession('Crux Factory');

    // Seed an initial V4 climb so quick-log uses V4
    store.logGenericAscent({
      gradeRaw: 'V4',
      outcome: 'attempt',
      movesLinked: 1,
    });

    // Simulate widget writing two ascents to App Group queue
    mockNativeLiveActivities.getPendingOfflineAscents.mockImplementation(
      async () => '1700000001.1|ATTEMPT,1700000002.2|SEND'
    );

    await liveActivityManager.handleWidgetEvent({ action: 'SEND', sendCount: 1, climbCount: 3 });

    const climbs = Q.getClimbsForSession(sessionId);
    expect(climbs.length).toBe(3); // 1 initial + 1 ATTEMPT + 1 SEND
    const sends = climbs.filter((c) => c.result === 'send' || c.result === 'top');
    expect(sends.length).toBe(1);
    expect(sends[0].grade_raw).toBe('V4');

    // Verify foreground sync does not double-count the same event keys
    await liveActivityManager.handleForegroundSync();
    expect(Q.getClimbsForSession(sessionId).length).toBe(3);
  });

  it('syncs rest timer adjustments (-15s / +15s) and SkipRest from widget to sessionStore', async () => {
    const store = useSessionStore.getState();
    store.startQuickSession('Vertical World');

    // Start a 3-minute rest timer from the app
    const initialEnd = Date.now() + 180 * 1000;
    store.setRestTimer(initialEnd, true);

    expect(mockNativeLiveActivities.updateActivity).toHaveBeenCalledWith(
      0,
      0,
      expect.closeTo(initialEnd / 1000, 1),
      '',
      'V0',
      0,
      0,
      false
    );

    // Simulate user tapping +15s on Lock Screen
    const adjustedEndSec = Math.floor((initialEnd + 15000) / 1000);
    await liveActivityManager.handleWidgetEvent({
      action: 'AdjustRest',
      restEndDate: adjustedEndSec,
    });

    expect(useSessionStore.getState().isRestTimerRunning).toBe(true);
    expect(useSessionStore.getState().restTimerEndTime).toBe(adjustedEndSec * 1000);

    // Simulate user tapping Skip on Lock Screen
    await liveActivityManager.handleWidgetEvent({
      action: 'SkipRest',
      restEndDate: 0,
    });

    expect(useSessionStore.getState().isRestTimerRunning).toBe(false);
    expect(useSessionStore.getState().restTimerEndTime).toBeNull();
  });

  it('ends Live Activity when session is completed or discarded', () => {
    const store = useSessionStore.getState();
    const sessionId = store.startQuickSession('Boulder Lab');

    Q.completeSessionWrapUp(
      sessionId,
      Date.now(),
      'Evening Session',
      '',
      'Boulder Lab',
      3,
      []
    );

    expect(mockNativeLiveActivities.endActivity).toHaveBeenCalled();
  });
});
