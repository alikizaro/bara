import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '../components/error-banner';
import { ScreenShell } from '../components/screen-shell';
import { GuessPanel } from '../features/game/guess-panel';
import { QuestionStage } from '../features/game/question-stage';
import { ResultsPanel } from '../features/game/results-panel';
import { SecretRolePanel } from '../features/game/secret-role-panel';
import { VotingPanel } from '../features/game/voting-panel';
import { LiveAudioRoom } from '../features/voice/live-audio-room';
import type { GameView } from '../domain/game';
import { useGame } from '../state/game-context';
import { colors, radii } from '../theme/tokens';

function phaseLabel(game: GameView): string {
  if (game.phase === 'automatic_questions') {
    return `سؤال تلقائي ${game.automaticTurnIndex + 1} من ${game.automaticTurnCount}`;
  }
  if (game.phase === 'free_questions') {
    return `أسئلة حرة · اللاعب ${game.freePlayerIndex + 1} من ${game.players.length}`;
  }
  if (game.phase === 'voting') {
    return 'التصويت';
  }
  if (game.phase === 'outsider_guess') {
    return 'تخمين برا السالفة';
  }
  return 'النتيجة';
}

export function GameScreen({ onLeave }: { onLeave: () => void }) {
  const {
    profile,
    game,
    voiceAccess,
    mode,
    isWorking,
    error,
    clearError,
    chooseFreeAnswerer,
    advanceConversation,
    submitVote,
    submitOutsiderGuess,
    skipOutsiderGuess,
    startNextRound,
    leaveRoom,
  } = useGame();
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const handleVoiceError = useCallback((message: string) => {
    setVoiceError(message);
  }, []);

  if (!profile || !game) {
    return (
      <ScreenShell>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>جارٍ تجهيز الدور السري…</Text>
        </View>
      </ScreenShell>
    );
  }

  const questionPhase =
    game.phase === 'automatic_questions' || game.phase === 'free_questions';
  const canSpeak =
    questionPhase &&
    Boolean(game.currentAnswererId) &&
    (profile.id === game.currentQuestionerId ||
      profile.id === game.currentAnswererId);

  const exit = () => {
    Alert.alert(
      'مغادرة الغرفة؟',
      'إذا كنت المضيف ستنتهي الغرفة لبقية اللاعبين.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مغادرة',
          style: 'destructive',
          onPress: () => {
            void leaveRoom().then(onLeave);
          },
        },
      ],
    );
  };

  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={exit}
          style={styles.exitButton}
        >
          <Text style={styles.exitText}>خروج</Text>
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>الجولة {game.roundNumber}</Text>
          <Text style={styles.phase}>{phaseLabel(game)}</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>مباشر</Text>
        </View>
      </View>

      {game.phase !== 'results' ? <SecretRolePanel game={game} /> : null}

      {questionPhase ? (
        <QuestionStage
          game={game}
          isWorking={isWorking}
          mode={mode}
          onAdvance={() => void advanceConversation().catch(() => undefined)}
          onChooseAnswerer={(playerId) =>
            void chooseFreeAnswerer(playerId).catch(() => undefined)
          }
          profile={profile}
          voiceConnected={Boolean(voiceAccess)}
        />
      ) : null}

      {game.phase === 'voting' ? (
        <VotingPanel
          game={game}
          isWorking={isWorking}
          onSubmit={(playerId) =>
            void submitVote(playerId).catch(() => undefined)
          }
          profile={profile}
        />
      ) : null}

      {game.phase === 'outsider_guess' ? (
        <GuessPanel
          game={game}
          isWorking={isWorking}
          onGuess={(name) =>
            void submitOutsiderGuess(name).catch(() => undefined)
          }
          onSkip={() => void skipOutsiderGuess().catch(() => undefined)}
          profile={profile}
        />
      ) : null}

      {game.phase === 'results' ? (
        <ResultsPanel
          game={game}
          isWorking={isWorking}
          onNextRound={() => void startNextRound().catch(() => undefined)}
          profile={profile}
        />
      ) : null}

      <LiveAudioRoom
        access={voiceAccess}
        canSpeak={canSpeak}
        onError={handleVoiceError}
      />
      <ErrorBanner
        message={voiceError ?? error}
        onDismiss={() => {
          setVoiceError(null);
          clearError();
        }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  topBar: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  phase: {
    maxWidth: 180,
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  liveBadge: {
    minWidth: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: '#4B1E3B',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  liveText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  exitButton: {
    minWidth: 58,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  exitText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
});
