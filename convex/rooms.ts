import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  requireActiveMembership,
  requirePlayer,
  requireRoomHost,
} from './lib/identity';
import { makeRoomCode, validateRoomOptions } from './lib/roomPolicy';
import { loadActiveRoomPlayers } from './lib/roomView';
import { createRoundForRoom } from './lib/rounds';
import { createDuelRound } from './lib/duelRounds';
import {
  categoryValidator,
  gameModeValidator,
  roomStatusValidator,
} from './validators';

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

const roomSnapshotValidator = v.object({
  id: v.id('rooms'),
  code: v.string(),
  status: roomStatusValidator,
  settings: v.object({
    mode: gameModeValidator,
    category: categoryValidator,
    categorySelected: v.boolean(),
    collection: v.union(v.string(), v.null()),
    maxPlayers: v.number(),
    automaticQuestions: v.number(),
    freeQuestionsPerPlayer: v.number(),
  }),
  players: v.array(roomPlayerValidator),
  hostPlayerId: v.id('players'),
});

const roomResultValidator = v.object({
  roomId: v.id('rooms'),
  code: v.string(),
});

export const create = mutation({
  args: {
    installationId: v.string(),
    maxPlayers: v.number(),
    automaticQuestions: v.number(),
    freeQuestionsPerPlayer: v.number(),
    mode: v.optional(gameModeValidator),
  },
  returns: roomResultValidator,
  handler: async (ctx, args) => {
    const mode = args.mode ?? 'classic';
    validateRoomOptions({
      ...args,
      mode,
      category: 'animals',
      collection: null,
    });
    const player = await requirePlayer(ctx, args.installationId);
    const currentMembership = await ctx.db
      .query('roomMembers')
      .withIndex('by_player_id_and_is_active', (q) =>
        q.eq('playerId', player._id).eq('isActive', true),
      )
      .take(1);
    const previousMembership = currentMembership[0];
    if (previousMembership) {
      const previousRoom = await ctx.db.get(previousMembership.roomId);
      await ctx.db.patch(previousMembership._id, {
        isActive: false,
        isReady: false,
      });
      if (previousRoom?.hostPlayerId === player._id) {
        await ctx.db.patch(previousRoom._id, { status: 'finished' });
      }
    }

    let code: string | null = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = makeRoomCode();
      const existing = await ctx.db
        .query('rooms')
        .withIndex('by_code', (q) => q.eq('code', candidate))
        .take(1);
      if (existing.length === 0) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      throw new Error('تعذر إنشاء رمز الغرفة، حاول مرة أخرى');
    }

    const roomId = await ctx.db.insert('rooms', {
      code,
      hostPlayerId: player._id,
      status: 'waiting',
      mode,
      category: 'animals',
      categorySelected: false,
      collection: null,
      maxPlayers: args.maxPlayers,
      automaticQuestions: args.automaticQuestions,
      freeQuestionsPerPlayer: args.freeQuestionsPerPlayer,
      activeRoundId: null,
      currentRoundNumber: 0,
      createdAt: Date.now(),
    });

    await ctx.db.insert('roomMembers', {
      roomId,
      playerId: player._id,
      isReady: true,
      isActive: true,
      roomScore: 0,
      joinedAt: Date.now(),
    });

    return { roomId, code };
  },
});

export const join = mutation({
  args: {
    installationId: v.string(),
    code: v.string(),
  },
  returns: roomResultValidator,
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    const code = args.code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (code.length !== 6) {
      throw new Error('رمز الغرفة يجب أن يتكون من 6 خانات');
    }

    const room = await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', code))
      .unique();
    if (!room || room.status !== 'waiting') {
      throw new Error('الغرفة غير موجودة أو بدأت المباراة');
    }

    const activeElsewhere = await ctx.db
      .query('roomMembers')
      .withIndex('by_player_id_and_is_active', (q) =>
        q.eq('playerId', player._id).eq('isActive', true),
      )
      .take(1);
    const oldMembership = activeElsewhere[0];
    if (oldMembership && oldMembership.roomId !== room._id) {
      const oldRoom = await ctx.db.get(oldMembership.roomId);
      await ctx.db.patch(oldMembership._id, {
        isActive: false,
        isReady: false,
      });
      if (oldRoom?.hostPlayerId === player._id) {
        await ctx.db.patch(oldRoom._id, { status: 'finished' });
      }
    }

    const existingMembership = await ctx.db
      .query('roomMembers')
      .withIndex('by_room_id_and_player_id', (q) =>
        q.eq('roomId', room._id).eq('playerId', player._id),
      )
      .unique();
    if (existingMembership) {
      await ctx.db.patch(existingMembership._id, {
        isActive: true,
        isReady: player._id === room.hostPlayerId,
      });
      return { roomId: room._id, code: room.code };
    }

    const activeMembers = await ctx.db
      .query('roomMembers')
      .withIndex('by_room_id_and_is_active', (q) =>
        q.eq('roomId', room._id).eq('isActive', true),
      )
      .take(room.maxPlayers);
    if (activeMembers.length >= room.maxPlayers) {
      throw new Error('الغرفة ممتلئة');
    }

    await ctx.db.insert('roomMembers', {
      roomId: room._id,
      playerId: player._id,
      isReady: false,
      isActive: true,
      roomScore: 0,
      joinedAt: Date.now(),
    });
    return { roomId: room._id, code: room.code };
  },
});

