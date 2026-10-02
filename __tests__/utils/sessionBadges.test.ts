import { computeSessionBadges } from '../../utils/sessionBadges';

describe('computeSessionBadges', () => {
  it('returns empty for no climbs', () => {
    expect(computeSessionBadges([], [], 10, 10)).toEqual([]);
  });

  it('detects Biggest session', () => {
    const climbs = Array(15).fill({ deleted_at: null, result: 'attempt', grade_index: 0 });
    const badges = computeSessionBadges(climbs, [], 10, 10);
    expect(badges).toContainEqual({ id: 'biggest_session', label: 'Biggest session', color: 'accent' });
  });

  it('does not detect Biggest session on first session', () => {
    const climbs = Array(15).fill({ deleted_at: null, result: 'attempt', grade_index: 0 });
    const badges = computeSessionBadges(climbs, [], 0, 0); // previousMaxClimbs = 0
    expect(badges).not.toContainEqual(expect.objectContaining({ id: 'biggest_session' }));
  });

  it('detects Flash day', () => {
    const climbs = [
      { deleted_at: null, result: 'flash', grade_index: 0 },
      { deleted_at: null, result: 'flash', grade_index: 0 },
    ];
    const badges = computeSessionBadges(climbs, [], 10, 10);
    expect(badges).toContainEqual({ id: 'flash_day', label: 'Flash day', color: 'flash' });
  });

  it('detects Project sent', () => {
    const climbs = [
      { deleted_at: null, result: 'send', project_id: 'proj_1', grade_index: 0 },
    ];
    const badges = computeSessionBadges(climbs, [], 10, 10);
    expect(badges).toContainEqual({ id: 'project_sent', label: 'Project sent', color: 'success' });
  });

  it('detects Personal best', () => {
    const climbs = [
      { deleted_at: null, result: 'send', grade_index: 5 }, // V5
    ];
    // prev highest is V4 (index 4)
    const badges = computeSessionBadges(climbs, [], 4, 10);
    expect(badges).toContainEqual({ id: 'personal_best', label: 'Personal best', color: 'accent' });
  });

  it('does not detect Personal best on first send', () => {
    const climbs = [
      { deleted_at: null, result: 'send', grade_index: 5 }, // V5
    ];
    // prev highest is 0
    const badges = computeSessionBadges(climbs, [], 0, 10);
    expect(badges).not.toContainEqual(expect.objectContaining({ id: 'personal_best' }));
  });
});
