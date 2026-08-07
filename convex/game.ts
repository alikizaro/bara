import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { getPlayableItems } from './data/starterItems';
import {
  requireActiveMembership,
  requirePlayer,
  requireRoomHost,
} from './lib/identity';
import { pickDistinctPair } from './lib/roomPolicy';
import { loadActiveRoomPlayers } from './lib/roomView';
import { createRoundForRoom } from './lib/rounds';
import { roundPhaseValidator } from './validators';

const roomPlayerValidator = v.object({
  id: v.id('players'),
  displayName: v.string(),
  avatarColor: v.string(),
  totalPoints: v.number(),
  isHost: v.boolean(),
  isReady: v.boolean(),
  isOnline: v.boolean(),
  roomScore: v.number(),
});

const guessChoiceValidator = v.object({
  name: v.string(),
  imageUrl: v.union(v.string(), v.null()),
});

const voteResultValidator = v.object({
  playerId: v.id('players'),
  voteCount: v.number(),
});

const roundPointValidator = v.object({
  playerId: v.id('players'),
  points: v.number(),
});

const gameViewValidator = v.object({
  roomId: v.id('rooms'),
  roundNumber: v.number(),
  phase: roundPhaseValidator,
  role: v.union(v.literal('inside'), v.literal('outsider')),
  secret: v.union(
    v.null(),
    v.object({
      name: v.string(),
      imageUrl: v.union(v.string(), v.null()),
    }),
  ),
  outsiderPlayerId: v.union(v.id('players'), v.null()),
  currentQuestionerId: v.union(v.id('players'), v.null()),
  currentAnswererId: v.union(v.id('players'), v.null()),
  automaticTurnIndex: v.number(),
  automaticTurnCount: v.number(),
  freePlayerIndex: v.number(),
  freeQuestionIndex: v.number(),
  freeQuestionCount: v.number(),
  guessChoices: v.union(v.null(), v.array(guessChoiceValidator)),
  myVoteTargetId: v.union(v.id('players'), v.null()),
  submittedVoteCount: v.number(),
  totalVoterCount: v.number(),
  voteResults: v.array(voteResultValidator),
  outsiderGuessName: v.union(v.string(), v.null()),
  outsiderGuessCorrect: v.union(v.boolean(), v.null()),
  roundPoints: v.array(roundPointValidator),
  players: v.array(roomPlayerValidator),
});

function makeGuessChoices(
  secretName: string,
  category: Doc<'rooms'>['category'],
  collection: string | null,
  roundNumber: number,
) {
  const items = getPlayableItems(category, collection);
  const secret = items.find((item) => item.name === secretName) ?? {
    name: secretName,
    imageUrl: null,
  };
  const alternatives = items.filter((item) => item.name !== secretName);
  const offset = alternatives.length === 0
    ? 0
    : (roundNumber * 7) % alternatives.length;
  const rotated = alternatives
    .slice(offset)
    .concat(alternatives.slice(0, offset));
  const choices = [secret, ...rotated.slice(0, 3)];
  const shift = choices.length === 0 ? 0 : roundNumber % choices.length;
  return choices.slice(shift).concat(choices.slice(0, shift));
}

function buildVoteResults(votes: Doc<'votes'>[]) {
  const counts = new Map<Id<'players'>, number>();
  for (const vote of votes) {
    counts.set(
      vote.targetPlayerId,
      (counts.get(vote.targetPlayerId) ?? 0) + 1,
    );
  }
  return [...counts.entries()].map(([playerId, voteCount]) => ({
    playerId,
    voteCount,
  }));
}

function buildRoundPoints(round: Doc<'rounds'>, votes: Doc<'votes'>[]) {
  const points = new Map<Id<'players'>, number>();
  for (const vote of votes) {
    if (vote.targetPlayerId === round.outsiderPlayerId) {
      points.set(vote.voterPlayerId, (points.get(vote.voterPlayerId) ?? 0) + 1);
    }
  }
  if (round.outsiderGuessCorrect) {
    points.set(
      round.outsiderPlayerId,
      (points.get(round.outsiderPlayerId) ?? 0) + 1,
    );
  }
  return [...points.entries()].map(([playerId, awardedPoints]) => ({
    playerId,
    points: awardedPoints,
  }));
}

