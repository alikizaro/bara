import { describe, expect, it } from 'vitest';

import { buildMafiaRoles } from './mafiaRounds';

describe('mafia roles', () => {
  it('builds a complete five-player role set', () => {
    const roles = buildMafiaRoles(5);
    expect(roles).toHaveLength(5);
    expect(roles.filter((role) => role === 'mafia')).toHaveLength(1);
    expect(roles).toContain('doctor');
    expect(roles).toContain('detective');
  });

  it('adds a second mafia for larger rooms', () => {
    const roles = buildMafiaRoles(7);
    expect(roles).toHaveLength(7);
    expect(roles.filter((role) => role === 'mafia')).toHaveLength(2);
  });
});
