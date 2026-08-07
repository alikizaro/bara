import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { getPlayableItems } from '../data/starterItems';
import { pickOrderedPair } from './roomPolicy';

function pickDifferent<T>(
  values: T[],
  isPrevious: (value: T) => boolean,
): T | undefined {
  const alternatives = values.filter((value) => !isPrevious(value));
  const pool = alternatives.length > 0 ? alternatives : values;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function createRoundForRoom(
  ctx: MutationCtx,
  room: Doc<'rooms'>,
  memberships: Doc<'roomMembers'>[],
  previousRound: Doc<'rounds'> | null = null,
): Promise<Id<'rounds'>> {
  const orderedMemberships = [...memberships].sort(
    (left, right) => left.joinedAt - right.joinedAt,
  );
  const items = getPlayableItems(room.category, room.collection);
  const item = pickDifferent(
    items,
    (candidate) => candidate.name === previousRound?.secretName,
  );
  const outsider = pickDifferent(
    orderedMemberships,
    (candidate) => candidate.playerId === previousRound?.outsiderPlayerId,
  );
  if (!item || !outsider || orderedMemberships.length < 2) {
    throw new Error('لا توجد بيانات أو لاعبون كافون لبدء الجولة');
  }
  const pair = pickOrderedPair(orderedMemberships, 0);

  return ctx.db.insert('rounds', {
    roomId: room._id,
    roundNumber: room.currentRoundNumber + 1,
    secretName: item.name,
    secretImageUrl: item.imageUrl,
    outsiderPlayerId: outsider.playerId,
    phase: 'automatic_questions',
    currentQuestionerId: pair.questionerId,
    currentAnswererId: pair.answererId,
    automaticTurnIndex: 0,
    freePlayerIndex: 0,
    freeQuestionIndex: 0,
    outsiderGuessName: null,
    outsiderGuessCorrect: null,
    completedAt: null,
    createdAt: Date.now(),
  });
}
