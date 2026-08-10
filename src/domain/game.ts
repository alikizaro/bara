export type CategoryId =
  | 'animals'
  | 'anime'
  | 'countries'
  | 'cities'
  | 'food'
  | 'people'
  | 'football'
  | 'mixed';

export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type GameMode = 'classic' | 'duel' | 'mafia';

export type BackendMode = 'demo' | 'online';

export interface PlayerProfile {
  id: string;
  displayName: string;
  avatarColor: string;
  avatarUrl: string | null;
  totalPoints: number;
}

export interface RoomPlayer extends PlayerProfile {
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
  roomScore: number;
}

export interface RoomSettings {
  mode: GameMode;
  category: CategoryId;
  collection: string | null;
  maxPlayers: number;
  automaticQuestions: number;
  freeQuestionsPerPlayer: number;
  outsiderCount: number;
  teamSize: number;
}

export interface DuelView {
  roomId: string;
  roundNumber: number;
  phase: 'duel_guessing' | 'duel_voting' | 'results';
  secret: GuessChoice;
  opponent: RoomPlayer;
  teamPlayers: RoomPlayer[];
  opponents: RoomPlayer[];
  myReadyToVote: boolean;
  readyToVoteCount: number;
  totalPlayerCount: number;
  voteChoices: GuessChoice[];
  myGuessName: string | null;
  opponentHasGuessed: boolean;
  result: {
    opponentSecret: GuessChoice;
    opponentGuessName: string | null;
    myGuessCorrect: boolean;
    opponentGuessCorrect: boolean;
  } | null;
  players: RoomPlayer[];
}

export interface RoomSnapshot {
  id: string;
  code: string;
  status: RoomStatus;
  settings: RoomSettings & { categorySelected: boolean };
  players: RoomPlayer[];
  hostPlayerId: string;
}

export interface VoiceAccess {
  serverUrl: string;
  token: string;
}

export interface GuessChoice {
  name: string;
  imageUrl: string | null;
}

export interface VoteResult {
  playerId: string;
  voteCount: number;
}

export interface RoundPoint {
  playerId: string;
  points: number;
}

export interface GameView {
  roomId: string;
  roundNumber: number;
  phase:
    | 'automatic_questions'
    | 'free_questions'
    | 'voting'
    | 'outsider_guess'
    | 'results';
  role: 'inside' | 'outsider';
  secret: { name: string; imageUrl: string | null } | null;
  outsiderPlayerId: string | null;
  outsiderPlayerIds: string[];
  currentQuestionerId: string | null;
  currentAnswererId: string | null;
  automaticTurnIndex: number;
  automaticTurnCount: number;
  freePlayerIndex: number;
  freeQuestionIndex: number;
  freeQuestionCount: number;
  guessChoices: GuessChoice[] | null;
  myVoteTargetId: string | null;
  submittedVoteCount: number;
  totalVoterCount: number;
  voteResults: VoteResult[];
  outsiderGuessName: string | null;
  outsiderGuessCorrect: boolean | null;
  roundPoints: RoundPoint[];
  players: RoomPlayer[];
}

export const categories: readonly {
  id: CategoryId;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    id: 'animals',
    label: 'الحيوانات',
    emoji: '🦊',
    description: 'برية، بحرية وطيور',
  },
  {
    id: 'anime',
    label: 'الأنمي',
    emoji: '⚔️',
    description: 'اختر العمل ثم الشخصية',
  },
  {
    id: 'countries',
    label: 'الدول',
    emoji: '🌍',
    description: 'دول من جميع القارات',
  },
  {
    id: 'cities',
    label: 'المدن',
    emoji: '🏙️',
    description: 'مدن عربية وعالمية',
  },
  {
    id: 'food',
    label: 'الأكلات',
    emoji: '🍕',
    description: 'أطباق وحلويات وفواكه',
  },
  {
    id: 'people',
    label: 'المشاهير',
    emoji: '🎭',
    description: 'فن وعلوم وتاريخ',
  },
  {
    id: 'football',
    label: 'كرة القدم',
    emoji: '⚽',
    description: 'نجوم قدامى وجدد',
  },
  {
    id: 'mixed',
    label: 'منوّع',
    emoji: '🎲',
    description: 'اختيار من جميع الأصناف',
  },
];

export const animeCollections = [
  { id: 'all-anime', label: 'كل الأنميات' },
  { id: 'one-piece', label: 'ون بيس' },
  { id: 'solo-leveling', label: 'سولو ليفلينغ' },
  { id: 'naruto', label: 'ناروتو' },
  { id: 'demon-slayer', label: 'قاتل الشياطين' },
  { id: 'attack-on-titan', label: 'هجوم العمالقة' },
  { id: 'jujutsu-kaisen', label: 'جوجوتسو كايسن' },
  { id: 'dragon-ball', label: 'دراغون بول' },
  { id: 'bleach', label: 'بليتش' },
  { id: 'hunter-x-hunter', label: 'هنتر × هنتر' },
  { id: 'my-hero-academia', label: 'أكاديمية بطلي' },
  { id: 'one-punch-man', label: 'ون بنش مان' },
  { id: 'death-note', label: 'ديث نوت' },
] as const;

export const defaultRoomSettings: RoomSettings = {
  mode: 'classic',
  category: 'animals',
  collection: null,
  maxPlayers: 6,
  automaticQuestions: 3,
  freeQuestionsPerPlayer: 1,
  outsiderCount: 1,
  teamSize: 1,
};

export type MafiaRole = 'mafia' | 'detective' | 'doctor' | 'citizen';

export interface MafiaView {
  roomId: string;
  roundNumber: number;
  phase: 'mafia_night' | 'mafia_discussion' | 'mafia_voting' | 'mafia_results';
  role: MafiaRole;
  teammates: RoomPlayer[];
  eliminatedPlayerIds: string[];
  myNightActionSubmitted: boolean;
  detectiveFinding: { targetPlayerId: string; isMafia: boolean } | null;
  players: RoomPlayer[];
  myVoteTargetId: string | null;
  submittedVoteCount: number;
  totalVoterCount: number;
  eliminatedPlayerId: string | null;
  winner: 'mafia' | 'village' | null;
  revealedRoles: { playerId: string; role: MafiaRole }[];
}
