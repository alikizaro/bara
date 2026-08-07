import type { RoomSettings } from './game';

export const ROOM_CODE_LENGTH = 6;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;

export function normalizeRoomCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

export function normalizeDisplayName(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 24);
}

export function validateDisplayName(value: string): string | null {
  const normalized = normalizeDisplayName(value);
  if (normalized.length < 2) {
    return 'اكتب اسمًا من حرفين على الأقل';
  }
  return null;
}

export function validateRoomSettings(settings: RoomSettings): string | null {
  if (settings.mode === 'duel' && settings.maxPlayers !== 2) {
    return 'وضع لاعب ضد لاعب يتطلب لاعبين فقط';
  }
  if (
    settings.mode !== 'duel' &&
    (!Number.isInteger(settings.maxPlayers) ||
      settings.maxPlayers < MIN_PLAYERS ||
      settings.maxPlayers > MAX_PLAYERS)
  ) {
    return 'عدد اللاعبين يجب أن يكون بين 3 و10';
  }
  if (
    !Number.isInteger(settings.automaticQuestions) ||
    settings.automaticQuestions < 1 ||
    settings.automaticQuestions > 10
  ) {
    return 'عدد الأسئلة التلقائية يجب أن يكون بين 1 و10';
  }
  if (
    !Number.isInteger(settings.freeQuestionsPerPlayer) ||
    settings.freeQuestionsPerPlayer < 1 ||
    settings.freeQuestionsPerPlayer > 3
  ) {
    return 'عدد الأسئلة الحرة يجب أن يكون بين 1 و3';
  }
  if (settings.category === 'anime' && !settings.collection) {
    return 'اختر عمل الأنمي أولًا';
  }
  return null;
}

export function canHostStart(
  players: readonly { isHost: boolean; isReady: boolean }[],
  mode: RoomSettings['mode'] = 'classic',
): boolean {
  const requiredPlayers = mode === 'duel' ? 2 : MIN_PLAYERS;
  if (players.length < requiredPlayers) {
    return false;
  }
  return players.every((player) => player.isHost || player.isReady);
}
