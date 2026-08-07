import { useState } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ScreenShell } from './src/components/screen-shell';
import { CreateRoomScreen } from './src/screens/create-room-screen';
import { DuelGameScreen } from './src/screens/duel-game-screen';
import { GameScreen } from './src/screens/game-screen';
import { HomeScreen } from './src/screens/home-screen';
import { JoinRoomScreen } from './src/screens/join-room-screen';
import { LobbyScreen } from './src/screens/lobby-screen';
import { WelcomeScreen } from './src/screens/welcome-screen';
import { GameBackendProvider } from './src/state/game-backend-provider';
import { useGame } from './src/state/game-context';
import { colors } from './src/theme/tokens';

type AppScreen = 'home' | 'create' | 'duel-create' | 'join' | 'lobby';

I18nManager.allowRTL(true);
I18nManager.swapLeftAndRightInRTL(true);

export default function App() {
  return (
    <SafeAreaProvider>
      <GameBackendProvider>
        <AppNavigator />
      </GameBackendProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const { isHydrating, profile, room, game, duel } = useGame();
  const [screen, setScreen] = useState<AppScreen>('home');

  if (isHydrating) {
    return (
      <ScreenShell scroll={false}>
        <View style={styles.loading}>
          <View style={styles.loadingLogo}>
            <Text style={styles.loadingQuestion}>؟</Text>
          </View>
          <Text style={styles.loadingTitle}>برا السالفة</Text>
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

  if (game || room?.status === 'playing') {
    return <GameScreen onLeave={() => setScreen('home')} />;
  }

  if (screen === 'lobby' || room) {
    return <LobbyScreen onLeave={() => setScreen('home')} />;
  }

  if (screen === 'create') {
    return (
      <CreateRoomScreen
        onBack={() => setScreen('home')}
        onCreated={() => setScreen('lobby')}
      />
    );
  }

  if (screen === 'duel-create') {
    return (
      <CreateRoomScreen
        initialMode="duel"
        onBack={() => setScreen('home')}
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

  return (
    <HomeScreen
      onCreate={() => setScreen('create')}
      onDuel={() => setScreen('duel-create')}
      onJoin={() => setScreen('join')}
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
