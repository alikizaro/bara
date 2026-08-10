import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { MAX_PLAYERS } from './roomPolicy';

type ReaderCtx =
  | Pick<QueryCtx, 'db' | 'storage'>
  | Pick<MutationCtx, 'db' | 'storage'>;

export async function loadActiveRoomPlayers(
  ctx: ReaderCtx,
  roomId: Id<'rooms'>,
  hostPlayerId: Id<'players'>,
) {
  const memberships = await ctx.db
    .query('roomMembers')
    .withIndex('by_room_id_and_is_active', (q) =>
      q.eq('roomId', roomId).eq('isActive', true),
    )
    .take(MAX_PLAYERS);

  memberships.sort((left, right) => left.joinedAt - right.joinedAt);

  const players = await Promise.all(
    memberships.map(async (membership) => {
      const player = await ctx.db.get(membership.playerId);
      if (!player) {
        return null;
      }
      return {
        id: player._id,
        displayName: player.displayName,
        avatarColor: player.avatarColor,
        avatarUrl: player.avatarStorageId
          ? await ctx.storage.getUrl(player.avatarStorageId)
          : null,
        totalPoints: player.totalPoints,
        isHost: player._id === hostPlayerId,
        isReady: membership.isReady,
        isOnline: Date.now() - player.lastSeenAt < 45_000,
        roomScore: membership.roomScore,
      };
    }),
  );

  return players.filter((player) => player !== null);
}
