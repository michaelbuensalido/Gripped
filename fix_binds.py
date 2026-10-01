with open('db/queries.ts', 'r') as f:
    content = f.read()

content = content.replace('log.rpe,', '(log.rpe ?? null),')
content = content.replace('log.notes,', '(log.notes ?? null),')
content = content.replace('log.media_uri,', '(log.media_uri ?? null),')
content = content.replace('project.microBeta ?? null', '(project.microBeta ?? null)')
content = content.replace('project.mediaUri ?? null', '(project.mediaUri ?? null)')

# Missing types
missing = """
export type SessionSummary = any;
export type WeeklyCapsuleOverviewData = any;
export type GradeVolumeEqualizerData = any;
export type SessionTrendPoint = any;
export type AnalyticsOverview = any;
"""
content += missing

with open('db/queries.ts', 'w') as f:
    f.write(content)
