import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Returns a live-updating elapsed time string ("HH:MM:SS")
 * strictly calculated against wall-clock timestamps to avoid timer drift.
 * Automatically recalculates when transitioning back to 'active' AppState.
 */
export function useSessionTimer(startTime: number | null, endTime: number | null): string {
  const [elapsed, setElapsed] = useState('00:00:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startTime) return;

    const tick = () => {
      const base = endTime ?? Date.now();
      setElapsed(formatElapsed(base - startTime));
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    // Immediate recalculation when the app transitions back to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        tick();
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [startTime, endTime]);

  return elapsed;
}

