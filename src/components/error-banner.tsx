import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme/tokens';

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  if (!message) {
    return null;
  }
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="إغلاق رسالة الخطأ"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onDismiss}
      >
        <Text style={styles.close}>×</Text>
      </Pressable>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.icon}>!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: '#4B1E3B',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 8,
  },
  message: {
    flex: 1,
    color: colors.text,
    textAlign: 'right',
    fontSize: 14,
    lineHeight: 21,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '900',
  },
  close: {
    color: colors.textMuted,
    fontSize: 24,
    lineHeight: 26,
  },
});
