import { v } from 'convex/values';

export const categoryValidator = v.union(
  v.literal('animals'),
  v.literal('anime'),
  v.literal('countries'),
  v.literal('cities'),
  v.literal('food'),
  v.literal('people'),
  v.literal('football'),
  v.literal('mixed'),
);

export const gameModeValidator = v.union(
  v.literal('classic'),
  v.literal('duel'),
  v.literal('mafia'),
);

export const roomStatusValidator = v.union(
  v.literal('waiting'),
  v.literal('playing'),
  v.literal('finished'),
);

export const roundPhaseValidator = v.union(
  v.literal('automatic_questions'),
  v.literal('free_questions'),
  v.literal('voting'),
  v.literal('outsider_guess'),
  v.literal('results'),
  v.literal('duel_guessing'),
  v.literal('duel_voting'),
  v.literal('mafia_discussion'),
  v.literal('mafia_night'),
  v.literal('mafia_voting'),
  v.literal('mafia_results'),
);

export const mafiaRoleValidator = v.union(
  v.literal('mafia'),
  v.literal('detective'),
  v.literal('doctor'),
  v.literal('citizen'),
);
