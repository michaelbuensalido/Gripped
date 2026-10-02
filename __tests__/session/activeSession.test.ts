import { renderHook, act } from '@testing-library/react-native';
import { useSessionStore } from '../../store/sessionStore';
import { isSend } from '../../utils/isSend';

describe('Active Session logic', () => {
  beforeEach(() => {
    useSessionStore.setState({
      restTimerEndTime: null,
      isRestTimerRunning: false,
    });
  });

  describe('Rest Timer', () => {
    it('sets timer to 3 minutes correctly', () => {
      const { result } = renderHook(() => useSessionStore());
      const now = Date.now();
      
      act(() => {
        result.current.setRestTimer(now + 3 * 60 * 1000, true);
      });
      
      expect(result.current.restTimerEndTime).toBeGreaterThanOrEqual(now + 3 * 60 * 1000 - 100);
      expect(result.current.restTimerEndTime).toBeLessThanOrEqual(now + 3 * 60 * 1000 + 100);
      expect(result.current.isRestTimerRunning).toBe(true);
    });

    it('adds 30s to existing timer', () => {
      const { result } = renderHook(() => useSessionStore());
      const now = Date.now();
      const initialEnd = now + 60 * 1000;
      
      act(() => {
        result.current.setRestTimer(initialEnd, true);
      });
      
      act(() => {
        result.current.addRestTimerSeconds(30);
      });
      
      expect(result.current.restTimerEndTime).toBe(initialEnd + 30 * 1000);
    });
  });

  describe('Hardest Send Detection', () => {
    it('detects a new hardest send', () => {
      const climbs = [
        { grade_index: 3, grade_raw: 'V3', result: 'top' },
        { grade_index: 5, grade_raw: 'V5', result: 'top' },
        { grade_index: 4, grade_raw: 'V4', result: 'flash' },
      ];
      
      const sends = climbs.filter(c => isSend(c.result));
      const hardestIndex = sends.reduce((max, c) => Math.max(max, c.grade_index), 0);
      
      expect(hardestIndex).toBe(5);
    });
  });

  describe('Insight Data Aggregation', () => {
    it('aggregates pyramid data correctly', () => {
      const climbs = [
        { grade_raw: 'V3', result: 'flash', grade_index: 3 },
        { grade_raw: 'V3', result: 'attempt', grade_index: 3 },
        { grade_raw: 'V4', result: 'top', grade_index: 4 },
        { grade_raw: 'V4', result: 'attempt', grade_index: 4 },
        { grade_raw: 'V4', result: 'attempt', grade_index: 4 },
      ];
      
      const counts: any = {};
      climbs.forEach((c) => {
        const g = c.grade_raw;
        if (!counts[g]) counts[g] = { flashes: 0, tops: 0, attempts: 0 };
        if (c.result === 'flash') counts[g].flashes++;
        else if (isSend(c.result)) counts[g].tops++;
        else counts[g].attempts++;
      });
      
      expect(counts['V3'].flashes).toBe(1);
      expect(counts['V3'].attempts).toBe(1);
      expect(counts['V4'].tops).toBe(1);
      expect(counts['V4'].attempts).toBe(2);
    });
  });
});
