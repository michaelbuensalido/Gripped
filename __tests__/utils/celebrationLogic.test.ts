import {
  shouldFireSmallCelebration,
  shouldFireMediumCelebration,
  shouldFireBigCelebration,
  getStreakMilestone,
} from '../../utils/celebrationLogic';

describe('celebrationLogic', () => {
  describe('shouldFireSmallCelebration', () => {
    it('returns true for flash', () => {
      expect(shouldFireSmallCelebration('flash')).toBe(true);
    });

    it('returns false for other results', () => {
      expect(shouldFireSmallCelebration('top')).toBe(false);
      expect(shouldFireSmallCelebration('send')).toBe(false);
      expect(shouldFireSmallCelebration('attempt')).toBe(false);
    });
  });

  describe('shouldFireMediumCelebration', () => {
    it('returns false if totalSessions is 3 or less', () => {
      expect(shouldFireMediumCelebration(5, 4, 3)).toBe(false);
      expect(shouldFireMediumCelebration(5, 4, 1)).toBe(false);
    });

    it('returns false if previousHardestGradeIndex is null', () => {
      expect(shouldFireMediumCelebration(5, null, 10)).toBe(false);
    });

    it('returns true if newGradeIndex > previousHardestGradeIndex and sessions > 3', () => {
      expect(shouldFireMediumCelebration(5, 4, 4)).toBe(true);
      expect(shouldFireMediumCelebration(10, 8, 20)).toBe(true);
    });

    it('returns false if newGradeIndex <= previousHardestGradeIndex', () => {
      expect(shouldFireMediumCelebration(4, 5, 10)).toBe(false);
      expect(shouldFireMediumCelebration(4, 4, 10)).toBe(false);
    });
  });

  describe('shouldFireBigCelebration', () => {
    it('returns true for project with top, flash, or send', () => {
      expect(shouldFireBigCelebration('top', 'proj-123')).toBe(true);
      expect(shouldFireBigCelebration('flash', 'proj-123')).toBe(true);
      expect(shouldFireBigCelebration('send', 'proj-123')).toBe(true);
    });

    it('returns false if projectId is null', () => {
      expect(shouldFireBigCelebration('top', null)).toBe(false);
      expect(shouldFireBigCelebration('flash', null)).toBe(false);
    });

    it('returns false if result is not top, flash, or send', () => {
      expect(shouldFireBigCelebration('attempt', 'proj-123')).toBe(false);
      expect(shouldFireBigCelebration('fall', 'proj-123')).toBe(false);
    });
  });

  describe('getStreakMilestone', () => {
    it('returns the milestone if currentStreak is in milestones', () => {
      expect(getStreakMilestone(2)).toBe(2);
      expect(getStreakMilestone(4)).toBe(4);
      expect(getStreakMilestone(8)).toBe(8);
      expect(getStreakMilestone(12)).toBe(12);
    });

    it('returns null if currentStreak is not a milestone', () => {
      expect(getStreakMilestone(1)).toBe(null);
      expect(getStreakMilestone(3)).toBe(null);
      expect(getStreakMilestone(5)).toBe(null);
      expect(getStreakMilestone(10)).toBe(null);
      expect(getStreakMilestone(20)).toBe(null);
    });
  });
});
