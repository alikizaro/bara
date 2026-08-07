import { describe, expect, it } from 'vitest';

import type { Id } from '../_generated/dataModel';
import {
  makeRoomCode,
  nextFreeTurn,
  pickDistinctPair,
  pickOrderedPair,
} from './roomPolicy';

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

  it('cycles questioners in join order', () => {
    const members = [
      { playerId: 'player-a' as Id<'players'> },
      { playerId: 'player-b' as Id<'players'> },
      { playerId: 'player-c' as Id<'players'> },
    ];
    expect(pickOrderedPair(members, 0)).toEqual({
      questionerId: 'player-a',
      answererId: 'player-b',
    });
    expect(pickOrderedPair(members, 3)).toEqual({
      questionerId: 'player-a',
      answererId: 'player-b',
    });
  });

  it('gives every player one turn before starting the next question cycle', () => {
    const turns = [{ playerIndex: 0, questionIndex: 0 }];
    while (true) {
      const current = turns[turns.length - 1]!;
      const next = nextFreeTurn({
        ...current,
        playerCount: 3,
        questionsPerPlayer: 3,
      });
      if (!next) {
        break;
      }
      turns.push(next);
    }
    expect(turns).toEqual([
      { playerIndex: 0, questionIndex: 0 },
      { playerIndex: 1, questionIndex: 0 },
      { playerIndex: 2, questionIndex: 0 },
      { playerIndex: 0, questionIndex: 1 },
      { playerIndex: 1, questionIndex: 1 },
      { playerIndex: 2, questionIndex: 1 },
      { playerIndex: 0, questionIndex: 2 },
      { playerIndex: 1, questionIndex: 2 },
      { playerIndex: 2, questionIndex: 2 },
    ]);
  });
});
