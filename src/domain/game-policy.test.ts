import { describe, expect, it } from 'vitest';

import type { RoomSettings } from './game';
import {
  canHostStart,
  normalizeDisplayName,
  normalizeRoomCode,
  validateRoomSettings,
} from './game-policy';

describe('game policy', () => {
  it('normalizes invite codes and limits them to six characters', () => {
    expect(normalizeRoomCode(' a7-k9 q2-extra ')).toBe('A7K9Q2');
  });

  it('normalizes whitespace in player names', () => {
    expect(normalizeDisplayName('  علي   الوندي  ')).toBe('علي الوندي');
  });

  it('requires an anime collection', () => {
    const settings: RoomSettings = {
      mode: 'classic',
      category: 'anime',
      collection: null,
      maxPlayers: 6,
      automaticQuestions: 3,
      freeQuestionsPerPlayer: 1,
      outsiderCount: 1,
      teamSize: 1,
    };
    expect(validateRoomSettings(settings)).toBe('اختر عمل الأنمي أولًا');
  });

  it('allows a ready two-player duel to start', () => {
    expect(
      canHostStart(
        [
          { isHost: true, isReady: true },
          { isHost: false, isReady: true },
        ],
        'duel',
      ),
    ).toBe(true);
  });

  it('allows the host to start only after three players and all guests ready', () => {
    expect(
      canHostStart([
        { isHost: true, isReady: true },
        { isHost: false, isReady: true },
        { isHost: false, isReady: true },
      ]),
    ).toBe(true);

    expect(
      canHostStart([
        { isHost: true, isReady: true },
        { isHost: false, isReady: false },
        { isHost: false, isReady: true },
      ]),
    ).toBe(false);
  });

  it('requires five players when there are two outsiders', () => {
    expect(validateRoomSettings({
      mode: 'classic', category: 'animals', collection: null,
      maxPlayers: 4, automaticQuestions: 3, freeQuestionsPerPlayer: 1,
      outsiderCount: 2, teamSize: 1,
    })).toBe('وضع شخصين برا السالفة يحتاج 5 لاعبين على الأقل');
  });

  it('requires both character teams to be full', () => {
    expect(canHostStart([
      { isHost: true, isReady: true },
      { isHost: false, isReady: true },
      { isHost: false, isReady: true },
    ], 'duel', 4)).toBe(false);
  });
});
