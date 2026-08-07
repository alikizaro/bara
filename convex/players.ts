import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  assertInstallationId,
  normalizeDisplayName,
  requirePlayer,
} from './lib/identity';

const avatarColors = [
  '#7C5CFF',
  '#19D3C5',
  '#FF8D66',
  '#FF668A',
  '#4B8CFF',
  '#C766FF',
];

const profileValidator = v.object({
  id: v.id('players'),
  displayName: v.string(),
  avatarColor: v.string(),
  totalPoints: v.number(),
});

function colorForInstallation(installationId: string): string {
  let hash = 0;
  for (const character of installationId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return avatarColors[hash % avatarColors.length] ?? '#7C5CFF';
}

export const upsertGuest = mutation({
  args: {
    installationId: v.string(),
    displayName: v.string(),
  },
  returns: profileValidator,
  handler: async (ctx, args) => {
    assertInstallationId(args.installationId);
    const displayName = normalizeDisplayName(args.displayName);
    const existing = await ctx.db
      .query('players')
      .withIndex('by_installation_id', (q) =>
        q.eq('installationId', args.installationId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName,
        lastSeenAt: Date.now(),
      });
      return {
        id: existing._id,
        displayName,
        avatarColor: existing.avatarColor,
        totalPoints: existing.totalPoints,
      };
    }

    const avatarColor = colorForInstallation(args.installationId);
    const playerId = await ctx.db.insert('players', {
      installationId: args.installationId,
      displayName,
      avatarColor,
      totalPoints: 0,
      lastSeenAt: Date.now(),
    });

    return {
      id: playerId,
      displayName,
      avatarColor,
      totalPoints: 0,
    };
  },
});

export const getMe = query({
  args: { installationId: v.string() },
  returns: v.union(v.null(), profileValidator),
  handler: async (ctx, args) => {
    assertInstallationId(args.installationId);
    const player = await ctx.db
      .query('players')
      .withIndex('by_installation_id', (q) =>
        q.eq('installationId', args.installationId),
      )
      .unique();

    if (!player) {
      return null;
    }
    return {
      id: player._id,
      displayName: player.displayName,
      avatarColor: player.avatarColor,
      totalPoints: player.totalPoints,
    };
  },
});

export const heartbeat = mutation({
  args: { installationId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await ctx.db.patch(player._id, { lastSeenAt: Date.now() });
    return null;
  },
});
