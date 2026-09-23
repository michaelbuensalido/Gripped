import { Platform, NativeModules, NativeEventEmitter, AppState } from 'react-native';
import { useSessionStore } from '../store/sessionStore';

// Defensive wrapper around react-native-live-activities native module.
// The module registers itself as NativeModules.LiveActivities via Obj-C bridge.

const LiveActivities = NativeModules.LiveActivities;

class LiveActivityManager {
  private isActive = false;
  private currentSessionId: string | null = null;
  private currentSessionStartTime: number | null = null;

  private currentSends = 0;
  private currentRestTarget: number | null = null;
  private currentZoneName: string | null = null;
  private currentGrade: string | null = null;
  private currentSet: number = 0;
  private totalSets: number = 0;
  private isComplete: boolean = false;

  constructor() {
    if (Platform.OS === 'ios' && LiveActivities) {
      const eventEmitter = new NativeEventEmitter(LiveActivities);
      eventEmitter.addListener('onLiveActivityStateChanged', (event: any) => {
        console.log('[LiveActivity] Received action from native widget:', event);
        const store = useSessionStore.getState();

        if (event.action === 'AdjustRest') {
           const targetMs = event.restEndDate > 0 ? event.restEndDate * 1000 : null;
           if (targetMs !== store.restTimerTargetTimestampMs) {
             store.updateRestTimerTarget(targetMs);
           }
        } else if (event.action === 'SkipRest') {
           // Suspend updates for 1.5s so the SwiftUI SKIPPED animation can finish
           liveActivityManager.suspendUpdates(1500);
           store.dismissRestTimer();
        } else if (event.action === 'SEND' || event.action === 'ATTEMPT') {
           // Suspend updates for 1.5s so the SwiftUI Checkmark/Flame animation can finish
           liveActivityManager.suspendUpdates(1500);
           store.logWidgetAscent(event.action as 'SEND' | 'ATTEMPT');
           
           // Clear the offline queue so AppState foreground doesn't double-count this
           if (LiveActivities.clearPendingOfflineAscents) {
             LiveActivities.clearPendingOfflineAscents().catch(() => {});
           }
        } else if (event.action === 'FINISH_SESSION') {
           // If the user tapped FINISH on the widget, end the session in JS too
           // This will natively end the activity automatically because store.clearAscents calls endSession
           store.clearAscents();
           // Also clear queue just in case
           if (LiveActivities.clearPendingOfflineAscents) {
             LiveActivities.clearPendingOfflineAscents().catch(() => {});
           }
        }
      });

      AppState.addEventListener('change', async (nextAppState) => {
        if (nextAppState === 'active') {
          console.log(`[DIAGNOSTIC TRACE] App Foregrounded at: ${Date.now()}ms`);

          try {
            // 1. Process Offline Queue via App Groups (User specified)
            if (LiveActivities.getPendingOfflineAscents) {
              const pendingStr = await LiveActivities.getPendingOfflineAscents();
              if (pendingStr && pendingStr.trim() !== '') {
                console.log(`[LiveActivity] Found pending offline ascents: ${pendingStr}`);
                const events = pendingStr.split(',');
                const store = useSessionStore.getState();
                for (const event of events) {
                  const parts = event.split('|');
                  if (parts.length === 2) {
                    const status = parts[1];
                    if (status === 'SEND' || status === 'ATTEMPT') {
                      console.log(`[LiveActivity] Dispatching queued offline ascent: ${status}`);
                      store.logWidgetAscent(status as 'SEND' | 'ATTEMPT');
                    }
                  }
                }
                // CRITICAL: Clear the queue so we don't double count
                if (LiveActivities.clearPendingOfflineAscents) {
                  await LiveActivities.clearPendingOfflineAscents();
                }
              }
            }

            // 2. Read single pending action directly from ActivityKit
            if (LiveActivities.getPendingWidgetAction) {
              const result = await LiveActivities.getPendingWidgetAction();
              const action: string = result?.action ?? '';
              console.log(`[DIAGNOSTIC TRACE] getPendingWidgetAction → action="${action}"`);

              const store = useSessionStore.getState();

              if (action === 'SkipRest') {
                if (LiveActivities.clearActiveRestAction) await LiveActivities.clearActiveRestAction();
                if (store.restTimerActive) store.dismissRestTimer();
                return;
              }

              if (action === 'AdjustRest') {
                if (LiveActivities.clearActiveRestAction) await LiveActivities.clearActiveRestAction();
                // Fall through to timestamp path below for the actual target
              }

              if (action === 'SEND' || action === 'ATTEMPT') {
                console.log(`[DIAGNOSTIC TRACE] Applying widget action: ${action}`);
                if (LiveActivities.clearActiveRestAction) await LiveActivities.clearActiveRestAction();
                // Since we already process PendingOfflineAscents above which covers SEND and ATTEMPT,
                // we probably don't need to do it again here. But if the queue failed, this acts as a fallback.
                // The widget only sets the queue now, but it also sets the state action. We should be careful of double counting.
                // If we processed from the queue, we shouldn't process here.
              }
            }

            // 3. Secondary path: rest timer drift correction via timestamp
            if (LiveActivities.getActiveRestEndTimestamp) {
              const timestampSeconds = await LiveActivities.getActiveRestEndTimestamp();
              if (timestampSeconds && timestampSeconds > 0) {
                const targetMs = timestampSeconds * 1000;
                const remaining = Math.max(0, Math.round((targetMs - Date.now()) / 1000));
                const store = useSessionStore.getState();
                if (remaining > 0 && Math.abs(targetMs - (store.restTimerTargetTimestampMs ?? 0)) > 2000) {
                  store.updateRestTimerTarget(targetMs);
                }
              }
            }
          } catch (e) {
            console.warn('[LiveActivity] AppState foreground handler failed:', e);
          }
        }
      });
    }
  }

