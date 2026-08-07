import animeArtworkCatalog from './anime_artwork.generated.json';
import { allAnimePack, animePacks } from './anime_packs';
import coreArtworkCatalog from './core_artwork.generated.json';
import {
  animalWords,
  cityWords,
  countryWords,
  famousPeopleWords,
  footballWords,
  foodWords,
} from './core_words';
import type {
  AnimeCollectionSummary,
  CatalogCategory,
  CatalogItem,
  GameWord,
} from './types';

interface ArtworkEntry {
  sourceUrl: string;
  url: string;
}

type ArtworkCatalog = Record<string, Record<string, ArtworkEntry>>;

const animeArtwork = animeArtworkCatalog as ArtworkCatalog;
const coreArtwork = coreArtworkCatalog as ArtworkCatalog;

function artworkFor(word: GameWord): string | null {
  if (word.sourceCategory === 'anime' && word.animePackId) {
    return animeArtwork[word.animePackId]?.[word.label]?.url ?? null;
  }
  if (word.sourceCategory) {
    return coreArtwork[word.sourceCategory]?.[word.label]?.url ?? null;
  }
  return null;
}

function mapWords(words: GameWord[]): CatalogItem[] {
  return words.map((word) => ({
    name: word.label,
    imageUrl: artworkFor(word),
  }));
}

const coreWords: Record<Exclude<CatalogCategory, 'anime' | 'mixed'>, GameWord[]> = {
  animals: animalWords,
  countries: countryWords,
  cities: cityWords,
  food: foodWords,
  people: famousPeopleWords,
  football: footballWords,
};

const uniqueItems = (items: CatalogItem[]): CatalogItem[] => [
  ...new Map(items.map((item) => [item.name, item])).values(),
];

export const animeCollections: AnimeCollectionSummary[] = [
  { id: allAnimePack.id, label: allAnimePack.name, count: allAnimePack.items.length },
  ...animePacks.map((pack) => ({
    id: pack.id,
    label: pack.name,
    count: pack.items.length,
  })),
];

export function getCatalogItems(
  category: CatalogCategory,
  collection: string | null,
): CatalogItem[] {
  if (category === 'anime') {
    const pack = collection === allAnimePack.id
      ? allAnimePack
      : animePacks.find((candidate) => candidate.id === collection) ?? animePacks[0];
    return pack ? mapWords(pack.items) : [];
  }

  if (category === 'mixed') {
    return uniqueItems([
      ...Object.values(coreWords).flatMap(mapWords),
      ...mapWords(allAnimePack.items),
    ]);
  }

  return mapWords(coreWords[category]);
}

export function getPlayableCatalogItems(
  category: CatalogCategory,
  collection: string | null,
): CatalogItem[] {
  const allItems = getCatalogItems(category, collection);
  const imagedItems = allItems.filter((item) => item.imageUrl !== null);
  return imagedItems.length >= 4 ? imagedItems : allItems;
}
