import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HAPTICS_STORAGE_KEY = '@cruxlog_haptics_enabled';

let isHapticsEnabled = true;

// Initialize from storage on app startup
AsyncStorage.getItem(HAPTICS_STORAGE_KEY)
  .then((val) => {
    if (val !== null) {
      isHapticsEnabled = val === 'true';
    }
  })
  .catch(() => {});

export function getHapticsEnabled(): boolean {
  return isHapticsEnabled;
}

export async function setHapticsEnabled(enabled: boolean): Promise<void> {
  isHapticsEnabled = enabled;
  try {
    await AsyncStorage.setItem(HAPTICS_STORAGE_KEY, String(enabled));
  } catch (err) {
    console.error('Failed to persist haptic preference:', err);
  }
}

export async function triggerHaptic(
  type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light'
): Promise<void> {
  if (!isHapticsEnabled) return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // Graceful fallback on devices/simulators where haptics are not supported
  }
}

/**
 * Triggers a distinctive double-impact feedback when the rest timer begins.
 * Heavy impact followed closely by a medium impact.
 */
export async function triggerRestTimerStart(): Promise<void> {
  if (!isHapticsEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 120);
  } catch {}
}

/**
 * Triggers a distinctive triple-pulse tactile alert for rest timer completion.
 * Success notification followed by heavy and medium impacts.
 */
export async function triggerRestTimerAlert(): Promise<void> {
  if (!isHapticsEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 150);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 300);
  } catch {}
}

