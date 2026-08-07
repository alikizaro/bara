import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '../theme/tokens';

export function Stepper({
  label,
  hint,
  value,
  minimum,
  maximum,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  minimum: number;
  maximum: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel={`تقليل ${label}`}
          accessibilityRole="button"
          disabled={value <= minimum}
          onPress={() => onChange(Math.max(minimum, value - 1))}
          style={[styles.button, value <= minimum && styles.disabled]}
        >
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          accessibilityLabel={`زيادة ${label}`}
          accessibilityRole="button"
          disabled={value >= maximum}
          onPress={() => onChange(Math.min(maximum, value + 1))}
          style={[styles.button, value >= maximum && styles.disabled]}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
    textAlign: 'right',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  buttonText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 27,
  },
  value: {
    minWidth: 24,
    color: colors.text,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.35,
  },
});
