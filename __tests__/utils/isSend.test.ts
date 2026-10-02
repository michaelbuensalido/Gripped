import { isSend } from '../../utils/isSend';

describe('isSend', () => {
  it('returns true for top, flash, send', () => {
    expect(isSend('top')).toBe(true);
    expect(isSend('flash')).toBe(true);
    expect(isSend('send')).toBe(true);
  });
  it('returns false for attempt, empty, null', () => {
    expect(isSend('attempt')).toBe(false);
    expect(isSend('')).toBe(false);
    expect(isSend(null)).toBe(false);
    expect(isSend(undefined)).toBe(false);
  });
});
