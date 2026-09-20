import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSessionStore } from '../store/sessionStore';
import { hapticEngine } from '../services/hapticEngine';
import { playRestTimerChime } from '../utils/sound';

/**
 * Drives the global rest timer — ticks the store using target timestamp calculations
 * to guarantee drift-free timing across background transitions.
 * Fires a triple-pulse tactile sequence and audio chime on timer completion.
 */
export function useRestTimer(): void {
  const restTimerActive = useSessionStore((s) => s.restTimerActive);
  const restTimerTarget = useSessionStore((s) => s.restTimerTargetTimestampMs);
  const syncRestTimer = useSessionStore((s) => s.syncRestTimer);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    if (restTimerActive) {
      hasAlertedRef.current = false;

      const checkTime = () => {
        const remaining = syncRestTimer();
        if (remaining <= 0 && !hasAlertedRef.current) {
          hasAlertedRef.current = true;
          hapticEngine.triggerRestComplete();
          playRestTimerChime();
        }
      };

      // Initial sync
      checkTime();
      intervalRef.current = setInterval(checkTime, 500);

      // Immediate sync upon returning from background/locked state
      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          checkTime();
        }
      });

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        subscription.remove();
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [restTimerActive, syncRestTimer, restTimerTarget]);
}

