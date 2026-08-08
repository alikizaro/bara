import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { ErrorBanner } from '../components/error-banner';
import { RemoteArtwork } from '../components/remote-artwork';
import { ScreenShell } from '../components/screen-shell';
import { LiveAudioRoom } from '../features/voice/live-audio-room';
import { useGame } from '../state/game-context';
import { colors, radii } from '../theme/tokens';

export function DuelGameScreen({ onLeave }: { onLeave: () => void }) {
  const {
    profile,
    duel,
    voiceAccess,
    isWorking,
    error,
    clearError,
    submitDuelGuess,
    startNextRound,
    leaveRoom,
  } = useGame();
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [guessText, setGuessText] = useState('');
  const handleVoiceError = useCallback((message: string) => {
    setVoiceError(message);
  }, []);

  if (!profile || !duel) {
    return (
      <ScreenShell>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>جارٍ تجهيز صور المواجهة…</Text>
        </View>
      </ScreenShell>
    );
  }

  const me = duel.players.find((player) => player.id === profile.id);
  const exit = () => {
    Alert.alert('مغادرة المواجهة؟', 'ستنتهي الغرفة إذا كنت المضيف.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'مغادرة',
        style: 'destructive',
        onPress: () => void leaveRoom().then(onLeave),
      },
    ]);
  };

  return (
    <ScreenShell
      floating={<LiveAudioRoom access={voiceAccess} canSpeak={duel.phase === 'duel_guessing'} onError={handleVoiceError} />}
    >
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={exit} style={styles.exitButton}>
          <Text style={styles.exitText}>خروج</Text>
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>المواجهة {duel.roundNumber}</Text>
          <Text style={styles.subtitle}>
            {duel.teamPlayers.length} ضد {duel.opponents.length} · خصومك: {duel.opponents.map((player) => player.displayName).join('، ')}
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>المايك مفتوح</Text>
        </View>
      </View>

      <View style={styles.secretCard}>
        <Text style={styles.eyebrow}>صورتك السرية</Text>
        <RemoteArtwork
          imageUrl={duel.secret.imageUrl}
          label={duel.secret.name}
          size={190}
        />
        <Text style={styles.secretName}>{duel.secret.name}</Text>
        <Text style={styles.secretHint}>
          أجب عن أسئلة خصمك، لكن لا تقل الاسم مباشرة.
        </Text>
      </View>

      {duel.phase === 'duel_guessing' && !duel.myGuessName ? (
        <View style={styles.guessSection}>
          <Text style={styles.sectionTitle}>ما الصورة التي ظهرت لخصمك؟</Text>
          <Text style={styles.sectionHint}>
            اسأله بالمايك ثم اكتب الاسم الذي تعتقد أنه ظهر له.
          </Text>
          <View style={styles.guessForm}>
            <TextInput
              accessibilityLabel="اسم تخمينك"
              editable={!isWorking}
              maxLength={120}
              onChangeText={setGuessText}
              placeholder="اكتب الاسم هنا"
              placeholderTextColor={colors.textDim}
              returnKeyType="done"
              style={styles.guessInput}
              textAlign="right"
              value={guessText}
            />
            <ActionButton
              disabled={!guessText.trim()}
              label="إرسال التخمين النهائي"
              loading={isWorking}
              onPress={() =>
                void submitDuelGuess(guessText).catch(() => undefined)
              }
            />
          </View>
        </View>
      ) : null}

      {duel.phase === 'duel_guessing' && duel.myGuessName ? (
        <View style={styles.waitingCard}>
          <Text style={styles.waitingEmoji}>⏳</Text>
          <Text style={styles.waitingTitle}>تم إرسال تخمينك</Text>
          <Text style={styles.waitingText}>
            اخترت: {duel.myGuessName}{'\n'}بانتظار بقية الفريقين…
          </Text>
        </View>
      ) : null}

      {duel.phase === 'results' && duel.result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>
            {duel.result.myGuessCorrect ? '🏆' : '🎯'}
          </Text>
          <Text style={styles.resultTitle}>
            {duel.result.myGuessCorrect ? 'تخمين صحيح!' : 'انتهت المواجهة'}
          </Text>
          <Text style={styles.resultText}>
            صورة {duel.opponent.displayName} كانت:
          </Text>
          <RemoteArtwork
            imageUrl={duel.result.opponentSecret.imageUrl}
            label={duel.result.opponentSecret.name}
            size={170}
          />
          <Text style={styles.opponentSecretName}>
            {duel.result.opponentSecret.name}
          </Text>
          <View style={styles.resultRows}>
            <ResultRow
              correct={duel.result.myGuessCorrect}
              label={`تخمينك: ${duel.myGuessName ?? 'بدون تخمين'}`}
            />
            <ResultRow
              correct={duel.result.opponentGuessCorrect}
              label={`تخمين خصمك: ${duel.result.opponentGuessName ?? 'بدون تخمين'}`}
            />
          </View>
          <Text style={styles.scoreText}>
            نقاطك في الغرفة: {me?.roomScore ?? 0} · نقاط الخصم: {duel.opponent.roomScore}
          </Text>
          {me?.isHost ? (
            <View style={styles.nextAction}>
              <ActionButton
                label="ابدأ مواجهة جديدة"
                loading={isWorking}
                onPress={() => void startNextRound().catch(() => undefined)}
              />
            </View>
          ) : (
            <Text style={styles.hostWait}>بانتظار المضيف لبدء المواجهة التالية</Text>
          )}
        </View>
      ) : null}

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

