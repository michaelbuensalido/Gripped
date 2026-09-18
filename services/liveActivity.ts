import { Platform, NativeModules } from 'react-native';

// Defensive wrapper around react-native-live-activities native module.
// The module registers itself as NativeModules.LiveActivities via Obj-C bridge.

const LiveActivities = NativeModules.LiveActivities;

class LiveActivityManager {
  private isActive = false;
  private currentSessionStartTime: number | null = null;

  private currentSends = 0;
  private currentRestTarget: number | null = null;

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

  private pushState() {
    try {
      const restTarget = this.currentRestTarget ? this.currentRestTarget / 1000 : 0;
      LiveActivities.updateActivity({
        sendCount: this.currentSends,
        restEndTimestamp: restTarget
      });
      console.log('[LiveActivity] ✅ updateActivity called — sends:', this.currentSends, 'rest:', restTarget);
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
