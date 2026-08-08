export type GameId = 'outsider' | 'character' | 'mafia';

export interface GameCatalogItem {
  id: GameId;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  available: boolean;
}

export const gameCatalog: GameCatalogItem[] = [
  {
    id: 'outsider',
    title: 'برا السالفة',
    subtitle: 'اكشفوا من لا يعرف الموضوع',
    emoji: '🕵️',
    accent: '#FFB84D',
    available: true,
  },
  {
    id: 'character',
    title: 'احزر شخصيتي',
    subtitle: 'اسأل وخمّن شخصية خصمك',
    emoji: '🎭',
    accent: '#19D3C5',
    available: true,
  },
  {
    id: 'mafia',
    title: 'المافيا',
    subtitle: 'خداع وتحقيق بين أهل اللّمّة',
    emoji: '🌙',
    accent: '#FF668A',
    available: true,
  },
];
