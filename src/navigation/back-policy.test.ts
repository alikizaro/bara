import { describe, expect, it } from 'vitest';

import { resolveBackAction } from './back-policy';

describe('Android back navigation', () => {
  it('leaves nested screens without exiting the app', () => {
    expect(resolveBackAction('profile', false)).toBe('home');
    expect(resolveBackAction('create', false)).toBe('game-modes');
  });

  it('requires leaving a room before returning home', () => {
    expect(resolveBackAction('home', true)).toBe('leave-room');
    expect(resolveBackAction('lobby', true)).toBe('leave-room');
  });

  it('allows Android to exit only from the home screen', () => {
    expect(resolveBackAction('home', false)).toBe('exit-app');
  });
});
