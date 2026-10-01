import { useEffect, useState } from 'react';
import { dbEvents } from './events';
import * as Q from './queries';

function useLiveQuery<T>(queryFn: () => T, deps: any[] = []): T {
  const [data, setData] = useState<T>(queryFn);
  
  useEffect(() => {
    setData(queryFn());
    return dbEvents.subscribe(() => {
      setData(queryFn());
    });
  }, deps);

  return data;
}

export function useActiveSession() {
  return useLiveQuery(() => Q.getActiveSession());
}

export function useSessionClimbs(sessionId: string) {
  return useLiveQuery(() => Q.getClimbsForSession(sessionId), [sessionId]);
}

export function useRecentSessions() {
  return useLiveQuery(() => Q.getAllSessions());
}

export function useProjects() {
  return useLiveQuery(() => Q.getAllProjects());
}

export function useHomeStats() {
  return useLiveQuery(() => Q.getHomeStats());
}

export function useAllSessions() {
  return useLiveQuery(() => Q.getAllSessions());
}
