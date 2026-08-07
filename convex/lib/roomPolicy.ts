import type { Doc, Id } from '../_generated/dataModel';
import { animeCollections } from '../data/catalog/catalog';

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;

export function validateRoomOptions(options: {
  mode?: 'classic' | 'duel';
  category: Doc<'rooms'>['category'];
  collection: string | null;
  maxPlayers: number;
  automaticQuestions: number;
  freeQuestionsPerPlayer: number;
}): void {
  if (options.mode === 'duel' && options.maxPlayers !== 2) {
    throw new Error('وضع لاعب ضد لاعب يتطلب لاعبين فقط');
  }
  if (
    options.mode !== 'duel' &&
    (!Number.isInteger(options.maxPlayers) ||
      options.maxPlayers < MIN_PLAYERS ||
      options.maxPlayers > MAX_PLAYERS)
  ) {
    throw new Error('عدد اللاعبين يجب أن يكون بين 3 و10');
  }
  if (
    !Number.isInteger(options.automaticQuestions) ||
    options.automaticQuestions < 1 ||
    options.automaticQuestions > 10
  ) {
    throw new Error('عدد الأسئلة التلقائية يجب أن يكون بين 1 و10');
  }
  if (
    !Number.isInteger(options.freeQuestionsPerPlayer) ||
    options.freeQuestionsPerPlayer < 1 ||
    options.freeQuestionsPerPlayer > 3
  ) {
    throw new Error('عدد الأسئلة الحرة يجب أن يكون بين 1 و3');
  }
  if (options.category === 'anime' && !options.collection) {
    throw new Error('اختر عمل الأنمي أولًا');
  }
  if (
    options.category === 'anime' &&
    !animeCollections.some((collection) => collection.id === options.collection)
  ) {
    throw new Error('حزمة الأنمي المختارة غير موجودة');
  }
  if (options.category !== 'anime' && options.collection !== null) {
    throw new Error('هذا الصنف لا يستخدم حزمة فرعية');
  }
}

export function makeRoomCode(random = Math.random): string {
  let code = '';
  for (let index = 0; index < 6; index += 1) {
    const alphabetIndex = Math.floor(random() * ROOM_ALPHABET.length);
    code += ROOM_ALPHABET[alphabetIndex] ?? 'A';
  }
  return code;
}

export function pickDistinctPair(
  members: readonly Pick<Doc<'roomMembers'>, 'playerId'>[],
  random = Math.random,
): {
  questionerId: Id<'players'>;
  answererId: Id<'players'>;
} {
  if (members.length < 2) {
    throw new Error('يلزم لاعبان على الأقل لبدء السؤال');
  }
  const questionerIndex = Math.floor(random() * members.length);
  let answererIndex = Math.floor(random() * (members.length - 1));
  if (answererIndex >= questionerIndex) {
    answererIndex += 1;
  }

  const questioner = members[questionerIndex];
  const answerer = members[answererIndex];
  if (!questioner || !answerer) {
    throw new Error('تعذر اختيار طرفي السؤال');
  }

  return {
    questionerId: questioner.playerId,
    answererId: answerer.playerId,
  };
}

export function pickOrderedPair(
  members: readonly Pick<Doc<'roomMembers'>, 'playerId'>[],
  turnIndex: number,
): {
  questionerId: Id<'players'>;
  answererId: Id<'players'>;
} {
  if (members.length < 2) {
    throw new Error('يلزم لاعبان على الأقل لبدء السؤال');
  }
  const questioner = members[turnIndex % members.length];
  const answerer = members[(turnIndex + 1) % members.length];
  if (!questioner || !answerer) {
    throw new Error('تعذر اختيار طرفي السؤال');
  }
  return {
    questionerId: questioner.playerId,
    answererId: answerer.playerId,
  };
}

export function nextFreeTurn(options: {
  playerIndex: number;
  questionIndex: number;
  playerCount: number;
  questionsPerPlayer: number;
}): { playerIndex: number; questionIndex: number } | null {
  const playerIndex = (options.playerIndex + 1) % options.playerCount;
  const questionIndex = playerIndex === 0
    ? options.questionIndex + 1
    : options.questionIndex;
  if (questionIndex >= options.questionsPerPlayer) {
    return null;
  }
  return { playerIndex, questionIndex };
}
