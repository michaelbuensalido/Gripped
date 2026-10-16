import { useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { getActiveSession, insertSession } from '../db/queries';
import { useActiveSession } from '../db/hooks';
import { v4 as uuid } from 'uuid';
import { triggerHaptic } from '../utils/haptics';

export function useSessionActions() {
  const router = useRouter();
  const activeSession = useActiveSession();
  const isCreating = useRef(false);

  const startOrResume = useCallback((gymName?: string) => {
    triggerHaptic('medium');
    const active = getActiveSession();
    if (active) {
      try {
        require('../services/liveActivity').liveActivityManager.syncFromDatabase();
      } catch {}
      router.push('/session/active');
      return;
    }

    if (isCreating.current) return;
    isCreating.current = true;

    try {
      const sessionId = uuid();
      const startTime = Date.now();
      const resolvedGym = gymName || 'Local Gym';
      insertSession({
        id: sessionId,
        gymName: resolvedGym,
        startTime,
        notes: '',
        title: 'Quick Session',
        rpe: null,
        mediaUris: [],
        skinState: null,
        fingerFatigue: null,
      });
      try {
        require('../services/liveActivity').liveActivityManager.startSession(
          sessionId,
          resolvedGym,
          startTime,
          0,
          0,
          'V0'
        );
      } catch {}
      router.push('/session/active');
    } finally {
      setTimeout(() => { isCreating.current = false; }, 500); // debounce
    }
  }, [router]);

  return { activeSession, startOrResume };
}