  public startSession(sessionId: string, sessionName: string) {
    if (Platform.OS !== 'ios') return;
    if (!LiveActivities) {
      console.warn('[LiveActivity] NativeModules.LiveActivities not found — was the app rebuilt after pod install?');
      return;
    }

    if (this.isActive && this.currentSessionId === sessionId) {
      this.pushState();
      return;
    }

    this.isActive = true;
    this.currentSessionId = sessionId;
    this.currentSessionStartTime = Date.now();
    this.currentSends = 0;
    this.currentRestTarget = null;
    this.currentZoneName = null;
    this.currentGrade = null;
    this.currentSet = 0;
    this.totalSets = 0;
    this.isComplete = false;

    try {
      LiveActivities.startActivity(
        sessionName,
        sessionId,
        this.currentSessionStartTime / 1000,
        0
      );
      console.log('[LiveActivity] ✅ startActivity called');
    } catch (e) {
      console.warn('[LiveActivity] startActivity failed', e);
    }
  }

  public updateSends(sendCount: number) {
    if (Platform.OS !== 'ios' || !LiveActivities) return;
    this.isActive = true; // Recover state
    this.currentSends = sendCount;
    this.pushState();
  }

  public updateRest(targetTimestampMs: number | null) {
    if (Platform.OS !== 'ios' || !LiveActivities) return;
    this.isActive = true; // Recover state
    this.currentRestTarget = targetTimestampMs;
    this.pushState();
  }

  public updateZoneContext(zoneName: string | null, grade: string | null, currentSet: number, totalSets: number, isComplete: boolean) {
    if (Platform.OS !== 'ios' || !LiveActivities) return;
    this.isActive = true;
    this.currentZoneName = zoneName;
    this.currentGrade = grade;
    this.currentSet = currentSet;
    this.totalSets = totalSets;
    this.isComplete = isComplete;
    this.pushState();
  }

  private updateTimeout: ReturnType<typeof setTimeout> | null = null;
  private suspendUntil: number = 0;

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
    try {
      const restTarget = this.currentRestTarget ? this.currentRestTarget / 1000 : 0;
      LiveActivities.updateActivity(
        this.currentSends, 
        restTarget,
        this.currentZoneName || "",
        this.currentGrade || "",
        this.currentSet,
        this.totalSets,
        this.isComplete
      );
      console.log('[LiveActivity] ✅ updateActivity called — sends:', this.currentSends, 'rest:', restTarget, 'zone:', this.currentZoneName, 'isComplete:', this.isComplete);
    } catch (e) {
      console.warn('[LiveActivity] updateActivity failed', e);
    }
  }

  public endSession() {
    if (Platform.OS !== 'ios' || !LiveActivities || !this.isActive) return;

    try {
      LiveActivities.endActivity();
      console.log('[LiveActivity] ✅ endActivity called');
    } catch (e) {
      console.warn('[LiveActivity] endActivity failed', e);
    }
    this.isActive = false;
    this.currentSessionId = null;
    this.currentSessionStartTime = null;
  }
}

export const liveActivityManager = new LiveActivityManager();

