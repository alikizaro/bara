export interface OfflineRound {
  names: string[];
  secret: string;
  outsider: number;
  choices: string[];
  questionsPerPlayer: number;
  phase: 'roles' | 'questions' | 'voting' | 'guess' | 'results';
  cursor: number;
  revealed: boolean;
  votes: number[];
  guess: string | null;
}

export type OfflineAction =
  | { type: 'reveal' | 'hide' | 'next' }
  | { type: 'vote'; target: number }
  | { type: 'guess'; word: string | null };

export function validateOfflineNames(names: string[], minimum = 3): string | null {
  if (names.length < minimum || names.length > 20) return `أضف من ${minimum} إلى 20 لاعبًا`;
  if (names.some((name) => !name.trim() || name.trim().length > 24)) return 'اكتب اسم كل لاعب (حتى 24 حرفًا)';
  if (new Set(names.map((name) => name.trim().toLocaleLowerCase())).size !== names.length) return 'الأسماء متكررة؛ ميّز كل لاعب باسم مختلف';
  return null;
}

export function shuffled<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function createOfflineRound(names: string[], words: string[], questionsPerPlayer: number, previousSecret?: string, random = Math.random): OfflineRound {
  const error = validateOfflineNames(names);
  if (error) throw new Error(error);
  if (!Number.isInteger(questionsPerPlayer) || questionsPerPlayer < 1 || questionsPerPlayer > 10) throw new Error('اختر من 1 إلى 10 أسئلة لكل لاعب');
  const pool = [...new Set(words.filter((word) => word.trim()))];
  if (pool.length < 4) throw new Error('هذا الصنف يحتاج أربع كلمات على الأقل');
  const secret = shuffled(pool.filter((word) => word !== previousSecret), random)[0]!;
  return {
    names: names.map((name) => name.trim()), secret,
    outsider: Math.floor(random() * names.length),
    choices: shuffled([secret, ...shuffled(pool.filter((word) => word !== secret), random).slice(0, 3)], random),
    questionsPerPlayer, phase: 'roles', cursor: 0, revealed: false, votes: [], guess: null,
  };
}

export function offlineReducer(state: OfflineRound, action: OfflineAction): OfflineRound {
  if (action.type === 'hide') return { ...state, revealed: false };
  if (action.type === 'reveal' && ['roles', 'voting', 'guess'].includes(state.phase)) return { ...state, revealed: true };
  if (action.type === 'next' && state.phase === 'roles' && state.revealed) {
    return state.cursor + 1 < state.names.length
      ? { ...state, cursor: state.cursor + 1, revealed: false }
      : { ...state, phase: 'questions', cursor: 0, revealed: false };
  }
  if (action.type === 'next' && state.phase === 'questions') {
    return state.cursor + 1 < state.names.length * state.questionsPerPlayer
      ? { ...state, cursor: state.cursor + 1 }
      : { ...state, phase: 'voting', cursor: 0, revealed: false };
  }
  if (action.type === 'vote' && state.phase === 'voting' && state.revealed &&
      Number.isInteger(action.target) && action.target >= 0 && action.target < state.names.length && action.target !== state.cursor) {
    const votes = [...state.votes, action.target];
    return votes.length === state.names.length
      ? { ...state, votes, phase: 'guess', cursor: state.outsider, revealed: false }
      : { ...state, votes, cursor: state.cursor + 1, revealed: false };
  }
  if (action.type === 'guess' && state.phase === 'guess' && state.revealed && (action.word === null || state.choices.includes(action.word))) {
    return { ...state, phase: 'results', guess: action.word, revealed: false };
  }
  return state;
}

export function offlineResult(round: OfflineRound) {
  const counts = round.names.map((_, index) => round.votes.filter((vote) => vote === index).length);
  const highest = Math.max(...counts);
  const leaders = counts.flatMap((count, index) => count === highest ? [index] : []);
  const caught = leaders.length === 1 && leaders[0] === round.outsider;
  const guessed = round.guess === round.secret;
  const points = round.names.map((_, index) => index === round.outsider ? Number(guessed) : Number(round.votes[index] === round.outsider));
  return { counts, tied: leaders.length > 1, caught, guessed, points };
}
