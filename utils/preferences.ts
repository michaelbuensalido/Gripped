import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GradeSystem = 'v_scale' | 'font';
export type UnitSystem = 'metric' | 'imperial';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export const GRADE_SYSTEM_KEY = '@cruxlog/grade_system';
export const UNITS_KEY = '@cruxlog/units';
export const EXPERIENCE_LEVEL_KEY = '@cruxlog/experience_level';
export const HOME_GYM_KEY = '@cruxlog/home_gym';

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
let currentExperienceLevel: ExperienceLevel = 'intermediate';
let currentHomeGym: string | null = null;

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

AsyncStorage.getItem(EXPERIENCE_LEVEL_KEY)
  .then((val) => {
    if (val === 'beginner' || val === 'intermediate' || val === 'advanced') {
      currentExperienceLevel = val;
      notify();
    }
  })
  .catch(() => {});

AsyncStorage.getItem(HOME_GYM_KEY)
  .then((val) => {
    if (val !== null) {
      currentHomeGym = val || null;
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

export function getExperienceLevel(): ExperienceLevel {
  return currentExperienceLevel;
}

export async function setExperienceLevel(level: ExperienceLevel): Promise<void> {
  currentExperienceLevel = level;
  notify();
  try {
    await AsyncStorage.setItem(EXPERIENCE_LEVEL_KEY, level);
  } catch (e) {
    console.error('Failed to persist experience level:', e);
  }
}

export function getHomeGym(): string | null {
  return currentHomeGym;
}

export async function setHomeGym(gymName: string | null): Promise<void> {
  currentHomeGym = gymName ? gymName.trim() : null;
  notify();
  try {
    if (currentHomeGym) {
      await AsyncStorage.setItem(HOME_GYM_KEY, currentHomeGym);
    } else {
      await AsyncStorage.removeItem(HOME_GYM_KEY);
    }
  } catch (e) {
    console.error('Failed to persist home gym:', e);
  }
}

export function formatGradeWithSystem(
  gradeIndex: number | null | undefined,
  system: GradeSystem = currentGradeSystem,
  rawFallback?: string
): string {
  if (gradeIndex === null || gradeIndex === undefined || isNaN(gradeIndex)) {
    if (rawFallback) {
      return formatGradeString(rawFallback, system);
    }
    return '—';
  }
  const clamped = Math.max(0, Math.min(16, Math.round(gradeIndex)));
  if (system === 'font') {
    return V_TO_FONT[clamped] || `V${clamped}`;
  }
  return `V${clamped}`;
}

export function formatGradeString(
  rawGrade: string | null | undefined,
  system: GradeSystem = currentGradeSystem
): string {
  if (!rawGrade) return '—';
  const trimmed = rawGrade.trim();
  if (!trimmed || trimmed === '–' || trimmed === '—') return trimmed || '—';
  if (/^VB$/i.test(trimmed)) {
    return system === 'font' ? '3' : 'VB';
  }
  const match = trimmed.match(/^[vV](\d{1,2})/);
  if (match) {
    const idx = parseInt(match[1], 10);
    if (!isNaN(idx)) {
      return formatGradeWithSystem(idx, system, trimmed);
    }
  }
  return trimmed;
}

export function usePreferences() {
  const [gradeSystem, setGradeSys] = useState<GradeSystem>(currentGradeSystem);
  const [unitSystem, setUnits] = useState<UnitSystem>(currentUnitSystem);
  const [experienceLevel, setExpLevel] = useState<ExperienceLevel>(currentExperienceLevel);
  const [homeGym, setHomeGymState] = useState<string | null>(currentHomeGym);

  useEffect(() => {
    const update = () => {
      setGradeSys(currentGradeSystem);
      setUnits(currentUnitSystem);
      setExpLevel(currentExperienceLevel);
      setHomeGymState(currentHomeGym);
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

  const changeExperienceLevel = useCallback(async (lvl: ExperienceLevel) => {
    await setExperienceLevel(lvl);
  }, []);

  const changeHomeGym = useCallback(async (gym: string | null) => {
    await setHomeGym(gym);
  }, []);

  return {
    gradeSystem,
    unitSystem,
    experienceLevel,
    homeGym,
    setGradeSystem: changeGradeSystem,
    setUnitSystem: changeUnitSystem,
    setExperienceLevel: changeExperienceLevel,
    setHomeGym: changeHomeGym,
    formatGrade: (idx: number | null | undefined, rawFallback?: string) =>
      formatGradeWithSystem(idx, gradeSystem, rawFallback),
    formatGradeLabel: (gradeOrIndex: number | string | null | undefined, fallback?: string) => {
      if (typeof gradeOrIndex === 'number') {
        return formatGradeWithSystem(gradeOrIndex, gradeSystem, fallback);
      }
      if (typeof gradeOrIndex === 'string') {
        return formatGradeString(gradeOrIndex, gradeSystem);
      }
      return fallback ? formatGradeString(fallback, gradeSystem) : '—';
    },
  };
}
