import { useEffect, useState } from 'react';
import { dbEvents } from './events';
import * as Q from './queries';
import * as B from './betaQueries';

function useLiveQuery<T>(queryFn: () => T, deps: any[] = []): T {
  const [data, setData] = useState<T>(queryFn);

  useEffect(() => {
    setData(queryFn());
    const unsubscribe = dbEvents.subscribe(() => {
      setData(queryFn());
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}

export function useActiveSession() {
  return useLiveQuery(() => Q.getActiveSession());
}

export function useSessionClimbs(sessionId: string) {
  return useLiveQuery(() => (sessionId ? Q.getClimbsForSession(sessionId) : []), [sessionId]);
}

export function useSessionDetail(sessionId: string) {
  return useLiveQuery(() => (sessionId ? Q.getSessionSummary(sessionId) : null), [sessionId]);
}

export function useSession(sessionId: string) {
  return useLiveQuery(() => (sessionId ? Q.getSessionById(sessionId) : null), [sessionId]);
}

export function useSessionProjects(sessionId: string) {
  return useLiveQuery(() => (sessionId ? Q.getProjectsForSession(sessionId) : []), [sessionId]);
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

export function useProgressStats(period: '7d'|'30d'|'90d'|'1y'|'all') {
  return useLiveQuery(() => {
    const now = Date.now();
    return {
      resultCounts: Q.getResultCounts(period, now),
      avgGradeLast20: Q.getAverageGradeLast20(),
      gradePyramid: Q.getGradePyramid(period, now),
      weeklyVolume: Q.getWeeklyVolume(period, now),
      rates: Q.getRates(period, now),
      hardestSend: Q.getHardestSendTrend(period, now),
      streak: Q.getStreak(now),
      wallAngleRates: Q.getWallAngleSendRates(period, now),
      failureReasons: Q.getFailureReasonCounts(period, now),
      sessionStats: Q.getSessionPeriodStats(period, now),
    };
  }, [period]);
}

export function useHomeSummary() {
  return useLiveQuery(() => Q.getHomeSummary());
}

export function useRecentGrades() {
  return useLiveQuery(() => Q.getRecentGrades());
}

export function useRichProjects() {
  return useLiveQuery(() => Q.getRichProjects());
}

export function useProject(id: string) {
  return useLiveQuery(() => Q.getRichProjectById(id), [id]);
}

export function useProjectHistory(id: string) {
  return useLiveQuery(() => Q.getProjectHistory(id), [id]);
}
export function useLogbookSummary(filters: Q.LogbookFilters) {
  return useLiveQuery(() => Q.getLogbookSummary(filters), [JSON.stringify(filters)]);
}

export function useLogbookHistory(filters: Q.LogbookFilters) {
  return useLiveQuery(() => Q.getLogbookHistory(filters), [JSON.stringify(filters)]);
}

// ─── Beta ────────────────────────────────────────────────────────────────────
export function useProjectBetas(projectId: string) {
  return useLiveQuery(() => (projectId ? B.getBetasForProject(projectId) : []), [projectId]);
}

export function useBetaMoves(betaId: string | null) {
  return useLiveQuery(() => (betaId ? B.getMovesForBeta(betaId) : []), [betaId]);
}

export function useProjectVideos(projectId: string) {
  return useLiveQuery(() => (projectId ? B.getVideosForProject(projectId) : []), [projectId]);
}

export function useVideoNotes(videoId: string) {
  return useLiveQuery(() => (videoId ? B.getNotesForVideo(videoId) : []), [videoId]);
}

export function useProjectStorageBytes(projectId: string) {
  return useLiveQuery(() => (projectId ? B.getProjectStorageBytes(projectId) : 0), [projectId]);
}
