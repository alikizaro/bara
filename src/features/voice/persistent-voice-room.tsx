import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useGame } from '../../state/game-context';
import { colors, radii } from '../../theme/tokens';
import { LiveAudioRoom } from './live-audio-room';

export function PersistentVoiceRoom() {
  const {
    profile,
    room,
    game,
    duel,
    mafia,
    voiceAccess,
    refreshVoiceAccess,
  } = useGame();
  const [error, setError] = useState<string | null>(null);
  const handleError = useCallback((message: string) => {
    setError(message || null);
  }, []);

  if (!profile || !room) return null;

  const questionPhase =
    game?.phase === 'automatic_questions' || game?.phase === 'free_questions';
  const canSpeak = room.status === 'waiting'
    || Boolean(
      questionPhase
      && game?.currentAnswererId
      && (profile.id === game.currentQuestionerId || profile.id === game.currentAnswererId),
    )
    || duel?.phase === 'duel_guessing'
    || mafia?.phase === 'mafia_discussion';

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <LiveAudioRoom
        access={voiceAccess}
        canSpeak={canSpeak}
        onDisconnected={refreshVoiceAccess}
        onError={handleError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    zIndex: 50,
    alignItems: 'center',
  },
  error: {
    maxWidth: '88%',
    color: colors.text,
    backgroundColor: '#4B1E3B',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radii.pill,
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 5,
  },
});
