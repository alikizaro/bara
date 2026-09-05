import { shuffled, validateOfflineNames } from './offline-game';

export interface CharacterRound {
  names: string[];
  secrets: string[];
  choices: string[][];
  phase: 'roles' | 'questions' | 'ready' | 'voting' | 'results';
  cursor: number;
  revealed: boolean;
  guesses: (string | null)[];
}
export type CharacterAction = { type: 'reveal' | 'hide' | 'next' | 'ready' | 'discuss' }
  | { type: 'guess'; word: string | null };

export const characterOpponent = (round: CharacterRound, player: number) => (player + 1) % round.names.length;

export function createCharacterRound(names: string[], words: string[], random = Math.random): CharacterRound {
  const error = validateOfflineNames(names, 2);
  if (error) throw new Error(error);
  const pool = [...new Set(words.filter((word) => word.trim()))];
  if (pool.length < Math.max(5, names.length)) throw new Error('لا توجد شخصيات كافية لهذا العدد؛ اختر صنفًا آخر');
  const secrets = shuffled(pool, random).slice(0, names.length);
  return { names: names.map((name) => name.trim()), secrets,
    choices: secrets.map((own, index) => {
      const answer = secrets[(index + 1) % names.length]!;
      return shuffled([answer, ...shuffled(pool.filter((word) => word !== own && word !== answer), random).slice(0, 3)], random);
    }), phase: 'roles', cursor: 0, revealed: false, guesses: [] };
}

export function characterReducer(round: CharacterRound, action: CharacterAction): CharacterRound {
  if (action.type === 'hide') return { ...round, revealed: false };
  if (action.type === 'reveal' && ['roles', 'ready', 'voting'].includes(round.phase)) return { ...round, revealed: true };
  if (action.type === 'next' && round.phase === 'roles' && round.revealed) {
    return round.cursor + 1 < round.names.length ? { ...round, cursor: round.cursor + 1, revealed: false }
      : { ...round, phase: 'questions', cursor: 0, revealed: false };
  }
  if (action.type === 'ready' && round.phase === 'questions') return { ...round, phase: 'ready', cursor: 0, revealed: false };
  if (action.type === 'discuss' && round.phase === 'ready') return { ...round, phase: 'questions', cursor: 0, revealed: false };
  if (action.type === 'ready' && round.phase === 'ready' && round.revealed) {
    return round.cursor + 1 < round.names.length ? { ...round, cursor: round.cursor + 1, revealed: false }
      : { ...round, phase: 'voting', cursor: 0, revealed: false };
  }
  if (action.type === 'guess' && round.phase === 'voting' && round.revealed &&
    (action.word === null || round.choices[round.cursor]!.includes(action.word))) {
    const guesses = [...round.guesses, action.word];
    return { ...round, guesses, cursor: guesses.length === round.names.length ? 0 : guesses.length,
      phase: guesses.length === round.names.length ? 'results' : 'voting', revealed: false };
  }
  return round;
}

export function characterPoints(round: CharacterRound): number[] {
  return round.names.map((_, i) => Number(round.guesses[i] === round.secrets[characterOpponent(round, i)]));
}
