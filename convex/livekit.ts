'use node';

import { AccessToken } from 'livekit-server-sdk';
import { v } from 'convex/values';

import { internal } from './_generated/api';
import { action } from './_generated/server';

export const issueRoomToken = action({
  args: {
    installationId: v.string(),
    roomId: v.id('rooms'),
  },
  returns: v.object({
    serverUrl: v.string(),
    token: v.string(),
  }),
  handler: async (ctx, args): Promise<{ serverUrl: string; token: string }> => {
    const identity: {
      identity: string;
      displayName: string;
      roomName: string;
    } = await ctx.runQuery(
      internal.voiceAuth!.getVoiceIdentity!,
      args,
    );
    const serverUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!serverUrl || !apiKey || !apiSecret) {
      throw new Error('خدمة الصوت لم تُربط بالخادم بعد');
    }

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: identity.identity,
      name: identity.displayName,
      ttl: 2 * 60 * 60,
      metadata: JSON.stringify({ roomId: args.roomId }),
    });
    accessToken.addGrant({
      room: identity.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return {
      serverUrl,
      token: await accessToken.toJwt(),
    };
  },
});
