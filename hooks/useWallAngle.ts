import { useState, useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import { getWallAngleCategory, type WallAngleInfo } from '../services/gradeEstimator';

const DEFAULT_SIMULATED_ANGLES = [35, 45, 15, 60, 5];

export interface UseWallAngleResult {
  angleDegrees: number;
  wallInfo: WallAngleInfo;
  isSimulated: boolean;
  cycleSimulatedAngle: () => void;
  setAngle: (deg: number) => void;
}

/**
 * Sensor hook measuring wall pitch angle relative to vertical:
 * theta = arctan(|Y| / sqrt(X^2 + Z^2)) * (180 / pi)
 * Includes low-pass filtering and instant simulator fallback.
 */
export function useWallAngle(active: boolean = true): UseWallAngleResult {
  const [angleDegrees, setAngleDegrees] = useState<number>(35);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const simIndexRef = useRef<number>(0);
  const smoothedAngleRef = useRef<number>(35);
  const sensorFiredRef = useRef<boolean>(false);

  useEffect(() => {
    if (!active) return;

    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
    sensorFiredRef.current = false;

    // Check availability & set update frequency (10Hz / 100ms)
    Accelerometer.setUpdateInterval(100);

    const setupListener = async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (!available) {
          setIsSimulated(true);
          return;
        }

        subscription = Accelerometer.addListener(({ x, y, z }) => {
          sensorFiredRef.current = true;
          setIsSimulated(false);

          // theta = arctan(|Y| / sqrt(X^2 + Z^2)) * (180 / pi)
          const denom = Math.sqrt(x * x + z * z) || 0.001;
          const rawPitch = Math.atan(Math.abs(y) / denom) * (180 / Math.PI);
          const clamped = Math.max(0, Math.min(90, rawPitch));

          // Low-pass exponential smoothing (alpha = 0.25)
          smoothedAngleRef.current =
            smoothedAngleRef.current * 0.75 + clamped * 0.25;

          setAngleDegrees(Math.round(smoothedAngleRef.current));
        });
      } catch (err) {
        console.warn('Accelerometer subscription error, using simulator mode:', err);
        setIsSimulated(true);
      }
    };

    setupListener();

    // If no sensor readings within 1.5s (common on simulator), fallback to simulated mode
    const simTimeout = setTimeout(() => {
      if (!sensorFiredRef.current) {
        setIsSimulated(true);
      }
    }, 1500);

    return () => {
      clearTimeout(simTimeout);
      if (subscription) {
        subscription.remove();
      }
    };
  }, [active]);

  const cycleSimulatedAngle = useCallback(() => {
    simIndexRef.current = (simIndexRef.current + 1) % DEFAULT_SIMULATED_ANGLES.length;
    const nextAngle = DEFAULT_SIMULATED_ANGLES[simIndexRef.current];
    smoothedAngleRef.current = nextAngle;
    setAngleDegrees(nextAngle);
    setIsSimulated(true);
  }, []);

  const setAngle = useCallback((deg: number) => {
    const clamped = Math.max(0, Math.min(90, Math.round(deg)));
    smoothedAngleRef.current = clamped;
    setAngleDegrees(clamped);
  }, []);

  const wallInfo = getWallAngleCategory(angleDegrees);

  return {
    angleDegrees,
    wallInfo,
    isSimulated,
    cycleSimulatedAngle,
    setAngle,
  };
}
