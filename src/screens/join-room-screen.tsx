import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { BackHeader } from '../components/back-header';
import { ErrorBanner } from '../components/error-banner';
import { ScreenShell } from '../components/screen-shell';
import { normalizeRoomCode, ROOM_CODE_LENGTH } from '../domain/game-policy';
import { useGame } from '../state/game-context';
import { colors, radii, shadows } from '../theme/tokens';

export function JoinRoomScreen({
  onBack,
  onJoined,
}: {
  onBack: () => void;
  onJoined: () => void;
}) {
  const { joinRoom, isWorking, error, clearError } = useGame();
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    if (code.length !== ROOM_CODE_LENGTH) {
      setLocalError('رمز الغرفة يجب أن يتكون من 6 خانات');
      return;
    }
    setLocalError(null);
    void joinRoom(code).then(onJoined).catch(() => undefined);
  };

  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="دخول غرفة" />
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🔑</Text>
        </View>
        <Text style={styles.title}>لديك رمز دعوة؟</Text>
        <Text style={styles.subtitle}>
          اطلب من صاحب الغرفة إرسال الرمز المكوّن من 6 خانات
        </Text>
      </View>

      <View style={[styles.card, shadows.card]}>
        <Text style={styles.inputLabel}>رمز الغرفة</Text>
        <TextInput
          accessibilityLabel="رمز الغرفة"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={ROOM_CODE_LENGTH}
          onChangeText={(value) => setCode(normalizeRoomCode(value))}
          onSubmitEditing={submit}
          placeholder="A7K9Q2"
          placeholderTextColor={colors.textDim}
          returnKeyType="go"
          style={styles.codeInput}
          value={code}
        />
        <Text style={styles.counter}>
          {code.length} / {ROOM_CODE_LENGTH}
        </Text>
        <ErrorBanner
          message={localError ?? error}
          onDismiss={() => {
            setLocalError(null);
            clearError();
          }}
        />
        <ActionButton
          disabled={code.length !== ROOM_CODE_LENGTH}
          label="دخول الغرفة"
          loading={isWorking}
          onPress={submit}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25,211,197,0.14)',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  icon: {
    fontSize: 46,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    marginTop: 20,
  },
  subtitle: {
    maxWidth: 310,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 10,
  },
  codeInput: {
    minHeight: 70,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 8,
    paddingHorizontal: 15,
  },
  counter: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 12,
  },
});
