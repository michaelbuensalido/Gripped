import { useState, useEffect, useRef } from 'react';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Returns a live-updating elapsed time string ("HH:MM:SS")
 * counting up from `startTime` (unix ms). Stops if `endTime` is set.
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

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, endTime]);

  return elapsed;
}
