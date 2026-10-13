import { extractSharedVideoLink } from '../../utils/betaLogic';

describe('extractSharedVideoLink', () => {
  it('uses webUrl when provided', () => {
    expect(extractSharedVideoLink('https://www.instagram.com/reel/abc/', null)).toEqual({
      url: 'https://www.instagram.com/reel/abc/',
      caption: null,
    });
  });

  it('splits caption and link from text payloads', () => {
    const r = extractSharedVideoLink(null, 'Heel hook beta https://www.tiktok.com/@a/video/1');
    expect(r?.url).toBe('https://www.tiktok.com/@a/video/1');
    expect(r?.caption).toBe('Heel hook beta');
  });

  it('strips trailing punctuation', () => {
    expect(extractSharedVideoLink(null, 'see https://instagr.am/p/x.')?.url).toBe('https://instagr.am/p/x');
  });

  it('returns null when no link present', () => {
    expect(extractSharedVideoLink(null, 'just words')).toBeNull();
    expect(extractSharedVideoLink(null, null)).toBeNull();
  });
});
