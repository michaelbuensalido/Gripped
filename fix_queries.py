import re

with open('db/queries.ts', 'r') as f:
    content = f.read()

# Add missing exports
missing_exports = """
export type SessionDetailData = any;
export type GradePyramidRow = any;

export function updateSessionConditions(sessionId: string, conditions: string[]): void {}

export function insertProject(project: any): void {
  const db = getDatabase();
  const now = Date.now();
  db.runSync(
    `INSERT INTO projects (id, title, grade_raw, grade_index, wall_angle, hold_type, status, high_water_mark_moves, total_moves, micro_beta, photo_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [project.id, project.title, project.gradeRaw, project.normalizedDifficulty, project.wallAngle, project.holdType, project.status, project.highWaterMarkMoves, project.totalMoves ?? null, project.microBeta ?? null, project.mediaUri ?? null, now, now]
  );
}

export function gradeToNumeric(gradeRaw: string): number {
  return parseInt(gradeRaw.replace('V', '')) || 0;
}
"""
content = content + missing_exports

# Replace `?? log.failure_reason` with `?? log.failure_reason ?? null` if not already
content = content.replace('log.failureReason ?? log.failure_reason,', '(log.failureReason ?? log.failure_reason ?? null),')
content = content.replace('log.wallAngle,', '(log.wallAngle ?? null),')
content = content.replace('attempt.wallAngle,', '(attempt.wallAngle ?? null),')
content = content.replace('attempt.holdType,', '(attempt.holdType ?? null),')
content = content.replace('attempt.outcome,', '(attempt.outcome ?? null),')

with open('db/queries.ts', 'w') as f:
    f.write(content)
