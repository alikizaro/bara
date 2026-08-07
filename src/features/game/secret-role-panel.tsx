import { StyleSheet, Text, View } from 'react-native';

import { RemoteArtwork } from '../../components/remote-artwork';
import type { GameView } from '../../domain/game';
import { colors, radii, shadows } from '../../theme/tokens';

export function SecretRolePanel({ game }: { game: GameView }) {
  return (
    <>
      <View
        style={[
          styles.roleCard,
          game.role === 'outsider' ? styles.outsiderCard : styles.insideCard,
          shadows.card,
        ]}
      >
        <Text style={styles.eyebrow}>دورك السري</Text>
        <Text style={styles.title}>
          {game.role === 'outsider' ? 'أنت برا السالفة' : 'أنت داخل السالفة'}
        </Text>
        <Text style={styles.hint}>
          {game.role === 'outsider'
            ? 'استمع جيدًا وحاول اكتشاف الشخصية من الأسئلة'
            : 'لا تكشف الشخصية بوضوح أثناء إجابتك'}
        </Text>
      </View>

      {game.secret ? (
        <View style={styles.secretCard}>
          <RemoteArtwork
            imageUrl={game.secret.imageUrl}
            label={game.secret.name}
            size={138}
          />
          <Text style={styles.secretLabel}>الشخصية أو العنصر السري</Text>
          <Text style={styles.secretName}>{game.secret.name}</Text>
        </View>
      ) : (
        <View style={styles.hiddenSecret}>
          <Text style={styles.hiddenEmoji}>❔</Text>
          <Text style={styles.hiddenTitle}>الشخصية مخفية عنك</Text>
          <Text style={styles.hiddenHint}>
            استمع للأسئلة من دون أن تكشف أنك لا تعرفها
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  roleCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 18,
  },
  insideCard: {
    backgroundColor: '#183D4B',
    borderColor: colors.secondary,
  },
  outsiderCard: {
    backgroundColor: '#4B1E3B',
    borderColor: colors.danger,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 5,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 5,
  },
  secretCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    padding: 18,
    marginTop: 12,
  },
  secretLabel: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 12,
  },
  secretName: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    marginTop: 4,
    textAlign: 'center',
  },
  hiddenSecret: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    borderStyle: 'dashed',
    backgroundColor: colors.backgroundElevated,
    padding: 24,
    marginTop: 12,
  },
  hiddenEmoji: {
    fontSize: 46,
  },
  hiddenTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  hiddenHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
});
