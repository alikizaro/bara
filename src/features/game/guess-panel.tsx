import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/action-button';
import { RemoteArtwork } from '../../components/remote-artwork';
import type { GameView, PlayerProfile } from '../../domain/game';
import { colors, radii } from '../../theme/tokens';

export function GuessPanel({
  game,
  profile,
  isWorking,
  onGuess,
  onSkip,
}: {
  game: GameView;
  profile: PlayerProfile;
  isWorking: boolean;
  onGuess: (name: string) => void;
  onSkip: () => void;
}) {
  const outsider = game.players.find(
    (player) => player.id === game.outsiderPlayerId,
  );
  const me = game.players.find((player) => player.id === profile.id);

  if (game.role !== 'outsider') {
    return (
      <View style={styles.waitCard}>
        <Text style={styles.waitEmoji}>🤫</Text>
        <Text style={styles.title}>اكتشفتم برا السالفة</Text>
        <Text style={styles.outsiderName}>{outsider?.displayName ?? 'اللاعب'}</Text>
        <Text style={styles.hint}>
          لديه الآن أربعة خيارات ومحاولة واحدة لمعرفة الشخصية.
        </Text>
        {me?.isHost ? (
          <View style={styles.skipAction}>
            <ActionButton
              label="تخطي التخمين عند غياب اللاعب"
              loading={isWorking}
              onPress={onSkip}
              variant="ghost"
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>🎯</Text>
      <Text style={styles.title}>هل عرفت الشخصية؟</Text>
      <Text style={styles.hint}>
        اختر إجابة واحدة. إذا كانت صحيحة تحصل على نقطة.
      </Text>
      <View style={styles.choices}>
        {(game.guessChoices ?? []).map((choice) => (
          <Pressable
            accessibilityRole="button"
            disabled={isWorking}
            key={choice.name}
            onPress={() => onGuess(choice.name)}
            style={({ pressed }) => [
              styles.choice,
              pressed && styles.pressed,
            ]}
          >
            <RemoteArtwork
              imageUrl={choice.imageUrl}
              label={choice.name}
              size={112}
            />
            <Text style={styles.choiceName}>{choice.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.backgroundElevated,
    padding: 16,
  },
  waitCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.backgroundElevated,
    padding: 24,
  },
  emoji: {
    fontSize: 42,
    textAlign: 'center',
  },
  waitEmoji: {
    fontSize: 48,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  outsiderName: {
    color: colors.warning,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 10,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
  },
  choices: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 18,
  },
  choice: {
    width: '48%',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 9,
  },
  choiceName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  skipAction: {
    alignSelf: 'stretch',
    marginTop: 20,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
