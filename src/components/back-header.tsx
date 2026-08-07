import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/tokens';

export function BackHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="رجوع"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        style={styles.backButton}
      >
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: {
    color: colors.text,
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '400',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  spacer: {
    width: 44,
  },
});
