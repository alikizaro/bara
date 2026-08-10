import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type {
  DuelView,
  GameView,
  CategoryId,
  PlayerProfile,
  RoomSettings,
  RoomSnapshot,
} from '../domain/game';
import {
  getStoredDisplayName,
  storeDisplayName,
} from '../services/device-identity';
import { avatarPalette } from '../theme/tokens';
import { GameContext, type GameContextValue } from './game-context';

const demoPlayers = [
  {
    id: 'demo-mohammed',
    displayName: 'محمد',
    avatarColor: '#19D3C5',
    avatarUrl: null,
    totalPoints: 8,
    isHost: false,
    isReady: true,
    isOnline: true,
    roomScore: 1,
  },
  {
    id: 'demo-sara',
    displayName: 'سارة',
    avatarColor: '#FF668A',
    avatarUrl: null,
    totalPoints: 12,
    isHost: false,
    isReady: true,
    isOnline: true,
    roomScore: 0,
  },
];

function demoCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => {
    const index = Math.floor(Math.random() * alphabet.length);
    return alphabet[index] ?? 'A';
  }).join('');
}

function buildGame(room: RoomSnapshot, profile: PlayerProfile): GameView {
  const firstAnswerer = room.players.find((player) => player.id !== profile.id);
  return {
    roomId: room.id,
    roundNumber: 1,
    phase: 'automatic_questions',
    role: 'inside',
    secret: {
      name:
        room.settings.category === 'anime' ? 'مونكي دي لوفي' : 'الثعلب',
      imageUrl: null,
    },
    outsiderPlayerId: null,
    outsiderPlayerIds: [],
    currentQuestionerId: profile.id,
    currentAnswererId: firstAnswerer?.id ?? null,
    automaticTurnIndex: 0,
    automaticTurnCount: room.settings.automaticQuestions,
    freePlayerIndex: 0,
    freeQuestionIndex: 0,
    freeQuestionCount: room.settings.freeQuestionsPerPlayer,
    guessChoices: null,
    myVoteTargetId: null,
    submittedVoteCount: 0,
    totalVoterCount: room.players.length,
    voteResults: [],
    outsiderGuessName: null,
    outsiderGuessCorrect: null,
    roundPoints: [],
    players: room.players,
  };
}

function buildDuel(room: RoomSnapshot, profile: PlayerProfile): DuelView {
  const opponent = room.players.find((player) => player.id !== profile.id) ?? room.players[0]!;
  return {
    roomId: room.id,
    roundNumber: 1,
    phase: 'duel_guessing',
    secret: { name: 'الثعلب', imageUrl: null },
    opponent,
    teamPlayers: room.players.filter((player) => player.id === profile.id),
    opponents: room.players.filter((player) => player.id !== profile.id),
    myReadyToVote: false,
    readyToVoteCount: 0,
    totalPlayerCount: room.players.length,
    voteChoices: [],
    myGuessName: null,
    opponentHasGuessed: false,
    result: null,
    players: room.players,
  };
}

