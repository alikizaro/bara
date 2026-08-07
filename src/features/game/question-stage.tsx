import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/action-button';
import { PlayerAvatar } from '../../components/player-avatar';
import type { BackendMode, GameView, PlayerProfile } from '../../domain/game';
import { colors, radii } from '../../theme/tokens';

export function QuestionStage({
  game,
  profile,
  mode,
  voiceConnected,
  isWorking,
  onChooseAnswerer,
  onAdvance,
}: {
  game: GameView;
  profile: PlayerProfile;
  mode: BackendMode;
  voiceConnected: boolean;
  isWorking: boolean;
  onChooseAnswerer: (playerId: string) => void;
  onAdvance: () => void;
}) {
  const questioner = game.players.find(
    (player) => player.id === game.currentQuestionerId,
  );
  const answerer = game.players.find(
    (player) => player.id === game.currentAnswererId,
  );
  const me = game.players.find((player) => player.id === profile.id);
  const isQuestioner = profile.id === game.currentQuestionerId;
  const canAdvance = Boolean(answerer) && (isQuestioner || Boolean(me?.isHost));
  const choosingAnswerer =
    game.phase === 'free_questions' && isQuestioner && !answerer;
  const canSpeak = isQuestioner || profile.id === game.currentAnswererId;

  return (
    <>
      {choosingAnswerer ? (
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>اختر اللاعب الذي تريد سؤاله</Text>
          <Text style={styles.pickerHint}>
            السؤال الحر {game.freeQuestionIndex + 1} من {game.freeQuestionCount}
          </Text>
          <View style={styles.pickerList}>
            {game.players
              .filter((player) => player.id !== profile.id)
              .map((player) => (
                <Pressable
                  accessibilityRole="button"
                  key={player.id}
                  onPress={() => onChooseAnswerer(player.id)}
                  style={({ pressed }) => [
                    styles.playerChoice,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.playerChoiceName}>{player.displayName}</Text>
                  <PlayerAvatar
                    color={player.avatarColor}
                    name={player.displayName}
                    online={player.isOnline}
                    size={44}
                  />
                </Pressable>
              ))}
          </View>
        </View>
      ) : null}

      <View style={styles.voiceCard}>
        <View style={styles.voiceHeader}>
          <Text style={styles.listeners}>الجميع يستمع الآن 🎧</Text>
          <Text style={styles.voiceTitle}>الحوار الصوتي</Text>
        </View>
        <View style={styles.speakers}>
          <Speaker player={answerer} label="يجيب" active={profile.id === answerer?.id} />
          <View style={styles.audioWave}>
            {[16, 32, 23, 39, 19].map((height, index) => (
              <View key={`${height}-${index}`} style={[styles.waveBar, { height }]} />
            ))}
          </View>
          <Speaker player={questioner} label="يسأل" active={isQuestioner} />
        </View>
        <View style={styles.micStatus}>
          <Text style={styles.micIcon}>{canSpeak && answerer ? '🎙️' : '🔇'}</Text>
          <Text style={styles.micText}>
            {!answerer
              ? 'بانتظار اختيار اللاعب المجيب'
              : canSpeak
                ? 'مايكك مفتوح لهذه المحادثة'
                : 'أنت تستمع الآن؛ استخدم أزرار الصوت أسفل الشاشة'}
          </Text>
        </View>
        <Text style={styles.connectionText}>
          {voiceConnected
            ? 'الصوت متصل عبر LiveKit'
            : mode === 'online'
              ? 'جارٍ الحصول على تصريح الصوت…'
              : 'الصوت الحقيقي يبدأ بعد ربط خادم LiveKit'}
        </Text>
      </View>

      {canAdvance ? (
        <View style={styles.advanceAction}>
          <ActionButton
            label={
              game.phase === 'automatic_questions'
                ? 'إنهاء السؤال والانتقال'
                : 'إنهاء سؤالي'
            }
            loading={isWorking}
            onPress={onAdvance}
            variant="secondary"
          />
        </View>
      ) : (
        <Text style={styles.waitingText}>
          {choosingAnswerer
            ? 'اختر لاعبًا من القائمة لبدء السؤال'
            : 'ينهي السائل الحوار عند اكتمال السؤال والجواب'}
        </Text>
      )}
    </>
  );
}

function Speaker({
  player,
  label,
  active,
}: {
  player: GameView['players'][number] | undefined;
  label: string;
  active: boolean;
}) {
  const name = player?.displayName ?? 'بانتظار اللاعب';
  return (
    <View style={styles.speaker}>
      <View style={active ? styles.activeSpeaker : undefined}>
        <PlayerAvatar
          color={player?.avatarColor ?? colors.textDim}
          name={name}
          online={Boolean(player?.isOnline)}
          size={58}
        />
      </View>
      <Text style={styles.speakerName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.speakerRole}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.backgroundElevated,
    padding: 16,
    marginTop: 12,
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  pickerHint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 5,
  },
  pickerList: {
    gap: 8,
    marginTop: 12,
  },
  playerChoice: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  playerChoiceName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  voiceCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 12,
  },
  voiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  listeners: {
    color: colors.secondary,
    fontSize: 11,
  },
  speakers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  speaker: {
    width: 96,
    alignItems: 'center',
  },
  activeSpeaker: {
    borderWidth: 3,
    borderColor: colors.secondary,
    borderRadius: 38,
    padding: 3,
  },
  speakerName: {
    maxWidth: 96,
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 7,
  },
  speakerRole: {
    color: colors.warning,
    fontSize: 10,
    marginTop: 2,
  },
  audioWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },
  micStatus: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundElevated,
    paddingVertical: 9,
    marginTop: 16,
  },
  micIcon: {
    fontSize: 16,
  },
  micText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  connectionText: {
    color: colors.textDim,
    textAlign: 'center',
    fontSize: 10,
    marginTop: 8,
  },
  advanceAction: {
    marginTop: 12,
  },
  waitingText: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});
