import { isSend } from './isSend';

export interface SessionBadge {
  id: string;
  label: string;
  color: 'flash' | 'accent' | 'danger' | 'success' | 'text';
}

export function computeSessionBadges(
  sessionClimbs: any[],
  sessionProjects: any[],
  previousHighestGradeIndex: number,
  previousMaxClimbs: number
): SessionBadge[] {
  const badges: SessionBadge[] = [];
  
  if (!sessionClimbs || sessionClimbs.length === 0) return badges;

  const activeClimbs = sessionClimbs.filter(c => c.deleted_at === null);
  if (activeClimbs.length === 0) return badges;

  // 1. Biggest session (most climbs so far)
  if (activeClimbs.length > previousMaxClimbs && previousMaxClimbs > 0) {
    badges.push({ id: 'biggest_session', label: 'Biggest session', color: 'accent' });
  }

  // 2. Flash day (2 or more flashes)
  const flashes = activeClimbs.filter(c => c.result === 'flash').length;
  if (flashes >= 2) {
    badges.push({ id: 'flash_day', label: 'Flash day', color: 'flash' });
  }

  // 3. Project sent (a project was topped in this session)
  // Assuming sessionProjects is an array of projects that were topped during this session
  // or we can just check if any climb has a project linked and result is send
  const projectSent = activeClimbs.some(c => c.project_id != null && isSend(c.result));
  if (projectSent || (sessionProjects && sessionProjects.some(p => p.isToppedInSession))) {
    badges.push({ id: 'project_sent', label: 'Project sent', color: 'success' });
  }

  // 4. Personal best (hardest send at that time beat all previous)
  const sends = activeClimbs.filter(c => isSend(c.result));
  if (sends.length > 0) {
    const sessionMaxGrade = Math.max(...sends.map(c => c.grade_index ?? 0));
    if (sessionMaxGrade > previousHighestGradeIndex && previousHighestGradeIndex > 0) {
      badges.push({ id: 'personal_best', label: 'Personal best', color: 'accent' });
    }
  }

  return badges;
}
