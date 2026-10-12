import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import {
  INTRO_MIN_GAP_DAYS,
  LAST_OPENED_STORAGE_KEY,
  shouldShowLaunchIntro,
  recordAppOpen,
} from "../../constants/launchConfig";

describe("launchConfig", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("defaults INTRO_MIN_GAP_DAYS to 0", () => {
    expect(INTRO_MIN_GAP_DAYS).toBe(0);
  });

  it("shows intro on first launch when no timestamp exists", async () => {
    const shouldShow = await shouldShowLaunchIntro();
    expect(shouldShow).toBe(true);
  });

  it("shows intro when minGapDays is 0 even if opened recently", async () => {
    await AsyncStorage.setItem(
      LAST_OPENED_STORAGE_KEY,
      new Date().toISOString()
    );
    const shouldShow = await shouldShowLaunchIntro(0);
    expect(shouldShow).toBe(true);
  });

  it("does not show intro if gap is less than minGapDays", async () => {
    // Opened 1 day ago, required gap is 3 days
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    await AsyncStorage.setItem(LAST_OPENED_STORAGE_KEY, oneDayAgo);

    const shouldShow = await shouldShowLaunchIntro(3);
    expect(shouldShow).toBe(false);
  });

  it("shows intro if gap is greater than or equal to minGapDays", async () => {
    // Opened 4 days ago, required gap is 3 days
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    await AsyncStorage.setItem(LAST_OPENED_STORAGE_KEY, fourDaysAgo);

    const shouldShow = await shouldShowLaunchIntro(3);
    expect(shouldShow).toBe(true);
  });

  it("safely falls back to true when AsyncStorage throws an error", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("Storage corrupted"));

    const shouldShow = await shouldShowLaunchIntro(2);
    expect(shouldShow).toBe(true);
  });

  it("records app open timestamp in AsyncStorage", async () => {
    await recordAppOpen();
    const stored = await AsyncStorage.getItem(LAST_OPENED_STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(new Date(stored!).getTime()).not.toBeNaN();
  });
});
