import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radii } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function ActionButton({
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          {icon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: '#65F5E8',
  },
  ghost: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: '#6B2345',
    borderColor: colors.danger,
  },
  content: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.46,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
