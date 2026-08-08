import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

type MafiaRole = 'mafia' | 'detective' | 'doctor' | 'citizen';

export function buildMafiaRoles(playerCount: number): MafiaRole[] {
  if (playerCount < 5) throw new Error('المافيا تحتاج 5 لاعبين على الأقل');
  const mafiaCount = playerCount >= 7 ? 2 : 1;
  return [
    ...Array.from({ length: mafiaCount }, () => 'mafia' as const),
    'detective',
    'doctor',
    ...Array.from({ length: playerCount - mafiaCount - 2 }, () => 'citizen' as const),
  ];
}

export async function createMafiaRound(
  ctx: MutationCtx,
  room: Doc<'rooms'>,
  memberships: Doc<'roomMembers'>[],
): Promise<Id<'rounds'>> {
  const players = [...memberships]
    .sort((left, right) => left.joinedAt - right.joinedAt)
    .map((membership) => membership.playerId);
  if (players.length < 5) throw new Error('المافيا تحتاج 5 لاعبين على الأقل');

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const roles = buildMafiaRoles(players.length);
  const assignments = shuffled.map((playerId, index) => ({
    playerId,
    role: roles[index] ?? 'citizen',
  }));
  const firstMafia = assignments.find((assignment) => assignment.role === 'mafia');
  if (!firstMafia) throw new Error('تعذر توزيع أدوار المافيا');

  return await ctx.db.insert('rounds', {
    roomId: room._id,
    roundNumber: room.currentRoundNumber + 1,
    secretName: 'المافيا',
    secretImageUrl: null,
    outsiderPlayerId: firstMafia.playerId,
    phase: 'mafia_night',
    currentQuestionerId: null,
    currentAnswererId: null,
    automaticTurnIndex: 0,
    freePlayerIndex: 0,
    freeQuestionIndex: 0,
    outsiderGuessName: null,
    outsiderGuessCorrect: null,
    mafiaAssignments: assignments,
    mafiaNightActions: [],
    mafiaDetectiveFindings: [],
    mafiaEliminatedPlayerIds: [],
    mafiaWinner: null,
    completedAt: null,
    createdAt: Date.now(),
  });
}
