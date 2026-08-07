import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/action-button';
import { PlayerAvatar } from '../../components/player-avatar';
import { RemoteArtwork } from '../../components/remote-artwork';
import type { GameView, PlayerProfile } from '../../domain/game';
import { colors, radii } from '../../theme/tokens';

export function ResultsPanel({
  game,
  profile,
  isWorking,
  onNextRound,
}: {
  game: GameView;
  profile: PlayerProfile;
  isWorking: boolean;
  onNextRound: () => void;
}) {
  const outsider = game.players.find(
    (player) => player.id === game.outsiderPlayerId,
  );
  const me = game.players.find((player) => player.id === profile.id);
  const votesByPlayer = new Map(
    game.voteResults.map((result) => [result.playerId, result.voteCount]),
  );
  const pointsByPlayer = new Map(
    game.roundPoints.map((result) => [result.playerId, result.points]),
  );

  return (
    <View>
      <View style={styles.resultCard}>
        <Text style={styles.emoji}>🏁</Text>
        <Text style={styles.title}>نتيجة الجولة {game.roundNumber}</Text>
        <Text style={styles.outsiderLabel}>كان برا السالفة</Text>
        <Text style={styles.outsiderName}>
          {outsider?.displayName ?? 'لاعب غير معروف'}
        </Text>

        {game.secret ? (
          <View style={styles.secretWrap}>
            <RemoteArtwork
              imageUrl={game.secret.imageUrl}
              label={game.secret.name}
              size={150}
            />
            <Text style={styles.secretLabel}>الشخصية الصحيحة</Text>
            <Text style={styles.secretName}>{game.secret.name}</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.guessResult,
            game.outsiderGuessCorrect ? styles.guessCorrect : styles.guessWrong,
          ]}
        >
          <Text style={styles.guessResultTitle}>
            {game.outsiderGuessCorrect
              ? 'عرف الشخصية وحصل على نقطة ✓'
              : 'لم يعرف الشخصية'}
          </Text>
          <Text style={styles.guessResultText}>
            {game.outsiderGuessName
              ? `اختياره: ${game.outsiderGuessName}`
              : 'لم يقدّم إجابة'}
          </Text>
        </View>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>النقاط والتصويت</Text>
        <View style={styles.scoreList}>
          {[...game.players]
            .sort((left, right) => right.roomScore - left.roomScore)
            .map((player, index) => {
              const roundPoints = pointsByPlayer.get(player.id) ?? 0;
              return (
                <View key={player.id} style={styles.playerRow}>
                  <Text style={styles.rank}>{index + 1}</Text>
                  <View style={styles.playerCopy}>
                    <Text style={styles.playerName}>
                      {player.displayName}
                      {player.id === profile.id ? ' (أنت)' : ''}
                    </Text>
                    <Text style={styles.playerMeta}>
                      {votesByPlayer.get(player.id) ?? 0} تصويت · المجموع{' '}
                      {player.roomScore}
                    </Text>
                  </View>
                  {roundPoints > 0 ? (
                    <Text style={styles.pointBadge}>+{roundPoints}</Text>
                  ) : null}
                  <PlayerAvatar
                    color={player.avatarColor}
                    name={player.displayName}
                    online={player.isOnline}
                    size={44}
                  />
                </View>
              );
            })}
        </View>
      </View>

      {me?.isHost ? (
        <View style={styles.nextAction}>
          <ActionButton
            label="ابدأ جولة جديدة"
            loading={isWorking}
            onPress={onNextRound}
          />
        </View>
      ) : (
        <Text style={styles.waiting}>بانتظار المضيف لبدء الجولة التالية</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.backgroundElevated,
    padding: 18,
  },
  emoji: {
    fontSize: 44,
  },
  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    marginTop: 7,
  },
  outsiderLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 14,
  },
  outsiderName: {
    color: colors.danger,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 3,
  },
  secretWrap: {
    alignItems: 'center',
    marginTop: 18,
  },
  secretLabel: {
    color: colors.textDim,
    fontSize: 10,
    marginTop: 9,
  },
  secretName: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 3,
  },
  guessResult: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
  },
  guessCorrect: {
    borderColor: colors.success,
    backgroundColor: '#17463D',
  },
  guessWrong: {
    borderColor: colors.danger,
    backgroundColor: '#4B1E3B',
  },
  guessResultTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  guessResultText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  scoreCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 12,
  },
  scoreTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  scoreList: {
    gap: 8,
    marginTop: 12,
  },
  playerRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.backgroundElevated,
    padding: 9,
  },
  rank: {
    width: 24,
    color: colors.textDim,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  playerCopy: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  playerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  playerMeta: {
    color: colors.textDim,
    fontSize: 10,
    marginTop: 3,
  },
  pointBadge: {
    color: colors.success,
    fontSize: 15,
    fontWeight: '900',
    marginRight: 9,
  },
  nextAction: {
    marginTop: 14,
  },
  waiting: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
  },
});
