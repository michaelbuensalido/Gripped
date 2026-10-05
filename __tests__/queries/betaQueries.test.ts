import { jest, describe, it, expect, beforeEach } from '@jest/globals';

let idCounter = 0;
jest.mock('uuid', () => ({ v4: () => `beta-uuid-${idCounter++}` }));

const deletedFiles: string[] = [];
jest.mock('../../services/betaFiles', () => ({
  deleteClipFile: (uri: string) => { deletedFiles.push(uri); },
  deleteProjectClipDir: () => {},
  storeClip: () => ({ uri: '', sizeBytes: 0 }),
}));

import { getDatabase } from '../../db/schema';
import { insertProject, deleteProject } from '../../db/queries';
import {
  createBeta,
  updateBeta,
  setCurrentBeta,
  deleteBeta,
  getBetasForProject,
  getMovesForBeta,
  getBeta,
  insertVideo,
  addVideoNote,
  getNotesForVideo,
  getVideosForProject,
  deleteVideo,
  getProjectStorageBytes,
  type BetaDraft,
} from '../../db/betaQueries';

const draft = (over: Partial<BetaDraft> = {}): BetaDraft => ({
  label: 'v',
  keyTip: 'Keep the left foot high',
  moves: [
    { id: 'm1', text: 'Start LH crimp', limb: 'LH' },
    { id: 'm2', text: 'Throw to sloper', limb: 'RH' },
    { id: 'm3', text: 'Heel hook', limb: 'LF' },
  ],
  cruxMoveId: 'm2',
  ...over,
});

const count = (table: string) => (getDatabase().getFirstSync<any>(`SELECT COUNT(*) AS n FROM ${table}`).n as number);

describe('beta queries (SQLite)', () => {
  beforeEach(() => {
    const db = getDatabase();
    db.execSync(`DELETE FROM video_notes; DELETE FROM beta_videos; DELETE FROM beta_moves; DELETE FROM betas; DELETE FROM outbox; DELETE FROM projects;`);
    deletedFiles.length = 0;
    insertProject({ id: 'p1', title: 'P1', gradeRaw: 'V4', normalizedDifficulty: 4, wallAngle: 'slab', holdType: 'crimps', status: 'in_progress', highWaterMarkMoves: 0, totalMoves: 10, microBeta: null, mediaUri: null });
  });

  it('first version is current, later versions are not', () => {
    createBeta('p1', draft());
    createBeta('p1', draft({ label: 'second' }));
    const betas = getBetasForProject('p1');
    expect(betas.map((b) => [b.version, b.isCurrent])).toEqual([[1, true], [2, false]]);
  });

  it('exactly one current after switching versions', () => {
    const a = createBeta('p1', draft());
    const b = createBeta('p1', draft());
    const c = createBeta('p1', draft());
    setCurrentBeta(c);
    expect(getBetasForProject('p1').filter((x) => x.isCurrent).map((x) => x.id)).toEqual([c]);
    setCurrentBeta(a);
    expect(getBetasForProject('p1').filter((x) => x.isCurrent).map((x) => x.id)).toEqual([a]);
    expect(b).toBeTruthy();
  });

  it('the database itself refuses two current versions for one project', () => {
    createBeta('p1', draft());
    const b = createBeta('p1', draft());
    expect(() => getDatabase().runSync(`UPDATE betas SET is_current = 1 WHERE id = ?`, [b])).toThrow();
  });

  it('makeCurrent on create demotes the previous current', () => {
    createBeta('p1', draft());
    const b = createBeta('p1', draft(), true);
    expect(getBetasForProject('p1').filter((x) => x.isCurrent).map((x) => x.id)).toEqual([b]);
  });

  it('deleting the current version promotes the newest remaining', () => {
    const a = createBeta('p1', draft());
    const b = createBeta('p1', draft());
    deleteBeta(a);
    const rest = getBetasForProject('p1');
    expect(rest.map((x) => x.id)).toEqual([b]);
    expect(rest[0].isCurrent).toBe(true);
  });

  it('persists move order and crux, drops blank moves', () => {
    const id = createBeta('p1', draft({
      moves: [
        { id: 'x1', text: 'one', limb: null },
        { id: 'x2', text: '   ', limb: null },
        { id: 'x3', text: 'three', limb: 'RF' },
      ],
      cruxMoveId: 'x3',
    }));
    const moves = getMovesForBeta(id);
    expect(moves.map((m) => [m.id, m.order])).toEqual([['x1', 0], ['x3', 1]]);
    expect(getBeta(id)?.cruxMoveId).toBe('x3');
  });

  it('a reorder saved through updateBeta persists', () => {
    const id = createBeta('p1', draft());
    updateBeta(id, draft({
      moves: [
        { id: 'm3', text: 'Heel hook', limb: 'LF' },
        { id: 'm1', text: 'Start LH crimp', limb: 'LH' },
        { id: 'm2', text: 'Throw to sloper', limb: 'RH' },
      ],
    }));
    expect(getMovesForBeta(id).map((m) => m.id)).toEqual(['m3', 'm1', 'm2']);
  });

  it('crux referencing a blank/removed move is cleared on save', () => {
    const id = createBeta('p1', draft());
    updateBeta(id, draft({ moves: [{ id: 'm1', text: 'only', limb: null }], cruxMoveId: 'm2' }));
    expect(getBeta(id)?.cruxMoveId).toBeNull();
  });

  it('deleting a project cascades betas, moves, videos, notes and removes clip files', () => {
    const betaId = createBeta('p1', draft());
    insertVideo({ id: 'v1', projectId: 'p1', localUri: 'file:///v1.mp4', durationSec: 12, sizeBytes: 1000 });
    insertVideo({ id: 'v2', projectId: 'p1', localUri: 'file:///v2.mp4', durationSec: 8, sizeBytes: 500 });
    addVideoNote('v1', 3, 'foot slipped');
    expect(count('betas')).toBe(1);
    expect(count('beta_moves')).toBe(3);

    deleteProject('p1');

    expect(count('betas')).toBe(0);
    expect(count('beta_moves')).toBe(0);
    expect(count('beta_videos')).toBe(0);
    expect(count('video_notes')).toBe(0);
    expect(deletedFiles.sort()).toEqual(['file:///v1.mp4', 'file:///v2.mp4']);
    expect(betaId).toBeTruthy();
  });

  it('deleting a project leaves other projects beta untouched', () => {
    insertProject({ id: 'p2', title: 'P2', gradeRaw: 'V3', normalizedDifficulty: 3, wallAngle: 'slab', holdType: 'crimps', status: 'in_progress', highWaterMarkMoves: 0, totalMoves: 8, microBeta: null, mediaUri: null });
    createBeta('p1', draft());
    createBeta('p2', draft());
    deleteProject('p1');
    expect(getBetasForProject('p2')).toHaveLength(1);
  });

  it('video notes are sorted by time, storage sums, and deleting a clip cascades its notes and file', () => {
    insertVideo({ id: 'v1', projectId: 'p1', localUri: 'file:///v1.mp4', durationSec: 30, sizeBytes: 2000 });
    addVideoNote('v1', 20, 'late');
    addVideoNote('v1', 5, 'early');
    expect(getNotesForVideo('v1').map((n) => n.text)).toEqual(['early', 'late']);
    expect(getProjectStorageBytes('p1')).toBe(2000);

    deleteVideo('v1');
    expect(getVideosForProject('p1')).toHaveLength(0);
    expect(count('video_notes')).toBe(0);
    expect(deletedFiles).toEqual(['file:///v1.mp4']);
    expect(getProjectStorageBytes('p1')).toBe(0);
  });
});
