jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
    setItem: jest.fn((k: string, v: string) => {
      store.set(k, v);
      return Promise.resolve();
    }),
  };
});

import { gradeToNumeric } from '../../db/queries';
import {
  formatGradeWithSystem,
  V_TO_FONT,
  getGradeSystem,
  setGradeSystem,
  getUnitSystem,
  setUnitSystem,
} from '../../utils/preferences';

describe('Grade Mapping and System Conversions', () => {
  describe('gradeToNumeric', () => {
    it('converts standard V-grades to numeric indexes', () => {
      expect(gradeToNumeric('V0')).toBe(0);
      expect(gradeToNumeric('V1')).toBe(1);
      expect(gradeToNumeric('V4')).toBe(4);
      expect(gradeToNumeric('V10')).toBe(10);
      expect(gradeToNumeric('V16')).toBe(16);
    });

    it('handles grades without the V prefix or lowercase v', () => {
      expect(gradeToNumeric('4')).toBe(4);
      expect(gradeToNumeric('v7')).toBe(7);
      expect(gradeToNumeric('v12')).toBe(12);
    });

    it('returns 0 for non-numeric or unrecognized formats', () => {
      expect(gradeToNumeric('')).toBe(0);
      expect(gradeToNumeric('unknown')).toBe(0);
      expect(gradeToNumeric('V?')).toBe(0);
    });
  });

  describe('formatGradeWithSystem (V-Scale and Font Scale)', () => {
    it('formats V-scale grades correctly', () => {
      expect(formatGradeWithSystem(0, 'v_scale')).toBe('V0');
      expect(formatGradeWithSystem(4, 'v_scale')).toBe('V4');
      expect(formatGradeWithSystem(9, 'v_scale')).toBe('V9');
      expect(formatGradeWithSystem(15, 'v_scale')).toBe('V15');
    });

    it('formats Fontainebleau grades correctly via V_TO_FONT lookup', () => {
      expect(formatGradeWithSystem(0, 'font')).toBe('4');
      expect(formatGradeWithSystem(1, 'font')).toBe('5');
      expect(formatGradeWithSystem(2, 'font')).toBe('5+');
      expect(formatGradeWithSystem(3, 'font')).toBe('6A');
      expect(formatGradeWithSystem(4, 'font')).toBe('6B');
      expect(formatGradeWithSystem(5, 'font')).toBe('6C');
      expect(formatGradeWithSystem(6, 'font')).toBe('7A');
      expect(formatGradeWithSystem(7, 'font')).toBe('7A+');
      expect(formatGradeWithSystem(8, 'font')).toBe('7B');
      expect(formatGradeWithSystem(9, 'font')).toBe('7B+');
      expect(formatGradeWithSystem(10, 'font')).toBe('7C');
      expect(formatGradeWithSystem(11, 'font')).toBe('8A');
      expect(formatGradeWithSystem(12, 'font')).toBe('8A+');
      expect(formatGradeWithSystem(13, 'font')).toBe('8B');
      expect(formatGradeWithSystem(14, 'font')).toBe('8B+');
      expect(formatGradeWithSystem(15, 'font')).toBe('8C');
      expect(formatGradeWithSystem(16, 'font')).toBe('8C+');
    });

    it('clamps values below 0 to 0 and above 16 to 16', () => {
      expect(formatGradeWithSystem(-3, 'v_scale')).toBe('V0');
      expect(formatGradeWithSystem(25, 'v_scale')).toBe('V16');
      expect(formatGradeWithSystem(25, 'font')).toBe('8C+');
    });

    it('handles null, undefined, or NaN with fallback', () => {
      expect(formatGradeWithSystem(null, 'v_scale', 'Custom V')).toBe('Custom V');
      expect(formatGradeWithSystem(undefined, 'font', 'N/A')).toBe('N/A');
      expect(formatGradeWithSystem(NaN, 'v_scale')).toBe('—');
    });
  });

  describe('User Preferences State', () => {
    it('sets and gets grade system', async () => {
      await setGradeSystem('font');
      expect(getGradeSystem()).toBe('font');

      await setGradeSystem('v_scale');
      expect(getGradeSystem()).toBe('v_scale');
    });

    it('sets and gets unit system', async () => {
      await setUnitSystem('imperial');
      expect(getUnitSystem()).toBe('imperial');

      await setUnitSystem('metric');
      expect(getUnitSystem()).toBe('metric');
    });
  });
});
