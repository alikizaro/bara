export type CatalogCategory =
  | 'animals'
  | 'anime'
  | 'countries'
  | 'cities'
  | 'food'
  | 'people'
  | 'football'
  | 'mixed';

export interface GameWord {
  label: string;
  emoji: string;
  sourceCategory?: string;
  animePackId?: string;
  animeTitle?: string;
}

export interface AnimePack {
  id: string;
  name: string;
  englishName: string;
  icon: string;
  color: string;
  items: GameWord[];
}

export interface CatalogItem {
  name: string;
  imageUrl: string | null;
}

export interface AnimeCollectionSummary {
  id: string;
  label: string;
  count: number;
}
