import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { getPlayableItems } from './data/starterItems';
import {
  requireActiveMembership,
  requirePlayer,
  requireRoomHost,
} from './lib/identity';
import { buildDuelChoices, createDuelRound } from './lib/duelRounds';
import { loadActiveRoomPlayers } from './lib/roomView';

const artworkValidator = v.object({
  name: v.string(),
  imageUrl: v.union(v.string(), v.null()),
});

const roomPlayerValidator = v.object({
  id: v.id('players'),
  displayName: v.string(),
  avatarColor: v.string(),
  avatarUrl: v.union(v.string(), v.null()),
  totalPoints: v.number(),
  isHost: v.boolean(),
  isReady: v.boolean(),
  isOnline: v.boolean(),
  roomScore: v.number(),
});

const duelViewValidator = v.object({
  roomId: v.id('rooms'),
  roundNumber: v.number(),
  phase: v.union(
    v.literal('duel_guessing'),
    v.literal('duel_voting'),
    v.literal('results'),
  ),
  secret: artworkValidator,
  opponent: roomPlayerValidator,
  teamPlayers: v.array(roomPlayerValidator),
  opponents: v.array(roomPlayerValidator),
  myReadyToVote: v.boolean(),
  readyToVoteCount: v.number(),
  totalPlayerCount: v.number(),
  voteChoices: v.array(artworkValidator),
  myGuessName: v.union(v.string(), v.null()),
  opponentHasGuessed: v.boolean(),
  result: v.union(
    v.null(),
    v.object({
      opponentSecret: artworkValidator,
      opponentGuessName: v.union(v.string(), v.null()),
      myGuessCorrect: v.boolean(),
      opponentGuessCorrect: v.boolean(),
    }),
  ),
  players: v.array(roomPlayerValidator),
});

async function awardPoint(
  ctx: MutationCtx,
  roomId: Id<'rooms'>,
  playerId: Id<'players'>,
): Promise<void> {
  const membership = await ctx.db
    .query('roomMembers')
    .withIndex('by_room_id_and_player_id', (q) =>
      q.eq('roomId', roomId).eq('playerId', playerId),
    )
    .unique();
  const player = await ctx.db.get(playerId);
  if (membership?.isActive) {
    await ctx.db.patch(membership._id, { roomScore: membership.roomScore + 1 });
  }
  if (player) {
    await ctx.db.patch(player._id, { totalPoints: player.totalPoints + 1 });
  }
}

export const getMyView = query({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.union(v.null(), duelViewValidator),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    if (!room?.activeRoundId || room.mode !== 'duel') {
      return null;
    }
    const round = await ctx.db.get(room.activeRoundId);
    const assignments = round?.duelAssignments ?? [];
    if (!round || (
      round.phase !== 'duel_guessing' &&
      round.phase !== 'duel_voting' &&
      round.phase !== 'results'
    )) {
      return null;
    }
    const mine = assignments.find((item) => item.playerId === player._id);
    const teams = round.duelTeams ?? assignments.map((item, index) => ({ playerId: item.playerId, team: index }));
    const myTeam = teams.find((item) => item.playerId === player._id)?.team;
    const opponentIds = new Set(teams.filter((item) => item.team !== myTeam).map((item) => item.playerId));
    const teamIds = new Set(teams.filter((item) => item.team === myTeam).map((item) => item.playerId));
    const theirs = assignments.find((item) => opponentIds.has(item.playerId));
    if (!mine || !theirs) {
      return null;
    }
    const players = await loadActiveRoomPlayers(ctx, room._id, room.hostPlayerId);
    const opponent = players.find((item) => item.id === theirs.playerId);
    if (!opponent) {
      return null;
    }
    const guesses = round.duelGuesses ?? [];
    const readyPlayerIds = round.duelReadyPlayerIds ?? [];
    const myGuess = guesses.find((guess) => guess.playerId === player._id);
    const opponentGuess = guesses.find((guess) => guess.playerId === opponent.id);
    const reveal = round.phase === 'results';

    return {
      roomId: room._id,
      roundNumber: round.roundNumber,
      phase: round.phase,
      secret: { name: mine.name, imageUrl: mine.imageUrl },
      opponent,
      teamPlayers: players.filter((item) => teamIds.has(item.id)),
      opponents: players.filter((item) => opponentIds.has(item.id)),
      myReadyToVote: readyPlayerIds.includes(player._id),
      readyToVoteCount: readyPlayerIds.length,
      totalPlayerCount: assignments.length,
      voteChoices: round.phase === 'duel_voting' ? (round.duelChoices ?? []) : [],
      myGuessName: myGuess?.guessedName ?? null,
      opponentHasGuessed: Boolean(opponentGuess),
      result: reveal
        ? {
            opponentSecret: { name: theirs.name, imageUrl: theirs.imageUrl },
            opponentGuessName: opponentGuess?.guessedName ?? null,
            myGuessCorrect: myGuess?.correct ?? false,
            opponentGuessCorrect: opponentGuess?.correct ?? false,
          }
        : null,
      players,
    };
  },
});

