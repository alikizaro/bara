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
);
