import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { getPlayableItems } from '../data/starterItems';
import type { StarterItem } from '../data/starterItems';

export function buildDuelChoices(
  items: StarterItem[],
  required: StarterItem[],
  limit = 8,
  random = Math.random,
): StarterItem[] {
  const requiredItems = [...new Map(required.map((item) => [item.name, item])).values()];
  const requiredNames = new Set(requiredItems.map((item) => item.name));
  const decoys = [...new Map(items.map((item) => [item.name, item])).values()]
    .filter((item) => !requiredNames.has(item.name));
  for (let index = decoys.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [decoys[index], decoys[other]] = [decoys[other]!, decoys[index]!];
  }
  const selected = [
    ...requiredItems,
    ...decoys.slice(0, Math.max(0, limit - requiredItems.length)),
  ];
  for (let index = selected.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [selected[index], selected[other]] = [selected[other]!, selected[index]!];
  }
  return selected;
}

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
  const choices = buildDuelChoices(items, [firstItem, secondItem]);

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
    duelReadyPlayerIds: [],
    duelChoices: choices,
    duelGuesses: [],
    createdAt: Date.now(),
  });
}
