import { useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { getActiveSession, insertSession, gradeToNumeric, insertAttempt } from '../db/queries';
import { useActiveSession } from '../db/hooks';
import { v4 as uuid } from 'uuid';
import { triggerHaptic } from '../utils/haptics';
import { useSessionStore } from '../store/sessionStore';

export function useSessionActions() {
  const router = useRouter();
  const activeSession = useActiveSession();
  const isCreating = useRef(false);

  const startOrResume = useCallback((gymName?: string) => {
    triggerHaptic('medium');
    const active = getActiveSession();
    if (active) {
      router.push('/session/active');
      return;
    }

    if (isCreating.current) return;
    isCreating.current = true;

    try {
      const sessionId = uuid();
      insertSession({
        id: sessionId,
        gymName: gymName || 'Local Gym',
        startTime: Date.now(),
        notes: '',
        title: 'Quick Session',
        rpe: null,
        mediaUris: [],
        skinState: null,
        fingerFatigue: null,
      });
      router.push('/session/active');
    } finally {
      setTimeout(() => { isCreating.current = false; }, 500); // debounce
    }
  }, [router]);

  return { activeSession, startOrResume };
}
