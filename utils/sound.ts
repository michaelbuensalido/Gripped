import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

let chimePlayer: AudioPlayer | null = null;
let isAudioConfigured = false;

async function configureAudio(): Promise<void> {
  if (isAudioConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
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

    if (!chimePlayer) {
      chimePlayer = createAudioPlayer(require('../assets/sounds/timer_chime.wav'));
    } else {
      await chimePlayer.seekTo(0);
    }
    chimePlayer.play();
  } catch (err) {
    // Graceful fallback if device audio is disabled or unavailable
    console.warn('CruxLog Sound: Failed to play rest timer chime', err);
  }
}

/**
 * Optional manual cleanup of sound resources
 */
export async function unloadRestTimerChime(): Promise<void> {
  if (chimePlayer) {
    try {
      chimePlayer.remove();
      chimePlayer = null;
    } catch {}
  }
}
