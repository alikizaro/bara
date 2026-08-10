import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { requireActiveMembership, requirePlayer, requireRoomHost } from './lib/identity';
import { createMafiaRound } from './lib/mafiaRounds';
import { loadActiveRoomPlayers } from './lib/roomView';
import { MAX_PLAYERS } from './lib/roomPolicy';
import { mafiaRoleValidator } from './validators';

const playerValidator = v.object({
  id: v.id('players'), displayName: v.string(), avatarColor: v.string(),
  avatarUrl: v.union(v.string(), v.null()), totalPoints: v.number(),
  isHost: v.boolean(), isReady: v.boolean(), isOnline: v.boolean(), roomScore: v.number(),
});

const mafiaViewValidator = v.object({
  roomId: v.id('rooms'), roundNumber: v.number(),
  phase: v.union(v.literal('mafia_night'), v.literal('mafia_discussion'), v.literal('mafia_voting'), v.literal('mafia_results')),
  role: mafiaRoleValidator,
  teammates: v.array(playerValidator), players: v.array(playerValidator),
  eliminatedPlayerIds: v.array(v.id('players')),
  myNightActionSubmitted: v.boolean(),
  detectiveFinding: v.union(v.null(), v.object({ targetPlayerId: v.id('players'), isMafia: v.boolean() })),
  myVoteTargetId: v.union(v.id('players'), v.null()),
  submittedVoteCount: v.number(), totalVoterCount: v.number(),
  eliminatedPlayerId: v.union(v.id('players'), v.null()),
  winner: v.union(v.literal('mafia'), v.literal('village'), v.null()),
  revealedRoles: v.array(v.object({ playerId: v.id('players'), role: mafiaRoleValidator })),
});