function ResultRow({ correct, label }: { correct: boolean; label: string }) {
  return (
    <View style={[styles.resultRow, correct ? styles.correct : styles.wrong]}>
      <Text style={styles.resultRowIcon}>{correct ? '✓' : '✕'}</Text>
      <Text style={styles.resultRowText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textMuted, fontSize: 16 },
  topBar: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  exitText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  titleWrap: { alignItems: 'center' },
  title: { color: colors.text, fontSize: 19, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: '#17463D',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  liveText: { color: colors.text, fontSize: 9, fontWeight: '800' },
  secretCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.backgroundElevated,
    padding: 18,
  },
  eyebrow: { color: colors.secondary, fontSize: 12, fontWeight: '900', marginBottom: 12 },
  secretName: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 10 },
  secretHint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 7 },
  guessSection: { marginTop: 22 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'right' },
  sectionHint: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 5 },
  guessForm: { gap: 10, marginTop: 14 },
  guessInput: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  waitingCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: '#123A42',
    padding: 24,
    marginTop: 18,
  },
  waitingEmoji: { fontSize: 40 },
  waitingTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 8 },
  waitingText: { color: colors.textMuted, fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 7 },
  resultCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.backgroundElevated,
    padding: 18,
    marginTop: 14,
  },
  resultEmoji: { fontSize: 46 },
  resultTitle: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 7 },
  resultText: { color: colors.textMuted, fontSize: 12, marginTop: 12, marginBottom: 10 },
  opponentSecretName: { color: colors.warning, fontSize: 22, fontWeight: '900', marginTop: 8 },
  resultRows: { alignSelf: 'stretch', gap: 8, marginTop: 16 },
  resultRow: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: radii.md, borderWidth: 1, padding: 11 },
  correct: { borderColor: colors.success, backgroundColor: '#17463D' },
  wrong: { borderColor: colors.danger, backgroundColor: '#4B1E3B' },
  resultRowIcon: { width: 25, color: colors.text, fontSize: 18, fontWeight: '900' },
  resultRowText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  scoreText: { color: colors.textMuted, fontSize: 12, marginTop: 14, textAlign: 'center' },
  nextAction: { alignSelf: 'stretch', marginTop: 16 },
  hostWait: { color: colors.textDim, fontSize: 11, marginTop: 15 },
});