export const getMyView = query({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.union(v.null(), gameViewValidator),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    if (!room?.activeRoundId) {
      return null;
    }
    const round = await ctx.db.get(room.activeRoundId);
    if (!round) {
      return null;
    }

    const isOutsider = round.outsiderPlayerId === player._id;
    const role: 'inside' | 'outsider' = isOutsider ? 'outsider' : 'inside';
    const revealResult = round.phase === 'results';
    const revealVotes =
      round.phase === 'outsider_guess' || round.phase === 'results';
    const players = await loadActiveRoomPlayers(
      ctx,
      room._id,
      room.hostPlayerId,
    );
    const votes =
      round.phase === 'voting' || revealVotes
        ? await ctx.db
            .query('votes')
            .withIndex('by_round_id', (q) => q.eq('roundId', round._id))
            .take(room.maxPlayers)
        : [];
    const ownVote = votes.find((vote) => vote.voterPlayerId === player._id);

    return {
      roomId: room._id,
      roundNumber: round.roundNumber,
      phase: round.phase,
      role,
      secret:
        !isOutsider || revealResult
          ? { name: round.secretName, imageUrl: round.secretImageUrl }
          : null,
      outsiderPlayerId: revealVotes ? round.outsiderPlayerId : null,
      currentQuestionerId: round.currentQuestionerId,
      currentAnswererId: round.currentAnswererId,
      automaticTurnIndex: round.automaticTurnIndex,
      automaticTurnCount: room.automaticQuestions,
      freePlayerIndex: round.freePlayerIndex,
      freeQuestionIndex: round.freeQuestionIndex,
      freeQuestionCount: room.freeQuestionsPerPlayer,
      guessChoices:
        isOutsider && round.phase === 'outsider_guess'
          ? makeGuessChoices(
              round.secretName,
              room.category,
              room.collection,
              round.roundNumber,
            )
          : null,
      myVoteTargetId: ownVote?.targetPlayerId ?? null,
      submittedVoteCount: votes.length,
      totalVoterCount: players.length,
      voteResults: revealVotes ? buildVoteResults(votes) : [],
      outsiderGuessName: revealResult ? round.outsiderGuessName ?? null : null,
      outsiderGuessCorrect:
        revealResult ? round.outsiderGuessCorrect ?? null : null,
      roundPoints: revealResult ? buildRoundPoints(round, votes) : [],
      players,
    };
  },
});

export const chooseFreeAnswerer = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
    answererPlayerId: v.id('players'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    if (!room?.activeRoundId) {
      throw new Error('لا توجد جولة نشطة');
    }
    const round = await ctx.db.get(room.activeRoundId);
    if (!round || round.phase !== 'free_questions') {
      throw new Error('اختيار اللاعب متاح في الأسئلة الحرة فقط');
    }
    if (round.currentQuestionerId !== player._id) {
      throw new Error('ليس دورك في السؤال الآن');
    }
    if (args.answererPlayerId === player._id) {
      throw new Error('اختر لاعبًا آخر');
    }
    await requireActiveMembership(ctx, room._id, args.answererPlayerId);
    await ctx.db.patch(round._id, {
      currentAnswererId: args.answererPlayerId,
    });
    return null;
  },
});

export const advanceConversation = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    if (!room?.activeRoundId) {
      throw new Error('لا توجد جولة نشطة');
    }
    const round = await ctx.db.get(room.activeRoundId);
    if (!round) {
      throw new Error('الجولة غير موجودة');
    }
    const canAdvance =
      player._id === room.hostPlayerId ||
      player._id === round.currentQuestionerId;
    if (!canAdvance) {
      throw new Error('صاحب الغرفة أو السائل فقط يمكنه إنهاء الحوار');
    }

    const memberships = await ctx.db
      .query('roomMembers')
      .withIndex('by_room_id_and_is_active', (q) =>
        q.eq('roomId', room._id).eq('isActive', true),
      )
      .take(room.maxPlayers);
    memberships.sort((left, right) => left.joinedAt - right.joinedAt);

    if (round.phase === 'automatic_questions') {
      const nextTurn = round.automaticTurnIndex + 1;
      if (nextTurn < room.automaticQuestions) {
        const pair = pickDistinctPair(memberships);
        await ctx.db.patch(round._id, {
          automaticTurnIndex: nextTurn,
          currentQuestionerId: pair.questionerId,
          currentAnswererId: pair.answererId,
        });
        return null;
      }

      const firstQuestioner = memberships[0];
      if (!firstQuestioner) {
        throw new Error('لا يوجد لاعب لبدء الأسئلة الحرة');
      }
      await ctx.db.patch(round._id, {
        phase: 'free_questions',
        currentQuestionerId: firstQuestioner.playerId,
        currentAnswererId: null,
        freePlayerIndex: 0,
        freeQuestionIndex: 0,
      });
      return null;
    }

    if (round.phase !== 'free_questions') {
      throw new Error('لا يمكن إنهاء حوار في هذه المرحلة');
    }
    if (!round.currentAnswererId) {
      throw new Error('اختر لاعبًا للإجابة أولًا');
    }

    const nextFreeQuestion = round.freeQuestionIndex + 1;
    if (nextFreeQuestion < room.freeQuestionsPerPlayer) {
      await ctx.db.patch(round._id, {
        freeQuestionIndex: nextFreeQuestion,
        currentAnswererId: null,
      });
      return null;
    }

    const nextPlayerIndex = round.freePlayerIndex + 1;
    const nextQuestioner = memberships[nextPlayerIndex];
    if (nextQuestioner) {
      await ctx.db.patch(round._id, {
        freePlayerIndex: nextPlayerIndex,
        freeQuestionIndex: 0,
        currentQuestionerId: nextQuestioner.playerId,
        currentAnswererId: null,
      });
      return null;
    }

    await ctx.db.patch(round._id, {
      phase: 'voting',
      currentQuestionerId: null,
      currentAnswererId: null,
    });
    return null;
  },
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
    await ctx.db.patch(membership._id, {
      roomScore: membership.roomScore + 1,
    });
  }
  if (player) {
    await ctx.db.patch(player._id, { totalPoints: player.totalPoints + 1 });
  }
}