function topVoted(votes: Pick<Doc<'votes'>, 'targetPlayerId'>[]): Id<'players'> | null {
  const counts = new Map<Id<'players'>, number>();
  for (const vote of votes) counts.set(vote.targetPlayerId, (counts.get(vote.targetPlayerId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

async function awardWinners(ctx: MutationCtx, roomId: Id<'rooms'>, assignments: NonNullable<Doc<'rounds'>['mafiaAssignments']>, winner: 'mafia' | 'village') {
  for (const assignment of assignments) {
    const wins = winner === 'mafia' ? assignment.role === 'mafia' : assignment.role !== 'mafia';
    if (!wins) continue;
    const membership = await ctx.db.query('roomMembers').withIndex('by_room_id_and_player_id', (q) => q.eq('roomId', roomId).eq('playerId', assignment.playerId)).unique();
    const player = await ctx.db.get(assignment.playerId);
    if (membership?.isActive) await ctx.db.patch(membership._id, { roomScore: membership.roomScore + 1 });
    if (player) await ctx.db.patch(player._id, { totalPoints: player.totalPoints + 1 });
  }
}

export const getMyView = query({
  args: { installationId: v.string(), roomId: v.id('rooms') },
  returns: v.union(v.null(), mafiaViewValidator),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    if (!room?.activeRoundId || room.mode !== 'mafia') return null;
    const round = await ctx.db.get(room.activeRoundId);
    const assignments = round?.mafiaAssignments ?? [];
    const mine = assignments.find((item) => item.playerId === player._id);
    if (!round || !mine || (
      round.phase !== 'mafia_night' &&
      round.phase !== 'mafia_discussion' &&
      round.phase !== 'mafia_voting' &&
      round.phase !== 'mafia_results'
    )) return null;
    const phase: 'mafia_night' | 'mafia_discussion' | 'mafia_voting' | 'mafia_results' = round.phase;
    const players = await loadActiveRoomPlayers(ctx, room._id, room.hostPlayerId);
    const votes = await ctx.db.query('votes').withIndex('by_round_id', (q) => q.eq('roundId', round._id)).take(MAX_PLAYERS);
    const eliminated = round.phase === 'mafia_results' ? topVoted(votes) : null;
    const eliminatedIds = new Set(round.mafiaEliminatedPlayerIds ?? []);
    const finding = (round.mafiaDetectiveFindings ?? []).find((item) => item.playerId === player._id);
    const teammateIds = new Set(assignments.filter((item) => item.role === 'mafia' && mine.role === 'mafia').map((item) => item.playerId));
    return {
      roomId: room._id, roundNumber: round.roundNumber, phase,
      role: mine.role,
      teammates: players.filter((item) => item.id !== player._id && teammateIds.has(item.id as Id<'players'>)),
      eliminatedPlayerIds: round.mafiaEliminatedPlayerIds ?? [],
      myNightActionSubmitted: (round.mafiaNightActions ?? []).some((action) => action.playerId === player._id),
      detectiveFinding: finding ? { targetPlayerId: finding.targetPlayerId, isMafia: finding.isMafia } : null,
      players,
      myVoteTargetId: votes.find((vote) => vote.voterPlayerId === player._id)?.targetPlayerId ?? null,
      submittedVoteCount: votes.length, totalVoterCount: players.filter((item) => !eliminatedIds.has(item.id as Id<'players'>)).length,
      eliminatedPlayerId: eliminated,
      winner: round.mafiaWinner ?? null,
      revealedRoles: round.phase === 'mafia_results' ? assignments : [],
    };
  },
});

export const submitNightAction = mutation({
  args: { installationId: v.string(), roomId: v.id('rooms'), targetPlayerId: v.id('players') },
  returns: v.object({ complete: v.boolean() }),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    const round = room?.activeRoundId ? await ctx.db.get(room.activeRoundId) : null;
    if (!room || !round || room.mode !== 'mafia' || round.phase !== 'mafia_night') throw new Error('مرحلة الليل غير متاحة الآن');
    await requireActiveMembership(ctx, room._id, args.targetPlayerId);

    const assignments = round.mafiaAssignments ?? [];
    const mine = assignments.find((assignment) => assignment.playerId === player._id);
    const target = assignments.find((assignment) => assignment.playerId === args.targetPlayerId);
    if (!mine || !target || mine.role === 'citizen') throw new Error('ليس لديك إجراء في مرحلة الليل');
    if ((round.mafiaNightActions ?? []).some((action) => action.playerId === player._id)) throw new Error('تم تسجيل اختيارك الليلي بالفعل');
    if (mine.role === 'mafia' && target.role === 'mafia') throw new Error('لا يمكن للمافيا اختيار أحد أفرادها');
    if (mine.role === 'detective' && player._id === args.targetPlayerId) throw new Error('اختر لاعبًا آخر للتحقيق معه');

    const nextActions = [...(round.mafiaNightActions ?? []), { playerId: player._id, targetPlayerId: args.targetPlayerId }];
    const requiredActors = assignments.filter((assignment) => assignment.role !== 'citizen');
    const complete = requiredActors.every((actor) => nextActions.some((action) => action.playerId === actor.playerId));
    const nextFindings = mine.role === 'detective'
      ? [...(round.mafiaDetectiveFindings ?? []), { playerId: player._id, targetPlayerId: args.targetPlayerId, isMafia: target.role === 'mafia' }]
      : (round.mafiaDetectiveFindings ?? []);

    if (!complete) {
      await ctx.db.patch(round._id, { mafiaNightActions: nextActions, mafiaDetectiveFindings: nextFindings });
      return { complete: false };
    }

    const mafiaTarget = topVoted(nextActions.filter((action) => assignments.find((item) => item.playerId === action.playerId)?.role === 'mafia'));
    const doctorId = assignments.find((assignment) => assignment.role === 'doctor')?.playerId;
    const savedTarget = nextActions.find((action) => action.playerId === doctorId)?.targetPlayerId ?? null;
    const eliminatedPlayerIds = mafiaTarget && mafiaTarget !== savedTarget ? [mafiaTarget] : [];
    await ctx.db.patch(round._id, {
      mafiaNightActions: nextActions,
      mafiaDetectiveFindings: nextFindings,
      mafiaEliminatedPlayerIds: eliminatedPlayerIds,
      phase: 'mafia_discussion',
    });
    return { complete: true };
  },
});

export const beginVoting = mutation({
  args: { installationId: v.string(), roomId: v.id('rooms') }, returns: v.null(),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    const room = await requireRoomHost(ctx, args.roomId, player._id);
    const round = room.activeRoundId ? await ctx.db.get(room.activeRoundId) : null;
    if (!round || round.phase !== 'mafia_discussion') throw new Error('مرحلة النقاش غير متاحة');
    await ctx.db.patch(round._id, { phase: 'mafia_voting' });
    return null;
  },
});

export const submitVote = mutation({
  args: { installationId: v.string(), roomId: v.id('rooms'), targetPlayerId: v.id('players') },
  returns: v.object({ complete: v.boolean() }),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    const round = room?.activeRoundId ? await ctx.db.get(room.activeRoundId) : null;
    if (!room || !round || room.mode !== 'mafia' || round.phase !== 'mafia_voting') throw new Error('التصويت غير متاح الآن');
    await requireActiveMembership(ctx, room._id, args.targetPlayerId);
    const eliminatedIds = new Set(round.mafiaEliminatedPlayerIds ?? []);
    if (eliminatedIds.has(player._id)) throw new Error('اللاعب المستبعد لا يستطيع التصويت');
    if (eliminatedIds.has(args.targetPlayerId)) throw new Error('هذا اللاعب مستبعد بالفعل');
    const oldVote = await ctx.db.query('votes').withIndex('by_round_id_and_voter_player_id', (q) => q.eq('roundId', round._id).eq('voterPlayerId', player._id)).unique();
    if (oldVote) throw new Error('صوّت بالفعل');
    await ctx.db.insert('votes', { roundId: round._id, voterPlayerId: player._id, targetPlayerId: args.targetPlayerId, createdAt: Date.now() });
    const members = await ctx.db.query('roomMembers').withIndex('by_room_id_and_is_active', (q) => q.eq('roomId', room._id).eq('isActive', true)).take(MAX_PLAYERS);
    const votes = await ctx.db.query('votes').withIndex('by_round_id', (q) => q.eq('roundId', round._id)).take(MAX_PLAYERS);
    const aliveMemberIds = members.map((member) => member.playerId).filter((playerId) => !eliminatedIds.has(playerId));
    const complete = votes.length >= aliveMemberIds.length;
    if (complete) {
      const eliminated = topVoted(votes);
      const assignments = round.mafiaAssignments ?? [];
      const eliminatedRole = assignments.find((item) => item.playerId === eliminated)?.role;
      const winner = eliminatedRole === 'mafia' ? 'village' : 'mafia';
      await awardWinners(ctx, room._id, assignments, winner);
      await ctx.db.patch(round._id, { phase: 'mafia_results', mafiaWinner: winner, completedAt: Date.now() });
    }
    return { complete };
  },
});

export const startNextRound = mutation({
  args: { installationId: v.string(), roomId: v.id('rooms') }, returns: v.object({ roundId: v.id('rounds') }),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    const room = await requireRoomHost(ctx, args.roomId, player._id);
    const previous = room.activeRoundId ? await ctx.db.get(room.activeRoundId) : null;
    if (room.mode !== 'mafia' || previous?.phase !== 'mafia_results') throw new Error('انتظر نتيجة الجولة أولًا');
    const members = await ctx.db.query('roomMembers').withIndex('by_room_id_and_is_active', (q) => q.eq('roomId', room._id).eq('isActive', true)).take(MAX_PLAYERS);
    const roundId = await createMafiaRound(ctx, room, members);
    await ctx.db.patch(room._id, { activeRoundId: roundId, currentRoundNumber: room.currentRoundNumber + 1, status: 'playing' });
    return { roundId };
  },
});
