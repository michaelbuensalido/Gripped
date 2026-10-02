import { jest, describe, it, expect } from '@jest/globals';
import { sortProjects } from '../../utils/projectSort';

describe('sortProjects', () => {
  const p1 = { id: 'p1', normalizedDifficulty: 4, highWaterMarkMoves: 10, totalMoves: 12, lastTriedAt: 1000 };
  const p2 = { id: 'p2', normalizedDifficulty: 6, highWaterMarkMoves: 5, totalMoves: 12, lastTriedAt: 2000 };
  
  it('sorts by Hardest', () => {
    const res = sortProjects([p1, p2], 'Hardest');
    expect(res[0].id).toBe('p2');
  });

  it('sorts by Closest to sending', () => {
    const res = sortProjects([p1, p2], 'Closest to sending');
    expect(res[0].id).toBe('p1'); // 10/12 > 5/12
  });

  it('sorts by Recently tried', () => {
    const res = sortProjects([p1, p2], 'Recently tried');
    expect(res[0].id).toBe('p2'); // 2000 > 1000
  });
});
