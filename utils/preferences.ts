import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GradeSystem = 'v_scale' | 'font';
export type UnitSystem = 'metric' | 'imperial';

export const GRADE_SYSTEM_KEY = '@cruxlog/grade_system';
export const UNITS_KEY = '@cruxlog/units';

export const V_TO_FONT: Record<number, string> = {
  0: '4',
  1: '5',
  2: '5+',
  3: '6A',
  4: '6B',
  5: '6C',
  6: '7A',
  7: '7A+',
  8: '7B',
  9: '7B+',
  10: '7C',
  11: '8A',
  12: '8A+',
  13: '8B',
  14: '8B+',
  15: '8C',
  16: '8C+',
};

let currentGradeSystem: GradeSystem = 'v_scale';
let currentUnitSystem: UnitSystem = 'metric';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

// Initial hydration from storage
AsyncStorage.getItem(GRADE_SYSTEM_KEY)
  .then((val) => {
    if (val === 'font' || val === 'v_scale') {
      currentGradeSystem = val;
      notify();
    }
  })
  .catch(() => {});

AsyncStorage.getItem(UNITS_KEY)
  .then((val) => {
    if (val === 'metric' || val === 'imperial') {
      currentUnitSystem = val;
      notify();
    }
  })
  .catch(() => {});

export function getGradeSystem(): GradeSystem {
  return currentGradeSystem;
}

export async function setGradeSystem(sys: GradeSystem): Promise<void> {
  currentGradeSystem = sys;
  notify();
  try {
    await AsyncStorage.setItem(GRADE_SYSTEM_KEY, sys);
  } catch (e) {
    console.error('Failed to persist grade system:', e);
  }
}

export function getUnitSystem(): UnitSystem {
  return currentUnitSystem;
}

export async function setUnitSystem(units: UnitSystem): Promise<void> {
  currentUnitSystem = units;
  notify();
  try {
    await AsyncStorage.setItem(UNITS_KEY, units);
  } catch (e) {
    console.error('Failed to persist units:', e);
  }
}

export function formatGradeWithSystem(
  gradeIndex: number | null | undefined,
  system: GradeSystem = currentGradeSystem,
  rawFallback?: string
): string {
  if (gradeIndex === null || gradeIndex === undefined || isNaN(gradeIndex)) {
    return rawFallback || '—';
  }
  const clamped = Math.max(0, Math.min(16, Math.round(gradeIndex)));
  if (system === 'font') {
    return V_TO_FONT[clamped] || `V${clamped}`;
  }
  return `V${clamped}`;
}

export function usePreferences() {
  const [gradeSystem, setGradeSys] = useState<GradeSystem>(currentGradeSystem);
  const [unitSystem, setUnits] = useState<UnitSystem>(currentUnitSystem);

  useEffect(() => {
    const update = () => {
      setGradeSys(currentGradeSystem);
      setUnits(currentUnitSystem);
    };
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  const changeGradeSystem = useCallback(async (sys: GradeSystem) => {
    await setGradeSystem(sys);
  }, []);

  const changeUnitSystem = useCallback(async (u: UnitSystem) => {
    await setUnitSystem(u);
  }, []);

  return {
    gradeSystem,
    unitSystem,
    setGradeSystem: changeGradeSystem,
    setUnitSystem: changeUnitSystem,
    formatGrade: (idx: number | null | undefined, rawFallback?: string) =>
      formatGradeWithSystem(idx, gradeSystem, rawFallback),
  };
}
