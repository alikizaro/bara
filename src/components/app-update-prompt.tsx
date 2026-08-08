import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  type AppUpdate,
} from '../services/app-updates';
import { colors, radii, shadows } from '../theme/tokens';

export function AppUpdatePrompt() {
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const applyAvailableUpdate = (available: AppUpdate | null) => {
      if (active && available) {
        setUpdate(available);
        setVisible(true);
      }
    };
    void checkForAppUpdate().then(applyAvailableUpdate);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void checkForAppUpdate().then(applyAvailableUpdate);
      }
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const install = async () => {
    if (!update || progress !== null) return;
    setError(null);
    setProgress(0);
    try {
      await downloadAndInstallUpdate(update, setProgress);
      setProgress(null);
    } catch (cause) {
      setProgress(null);
      setError(
        cause instanceof Error
          ? cause.message
          : 'تعذر تنزيل التحديث. تحقق من الإنترنت وحاول مجددًا.',
      );
    }
  };

  if (!update) return null;

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => progress === null && setVisible(false)}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, shadows.card]}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>↓</Text>
          </View>
          <Text style={styles.title}>تحديث جديد للَمّة</Text>
          <Text style={styles.body}>
            الإصدار {update.versionName} جاهز. حدّث الآن لتحصل على إصلاحات الصوت وأحدث الألعاب.
          </Text>

          {progress !== null ? (
            <View style={styles.progressArea}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>{Math.round(progress * 100)}٪</Text>
                <ActivityIndicator color={colors.warning} size="small" />
              </View>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={progress !== null}
            onPress={() => void install()}
            style={({ pressed }) => [styles.install, pressed && styles.pressed]}
          >
            <Text style={styles.installText}>
              {progress === null
                ? Platform.OS === 'ios' ? 'فتح App Store' : 'تنزيل وتثبيت التحديث'
                : 'جارٍ تنزيل التحديث…'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={progress !== null}
            onPress={() => setVisible(false)}
            style={styles.later}
          >
            <Text style={styles.laterText}>لاحقًا</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.backgroundElevated,
    padding: 24,
  },
  badge: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.warning,
  },
  badgeIcon: { color: '#24170A', fontSize: 35, fontWeight: '900' },
  title: { color: colors.text, fontSize: 23, fontWeight: '900', marginTop: 18 },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 9,
  },
  progressArea: { width: '100%', marginTop: 20 },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  progressFill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.warning },
  progressRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 8, marginTop: 9 },
  progressText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  error: { color: colors.danger, textAlign: 'center', fontSize: 12, marginTop: 14 },
  install: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    marginTop: 22,
  },
  installText: { color: colors.text, fontSize: 16, fontWeight: '900' },
  later: { paddingHorizontal: 28, paddingVertical: 14 },
  laterText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
