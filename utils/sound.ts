import { Audio } from 'expo-av';

let chimeSound: Audio.Sound | null = null;
let isAudioConfigured = false;

async function configureAudio(): Promise<void> {
  if (isAudioConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    isAudioConfigured = true;
  } catch (err) {
    console.warn('CruxLog Sound: Failed to configure audio mode', err);
  }
}

/**
 * Plays a crisp 0.55s gym-penetrating bell chime when the rest timer reaches 0.
 * Reuses the preloaded audio instance for sub-millisecond playback latency.
 */
export async function playRestTimerChime(): Promise<void> {
  try {
    await configureAudio();

    if (chimeSound) {
      await chimeSound.replayAsync();
      return;
    }

    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/timer_chime.wav'),
      { shouldPlay: true, volume: 1.0 }
    );
    chimeSound = sound;
  } catch (err) {
    // Graceful fallback if device audio is disabled or unavailable
    console.warn('CruxLog Sound: Failed to play rest timer chime', err);
  }
}

/**
 * Optional manual cleanup of sound resources
 */
export async function unloadRestTimerChime(): Promise<void> {
  if (chimeSound) {
    try {
      await chimeSound.unloadAsync();
      chimeSound = null;
    } catch {}
  }
}
