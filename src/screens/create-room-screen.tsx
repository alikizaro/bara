import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { BackHeader } from '../components/back-header';
import { ErrorBanner } from '../components/error-banner';
import { ScreenShell } from '../components/screen-shell';
import { Stepper } from '../components/stepper';
import { defaultRoomSettings, type GameMode, type RoomSettings } from '../domain/game';
import { validateRoomSettings } from '../domain/game-policy';
import { useGame } from '../state/game-context';
import { colors, radii } from '../theme/tokens';

export function CreateRoomScreen({
  onBack,
  onCreated,
  initialMode = 'classic',
  initialSettings,
}: {
  onBack: () => void;
  onCreated: () => void;
  initialMode?: GameMode;
  initialSettings?: Partial<RoomSettings>;
}) {
  const { createRoom, isWorking, error, clearError } = useGame();
  const [settings, setSettings] = useState<RoomSettings>(() => ({
    ...defaultRoomSettings,
    mode: initialMode,
    maxPlayers: initialMode === 'duel' ? 2 : defaultRoomSettings.maxPlayers,
    ...initialSettings,
  }));
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    const validationError = validateRoomSettings(settings);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    void createRoom(settings).then(onCreated).catch(() => undefined);
  };

  return (
    <ScreenShell>
      <BackHeader
        onBack={onBack}
        title={settings.mode === 'duel' ? `${settings.teamSize} ضد ${settings.teamSize}` : settings.mode === 'mafia' ? 'المافيا' : 'إنشاء غرفة'}
      />
      <Text style={styles.heading}>
        {settings.mode === 'duel' ? 'أنشئ مواجهة' : settings.mode === 'mafia' ? 'أنشئ ليلة مافيا' : 'أنشئ غرفة'}
      </Text>
      <Text style={styles.subheading}>
        اجمع اللاعبين أولًا، تحدثوا واتفقوا على التصنيف داخل الغرفة.
      </Text>

      {settings.mode === 'classic' ? (
        <>
          <Text style={styles.sectionTitle}>إعدادات المباراة</Text>
          <View style={styles.steppers}>
        <Stepper
          hint="الحد المتاح داخل الغرفة"
          label="عدد اللاعبين"
          maximum={10}
          minimum={settings.outsiderCount === 2 ? 5 : 3}
          onChange={(maxPlayers) =>
            setSettings((current) => ({ ...current, maxPlayers }))
          }
          value={settings.maxPlayers}
        />
        <Stepper
          hint="اللعبة تختار من يسأل من"
          label="الأسئلة التلقائية"
          maximum={10}
          minimum={1}
          onChange={(automaticQuestions) =>
            setSettings((current) => ({ ...current, automaticQuestions }))
          }
          value={settings.automaticQuestions}
        />
        <Stepper
          hint="كل لاعب يختار من يسأله"
          label="الأسئلة الحرة لكل لاعب"
          maximum={3}
          minimum={1}
          onChange={(freeQuestionsPerPlayer) =>
            setSettings((current) => ({
              ...current,
              freeQuestionsPerPlayer,
            }))
          }
          value={settings.freeQuestionsPerPlayer}
        />
          </View>
        </>
      ) : settings.mode === 'duel' ? (
        <View style={styles.duelNote}>
          <Text style={styles.duelNoteTitle}>🎙️ مواجهة صوتية مفتوحة</Text>
          <Text style={styles.duelNoteText}>
            فريقان من {settings.teamSize} ضد {settings.teamSize}، لكل فريق صورة مختلفة والتخمين مفتوح بالمايك.
          </Text>
        </View>
      ) : (
        <View style={styles.duelNote}>
          <Text style={styles.duelNoteTitle}>🌙 أدوار سرية وتصويت جماعي</Text>
          <Text style={styles.duelNoteText}>يجتمع {settings.maxPlayers} لاعبين، يتناقشون بالصوت ثم يصوّتون لكشف المافيا.</Text>
        </View>
      )}

      <ErrorBanner
        message={localError ?? error}
        onDismiss={() => {
          setLocalError(null);
          clearError();
        }}
      />
      <View style={styles.submit}>
        <ActionButton
          label="إنشاء الغرفة"
          loading={isWorking}
          onPress={submit}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 18,
  },
  subheading: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'right',
    marginTop: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 24,
    marginBottom: 12,
  },
  steppers: {
    gap: 10,
  },
  submit: {
    marginTop: 16,
  },
  duelNote: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: '#123A42',
    padding: 16,
    marginTop: 22,
  },
  duelNoteTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  duelNoteText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 6,
  },
});
