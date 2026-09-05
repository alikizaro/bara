import { allAnimePack, animePacks } from '../../../convex/data/catalog/anime_packs';
import { animalWords, cityWords, countryWords, famousPeopleWords, footballWords, foodWords } from '../../../convex/data/catalog/core_words';
import type { CategoryId } from '../../domain/game';

// Bundle names only: offline rounds never fetch artwork or contact the server.
export function offlineWords(category: CategoryId, collection: string): string[] {
  const core = { animals: animalWords, cities: cityWords, countries: countryWords, people: famousPeopleWords, football: footballWords, food: foodWords };
  const anime = collection === 'all-anime' ? allAnimePack.items : animePacks.find((pack) => pack.id === collection)?.items ?? [];
  const words = category === 'mixed' ? [...Object.values(core).flat(), ...allAnimePack.items]
    : category === 'anime' ? anime : core[category];
  return [...new Set(words.map((word) => word.label))];
}
