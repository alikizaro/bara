import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

type ReaderCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

export function assertInstallationId(installationId: string): void {
  if (installationId.length < 20 || installationId.length > 100) {
    throw new Error('معرّف الجهاز غير صالح');
  }
}

export function normalizeDisplayName(displayName: string): string {
  const normalized = displayName.replace(/\s+/g, ' ').trim().slice(0, 24);
  if (normalized.length < 2) {
    throw new Error('الاسم يجب أن يتكون من حرفين على الأقل');
  }
  return normalized;
}

export async function requirePlayer(
  ctx: ReaderCtx,
  installationId: string,
) {
  assertInstallationId(installationId);
  const player = await ctx.db
    .query('players')
    .withIndex('by_installation_id', (q) =>
      q.eq('installationId', installationId),
    )
    .unique();

  if (!player) {
    throw new Error('أنشئ ملف اللاعب أولًا');
  }
  return player;
}

export async function requireActiveMembership(
  ctx: ReaderCtx,
  roomId: Id<'rooms'>,
  playerId: Id<'players'>,
) {
  const membership = await ctx.db
    .query('roomMembers')
    .withIndex('by_room_id_and_player_id', (q) =>
      q.eq('roomId', roomId).eq('playerId', playerId),
    )
    .unique();

  if (!membership?.isActive) {
    throw new Error('أنت لست عضوًا في هذه الغرفة');
  }
  return membership;
}

export async function requireRoomHost(
  ctx: ReaderCtx,
  roomId: Id<'rooms'>,
  playerId: Id<'players'>,
) {
  const room = await ctx.db.get(roomId);
  if (!room) {
    throw new Error('الغرفة غير موجودة');
  }
  if (room.hostPlayerId !== playerId) {
    throw new Error('هذا الإجراء متاح لصاحب الغرفة فقط');
  }
  return room;
}
