export function getCachedArtworkUrl(imageUrl: string): string {
  if (imageUrl.startsWith('https://images.weserv.nl/')) return imageUrl;
  if (!imageUrl.startsWith('https://upload.wikimedia.org/')) return imageUrl;
  const source = imageUrl.split('?')[0]?.replace(/^https?:\/\//, '') ?? imageUrl;
  return `https://images.weserv.nl/?url=${encodeURIComponent(source)}&w=720&h=720&fit=cover&output=jpg`;
}

export function getArtworkAttemptUrl(imageUrl: string, attempt: number): string | null {
  const cached = getCachedArtworkUrl(imageUrl);
  if (attempt === 0) return cached;
  if (attempt === 1 && cached !== imageUrl) return imageUrl;
  return null;
}
