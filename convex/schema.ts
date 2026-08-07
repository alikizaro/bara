import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import {
  categoryValidator,
  gameModeValidator,
  roomStatusValidator,
  roundPhaseValidator,
} from './validators';

export default defineSchema({
  players: defineTable({
    installationId: v.string(),
    displayName: v.string(),
    avatarColor: v.string(),
    totalPoints: v.number(),
    lastSeenAt: v.number(),
  }).index('by_installation_id', ['installationId']),

  rooms: defineTable({
    code: v.string(),
    hostPlayerId: v.id('players'),
    status: roomStatusValidator,
    category: categoryValidator,
    categorySelected: v.optional(v.boolean()),
    mode: v.optional(gameModeValidator),
    collection: v.union(v.string(), v.null()),
    maxPlayers: v.number(),
    automaticQuestions: v.number(),
    freeQuestionsPerPlayer: v.number(),
    activeRoundId: v.union(v.id('rounds'), v.null()),
    currentRoundNumber: v.number(),
    createdAt: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_host_player_id', ['hostPlayerId']),

  roomMembers: defineTable({
    roomId: v.id('rooms'),
    playerId: v.id('players'),
    isReady: v.boolean(),
    isActive: v.boolean(),
    roomScore: v.number(),
    joinedAt: v.number(),
  })
    .index('by_room_id_and_is_active', ['roomId', 'isActive'])
    .index('by_room_id_and_player_id', ['roomId', 'playerId'])
    .index('by_player_id_and_is_active', ['playerId', 'isActive']),

  rounds: defineTable({
    roomId: v.id('rooms'),
    roundNumber: v.number(),
    secretName: v.string(),
    secretImageUrl: v.union(v.string(), v.null()),
    outsiderPlayerId: v.id('players'),
    phase: roundPhaseValidator,
    currentQuestionerId: v.union(v.id('players'), v.null()),
    currentAnswererId: v.union(v.id('players'), v.null()),
    automaticTurnIndex: v.number(),
    freePlayerIndex: v.number(),
    freeQuestionIndex: v.number(),
    outsiderGuessName: v.optional(v.union(v.string(), v.null())),
    outsiderGuessCorrect: v.optional(v.union(v.boolean(), v.null())),
    completedAt: v.optional(v.union(v.number(), v.null())),
    duelAssignments: v.optional(
      v.array(
        v.object({
          playerId: v.id('players'),
          name: v.string(),
          imageUrl: v.union(v.string(), v.null()),
        }),
      ),
    ),
    duelGuesses: v.optional(
      v.array(
        v.object({
          playerId: v.id('players'),
          guessedName: v.string(),
          correct: v.boolean(),
        }),
      ),
    ),
    createdAt: v.number(),
  }).index('by_room_id_and_round_number', ['roomId', 'roundNumber']),

  votes: defineTable({
    roundId: v.id('rounds'),
    voterPlayerId: v.id('players'),
    targetPlayerId: v.id('players'),
    createdAt: v.number(),
  })
    .index('by_round_id', ['roundId'])
    .index('by_round_id_and_voter_player_id', [
      'roundId',
      'voterPlayerId',
    ]),

  items: defineTable({
    category: categoryValidator,
    collection: v.union(v.string(), v.null()),
    name: v.string(),
    imageUrl: v.union(v.string(), v.null()),
    randomKey: v.number(),
    isActive: v.boolean(),
  })
    .index('by_category_and_is_active', ['category', 'isActive'])
    .index('by_category_and_collection_and_is_active', [
      'category',
      'collection',
      'isActive',
    ]),
});
