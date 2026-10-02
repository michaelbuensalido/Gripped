export function shouldFireSmallCelebration(result: string): boolean {
  return result === 'flash';
}

export function shouldFireMediumCelebration(
  newGradeIndex: number,
  previousHardestGradeIndex: number | null,
  totalSessions: number
): boolean {
  if (totalSessions <= 3) return false;
  if (previousHardestGradeIndex === null) return false;
  return newGradeIndex > previousHardestGradeIndex;
}

export function shouldFireBigCelebration(
  result: string,
  projectId: string | null
): boolean {
  return projectId !== null && (result === 'top' || result === 'flash' || result === 'send');
}

export function getStreakMilestone(currentStreak: number): number | null {
  const milestones = [2, 4, 8, 12];
  if (milestones.includes(currentStreak)) return currentStreak;
  return null;
}
