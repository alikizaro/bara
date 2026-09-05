import { describe, expect, it } from 'vitest';
import { categories, animeCollections } from '../../domain/game';
import { offlineWords } from './offline-catalog';
import { createOfflineRound, offlineReducer, offlineResult, validateOfflineNames } from './offline-game';

describe('one-device offline game', () => {
  const names = ['علي', 'محمد', 'أحمد'];
  const words = ['أسد', 'نمر', 'فيل', 'قطة', 'كلب'];
  it('completes secret handoffs, round-robin questions, private votes, guess and scoring', () => {
    let round = createOfflineRound(names, words, 3, undefined, () => 0);
    expect(round.outsider).toBe(0);
    expect(new Set(round.choices).size).toBe(4);
    expect(round.choices).toContain(round.secret);
    expect(offlineReducer(round, { type: 'next' })).toBe(round);
    for (let i = 0; i < 3; i++) {
      expect(round.cursor).toBe(i);
      expect(round.revealed).toBe(false);
      round = offlineReducer(round, { type: 'reveal' });
      round = offlineReducer(round, { type: 'next' });
    }
    const order = [];
    for (let i = 0; i < 9; i++) {
      expect(round.phase).toBe('questions');
      order.push(round.names[round.cursor % 3]);
      round = offlineReducer(round, { type: 'next' });
    }
    expect(order).toEqual([...names, ...names, ...names]);
    expect(round.phase).toBe('voting');
    expect(offlineReducer(round, { type: 'vote', target: 1 })).toBe(round);
    for (const target of [1, 0, 0]) {
      round = offlineReducer(round, { type: 'reveal' });
      expect(offlineReducer(round, { type: 'vote', target: round.cursor })).toBe(round);
      round = offlineReducer(round, { type: 'vote', target });
      expect(round.revealed).toBe(false);
    }
    expect(round.phase).toBe('guess');
    round = offlineReducer(round, { type: 'reveal' });
    round = offlineReducer(round, { type: 'guess', word: round.secret });
    expect(round.phase).toBe('results');
    expect(offlineResult(round)).toMatchObject({ caught: true, guessed: true, tied: false, points: [1, 1, 1] });
    expect(offlineReducer(round, { type: 'guess', word: null })).toBe(round);
  });

  it('hides private views on interruption and requires revealing again', () => {
    const round = createOfflineRound(names, words, 1);
    const hidden = offlineReducer(offlineReducer(round, { type: 'reveal' }), { type: 'hide' });
    expect(hidden.revealed).toBe(false);
    expect(hidden.cursor).toBe(0);
    expect(offlineReducer(hidden, { type: 'next' })).toBe(hidden);
  });

  it('handles tied votes and wrong guesses without awarding outsider points', () => {
    const round = { ...createOfflineRound(names, words, 1, undefined, () => 0), votes: [1, 2, 0], guess: null };
    expect(offlineResult(round)).toMatchObject({ caught: false, tied: true, guessed: false, points: [0, 0, 1] });
  });

  it('validates participants and supports twenty players with a new secret on replay', () => {
    expect(validateOfflineNames(['علي', ' علي ', 'أحمد'])).toBeTruthy();
    expect(validateOfflineNames(['علي', '', 'أحمد'])).toBeTruthy();
    expect(validateOfflineNames(['علي', 'أحمد'])).toBeTruthy();
    expect(validateOfflineNames(Array.from({ length: 21 }, (_, i) => `لاعب ${i}`))).toBeTruthy();
    const players = Array.from({ length: 20 }, (_, i) => `لاعب ${i}`);
    const round = createOfflineRound(players, words, 10, undefined, () => 0.9999);
    expect(round.outsider).toBe(19);
    expect(createOfflineRound(players, words, 1, round.secret).secret).not.toBe(round.secret);
    expect(() => createOfflineRound(names, ['أسد'], 1)).toThrow();
    expect(() => createOfflineRound(names, words, 0)).toThrow();
  });

  it('bundles every category and anime collection without network or image dependencies', () => {
    for (const category of categories) {
      const pool = offlineWords(category.id, 'all-anime');
      expect(pool.length).toBeGreaterThanOrEqual(4);
      expect(pool.every((word) => !word.includes('https://'))).toBe(true);
    }
    for (const collection of animeCollections) {
      expect(offlineWords('anime', collection.id).length).toBeGreaterThanOrEqual(4);
    }
  });
});
