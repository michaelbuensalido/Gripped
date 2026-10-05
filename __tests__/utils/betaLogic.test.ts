import { describe, it, expect } from '@jest/globals';
import {
  nextVersion,
  makeCurrent,
  pickCurrentAfterDelete,
  normalizeOrder,
  reorderMoves,
  removeMove,
  toggleCrux,
  stripEmptyMoves,
  videoFilesToDelete,
  totalStorageBytes,
  formatTimestamp,
  formatBytes,
} from '../../utils/betaLogic';

const b = (id: string, version: number, isCurrent = false) => ({ id, version, isCurrent });
const m = (id: string, order: number, text = id) => ({ id, order, text });

describe('versioning', () => {
  it('nextVersion starts at 1 and increments from the highest', () => {
    expect(nextVersion([])).toBe(1);
    expect(nextVersion([{ version: 1 }, { version: 3 }])).toBe(4);
  });

  it('makeCurrent leaves exactly one current', () => {
    const out = makeCurrent([b('a', 1, true), b('b', 2), b('c', 3)], 'c');
    expect(out.filter((x) => x.isCurrent).map((x) => x.id)).toEqual(['c']);
  });

  it('makeCurrent with an unknown id changes nothing (invariant preserved)', () => {
    const input = [b('a', 1, true), b('b', 2)];
    const out = makeCurrent(input, 'zzz');
    expect(out.filter((x) => x.isCurrent).map((x) => x.id)).toEqual(['a']);
  });

  it('after deleting the current version the newest becomes current', () => {
    const out = pickCurrentAfterDelete([b('a', 1), b('b', 2)]);
    expect(out.filter((x) => x.isCurrent).map((x) => x.id)).toEqual(['b']);
  });

  it('after deleting a non-current version nothing changes', () => {
    const input = [b('a', 1, true), b('b', 2)];
    expect(pickCurrentAfterDelete(input)).toBe(input);
  });

  it('after deleting the last version the list stays empty', () => {
    expect(pickCurrentAfterDelete([])).toEqual([]);
  });
});

describe('move ordering', () => {
  it('normalizeOrder sorts and removes gaps', () => {
    const out = normalizeOrder([m('c', 9), m('a', 2), m('b', 5)]);
    expect(out.map((x) => [x.id, x.order])).toEqual([['a', 0], ['b', 1], ['c', 2]]);
  });

  it('reorderMoves moves an item down and renumbers', () => {
    const out = reorderMoves([m('a', 0), m('b', 1), m('c', 2)], 0, 2);
    expect(out.map((x) => x.id)).toEqual(['b', 'c', 'a']);
    expect(out.map((x) => x.order)).toEqual([0, 1, 2]);
  });

  it('reorderMoves moves an item up', () => {
    const out = reorderMoves([m('a', 0), m('b', 1), m('c', 2)], 2, 0);
    expect(out.map((x) => x.id)).toEqual(['c', 'a', 'b']);
  });

  it('reorderMoves ignores out-of-range and no-op indices', () => {
    const input = [m('a', 0), m('b', 1)];
    expect(reorderMoves(input, 5, 0).map((x) => x.id)).toEqual(['a', 'b']);
    expect(reorderMoves(input, 0, 0).map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('reorderMoves does not mutate its input', () => {
    const input = [m('a', 0), m('b', 1)];
    reorderMoves(input, 0, 1);
    expect(input.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('removeMove renumbers and clears the crux only if it was the crux', () => {
    const base = [m('a', 0), m('b', 1), m('c', 2)];
    const keep = removeMove(base, 'a', 'c');
    expect(keep.moves.map((x) => x.order)).toEqual([0, 1]);
    expect(keep.cruxMoveId).toBe('c');
    expect(removeMove(base, 'c', 'c').cruxMoveId).toBeNull();
  });

  it('toggleCrux keeps only one crux', () => {
    expect(toggleCrux(null, 'a')).toBe('a');
    expect(toggleCrux('a', 'b')).toBe('b');
    expect(toggleCrux('a', 'a')).toBeNull();
  });

  it('stripEmptyMoves drops blank rows and renumbers', () => {
    const out = stripEmptyMoves([m('a', 0, 'Start'), m('b', 1, '   '), m('c', 2, 'Top')]);
    expect(out.map((x) => [x.id, x.order])).toEqual([['a', 0], ['c', 1]]);
  });
});

describe('cascade delete planning', () => {
  it('lists every clip file and skips empty uris', () => {
    expect(videoFilesToDelete([{ localUri: 'file:///a.mp4' }, { localUri: '' }, { localUri: 'file:///b.mp4' }])).toEqual([
      'file:///a.mp4',
      'file:///b.mp4',
    ]);
  });

  it('totals storage', () => {
    expect(totalStorageBytes([{ sizeBytes: 100 }, { sizeBytes: 50 }])).toBe(150);
  });
});

describe('formatting', () => {
  it('formatTimestamp', () => {
    expect(formatTimestamp(0)).toBe('0:00');
    expect(formatTimestamp(8.9)).toBe('0:08');
    expect(formatTimestamp(83.4)).toBe('1:23');
    expect(formatTimestamp(-4)).toBe('0:00');
    expect(formatTimestamp(NaN)).toBe('0:00');
  });

  it('formatBytes', () => {
    expect(formatBytes(0)).toBe('0 MB');
    expect(formatBytes(1000)).toBe('<1 MB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatBytes(120 * 1024 * 1024)).toBe('120 MB');
  });
});
