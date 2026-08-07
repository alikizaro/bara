import {
  useAction,
  useMutation,
  useQuery,
} from 'convex/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type {
  GameView,
  DuelView,
  PlayerProfile,
  RoomSettings,
  RoomSnapshot,
  VoiceAccess,
} from '../domain/game';
import {
  getOrCreateInstallationId,
  getStoredDisplayName,
  storeDisplayName,
} from '../services/device-identity';
import { GameContext, type GameContextValue } from './game-context';

function readableError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^.*Uncaught Error:\s*/s, '').trim();
  }
  return 'حدث خطأ غير متوقع، حاول مرة أخرى';
}

export function OnlineGameProvider({ children }: { children: ReactNode }) {
  const upsertGuest = useMutation(api.players!.upsertGuest!);
  const heartbeat = useMutation(api.players!.heartbeat!);
  const createOnlineRoom = useMutation(api.rooms!.create!);
  const joinOnlineRoom = useMutation(api.rooms!.join!);
  const setOnlineReady = useMutation(api.rooms!.setReady!);
  const startOnlineGame = useMutation(api.rooms!.start!);
  const leaveOnlineRoom = useMutation(api.rooms!.leave!);
  const chooseOnlineFreeAnswerer = useMutation(api.game!.chooseFreeAnswerer!);
  const advanceOnlineConversation = useMutation(
    api.game!.advanceConversation!,
  );
  const submitOnlineVote = useMutation(api.game!.submitVote!);
  const submitOnlineOutsiderGuess = useMutation(
    api.game!.submitOutsiderGuess!,
  );
  const submitOnlineDuelGuess = useMutation(api.duel!.submitGuess!);
  const startOnlineNextDuelRound = useMutation(api.duel!.startNextRound!);
  const skipOnlineOutsiderGuess = useMutation(
    api.game!.skipOutsiderGuess!,
  );
  const startOnlineNextRound = useMutation(api.game!.startNextRound!);
  const issueVoiceToken = useAction(api.livekit!.issueRoomToken!);

  const [installationId, setInstallationId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<Id<'rooms'> | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [voiceAccess, setVoiceAccess] = useState<VoiceAccess | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomQuery = useQuery(
    api.rooms!.getLobby!,
    installationId && roomId ? { installationId, roomId } : 'skip',
  ) as RoomSnapshot | null | undefined;
  const gameQuery = useQuery(
    api.game!.getMyView!,
    installationId && roomId && roomQuery?.status === 'playing' &&
      roomQuery.settings.mode !== 'duel'
      ? { installationId, roomId }
      : 'skip',
  ) as GameView | null | undefined;
  const duelQuery = useQuery(
    api.duel!.getMyView!,
    installationId && roomId && roomQuery?.status === 'playing' &&
      roomQuery.settings.mode === 'duel'
      ? { installationId, roomId }
      : 'skip',
  ) as DuelView | null | undefined;

  useEffect(() => {
    let active = true;
    void Promise.all([getOrCreateInstallationId(), getStoredDisplayName()])
      .then(async ([nextInstallationId, storedName]) => {
        if (!active) {
          return;
        }
        setInstallationId(nextInstallationId);
        if (storedName) {
          const nextProfile = (await upsertGuest({
            installationId: nextInstallationId,
            displayName: storedName,
          })) as PlayerProfile;
          if (active) {
            setProfile(nextProfile);
          }
        }
      })
      .catch((nextError: unknown) => {
        if (active) {
          setError(readableError(nextError));
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
  }, [upsertGuest]);

  useEffect(() => {
    if (!installationId || !roomId) {
      return undefined;
    }
    const sendHeartbeat = () => {
      void heartbeat({ installationId }).catch(() => undefined);
    };
    sendHeartbeat();
    const intervalId = setInterval(sendHeartbeat, 20_000);
    return () => clearInterval(intervalId);
  }, [heartbeat, installationId, roomId]);

  useEffect(() => {
    if (
      !installationId ||
      !roomId ||
      (!gameQuery && !duelQuery) ||
      voiceAccess
    ) {
      return;
    }
    let active = true;
    void issueVoiceToken({ installationId, roomId })
      .then((access: VoiceAccess) => {
        if (active) {
          setVoiceAccess(access);
        }
      })
      .catch((nextError: unknown) => {
        if (active) {
          setError(readableError(nextError));
        }
      });
    return () => {
      active = false;
    };
  }, [
    duelQuery,
    gameQuery,
    installationId,
    issueVoiceToken,
    roomId,
    voiceAccess,
  ]);

  const saveDisplayName = useCallback(
    async (displayName: string) => {
      if (!installationId) {
        return;
      }
      setIsWorking(true);
      setError(null);
      try {
        const nextProfile = (await upsertGuest({
          installationId,
          displayName,
        })) as PlayerProfile;
        await storeDisplayName(displayName);
        setProfile(nextProfile);
      } catch (nextError) {
        setError(readableError(nextError));
        throw nextError;
      } finally {
        setIsWorking(false);
      }
    },
    [installationId, upsertGuest],
  );

  const createRoom = useCallback(
    async (settings: RoomSettings) => {
      if (!installationId) {
        return;
      }
      setIsWorking(true);
      setError(null);
      try {
        const result = (await createOnlineRoom({
          installationId,
          ...settings,
        })) as { roomId: Id<'rooms'>; code: string };
        setRoomId(result.roomId);
        setVoiceAccess(null);
      } catch (nextError) {
        setError(readableError(nextError));
        throw nextError;
      } finally {
        setIsWorking(false);
      }
    },
    [createOnlineRoom, installationId],
  );

  const joinRoom = useCallback(
    async (code: string) => {
      if (!installationId) {
        return;
      }
      setIsWorking(true);
      setError(null);
      try {
        const result = (await joinOnlineRoom({
          installationId,
          code,
        })) as { roomId: Id<'rooms'>; code: string };
        setRoomId(result.roomId);
        setVoiceAccess(null);
      } catch (nextError) {
        setError(readableError(nextError));
        throw nextError;
      } finally {
        setIsWorking(false);
      }
    },
    [installationId, joinOnlineRoom],
  );

  const setReady = useCallback(
    async (isReady: boolean) => {
      if (!installationId || !roomId) {
        return;
      }
      try {
        await setOnlineReady({ installationId, roomId, isReady });
      } catch (nextError) {
        setError(readableError(nextError));
        throw nextError;
      }
    },
    [installationId, roomId, setOnlineReady],
  );

  const startGame = useCallback(async () => {
    if (!installationId || !roomId) {
      return;
    }
    setIsWorking(true);
    setError(null);
    try {
      await startOnlineGame({ installationId, roomId });
    } catch (nextError) {
      setError(readableError(nextError));
      throw nextError;
    } finally {
      setIsWorking(false);
    }
  }, [installationId, roomId, startOnlineGame]);

  const chooseFreeAnswerer = useCallback(
    async (answererPlayerId: string) => {
      if (!installationId || !roomId) {
        return;
      }
      setError(null);
      try {
        await chooseOnlineFreeAnswerer({
          installationId,
          roomId,
          answererPlayerId: answererPlayerId as Id<'players'>,
        });
      } catch (nextError) {
        setError(readableError(nextError));
        throw nextError;
      }
    },
    [chooseOnlineFreeAnswerer, installationId, roomId],
  );

  const advanceConversation = useCallback(async () => {
    if (!installationId || !roomId) {
      return;
    }
    setIsWorking(true);
    setError(null);
    try {
      await advanceOnlineConversation({ installationId, roomId });
    } catch (nextError) {
      setError(readableError(nextError));
      throw nextError;
    } finally {
      setIsWorking(false);
    }
  }, [advanceOnlineConversation, installationId, roomId]);

  const submitVote = useCallback(
    async (targetPlayerId: string) => {
      if (!installationId || !roomId) {
        return;
      }
      setIsWorking(true);
      setError(null);
      try {
        await submitOnlineVote({
          installationId,
          roomId,
          targetPlayerId: targetPlayerId as Id<'players'>,
        });
      } catch (nextError) {
        setError(readableError(nextError));
        throw nextError;
      } finally {
        setIsWorking(false);
      }
    },
    [installationId, roomId, submitOnlineVote],
  );

  const submitOutsiderGuess = useCallback(
    async (guessedName: string) => {
      if (!installationId || !roomId) {
        return;
      }
      setIsWorking(true);
      setError(null);
      try {
        await submitOnlineOutsiderGuess({
          installationId,
          roomId,
          guessedName,
        });
      } catch (nextError) {
        setError(readableError(nextError));
        throw nextError;
      } finally {
        setIsWorking(false);
      }
    },
    [installationId, roomId, submitOnlineOutsiderGuess],
  );

  const submitDuelGuess = useCallback(
    async (guessedName: string) => {
      if (!installationId || !roomId) {
        return;
      }
      setIsWorking(true);
      setError(null);
      try {
        await submitOnlineDuelGuess({ installationId, roomId, guessedName });
      } catch (nextError) {
        setError(readableError(nextError));
        throw nextError;
      } finally {
        setIsWorking(false);
      }
    },
    [installationId, roomId, submitOnlineDuelGuess],
  );

  const skipOutsiderGuess = useCallback(async () => {
    if (!installationId || !roomId) {
      return;
    }
    setIsWorking(true);
    setError(null);
    try {
      await skipOnlineOutsiderGuess({ installationId, roomId });
    } catch (nextError) {
      setError(readableError(nextError));
      throw nextError;
    } finally {
      setIsWorking(false);
    }
  }, [installationId, roomId, skipOnlineOutsiderGuess]);

  const startNextRound = useCallback(async () => {
    if (!installationId || !roomId) {
      return;
    }
    setIsWorking(true);
    setError(null);
    try {
      if (roomQuery?.settings.mode === 'duel') {
        await startOnlineNextDuelRound({ installationId, roomId });
      } else {
        await startOnlineNextRound({ installationId, roomId });
      }
    } catch (nextError) {
      setError(readableError(nextError));
      throw nextError;
    } finally {
      setIsWorking(false);
    }
  }, [
    installationId,
    roomId,
    roomQuery,
    startOnlineNextDuelRound,
    startOnlineNextRound,
  ]);

  const leaveRoom = useCallback(async () => {
    if (installationId && roomId) {
      try {
        await leaveOnlineRoom({ installationId, roomId });
      } catch (nextError) {
        setError(readableError(nextError));
      }
    }
    setRoomId(null);
    setVoiceAccess(null);
  }, [installationId, leaveOnlineRoom, roomId]);

  const value = useMemo<GameContextValue>(
    () => ({
      mode: 'online',
      isHydrating,
      isWorking,
      profile,
      room: roomQuery ?? null,
      game: gameQuery ?? null,
      duel: duelQuery ?? null,
      voiceAccess,
      error,
      saveDisplayName,
      createRoom,
      joinRoom,
      setReady,
      startGame,
      chooseFreeAnswerer,
      advanceConversation,
      submitVote,
      submitOutsiderGuess,
      submitDuelGuess,
      skipOutsiderGuess,
      startNextRound,
      leaveRoom,
      clearError: () => setError(null),
    }),
    [
      createRoom,
      advanceConversation,
      chooseFreeAnswerer,
      error,
      gameQuery,
      duelQuery,
      isHydrating,
      isWorking,
      joinRoom,
      leaveRoom,
      profile,
      roomQuery,
      saveDisplayName,
      setReady,
      skipOutsiderGuess,
      startGame,
      startNextRound,
      submitOutsiderGuess,
      submitDuelGuess,
      submitVote,
      voiceAccess,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
