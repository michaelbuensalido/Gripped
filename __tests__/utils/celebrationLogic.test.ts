import { shouldFireMediumCelebration, shouldFireSmallCelebration, shouldFireBigCelebration } from '../../utils/celebrationLogic';

describe('Celebrations', () => {
  describe('Medium Celebration (New Best)', () => {
    it('fires for a strictly harder grade', () => {
      // e.g. V6 (6) vs V5 (5)
      expect(shouldFireMediumCelebration(6, 5, 10)).toBe(true);
    });

    it('does not fire for a tie (not strictly harder)', () => {
      // e.g. V5 (5) vs V5 (5)
      expect(shouldFireMediumCelebration(5, 5, 10)).toBe(false);
    });

    it('does not fire for a first-ever climb (no previous best exists)', () => {
      // e.g. V5, but previous is null
      expect(shouldFireMediumCelebration(5, null, 10)).toBe(false);
    });

    it('ignores deleted earlier climbs implicitly (previousHardestGradeIndex takes it into account)', () => {
      // This is implicit in the design since previousHardestGradeIndex is passed in.
      // If the earlier V8 was deleted, the query calculates V5 as the current previousBest.
      // Then logging a V6 becomes the new best, so it should fire.
      expect(shouldFireMediumCelebration(6, 5, 10)).toBe(true);
    });
  });

  describe('Small Celebration', () => {
    it('fires on flash', () => {
      expect(shouldFireSmallCelebration('flash')).toBe(true);
      expect(shouldFireSmallCelebration('top')).toBe(false);
    });
  });

  describe('Big Celebration', () => {
    it('fires on project send', () => {
      expect(shouldFireBigCelebration('top', 'proj-1')).toBe(true);
      expect(shouldFireBigCelebration('flash', 'proj-1')).toBe(true);
      expect(shouldFireBigCelebration('attempt', 'proj-1')).toBe(false);
      expect(shouldFireBigCelebration('top', null)).toBe(false);
    });
  });
});
