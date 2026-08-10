import { describe, expect, it } from 'vitest';

import {
  animeCollections,
  getCatalogItems,
  getPlayableCatalogItems,
} from './catalog';
import type { CatalogCategory } from './types';

describe('game content catalog', () => {
  it('contains all twelve anime packs plus the combined choice', () => {
    expect(animeCollections).toHaveLength(13);
    expect(getCatalogItems('anime', 'all-anime')).toHaveLength(1078);
  });

  it('keeps Naruto independent from Boruto characters', () => {
    const names = getCatalogItems('anime', 'naruto').map((item) => item.name);
    const borutoCharacters = [
      'بوروتو أوزوماكي',
      'سارادا أوتشيها',
      'ميتسوكي',
      'كاواكي',
      'موموشيكي أوتسوتسوكي',
    ];
    expect(names).not.toEqual(expect.arrayContaining(borutoCharacters));
  });

  it('provides a reviewed image for all 168 animals', () => {
    const animals = getCatalogItems('animals', null);
    expect(animals).toHaveLength(168);
    expect(animals.every((item) => item.imageUrl !== null)).toBe(true);
    expect(getPlayableCatalogItems('animals', null).length).toBeGreaterThan(160);
  });

  it('only selects reviewed images when a category has enough artwork', () => {
    const categories: CatalogCategory[] = [
      'animals',
      'anime',
      'countries',
      'cities',
      'food',
      'people',
      'football',
      'mixed',
    ];
    for (const category of categories) {
      const collection = category === 'anime' ? 'one-piece' : null;
      const items = getPlayableCatalogItems(category, collection);
      expect(items.length).toBeGreaterThanOrEqual(4);
      expect(items.every((item) => item.imageUrl !== null)).toBe(true);
      expect(new Set(items.map((item) => item.imageUrl)).size).toBe(items.length);
    }
  });

  it('excludes character names whose generated image belongs to somebody else', () => {
    const names = getPlayableCatalogItems('anime', 'naruto').map((item) => item.name);
    expect(names).not.toContain('ناغاتو');
    expect(names).not.toContain('نيواكي');
    expect(names).toContain('يوغيتو ني');
    expect(names).toContain('أونـوكي');
  });
});
