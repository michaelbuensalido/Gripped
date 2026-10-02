import { plural } from '../../utils/string';

describe('plural', () => {
  it('returns singular when n = 1', () => {
    expect(plural(1, 'session')).toBe('1 session');
  });

  it('returns plural when n = 0', () => {
    expect(plural(0, 'session')).toBe('0 sessions');
  });

  it('returns plural when n > 1', () => {
    expect(plural(2, 'session')).toBe('2 sessions');
  });

  it('uses custom plural string if provided', () => {
    expect(plural(2, 'try', 'tries')).toBe('2 tries');
    expect(plural(1, 'try', 'tries')).toBe('1 try');
  });
});
