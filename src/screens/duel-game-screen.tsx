import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { ErrorBanner } from '../components/error-banner';
import { RemoteArtwork } from '../components/remote-artwork';
import { ScreenShell } from '../components/screen-shell';
import { useGame } from '../state/game-context';
import { colors, radii } from '../theme/tokens';

export function DuelGameScreen({ onLeave }: { onLeave: () => void }) {
  const {
    profile,
    duel,
    isWorking,
    error,
    clearError,
    markDuelReadyToVote,
    submitDuelGuess,
    startNextRound,
    leaveRoom,
  } = useGame();
  const [selectedChoiceName, setSelectedChoiceName] = useState<string | null>(null);

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
    <ScreenShell>
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

      {duel.phase === 'duel_guessing' && !duel.myReadyToVote ? (
        <View style={styles.readyCard}>
          <Text style={styles.readyEmoji}>🤝</Text>
          <Text style={styles.sectionTitle}>انتهيت من الأسئلة؟</Text>
          <Text style={styles.sectionHint}>
            عندما يصبح فريقك جاهزًا اضغط «فلنصوّت». لن تظهر الخيارات حتى يوافق جميع اللاعبين.
          </Text>
          <View style={styles.readyProgress}>
            <Text style={styles.readyCount}>{duel.readyToVoteCount}/{duel.totalPlayerCount}</Text>
            <Text style={styles.readyLabel}>جاهزون للتصويت</Text>
          </View>
          <ActionButton
            label="فلنصوّت"
            loading={isWorking}
            onPress={() => void markDuelReadyToVote().catch(() => undefined)}
          />
        </View>
      ) : null}

      {duel.phase === 'duel_guessing' && duel.myReadyToVote ? (
        <View style={styles.waitingCard}>
          <Text style={styles.waitingEmoji}>⏳</Text>
          <Text style={styles.waitingTitle}>أنت جاهز للتصويت</Text>
          <Text style={styles.waitingText}>
            {duel.readyToVoteCount}/{duel.totalPlayerCount} جاهزون{`\n`}ستظهر بطاقات الشخصيات للجميع في اللحظة نفسها.
          </Text>
        </View>
      ) : null}

      {duel.phase === 'duel_voting' && !duel.myGuessName ? (
        <View style={styles.voteSection}>
          <Text style={styles.voteEyebrow}>التصويت سري</Text>
          <Text style={styles.sectionTitle}>اختر شخصية خصمك</Text>
          <Text style={styles.sectionHint}>اضغط البطاقة التي تعتقد أنها ظهرت للفريق المقابل، ثم أكّد صوتك.</Text>
          <View style={styles.choiceGrid}>
            {duel.voteChoices.map((choice) => {
              const selected = choice.name === selectedChoiceName;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={choice.name}
                  onPress={() => setSelectedChoiceName(choice.name)}
                  style={[styles.choiceCard, selected && styles.choiceCardSelected]}
                >
                  <RemoteArtwork imageUrl={choice.imageUrl} label={choice.name} size={128} />
                  <Text numberOfLines={2} style={styles.choiceName}>{choice.name}</Text>
                  {selected ? <View style={styles.choiceCheck}><Text style={styles.choiceCheckText}>✓</Text></View> : null}
                </Pressable>
              );
            })}
          </View>
          <ActionButton
            disabled={!selectedChoiceName}
            label="تأكيد التصويت"
            loading={isWorking}
            onPress={() => selectedChoiceName ? void submitDuelGuess(selectedChoiceName).catch(() => undefined) : undefined}
          />
        </View>
      ) : null}

      {duel.phase === 'duel_voting' && duel.myGuessName ? (
        <View style={styles.waitingCard}>
          <Text style={styles.waitingEmoji}>🗳️</Text>
          <Text style={styles.waitingTitle}>سُجّل صوتك</Text>
          <Text style={styles.waitingText}>اخترت: {duel.myGuessName}{`\n`}بانتظار أصوات بقية اللاعبين…</Text>
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
        message={error}
        onDismiss={() => {
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
  readyCard: {
    alignItems: 'stretch',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
    padding: 18,
    marginTop: 18,
    gap: 12,
  },
  readyEmoji: { fontSize: 38, textAlign: 'center' },
  readyProgress: {
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.backgroundElevated,
    padding: 12,
  },
  readyCount: { color: colors.secondary, fontSize: 25, fontWeight: '900' },
  readyLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  voteSection: { marginTop: 20, gap: 12 },
  voteEyebrow: {
    alignSelf: 'flex-end',
    color: colors.warning,
    fontSize: 11,
    fontWeight: '900',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  choiceGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  choiceCard: {
    width: '48%',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 8,
    position: 'relative',
  },
  choiceCardSelected: {
    borderColor: colors.warning,
    backgroundColor: '#3B2D63',
  },
  choiceName: {
    minHeight: 38,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  choiceCheck: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.warning,
  },
  choiceCheckText: { color: colors.background, fontSize: 16, fontWeight: '900' },
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
