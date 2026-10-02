import { describe, it, expect } from '@jest/globals';
import { isSend, countSends } from '../../utils/isSend';

describe('isSend', () => {
  it('identifies sends correctly', () => {
    expect(isSend('flash')).toBe(true);
    expect(isSend('top')).toBe(true);
    expect(isSend('send')).toBe(true);
    expect(isSend('FLASH')).toBe(true);
    expect(isSend('Top')).toBe(true);

    expect(isSend('attempt')).toBe(false);
    expect(isSend('fall')).toBe(false);
    expect(isSend('zone')).toBe(false);
    expect(isSend(null)).toBe(false);
    expect(isSend(undefined)).toBe(false);
    expect(isSend('')).toBe(false);
  });

  it('counts Flash + Attempt as 1 send', () => {
    const climbs = [{ result: 'flash' }, { result: 'attempt' }];
    expect(countSends(climbs)).toBe(1);
  });

  it('counts Top + Top as 2 sends', () => {
    const climbs = [{ result: 'top' }, { result: 'top' }];
    expect(countSends(climbs)).toBe(2);
  });

  it('counts Attempt only as 0 sends', () => {
    const climbs = [{ result: 'attempt' }];
    expect(countSends(climbs)).toBe(0);
  });

  it('counts multiple mixed outcomes accurately', () => {
    const climbs = [
      { result: 'attempt' },
      { result: 'flash' },
      { result: 'fall' },
      { result: 'top' },
      { result: 'attempt' },
    ];
    expect(countSends(climbs)).toBe(2);
  });
});
