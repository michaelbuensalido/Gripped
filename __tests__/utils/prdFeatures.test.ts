import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../services/betaFiles', () => ({
  deleteClipFile: () => {},
  deleteProjectClipDir: () => {},
  storeClip: () => ({ uri: '', sizeBytes: 0 }),
}));

import { getDatabase } from '../../db/schema';
import { insertPastSession, getAllSessions, getClimbsForSession } from '../../db/queries';
import { insertVideoInboxItem, getVideoInbox, deleteVideoInboxItem } from '../../db/betaQueries';
import { detectVideoPlatform, formatBetaSummaryText } from '../../utils/betaLogic';

describe('PRD roadmap features', () => {
  beforeEach(() => {
    getDatabase().execSync('DELETE FROM video_inbox; DELETE FROM climbs; DELETE FROM sessions; DELETE FROM outbox;');
  });

  it('inserts a backdated session with climbs', () => {
    const start = Date.now() - 3 * 86400000;
    const id = insertPastSession({
      startTime: start,
      endTime: start + 3600000,
      gymName: 'Test Gym',
      climbs: [
        { gradeRaw: 'V4', outcome: 'top', attempts: 2 },
        { gradeRaw: 'V3', outcome: 'flash', attempts: 1 },
      ],
    });
    const sessions = getAllSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(id);
    expect(sessions[0].endTime).toBe(start + 3600000);
    expect(getClimbsForSession(id)).toHaveLength(2);
  });

  it('stores and removes video inbox links', () => {
    const id = insertVideoInboxItem({ videoUrl: 'https://www.tiktok.com/@a/video/1', sourceType: 'tiktok' });
    expect(getVideoInbox().map((i) => i.id)).toEqual([id]);
    deleteVideoInboxItem(id);
    expect(getVideoInbox()).toHaveLength(0);
  });

  it('detects platforms', () => {
    expect(detectVideoPlatform('https://instagram.com/reel/x')).toBe('instagram');
    expect(detectVideoPlatform('https://vm.tiktok.com/x')).toBe('tiktok');
    expect(detectVideoPlatform('https://www.youtube.com/shorts/x')).toBe('youtube');
    expect(detectVideoPlatform('https://youtu.be/x')).toBe('youtube');
    expect(detectVideoPlatform('https://example.com')).toBe('other');
  });

  it('formats the beta share text with crux and videos', () => {
    const text = formatBetaSummaryText(
      { title: 'Rule Test', gradeRaw: 'V4', gymName: 'Test Gym', wallAngle: 'overhang', holdType: 'crimps' },
      { version: 1, label: '', keyTip: 'Hips in', cruxMoveId: 'b' },
      [
        { id: 'a', betaId: 'x', order: 0, text: 'Start', limb: null },
        { id: 'b', betaId: 'x', order: 1, text: 'Big move', limb: null },
      ],
      [{ videoUrl: 'https://tiktok.com/x', caption: null, sourceType: 'tiktok' }],
    );
    expect(text).toContain('Gripped Beta: Rule Test (V4)');
    expect(text).toContain('Key Tip: Hips in');
    expect(text).toContain('2. Big move [CRUX]');
    expect(text).toContain('- https://tiktok.com/x');
  });
});
