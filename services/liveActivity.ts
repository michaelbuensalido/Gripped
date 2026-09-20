import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { useSessionStore } from '../store/sessionStore';

// Defensive wrapper around react-native-live-activities native module.
// The module registers itself as NativeModules.LiveActivities via Obj-C bridge.

const LiveActivities = NativeModules.LiveActivities;

class LiveActivityManager {
  private isActive = false;
  private currentSessionStartTime: number | null = null;

  private currentSends = 0;
  private currentRestTarget: number | null = null;
  private currentZoneName: string | null = null;
  private currentGrade: string | null = null;
  private currentSet: number = 0;
  private totalSets: number = 0;

  constructor() {
    if (Platform.OS === 'ios' && LiveActivities) {
      const eventEmitter = new NativeEventEmitter(LiveActivities);
      eventEmitter.addListener('onLiveActivityStateChanged', (event: any) => {
        console.log('[LiveActivity] Received action from native widget:', event);
        if (event.action === 'AdjustRest' || event.action === 'SkipRest') {
           // event.restEndDate is in seconds, store needs ms
           const targetMs = event.restEndDate > 0 ? event.restEndDate * 1000 : null;
           const store = useSessionStore.getState();
           if (targetMs !== store.restTimerTargetTimestampMs) {
             // Update the store directly
             store.updateRestTimerTarget(targetMs);
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

    this.isActive = true;
    this.currentSessionStartTime = Date.now();
    this.currentSends = 0;
    this.currentRestTarget = null;
    this.currentZoneName = null;
    this.currentGrade = null;
    this.currentSet = 0;
    this.totalSets = 0;

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

  public updateZoneContext(zoneName: string | null, grade: string | null, currentSet: number, totalSets: number) {
    if (Platform.OS !== 'ios' || !LiveActivities) return;
    this.isActive = true;
    this.currentZoneName = zoneName;
    this.currentGrade = grade;
    this.currentSet = currentSet;
    this.totalSets = totalSets;
    this.pushState();
  }

  private pushState() {
    try {
      const restTarget = this.currentRestTarget ? this.currentRestTarget / 1000 : 0;
      LiveActivities.updateActivity(
        this.currentSends, 
        restTarget,
        this.currentZoneName || "",
        this.currentGrade || "",
        this.currentSet,
        this.totalSets
      );
      console.log('[LiveActivity] ✅ updateActivity called — sends:', this.currentSends, 'rest:', restTarget, 'zone:', this.currentZoneName);
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
    this.currentSessionStartTime = null;
  }
}

export const liveActivityManager = new LiveActivityManager();

