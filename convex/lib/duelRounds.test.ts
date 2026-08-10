import { describe, expect, it } from 'vitest';

import { buildDuelChoices } from './duelRounds';

describe('duel voting choices', () => {
  const items = Array.from({ length: 12 }, (_, index) => ({
    name: `شخصية ${index + 1}`,
    imageUrl: `https://example.com/${index + 1}.jpg`,
  }));

  it('shows a compact unique ballot that always contains both team secrets', () => {
    const choices = buildDuelChoices(items, [items[2]!, items[9]!], 8, () => 0.4);
    expect(choices).toHaveLength(8);
    expect(choices.map((choice) => choice.name)).toEqual(
      expect.arrayContaining([items[2]!.name, items[9]!.name]),
    );
    expect(new Set(choices.map((choice) => choice.name)).size).toBe(8);
  });
});
