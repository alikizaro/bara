import { describe, expect, it } from 'vitest';

import type { Id } from '../_generated/dataModel';
import { makeRoomCode, pickDistinctPair } from './roomPolicy';

describe('room backend policy', () => {
  it('creates a six-character room code from the safe alphabet', () => {
    expect(makeRoomCode(() => 0)).toBe('AAAAAA');
    expect(makeRoomCode(() => 0.999)).toHaveLength(6);
  });

  it('never selects the same questioner and answerer', () => {
    const members = [
      { playerId: 'player-a' as Id<'players'> },
      { playerId: 'player-b' as Id<'players'> },
      { playerId: 'player-c' as Id<'players'> },
    ];
    const pair = pickDistinctPair(members, () => 0);
    expect(pair.questionerId).not.toBe(pair.answererId);
  });
});
