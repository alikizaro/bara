import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameCatalogItem } from '../domain/game-catalog';
import { colors, radii, shadows } from '../theme/tokens';

export function GameCard({ game, onPress }: { game: GameCatalogItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadows.card, pressed && styles.pressed]}
    >
      <View style={[styles.illustration, { backgroundColor: `${game.accent}22` }]}>
        <View style={[styles.orbit, { borderColor: `${game.accent}88` }]} />
        <Text style={styles.emoji}>{game.emoji}</Text>
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{game.title}</Text>
          <View style={[styles.dot, { backgroundColor: game.accent }]} />
        </View>
        <Text style={styles.subtitle}>{game.subtitle}</Text>
        <View style={[styles.status, { borderColor: `${game.accent}88` }]}>
          <Text style={[styles.statusText, { color: game.accent }]}>
            {game.available ? 'العب الآن' : 'قريبًا'}
          </Text>
        </View>
      </View>
      <Text style={styles.arrow}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 132,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    padding: 15,
  },
  illustration: {
    width: 92,
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 24,
  },
  orbit: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    transform: [{ rotate: '-18deg' }],
  },
  emoji: { fontSize: 43 },
  copy: { flex: 1, alignItems: 'flex-end', marginHorizontal: 14 },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  title: { color: colors.text, fontSize: 19, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 5, textAlign: 'right' },
  status: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 12 },
  statusText: { fontSize: 10, fontWeight: '900' },
  arrow: { color: colors.textDim, fontSize: 34, fontWeight: '300' },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
});
