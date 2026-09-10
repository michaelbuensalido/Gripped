import { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';

/**
 * Drives the global rest timer — ticks the store every second while active.
 * Mount this once at the session root.
 */
export function useRestTimer(): void {
  const restTimerActive = useSessionStore((s) => s.restTimerActive);
  const tickRestTimer = useSessionStore((s) => s.tickRestTimer);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (restTimerActive) {
      intervalRef.current = setInterval(tickRestTimer, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restTimerActive, tickRestTimer]);
}
