import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme/tokens';

export function ModeCard({
  title,
  description,
  emoji,
  available = true,
  onPress,
}: {
  title: string;
  description: string;
  emoji: string;
  available?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!available}
      onPress={onPress}
      style={({ pressed }) => [styles.card, !available && styles.disabled, pressed && styles.pressed]}
    >
      <View style={styles.emojiBox}><Text style={styles.emoji}>{emoji}</Text></View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          {!available ? <Text style={styles.soon}>قريبًا</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={styles.arrow}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 104, flexDirection: 'row-reverse', alignItems: 'center', borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14 },
  emojiBox: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.backgroundElevated },
  emoji: { fontSize: 29 },
  copy: { flex: 1, alignItems: 'flex-end', marginHorizontal: 13 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.text, fontSize: 17, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: 'right' },
  soon: { color: colors.warning, fontSize: 9, fontWeight: '900', borderWidth: 1, borderColor: colors.warning, borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 2 },
  arrow: { color: colors.textDim, fontSize: 30 },
  disabled: { opacity: 0.52 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
