import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { BackHeader } from '../components/back-header';
import { ErrorBanner } from '../components/error-banner';
import { ScreenShell } from '../components/screen-shell';
import { Stepper } from '../components/stepper';
import {
  animeCollections,
  categories,
  defaultRoomSettings,
  type CategoryId,
  type GameMode,
  type RoomSettings,
} from '../domain/game';
import { validateRoomSettings } from '../domain/game-policy';
import { useGame } from '../state/game-context';
import { colors, radii } from '../theme/tokens';

export function CreateRoomScreen({
  onBack,
  onCreated,
  initialMode = 'classic',
}: {
  onBack: () => void;
  onCreated: () => void;
  initialMode?: GameMode;
}) {
  const { createRoom, isWorking, error, clearError } = useGame();
  const [settings, setSettings] = useState<RoomSettings>(() => ({
    ...defaultRoomSettings,
    mode: initialMode,
    maxPlayers: initialMode === 'duel' ? 2 : defaultRoomSettings.maxPlayers,
  }));
  const [localError, setLocalError] = useState<string | null>(null);

  const chooseCategory = (category: CategoryId) => {
    setSettings((current) => ({
      ...current,
      category,
      collection: category === 'anime' ? 'one-piece' : null,
    }));
  };

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
        title={settings.mode === 'duel' ? 'لاعب ضد لاعب' : 'إنشاء غرفة'}
      />
      <Text style={styles.heading}>
        {settings.mode === 'duel' ? 'اختر تصنيف المواجهة' : 'اختر نوع السالفة'}
      </Text>
      <Text style={styles.subheading}>
        {settings.mode === 'duel'
          ? 'ستظهر لكل لاعب صورة مختلفة، والفائز من يخمّن صورة خصمه'
          : 'يمكنك تغيير هذه الخيارات قبل بدء المباراة'}
      </Text>

      <View style={styles.categoryList}>
        {categories.map((category) => {
          const selected = category.id === settings.category;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={category.id}
              onPress={() => chooseCategory(category.id)}
              style={({ pressed }) => [
                styles.categoryCard,
                selected && styles.categorySelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.categoryCopy}>
                <Text style={styles.categoryLabel}>{category.label}</Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              </View>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            </Pressable>
          );
        })}
      </View>

      {settings.category === 'anime' ? (
        <View style={styles.animeSection}>
          <Text style={styles.sectionTitle}>اختر الأنمي</Text>
          <View style={styles.chips}>
            {animeCollections.map((collection) => {
              const selected = settings.collection === collection.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={collection.id}
                  onPress={() =>
                    setSettings((current) => ({
                      ...current,
                      collection: collection.id,
                    }))
                  }
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {collection.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.narutoNote}>
            ناروتو مستقل بالكامل ولا يحتوي شخصيات بوروتو
          </Text>
        </View>
      ) : null}

      {settings.mode === 'classic' ? (
        <>
          <Text style={styles.sectionTitle}>إعدادات المباراة</Text>
          <View style={styles.steppers}>
        <Stepper
          hint="الحد المتاح داخل الغرفة"
          label="عدد اللاعبين"
          maximum={10}
          minimum={3}
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
      ) : (
        <View style={styles.duelNote}>
          <Text style={styles.duelNoteTitle}>🎙️ مواجهة صوتية مفتوحة</Text>
          <Text style={styles.duelNoteText}>
            لاعبان فقط، المايك مفتوح لكليكما، ثم يختار كل لاعب تخمينه من الصور.
          </Text>
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
  categoryList: {
    gap: 10,
    marginTop: 20,
  },
  categoryCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundElevated,
    padding: 15,
  },
  categorySelected: {
    borderColor: colors.primaryLight,
    backgroundColor: colors.surfaceBright,
  },
  categoryCopy: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 13,
  },
  categoryLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  categoryDescription: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  categoryEmoji: {
    fontSize: 34,
  },
  animeSection: {
    marginTop: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginTop: 24,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 9,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chipSelected: {
    borderColor: colors.secondary,
    backgroundColor: '#134A50',
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: colors.text,
  },
  narutoNote: {
    color: colors.secondary,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 10,
  },
  steppers: {
    gap: 10,
  },
  submit: {
    marginTop: 16,
  },
  pressed: {
    opacity: 0.82,
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
