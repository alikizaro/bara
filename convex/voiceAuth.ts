import { v } from 'convex/values';

import { internalQuery } from './_generated/server';
import {
  requireActiveMembership,
  requirePlayer,
} from './lib/identity';

export const getVoiceIdentity = internalQuery({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.object({
    identity: v.string(),
    displayName: v.string(),
    roomName: v.string(),
  }),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status === 'finished') {
      throw new Error('الغرفة غير متاحة للصوت');
    }
    return {
      identity: player._id,
      displayName: player.displayName,
      roomName: `bara-${room._id}`,
    };
  },
});
