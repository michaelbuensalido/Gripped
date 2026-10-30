import { extractSharedVideoLink, detectVideoPlatform, formatVideoPlatformLabel } from '../../utils/betaLogic';

describe('extractSharedVideoLink', () => {
  it('uses webUrl when provided', () => {
    expect(extractSharedVideoLink('https://www.instagram.com/reel/abc/', null)).toEqual({
      url: 'https://www.instagram.com/reel/abc/',
      caption: null,
    });
  });

  it('splits caption and link from text payloads (TikTok & YouTube)', () => {
    const tiktok = extractSharedVideoLink(null, 'Heel hook beta https://www.tiktok.com/@a/video/1');
    expect(tiktok?.url).toBe('https://www.tiktok.com/@a/video/1');
    expect(tiktok?.caption).toBe('Heel hook beta');

    const yt = extractSharedVideoLink(null, 'V8 slab crux https://youtube.com/shorts/abc123?si=xyz');
    expect(yt?.url).toBe('https://youtube.com/shorts/abc123?si=xyz');
    expect(yt?.caption).toBe('V8 slab crux');
  });

  it('strips duplicate URL from text when both webUrl and text are provided', () => {
    const r = extractSharedVideoLink(
      'https://youtu.be/abc123',
      'Toe hook sequence https://youtu.be/abc123?si=shared',
    );
    expect(r).toEqual({
      url: 'https://youtu.be/abc123',
      caption: 'Toe hook sequence',
    });
  });

  it('strips trailing punctuation', () => {
    expect(extractSharedVideoLink(null, 'see https://instagr.am/p/x.')?.url).toBe('https://instagr.am/p/x');
  });

  it('returns null when no link present', () => {
    expect(extractSharedVideoLink(null, 'just words')).toBeNull();
    expect(extractSharedVideoLink(null, null)).toBeNull();
  });

  it('formats platform labels for Instagram, TikTok, YouTube, and fallback', () => {
    expect(formatVideoPlatformLabel(detectVideoPlatform('https://www.instagram.com/reel/1'))).toBe('Instagram');
    expect(formatVideoPlatformLabel(detectVideoPlatform('https://www.tiktok.com/@user/video/1'))).toBe('TikTok');
    expect(formatVideoPlatformLabel(detectVideoPlatform('https://youtube.com/shorts/1'))).toBe('YouTube');
    expect(formatVideoPlatformLabel(detectVideoPlatform('https://youtu.be/1'))).toBe('YouTube');
    expect(formatVideoPlatformLabel(detectVideoPlatform('https://example.com/1'), 'Web Link')).toBe('Web Link');
  });
});