export function DemoGameProvider({ children }: { children: ReactNode }) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [game, setGame] = useState<GameView | null>(null);
  const [duel, setDuel] = useState<DuelView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getStoredDisplayName()
      .then((displayName) => {
        if (active && displayName) {
          setProfile({
            id: 'demo-current-player',
            displayName,
            avatarColor: avatarPalette[0],
            avatarUrl: null,
            totalPoints: 0,
          });
        }
      })
      .finally(() => {
        if (active) {
          setIsHydrating(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const saveDisplayName = useCallback(async (displayName: string) => {
    setIsWorking(true);
    setError(null);
    try {
      await storeDisplayName(displayName);
      setProfile({
        id: 'demo-current-player',
        displayName,
        avatarColor: avatarPalette[0],
        avatarUrl: null,
        totalPoints: 0,
      });
    } finally {
      setIsWorking(false);
    }
  }, []);

  const updateProfile = useCallback(async (displayName: string, image?: { uri: string }) => {
    await storeDisplayName(displayName);
    setProfile((current) => current ? { ...current, displayName, avatarUrl: image?.uri ?? current.avatarUrl } : current);
  }, []);

  const createRoom = useCallback(
    async (settings: RoomSettings) => {
      if (!profile) {
        return;
      }
      setIsWorking(true);
      setError(null);
      try {
        const host = {
          ...profile,
          isHost: true,
          isReady: true,
          isOnline: true,
          roomScore: 0,
        };
        setRoom({
          id: 'demo-room',
          code: demoCode(),
          status: 'waiting',
          settings: { ...settings, categorySelected: false },
          players: settings.mode === 'duel' ? [host, demoPlayers[0]!] : [host, ...demoPlayers],
          hostPlayerId: host.id,
        });
        setGame(null);
        setDuel(null);
      } finally {
        setIsWorking(false);
      }
    },
    [profile],
  );

  const joinRoom = useCallback(
    async (code: string) => {
      if (!profile) {
        return;
      }
      setIsWorking(true);
      setError(null);
      try {
        setRoom({
          id: 'demo-room',
          code,
          status: 'waiting',
          settings: {
            mode: 'classic',
            category: 'animals',
            collection: null,
            maxPlayers: 6,
            automaticQuestions: 3,
            freeQuestionsPerPlayer: 1,
            outsiderCount: 1,
            teamSize: 1,
            categorySelected: false,
          },
          players: [
            { ...demoPlayers[0]!, isHost: true },
            {
              ...profile,
              isHost: false,
              isReady: false,
              isOnline: true,
              roomScore: 0,
            },
            demoPlayers[1]!,
          ],
          hostPlayerId: demoPlayers[0]!.id,
        });
        setGame(null);
      } finally {
        setIsWorking(false);
      }
    },
    [profile],
  );

  const setReady = useCallback(
    async (isReady: boolean) => {
      if (!profile) {
        return;
      }
      setRoom((current) =>
        current
          ? {
              ...current,
              players: current.players.map((player) =>
                player.id === profile.id ? { ...player, isReady } : player,
              ),
            }
          : current,
      );
    },
    [profile],
  );

  const setRoomCategory = useCallback(
    async (category: CategoryId, collection: string | null) => {
      setRoom((current) =>
        current
          ? {
              ...current,
              settings: {
                ...current.settings,
                category,
                collection,
                categorySelected: true,
              },
            }
          : current,
      );
    },
    [],
  );

  const startGame = useCallback(async () => {
    if (!room || !profile) {
      return;
    }
    const playingRoom: RoomSnapshot = { ...room, status: 'playing' };
    setRoom(playingRoom);
    if (room.settings.mode === 'duel') {
      setDuel(buildDuel(playingRoom, profile));
      setGame(null);
    } else {
      setGame(buildGame(playingRoom, profile));
      setDuel(null);
    }
  }, [profile, room]);

  const chooseFreeAnswerer = useCallback(async (answererPlayerId: string) => {
    setGame((current) =>
      current ? { ...current, currentAnswererId: answererPlayerId } : current,
    );
  }, []);

  const advanceConversation = useCallback(async () => {
    setGame((current) => {
      if (!current || !room) {
        return current;
      }
      if (current.phase === 'automatic_questions') {
        const nextTurn = current.automaticTurnIndex + 1;
        if (nextTurn < current.automaticTurnCount) {
          const questioner = current.players[nextTurn % current.players.length];
          const answerer = current.players[(nextTurn + 1) % current.players.length];
          return {
            ...current,
            automaticTurnIndex: nextTurn,
            currentQuestionerId: questioner?.id ?? null,
            currentAnswererId: answerer?.id ?? null,
          };
        }
        return {
          ...current,
          phase: 'free_questions',
          freePlayerIndex: 0,
          freeQuestionIndex: 0,
          currentQuestionerId: current.players[0]?.id ?? null,
          currentAnswererId: null,
        };
      }
      if (current.phase !== 'free_questions' || !current.currentAnswererId) {
        return current;
      }
      const nextPlayer = (current.freePlayerIndex + 1) % current.players.length;
      const nextQuestion = nextPlayer === 0
        ? current.freeQuestionIndex + 1
        : current.freeQuestionIndex;
      if (nextQuestion < current.freeQuestionCount) {
        return {
          ...current,
          freePlayerIndex: nextPlayer,
          freeQuestionIndex: nextQuestion,
          currentQuestionerId: current.players[nextPlayer]?.id ?? null,
          currentAnswererId: null,
        };
      }
      return {
        ...current,
        phase: 'voting',
        currentQuestionerId: null,
        currentAnswererId: null,
      };
    });
  }, [room]);

  const submitVote = useCallback(
    async (targetPlayerId: string) => {
      setGame((current) => {
        if (!current || !profile) {
          return current;
        }
        const outsiderPlayerId = demoPlayers[0]?.id ?? null;
        return {
          ...current,
          phase: 'results',
          secret: current.secret ?? { name: 'الثعلب', imageUrl: null },
          outsiderPlayerId,
          outsiderPlayerIds: outsiderPlayerId ? [outsiderPlayerId] : [],
          myVoteTargetId: targetPlayerId,
          submittedVoteCount: current.totalVoterCount,
          voteResults: [{ playerId: targetPlayerId, voteCount: 2 }],
          outsiderGuessName: 'الذئب',
          outsiderGuessCorrect: false,
          roundPoints:
            targetPlayerId === outsiderPlayerId
              ? [{ playerId: profile.id, points: 1 }]
              : [],
        };
      });
    },
    [profile],
  );

  const submitOutsiderGuess = useCallback(async (guessedName: string) => {
    setGame((current) =>
      current
        ? {
            ...current,
            phase: 'results',
            outsiderGuessName: guessedName,
            outsiderGuessCorrect: guessedName === current.secret?.name,
          }
        : current,
    );
  }, []);

  const skipOutsiderGuess = useCallback(async () => {
    setGame((current) =>
      current
        ? {
            ...current,
            phase: 'results',
            outsiderGuessName: null,
            outsiderGuessCorrect: false,
          }
        : current,
    );
  }, []);

  const submitDuelGuess = useCallback(async (guessedName: string) => {
    setDuel((current) =>
      current
        ? {
            ...current,
            phase: 'results',
            myGuessName: guessedName,
            opponentHasGuessed: true,
            result: {
              opponentSecret: { name: 'الأسد', imageUrl: null },
              opponentGuessName: current.secret.name,
              myGuessCorrect: guessedName === 'الأسد',
              opponentGuessCorrect: true,
            },
          }
        : current,
    );
  }, []);

  const markDuelReadyToVote = useCallback(async () => {
    setDuel((current) => current ? {
      ...current,
      phase: 'duel_voting',
      myReadyToVote: true,
      readyToVoteCount: current.totalPlayerCount,
      voteChoices: [
        { name: 'الأسد', imageUrl: null },
        { name: 'الثعلب', imageUrl: null },
        { name: 'النمر', imageUrl: null },
        { name: 'الدب', imageUrl: null },
      ],
    } : current);
  }, []);

  const startNextRound = useCallback(async () => {
    if (!room || !profile) {
      return;
    }
    if (room.settings.mode === 'duel') {
      const next = buildDuel(room, profile);
      setDuel((current) => ({
        ...next,
        roundNumber: (current?.roundNumber ?? 0) + 1,
      }));
      return;
    }
    const next = buildGame(room, profile);
    setGame((current) => ({
      ...next,
      roundNumber: (current?.roundNumber ?? 0) + 1,
    }));
  }, [profile, room]);

  const leaveRoom = useCallback(async () => {
    setRoom(null);
    setGame(null);
    setDuel(null);
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      mode: 'demo',
      isHydrating,
      isWorking,
      profile,
      room,
      game,
      duel,
      mafia: null,
      voiceAccess: null,
      error,
      saveDisplayName,
      updateProfile,
      createRoom,
      joinRoom,
      setReady,
      setRoomCategory,
      startGame,
      chooseFreeAnswerer,
      advanceConversation,
      submitVote,
      submitOutsiderGuess,
      markDuelReadyToVote,
      submitDuelGuess,
      submitMafiaNightAction: async () => undefined,
      beginMafiaVoting: async () => undefined,
      submitMafiaVote: async () => undefined,
      skipOutsiderGuess,
      startNextRound,
      leaveRoom,
      refreshVoiceAccess: () => undefined,
      clearError: () => setError(null),
    }),
    [
      createRoom,
      advanceConversation,
      chooseFreeAnswerer,
      error,
      game,
      duel,
      isHydrating,
      isWorking,
      joinRoom,
      leaveRoom,
      profile,
      room,
      saveDisplayName,
      updateProfile,
      setReady,
      setRoomCategory,
      skipOutsiderGuess,
      startGame,
      startNextRound,
      submitOutsiderGuess,
      markDuelReadyToVote,
      submitDuelGuess,
      submitVote,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