export const getLobby = query({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.union(v.null(), roomSnapshotValidator),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    await requireActiveMembership(ctx, args.roomId, player._id);
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return null;
    }
    const players = await loadActiveRoomPlayers(
      ctx,
      room._id,
      room.hostPlayerId,
    );
    return {
      id: room._id,
      code: room.code,
      status: room.status,
      settings: {
        mode: room.mode ?? 'classic',
        category: room.category,
        categorySelected: room.categorySelected ?? false,
        collection: room.collection,
        maxPlayers: room.maxPlayers,
        automaticQuestions: room.automaticQuestions,
        freeQuestionsPerPlayer: room.freeQuestionsPerPlayer,
      },
      players,
      hostPlayerId: room.hostPlayerId,
    };
  },
});

export const setCategory = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
    category: categoryValidator,
    collection: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    const room = await requireRoomHost(ctx, args.roomId, player._id);
    if (room.status !== 'waiting') {
      throw new Error('لا يمكن تغيير التصنيف بعد بدء المباراة');
    }
    validateRoomOptions({
      mode: room.mode ?? 'classic',
      category: args.category,
      collection: args.collection,
      maxPlayers: room.maxPlayers,
      automaticQuestions: room.automaticQuestions,
      freeQuestionsPerPlayer: room.freeQuestionsPerPlayer,
    });
    await ctx.db.patch(room._id, {
      category: args.category,
      categorySelected: true,
      collection: args.collection,
    });
    return null;
  },
});

export const setReady = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
    isReady: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== 'waiting') {
      throw new Error('لا يمكن تغيير الاستعداد بعد بدء المباراة');
    }
    const membership = await requireActiveMembership(
      ctx,
      room._id,
      player._id,
    );
    await ctx.db.patch(membership._id, {
      isReady: player._id === room.hostPlayerId ? true : args.isReady,
    });
    return null;
  },
});

export const start = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.object({ roundId: v.id('rounds') }),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    const room = await requireRoomHost(ctx, args.roomId, player._id);
    if (room.status !== 'waiting') {
      throw new Error('المباراة بدأت بالفعل');
    }

    const memberships = await ctx.db
      .query('roomMembers')
      .withIndex('by_room_id_and_is_active', (q) =>
        q.eq('roomId', room._id).eq('isActive', true),
      )
      .take(room.maxPlayers);
    const mode = room.mode ?? 'classic';
    if (!(room.categorySelected ?? false)) {
      throw new Error('اختر التصنيف بعد اتفاق اللاعبين أولًا');
    }
    const requiredPlayers = mode === 'duel' ? 2 : 3;
    if (memberships.length < requiredPlayers) {
      throw new Error(
        mode === 'duel' ? 'يلزم لاعبان لبدء المواجهة' : 'يلزم 3 لاعبين على الأقل',
      );
    }
    const notReady = memberships.some(
      (membership) =>
        membership.playerId !== room.hostPlayerId && !membership.isReady,
    );
    if (notReady) {
      throw new Error('انتظر حتى يصبح جميع اللاعبين جاهزين');
    }

    const roundId = mode === 'duel'
      ? await createDuelRound(ctx, room, memberships)
      : await createRoundForRoom(ctx, room, memberships);
    await ctx.db.patch(room._id, {
      status: 'playing',
      activeRoundId: roundId,
      currentRoundNumber: room.currentRoundNumber + 1,
    });
    return { roundId };
  },
});

export const leave = mutation({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const player = await requirePlayer(ctx, args.installationId);
    const membership = await requireActiveMembership(
      ctx,
      args.roomId,
      player._id,
    );
    const room = await ctx.db.get(args.roomId);
    await ctx.db.patch(membership._id, { isActive: false, isReady: false });
    if (room?.hostPlayerId === player._id) {
      await ctx.db.patch(room._id, { status: 'finished' });
    }
    return null;
  },
});
