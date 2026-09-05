import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { ErrorBanner } from '../components/error-banner';
import { ScreenShell } from '../components/screen-shell';
import {
  normalizeDisplayName,
  validateDisplayName,
} from '../domain/game-policy';
import { useGame } from '../state/game-context';
import { colors, radii, shadows } from '../theme/tokens';

export function WelcomeScreen({ onOffline, onOfflineCharacter }: { onOffline: () => void; onOfflineCharacter: () => void }) {
  const { saveDisplayName, isWorking, error, clearError, mode } = useGame();
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    const normalized = normalizeDisplayName(displayName);
    const validationError = validateDisplayName(normalized);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    void saveDisplayName(normalized);
  };

  return (
    <ScreenShell>
      <View style={styles.hero}>
        <View style={styles.logoHalo}>
          <View style={styles.logo}>
            <Text style={styles.logoQuestion}>؟</Text>
            <Text style={styles.logoMic}>🎙️</Text>
          </View>
        </View>
        <Text style={styles.title}>برا السالفة</Text>
        <Text style={styles.subtitle}>
          اسأل، اسمع، واكتشف من لا يعرف الشخصية
        </Text>
      </View>

      <View style={[styles.card, shadows.card]}>
        <Text style={styles.cardTitle}>ما الاسم الذي سيظهر لأصدقائك؟</Text>
        <TextInput
          accessibilityLabel="اسم اللاعب"
          autoCorrect={false}
          maxLength={24}
          onChangeText={setDisplayName}
          onSubmitEditing={submit}
          placeholder="مثلاً: علي"
          placeholderTextColor={colors.textDim}
          returnKeyType="done"
          style={styles.input}
          textAlign="right"
          value={displayName}
        />
        <ErrorBanner
          message={localError ?? error}
          onDismiss={() => {
            setLocalError(null);
            clearError();
          }}
        />
        <ActionButton
          label="ابدأ اللعب"
          icon={<Text style={styles.buttonIcon}>←</Text>}
          loading={isWorking}
          onPress={submit}
        />
      </View>

      <ActionButton label="📱 برا السالفة — بجهاز واحد بدون إنترنت" variant="ghost" onPress={onOffline} />
      <ActionButton label="🎭 احزر الشخصية — بجهاز واحد بدون إنترنت" variant="ghost" onPress={onOfflineCharacter} />
      <View style={styles.privacyRow}>
        <Text style={styles.privacyText}>
          {mode === 'online'
            ? 'متصل بالخادم — ستتزامن الغرف بين الأجهزة'
            : 'وضع المعاينة — الخادم السحابي لم يُربط بعد'}
        </Text>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: mode === 'online' ? colors.success : colors.warning },
          ]}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
  },
  logoHalo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,92,255,0.17)',
    borderWidth: 1,
    borderColor: 'rgba(169,152,255,0.45)',
  },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    transform: [{ rotate: '-5deg' }],
  },
  logoQuestion: {
    color: colors.text,
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 70,
  },
  logoMic: {
    position: 'absolute',
    right: -15,
    bottom: -12,
    fontSize: 40,
    transform: [{ rotate: '5deg' }],
  },
  title: {
    color: colors.text,
    fontSize: 37,
    fontWeight: '900',
    marginTop: 24,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 14,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
  },
  input: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 17,
    paddingHorizontal: 16,
  },
  buttonIcon: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  privacyRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 18,
  },
  privacyText: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