export const submitVote = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
    targetPlayerId: v.id('players'),
  },
  returns: v.object({ votingComplete: v.boolean() }),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    if (player._id === args.targetPlayerId) {
      throw new Error('لا يمكنك التصويت لنفسك');
    }
    await requireActiveMembership(ctx, args.roomId, args.targetPlayerId);
    const room = await ctx.db.get(args.roomId);
    if (!room?.activeRoundId) {
      throw new Error('لا توجد جولة نشطة');
    }
    const round = await ctx.db.get(room.activeRoundId);
    if (!round || round.phase !== 'voting') {
      throw new Error('التصويت غير متاح الآن');
    }

    const existingVote = await ctx.db
      .query('votes')
      .withIndex('by_round_id_and_voter_player_id', (q) =>
        q.eq('roundId', round._id).eq('voterPlayerId', player._id),
      )
      .unique();
    if (existingVote) {
      await ctx.db.patch(existingVote._id, {
        targetPlayerId: args.targetPlayerId,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert('votes', {
        roundId: round._id,
        voterPlayerId: player._id,
        targetPlayerId: args.targetPlayerId,
        createdAt: Date.now(),
      });
    }

    const members = await ctx.db
      .query('roomMembers')
      .withIndex('by_room_id_and_is_active', (q) =>
        q.eq('roomId', room._id).eq('isActive', true),
      )
      .take(room.maxPlayers);
    const votes = await ctx.db
      .query('votes')
      .withIndex('by_round_id', (q) => q.eq('roundId', round._id))
      .take(room.maxPlayers);
    if (votes.length < members.length) {
      return { votingComplete: false };
    }

    for (const vote of votes) {
      if (vote.targetPlayerId === round.outsiderPlayerId) {
        await awardPoint(ctx, room._id, vote.voterPlayerId);
      }
    }
    await ctx.db.patch(round._id, { phase: 'outsider_guess' });
    return { votingComplete: true };
  },
});

export const submitOutsiderGuess = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
    guessedName: v.string(),
  },
  returns: v.object({ correct: v.boolean() }),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    if (!room?.activeRoundId) {
      throw new Error('لا توجد جولة نشطة');
    }
    const round = await ctx.db.get(room.activeRoundId);
    if (!round || round.phase !== 'outsider_guess') {
      throw new Error('مرحلة التخمين غير متاحة');
    }
    if (round.outsiderPlayerId !== player._id) {
      throw new Error('التخمين متاح للاعب برا السالفة فقط');
    }

    const guessedName = args.guessedName.trim().slice(0, 120);
    const choices = makeGuessChoices(
      round.secretName,
      room.category,
      room.collection,
      round.roundNumber,
    );
    if (!choices.some((choice) => choice.name === guessedName)) {
      throw new Error('هذا الخيار غير صالح');
    }
    const correct = guessedName === round.secretName;
    if (correct) {
      await awardPoint(ctx, room._id, player._id);
    }
    await ctx.db.patch(round._id, {
      phase: 'results',
      outsiderGuessName: guessedName,
      outsiderGuessCorrect: correct,
      completedAt: Date.now(),
    });
    return { correct };
  },
});

export const skipOutsiderGuess = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    const room = await requireRoomHost(ctx, args.roomId, player._id);
    await requireActiveMembership(ctx, room._id, player._id);
    if (!room.activeRoundId) {
      throw new Error('لا توجد جولة نشطة');
    }
    const round = await ctx.db.get(room.activeRoundId);
    if (!round || round.phase !== 'outsider_guess') {
      throw new Error('مرحلة التخمين غير متاحة');
    }
    await ctx.db.patch(round._id, {
      phase: 'results',
      outsiderGuessName: null,
      outsiderGuessCorrect: false,
      completedAt: Date.now(),
    });
    return null;
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
    if (!room.activeRoundId) {
      throw new Error('لا توجد جولة سابقة');
    }
    const previousRound = await ctx.db.get(room.activeRoundId);
    if (!previousRound || previousRound.phase !== 'results') {
      throw new Error('انتظر ظهور نتيجة الجولة أولًا');
    }
    const memberships = await ctx.db
      .query('roomMembers')
      .withIndex('by_room_id_and_is_active', (q) =>
        q.eq('roomId', room._id).eq('isActive', true),
      )
      .take(room.maxPlayers);
    if (memberships.length < 3) {
      throw new Error('يلزم 3 لاعبين على الأقل للجولة التالية');
    }
    const roundId = await createRoundForRoom(
      ctx,
      room,
      memberships,
      previousRound,
    );
    await ctx.db.patch(room._id, {
      status: 'playing',
      activeRoundId: roundId,
      currentRoundNumber: room.currentRoundNumber + 1,
    });
    return { roundId };
  },
});
