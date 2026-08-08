import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { getPlayableItems } from '../data/starterItems';

export async function createDuelRound(
  ctx: MutationCtx,
  room: Doc<'rooms'>,
  memberships: Doc<'roomMembers'>[],
  previousRound: Doc<'rounds'> | null = null,
): Promise<Id<'rounds'>> {
  const players = [...memberships].sort(
    (left, right) => left.joinedAt - right.joinedAt,
  );
  const items = getPlayableItems(room.category, room.collection).filter(
    (item) => item.name !== previousRound?.secretName,
  );
  const teamSize = room.teamSize ?? 1;
  if (players.length !== teamSize * 2 || items.length < 2) {
    throw new Error(`يلزم ${teamSize * 2} لاعبين وصورتان على الأقل لبدء المواجهة`);
  }

  const firstIndex = Math.floor(Math.random() * items.length);
  const secondOffset = 1 + Math.floor(Math.random() * (items.length - 1));
  const firstItem = items[firstIndex];
  const secondItem = items[(firstIndex + secondOffset) % items.length];
  const firstPlayer = players[0];
  if (!firstItem || !secondItem || !firstPlayer) {
    throw new Error('تعذر اختيار صور المواجهة');
  }

  return ctx.db.insert('rounds', {
    roomId: room._id,
    roundNumber: room.currentRoundNumber + 1,
    secretName: firstItem.name,
    secretImageUrl: firstItem.imageUrl,
    outsiderPlayerId: firstPlayer.playerId,
    phase: 'duel_guessing',
    currentQuestionerId: null,
    currentAnswererId: null,
    automaticTurnIndex: 0,
    freePlayerIndex: 0,
    freeQuestionIndex: 0,
    outsiderGuessName: null,
    outsiderGuessCorrect: null,
    completedAt: null,
    duelAssignments: players.map((player, index) => ({
      playerId: player.playerId,
      name: index < teamSize ? firstItem.name : secondItem.name,
      imageUrl: index < teamSize ? firstItem.imageUrl : secondItem.imageUrl,
    })),
    duelTeams: players.map((player, index) => ({
      playerId: player.playerId,
      team: index < teamSize ? 0 : 1,
    })),
    duelGuesses: [],
    createdAt: Date.now(),
  });
}
