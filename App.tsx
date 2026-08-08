import { useCallback, useState } from 'react';
import { Alert, I18nManager, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ScreenShell } from './src/components/screen-shell';
import { AppUpdatePrompt } from './src/components/app-update-prompt';
import type { GameId } from './src/domain/game-catalog';
import type { RoomSettings } from './src/domain/game';
import { useAndroidBack } from './src/hooks/use-android-back';
import { resolveBackAction, type NavigationScreen } from './src/navigation/back-policy';
import { CreateRoomScreen } from './src/screens/create-room-screen';
import { DuelGameScreen } from './src/screens/duel-game-screen';
import { GameScreen } from './src/screens/game-screen';
import { GameModesScreen } from './src/screens/game-modes-screen';
import { HomeScreen } from './src/screens/home-screen';
import { JoinRoomScreen } from './src/screens/join-room-screen';
import { LobbyScreen } from './src/screens/lobby-screen';
import { MafiaGameScreen } from './src/screens/mafia-game-screen';
import { ProfileScreen } from './src/screens/profile-screen';
import { WelcomeScreen } from './src/screens/welcome-screen';
import { GameBackendProvider } from './src/state/game-backend-provider';
import { useGame } from './src/state/game-context';
import { colors } from './src/theme/tokens';

I18nManager.allowRTL(true);
I18nManager.swapLeftAndRightInRTL(true);

export default function App() {
  return (
    <SafeAreaProvider>
      <GameBackendProvider>
        <AppNavigator />
        <AppUpdatePrompt />
      </GameBackendProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const { isHydrating, profile, room, game, duel, mafia, leaveRoom } = useGame();
  const [screen, setScreen] = useState<NavigationScreen>('home');
  const [selectedGame, setSelectedGame] = useState<GameId>('outsider');
  const [roomPreset, setRoomPreset] = useState<Partial<RoomSettings>>({});

  const handleHardwareBack = useCallback(() => {
    const action = resolveBackAction(screen, Boolean(room || game || duel || mafia));
    if (action === 'leave-room') {
      Alert.alert('مغادرة الغرفة؟', 'ستعود إلى الصفحة الرئيسية.', [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مغادرة',
          style: 'destructive',
          onPress: () => void leaveRoom().then(() => setScreen('home')),
        },
      ]);
      return true;
    }
    if (action === 'game-modes') {
      setScreen('game-modes');
      return true;
    }
    if (action === 'home') {
      setScreen('home');
      return true;
    }
    return false;
  }, [duel, game, leaveRoom, mafia, room, screen]);

  useAndroidBack(handleHardwareBack);

  if (isHydrating) {
    return (
      <ScreenShell scroll={false}>
        <View style={styles.loading}>
          <View style={styles.loadingLogo}>
            <Text style={styles.loadingQuestion}>؟</Text>
          </View>
          <Text style={styles.loadingTitle}>لَمّة</Text>
          <Text style={styles.loadingHint}>جارٍ تجهيز اللعبة…</Text>
        </View>
      </ScreenShell>
    );
  }

  if (!profile) {
    return <WelcomeScreen />;
  }

  if (room?.settings.mode === 'duel' && (duel || room.status === 'playing')) {
    return <DuelGameScreen onLeave={() => setScreen('home')} />;
  }

  if (room?.settings.mode === 'mafia' && (mafia || room.status === 'playing')) {
    return <MafiaGameScreen onLeave={() => setScreen('home')} />;
  }

  if (game || room?.status === 'playing') {
    return <GameScreen onLeave={() => setScreen('home')} />;
  }

  if (screen === 'lobby' || room) {
    return <LobbyScreen onLeave={() => setScreen('home')} />;
  }

  if (screen === 'create') {
    return (
      <CreateRoomScreen
        initialMode={roomPreset.mode}
        initialSettings={roomPreset}
        onBack={() => setScreen('game-modes')}
        onCreated={() => setScreen('lobby')}
      />
    );
  }

  if (screen === 'duel-create') {
    return (
      <CreateRoomScreen
        initialMode="duel"
        onBack={() => setScreen('game-modes')}
        onCreated={() => setScreen('lobby')}
      />
    );
  }

  if (screen === 'join') {
    return (
      <JoinRoomScreen
        onBack={() => setScreen('home')}
        onJoined={() => setScreen('lobby')}
      />
    );
  }

  if (screen === 'profile') {
    return <ProfileScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'game-modes') {
    return (
      <GameModesScreen
        game={selectedGame}
        onBack={() => setScreen('home')}
        actions={{
          onCreate: (preset) => {
            setRoomPreset(preset);
            setScreen('create');
          },
          onJoin: () => setScreen('join'),
        }}
      />
    );
  }

  return (
    <HomeScreen
      onGame={(game) => {
        setSelectedGame(game);
        setScreen('game-modes');
      }}
      onJoin={() => setScreen('join')}
      onProfile={() => setScreen('profile')}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 94,
    height: 94,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  loadingQuestion: {
    color: colors.text,
    fontSize: 58,
    fontWeight: '900',
  },
  loadingTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 20,
  },
  loadingHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 7,
  },
});
