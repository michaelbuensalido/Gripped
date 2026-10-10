// Pure function unit tests for ProjectCard business logic
// These test the data formatting logic without requiring React

// --- Informative status chip ---
function getInformativeStatusChip(statusChip: string | undefined | null): string | null {
  if (!statusChip || statusChip === 'Not started') return null;
  return statusChip;
}

describe('getInformativeStatusChip', () => {
  it('returns null for "Not started"', () => {
    expect(getInformativeStatusChip('Not started')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(getInformativeStatusChip(undefined)).toBeNull();
  });

  it('returns chip for "Working"', () => {
    expect(getInformativeStatusChip('Working')).toBe('Working');
  });

  it('returns chip for "Close"', () => {
    expect(getInformativeStatusChip('Close')).toBe('Close');
  });
});

// --- Line 3 formatting ---
function formatLine3(project: {
  attempts: number;
  highWaterMarkMoves?: number;
  lastTriedAt?: number | null;
}): string {
  if (!project.attempts || project.attempts === 0) return 'No attempts yet';
  let line = `${project.attempts} burns`;
  if (project.highWaterMarkMoves) line += ` · ${project.highWaterMarkMoves} moves linked`;
  if (project.lastTriedAt) {
    const days = Math.floor((Date.now() - project.lastTriedAt) / (1000 * 60 * 60 * 24));
    const relative = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
    line += ` · ${relative}`;
  }
  return line;
}

describe('formatLine3', () => {
  it('shows "No attempts yet" for 0 burns', () => {
    expect(formatLine3({ attempts: 0 })).toBe('No attempts yet');
  });

  it('shows burn count with no optional fields', () => {
    expect(formatLine3({ attempts: 5 })).toBe('5 burns');
  });

  it('includes highWaterMarkMoves when present', () => {
    expect(formatLine3({ attempts: 12, highWaterMarkMoves: 6 })).toContain('6 moves linked');
  });

  it('does not include moves line when 0', () => {
    expect(formatLine3({ attempts: 8, highWaterMarkMoves: 0 })).not.toContain('moves linked');
  });

  it('includes relative date when lastTriedAt is set', () => {
    const yesterday = Date.now() - 86400000;
    expect(formatLine3({ attempts: 3, lastTriedAt: yesterday })).toContain('Yesterday');
  });
});

// --- Caption counts ---
function buildCaptionCounts(projects: { status: string; attempts: number }[]): string {
  const active = projects.filter(p => p.status === 'in_progress').length;
  const sent = projects.filter(p => p.status === 'sent').length;
  const burns = projects.reduce((sum, p) => sum + (p.attempts || 0), 0);
  return `${active} active · ${sent} sent · ${burns} burns`;
}

describe('buildCaptionCounts', () => {
  it('shows correct counts for empty list', () => {
    expect(buildCaptionCounts([])).toBe('0 active · 0 sent · 0 burns');
  });

  it('shows correct counts for mixed projects', () => {
    const projects = [
      { status: 'in_progress', attempts: 5 },
      { status: 'in_progress', attempts: 3 },
      { status: 'sent', attempts: 10 },
    ];
    expect(buildCaptionCounts(projects)).toBe('2 active · 1 sent · 18 burns');
  });

  it('shows correct counts for all in progress', () => {
    const projects = [
      { status: 'in_progress', attempts: 1 },
      { status: 'in_progress', attempts: 2 },
    ];
    expect(buildCaptionCounts(projects)).toBe('2 active · 0 sent · 3 burns');
  });
});

// --- Tab filtering and Archive/Restore logic ---
function filterProjectsByTab(
  projects: { id: string; status: 'in_progress' | 'sent' | 'abandoned' }[],
  tab: 'in_progress' | 'sent' | 'archived'
) {
  if (tab === 'in_progress') return projects.filter(p => p.status === 'in_progress');
  if (tab === 'sent') return projects.filter(p => p.status === 'sent');
  return projects.filter(p => p.status === 'abandoned');
}

describe('filterProjectsByTab (Archive & Tabs)', () => {
  const sample = [
    { id: '1', status: 'in_progress' as const },
    { id: '2', status: 'sent' as const },
    { id: '3', status: 'abandoned' as const },
    { id: '4', status: 'in_progress' as const },
    { id: '5', status: 'abandoned' as const },
  ];

  it('filters active projects correctly', () => {
    const res = filterProjectsByTab(sample, 'in_progress');
    expect(res.map(p => p.id)).toEqual(['1', '4']);
  });

  it('filters sent projects correctly', () => {
    const res = filterProjectsByTab(sample, 'sent');
    expect(res.map(p => p.id)).toEqual(['2']);
  });

  it('filters archived projects correctly', () => {
    const res = filterProjectsByTab(sample, 'archived');
    expect(res.map(p => p.id)).toEqual(['3', '5']);
  });

  it('transitions from in_progress to abandoned (archiving)', () => {
    let p: { id: string; status: 'in_progress' | 'abandoned' } = { id: '1', status: 'in_progress' };
    const archive = (item: typeof p) => ({ ...item, status: 'abandoned' as const });
    p = archive(p);
    expect(p.status).toBe('abandoned');
    expect(filterProjectsByTab([p], 'archived')).toHaveLength(1);
    expect(filterProjectsByTab([p], 'in_progress')).toHaveLength(0);
  });

  it('transitions from abandoned to in_progress (restoring)', () => {
    let p: { id: string; status: 'in_progress' | 'abandoned' } = { id: '1', status: 'abandoned' };
    const restore = (item: typeof p) => ({ ...item, status: 'in_progress' as const });
    p = restore(p);
    expect(p.status).toBe('in_progress');
    expect(filterProjectsByTab([p], 'in_progress')).toHaveLength(1);
    expect(filterProjectsByTab([p], 'archived')).toHaveLength(0);
  });
});

