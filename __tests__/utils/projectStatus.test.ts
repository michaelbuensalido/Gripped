import { jest, describe, it, expect } from '@jest/globals';
import { getDerivedProjectStatus } from '../../utils/projectStatus';

describe('getDerivedProjectStatus', () => {
  it('returns Not started for 0 burns', () => {
    expect(getDerivedProjectStatus(0, 0, null)).toBe('Not started');
  });
  
  it('returns Working for some burns', () => {
    expect(getDerivedProjectStatus(3, 5, 12)).toBe('Working');
  });
  
  it('returns Close for 10 or more burns', () => {
    expect(getDerivedProjectStatus(10, 2, 12)).toBe('Close');
    expect(getDerivedProjectStatus(15, 0, null)).toBe('Close');
  });
  
  it('returns Close for high water mark >= 80% of total moves', () => {
    expect(getDerivedProjectStatus(2, 10, 12)).toBe('Close'); // 10/12 = 83%
    expect(getDerivedProjectStatus(1, 4, 5)).toBe('Close'); // 4/5 = 80%
  });
});
