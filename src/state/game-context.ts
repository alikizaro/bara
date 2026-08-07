import { createContext, useContext } from 'react';

import type {
  BackendMode,
  DuelView,
  GameView,
  PlayerProfile,
  RoomSettings,
  RoomSnapshot,
  VoiceAccess,
  CategoryId,
} from '../domain/game';

export interface GameContextValue {
  mode: BackendMode;
  isHydrating: boolean;
  isWorking: boolean;
  profile: PlayerProfile | null;
  room: RoomSnapshot | null;
  game: GameView | null;
  duel: DuelView | null;
  voiceAccess: VoiceAccess | null;
  error: string | null;
  saveDisplayName: (displayName: string) => Promise<void>;
  createRoom: (settings: RoomSettings) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  setReady: (isReady: boolean) => Promise<void>;
  setRoomCategory: (category: CategoryId, collection: string | null) => Promise<void>;
  startGame: () => Promise<void>;
  chooseFreeAnswerer: (answererPlayerId: string) => Promise<void>;
  advanceConversation: () => Promise<void>;
  submitVote: (targetPlayerId: string) => Promise<void>;
  submitOutsiderGuess: (guessedName: string) => Promise<void>;
  submitDuelGuess: (guessedName: string) => Promise<void>;
  skipOutsiderGuess: () => Promise<void>;
  startNextRound: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  clearError: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used inside GameBackendProvider');
  }
  return context;
}
