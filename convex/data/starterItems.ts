import {
  getCatalogItems,
  getPlayableCatalogItems,
} from './catalog/catalog';
import type {
  CatalogCategory,
  CatalogItem,
} from './catalog/types';

export type StarterCategory = CatalogCategory;
export type StarterItem = CatalogItem;

export function getStarterItems(
  category: StarterCategory,
  collection: string | null,
): StarterItem[] {
  return getCatalogItems(category, collection);
}

export function getPlayableItems(
  category: StarterCategory,
  collection: string | null,
): StarterItem[] {
  return getPlayableCatalogItems(category, collection);
}
