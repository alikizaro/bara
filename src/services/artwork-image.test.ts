import { describe, expect, it } from 'vitest';

import { getArtworkAttemptUrl, getCachedArtworkUrl } from './artwork-image';

describe('artwork image fallback', () => {
  const original = 'https://upload.wikimedia.org/example.jpg?utm_source=test';

  it('uses a cached resized image first and strips tracking parameters', () => {
    const cached = getCachedArtworkUrl(original);
    expect(cached).toContain('images.weserv.nl');
    expect(cached).toContain(encodeURIComponent('upload.wikimedia.org/example.jpg'));
    expect(cached).not.toContain('utm_source');
  });

  it('falls back to the original URL and then to the visual placeholder', () => {
    expect(getArtworkAttemptUrl(original, 0)).toContain('images.weserv.nl');
    expect(getArtworkAttemptUrl(original, 1)).toBe(original);
    expect(getArtworkAttemptUrl(original, 2)).toBeNull();
  });

  it('uses non-Wikimedia artwork directly because that CDN blocks image proxies', () => {
    const anime = 'https://cdn.myanimelist.net/images/characters/9/310307.jpg?s=abc';
    expect(getArtworkAttemptUrl(anime, 0)).toBe(anime);
    expect(getArtworkAttemptUrl(anime, 1)).toBeNull();
  });
});