export const markReadyToVote = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.object({
    readyCount: v.number(),
    totalCount: v.number(),
    complete: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    const round = room?.activeRoundId ? await ctx.db.get(room.activeRoundId) : null;
    if (!room || !round || room.mode !== 'duel' || round.phase !== 'duel_guessing') {
      throw new Error('مرحلة الأسئلة انتهت بالفعل');
    }
    const assignments = round.duelAssignments ?? [];
    if (!assignments.some((assignment) => assignment.playerId === player._id)) {
      throw new Error('أنت لست ضمن لاعبي هذه المواجهة');
    }
    const current = round.duelReadyPlayerIds ?? [];
    const next = current.includes(player._id) ? current : [...current, player._id];
    const complete = next.length === assignments.length;
    const legacyChoices = round.duelChoices?.length
      ? round.duelChoices
      : buildDuelChoices(
          getPlayableItems(room.category, room.collection),
          [...new Map(assignments.map((assignment) => [assignment.name, {
            name: assignment.name,
            imageUrl: assignment.imageUrl,
          }])).values()],
        );
    await ctx.db.patch(round._id, {
      duelReadyPlayerIds: next,
      duelChoices: legacyChoices,
      phase: complete ? 'duel_voting' : 'duel_guessing',
    });
    return { readyCount: next.length, totalCount: assignments.length, complete };
  },
});

export const submitGuess = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
    guessedName: v.string(),
  },
  returns: v.object({ correct: v.boolean(), complete: v.boolean() }),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    if (!room?.activeRoundId || room.mode !== 'duel') {
      throw new Error('لا توجد مواجهة نشطة');
    }
    const round = await ctx.db.get(room.activeRoundId);
    if (!round || round.phase !== 'duel_voting') {
      throw new Error('انتظر حتى يضغط جميع اللاعبين «فلنصوّت»');
    }
    const assignments = round.duelAssignments ?? [];
    const teams = round.duelTeams ?? assignments.map((item, index) => ({ playerId: item.playerId, team: index }));
    const myTeam = teams.find((item) => item.playerId === player._id)?.team;
    const opponentId = teams.find((item) => item.team !== myTeam)?.playerId;
    const target = assignments.find((item) => item.playerId === opponentId);
    if (!target || assignments.length < 2) {
      throw new Error('تعذر العثور على صورة الخصم');
    }
    const guesses = round.duelGuesses ?? [];
    if (guesses.some((guess) => guess.playerId === player._id)) {
      throw new Error('تم إرسال تخمينك بالفعل');
    }
    const guessedName = args.guessedName.replace(/\s+/g, ' ').trim().slice(0, 120);
    if (!(round.duelChoices ?? []).some((choice) => choice.name === guessedName)) {
      throw new Error('اختر شخصية من بطاقات التصويت');
    }
    const correct = guessedName.toLocaleLowerCase() === target.name.toLocaleLowerCase();
    const nextGuesses = [...guesses, { playerId: player._id, guessedName, correct }];
    const complete = nextGuesses.length === assignments.length;
    if (complete) {
      for (const guess of nextGuesses) {
        if (guess.correct) {
          await awardPoint(ctx, room._id, guess.playerId);
        }
      }
    }
    await ctx.db.patch(round._id, {
      duelGuesses: nextGuesses,
      phase: complete ? 'results' : 'duel_voting',
      completedAt: complete ? Date.now() : null,
    });
    return { correct, complete };
  },
});

export const startNextRound = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.object({ roundId: v.id('rounds') }),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    const room = await requireRoomHost(ctx, args.roomId, player._id);
    await requireActiveMembership(ctx, room._id, player._id);
    const previousRound = room.activeRoundId
      ? await ctx.db.get(room.activeRoundId)
      : null;
    if (room.mode !== 'duel' || previousRound?.phase !== 'results') {
      throw new Error('انتظر ظهور نتيجة المواجهة أولًا');
    }
    const memberships = await ctx.db
      .query('roomMembers')
      .withIndex('by_room_id_and_is_active', (q) =>
        q.eq('roomId', room._id).eq('isActive', true),
      )
      .take(room.maxPlayers);
    if (memberships.length !== room.maxPlayers) {
      throw new Error('يلزم وجود جميع لاعبي الفريقين لبدء جولة جديدة');
    }
    const roundId = await createDuelRound(ctx, room, memberships, previousRound);
    await ctx.db.patch(room._id, {
      activeRoundId: roundId,
      currentRoundNumber: room.currentRoundNumber + 1,
      status: 'playing',
    });
    return { roundId };
  },
});
