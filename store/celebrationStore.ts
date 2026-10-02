import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CelebrationState {
  celebrationsEnabled: boolean;
  setCelebrationsEnabled: (enabled: boolean) => void;
  celebratedClimbs: Record<string, 'small' | 'medium' | 'big'>;
  markCelebrated: (id: string, type: 'small' | 'medium' | 'big') => void;
  unmarkCelebrated: (id: string) => void;
  hasCelebrated: (id: string) => boolean;
  celebratedStreaks: Record<number, boolean>;
  markStreakCelebrated: (week: number) => void;
  hasStreakCelebrated: (week: number) => boolean;
}

export const useCelebrationStore = create<CelebrationState>()(
  persist(
    (set, get) => ({
      celebrationsEnabled: true,
      setCelebrationsEnabled: (enabled) => set({ celebrationsEnabled: enabled }),
      celebratedClimbs: {},
      markCelebrated: (id, type) =>
        set((state) => ({
          celebratedClimbs: { ...state.celebratedClimbs, [id]: type },
        })),
      unmarkCelebrated: (id) =>
        set((state) => {
          const newCelebratedClimbs = { ...state.celebratedClimbs };
          delete newCelebratedClimbs[id];
          return { celebratedClimbs: newCelebratedClimbs };
        }),
      hasCelebrated: (id) => get().celebratedClimbs[id] !== undefined,
      celebratedStreaks: {},
      markStreakCelebrated: (week) =>
        set((state) => ({
          celebratedStreaks: { ...state.celebratedStreaks, [week]: true },
        })),
      hasStreakCelebrated: (week) => get().celebratedStreaks[week] === true,
    }),
    {
      name: 'cruxlog-celebration-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
