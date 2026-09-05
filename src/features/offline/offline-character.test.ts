import { describe, expect, it } from 'vitest';
import { characterOpponent, characterPoints, characterReducer, createCharacterRound } from './offline-character';
import { offlineWords } from './offline-catalog';

describe('offline character guessing', () => {
  const words = offlineWords('animals', 'all-anime');
  it.each([2, 3, 20])('completes a %i-player round without showing choices until everyone agrees', (count) => {
    let round = createCharacterRound(Array.from({ length: count }, (_, i) => `لاعب ${i}`), words);
    expect(new Set(round.secrets).size).toBe(count);
    for (let i = 0; i < count; i++) {
      expect(characterOpponent(round, i)).not.toBe(i);
      expect(round.choices[i]).not.toContain(round.secrets[i]);
      expect(round.choices[i]).toContain(round.secrets[characterOpponent(round, i)]);
      expect(new Set(round.choices[i]).size).toBe(4);
      expect(round.cursor).toBe(i);
      expect(round.revealed).toBe(false);
      expect(characterReducer(round, { type: 'next' })).toBe(round);
      round = characterReducer(round, { type: 'reveal' });
      round = characterReducer(round, { type: 'next' });
    }
    expect(round.phase).toBe('questions');
    expect(characterReducer(round, { type: 'guess', word: round.secrets[1]! })).toBe(round);
    round = characterReducer(round, { type: 'ready' });
    for (let i = 0; i < count; i++) {
      expect(round.phase).toBe('ready');
      expect(characterReducer(round, { type: 'ready' })).toBe(round);
      round = characterReducer(round, { type: 'reveal' });
      round = characterReducer(round, { type: 'ready' });
    }
    for (let i = 0; i < count; i++) {
      expect(round.phase).toBe('voting');
      expect(round.revealed).toBe(false);
      round = characterReducer(round, { type: 'reveal' });
      expect(characterReducer(round, { type: 'guess', word: 'invalid' })).toBe(round);
      round = characterReducer(round, { type: 'guess', word: i === 0 ? null : round.secrets[characterOpponent(round, i)]! });
    }
    expect(round.phase).toBe('results');
    expect(characterPoints(round)).toEqual([0, ...Array(count - 1).fill(1)]);
    expect(characterReducer(round, { type: 'guess', word: null })).toBe(round);
  });

  it('hides a revealed secret and resets readiness when someone wants more questions', () => {
    let round = createCharacterRound(['علي', 'محمد'], words);
    round = characterReducer(round, { type: 'reveal' });
    round = characterReducer(round, { type: 'hide' });
    expect(round.revealed).toBe(false);
    round = { ...round, phase: 'ready', cursor: 1, revealed: true };
    round = characterReducer(round, { type: 'discuss' });
    expect(round).toMatchObject({ phase: 'questions', cursor: 0, revealed: false });
    expect(characterReducer(round, { type: 'ready' })).toMatchObject({ phase: 'ready', cursor: 0, revealed: false });
  });

  it('rejects invalid names, insufficient words and more than twenty players', () => {
    expect(() => createCharacterRound(['علي'], words)).toThrow();
    expect(() => createCharacterRound(['علي', ' علي '], words)).toThrow();
    expect(() => createCharacterRound(['علي', 'محمد'], ['أسد'])).toThrow();
    expect(() => createCharacterRound(Array.from({ length: 21 }, (_, i) => `${i}`), words)).toThrow();
  });
});
