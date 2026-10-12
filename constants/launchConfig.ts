import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Minimum number of days between launches required to show the branded intro sequence.
 * Default is 0 (show on every cold start).
 */
export const INTRO_MIN_GAP_DAYS = 0;

/**
 * AsyncStorage key used to store the ISO timestamp of the last app open.
 */
export const LAST_OPENED_STORAGE_KEY = "@cruxlog/last_opened_at";

/**
 * Checks if the branded launch intro should be displayed based on
 * the minimum days gap since the last recorded open.
 * First ever launch always returns true.
 * Storage errors safely default to true.
 */
export async function shouldShowLaunchIntro(
  minGapDays: number = INTRO_MIN_GAP_DAYS
): Promise<boolean> {
  try {
    const lastOpenedStr = await AsyncStorage.getItem(LAST_OPENED_STORAGE_KEY);
    if (!lastOpenedStr) {
      // First ever launch
      return true;
    }
    if (minGapDays <= 0) {
      return true;
    }
    const lastOpenedTime = new Date(lastOpenedStr).getTime();
    if (isNaN(lastOpenedTime)) {
      return true;
    }
    const now = Date.now();
    const gapMs = now - lastOpenedTime;
    const minGapMs = minGapDays * 24 * 60 * 60 * 1000;
    return gapMs >= minGapMs;
  } catch (error) {
    console.warn("[launchConfig] Failed to read lastOpenedAt:", error);
    return true;
  }
}

/**
 * Records the current timestamp as the last opened time in AsyncStorage.
 */
export async function recordAppOpen(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      LAST_OPENED_STORAGE_KEY,
      new Date().toISOString()
    );
  } catch (error) {
    console.warn("[launchConfig] Failed to record lastOpenedAt:", error);
  }
}
