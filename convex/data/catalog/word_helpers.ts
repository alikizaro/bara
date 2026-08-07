import type { AnimePack, GameWord } from './types';

interface WordMetadata {
  sourceCategory?: string;
  animePackId?: string;
  animeTitle?: string;
}

export function makeWords(raw: string, emoji: string, metadata: WordMetadata = {}): GameWord[] {
  return [...new Set(raw.split("|").map((item) => item.trim()).filter(Boolean))]
    .map((label) => ({ label, emoji, ...metadata }));
}

export function makeAnimePack(
  id: string,
  name: string,
  englishName: string,
  icon: string,
  color: string,
  raw: string,
): AnimePack {
  return {
    id,
    name,
    englishName,
    icon,
    color,
    items: makeWords(raw, icon, {
      sourceCategory: "anime",
      animePackId: id,
      animeTitle: englishName,
    }),
  };
}
