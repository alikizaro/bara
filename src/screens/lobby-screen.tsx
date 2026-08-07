import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { ErrorBanner } from '../components/error-banner';
import { PlayerAvatar } from '../components/player-avatar';
import { ScreenShell } from '../components/screen-shell';
import { LiveAudioRoom } from '../features/voice/live-audio-room';
import { animeCollections, categories } from '../domain/game';
import { canHostStart } from '../domain/game-policy';
import { useGame } from '../state/game-context';
import { colors, radii, shadows } from '../theme/tokens';

export function LobbyScreen({ onLeave }: { onLeave: () => void }) {
  const {
    profile,
    room,
    voiceAccess,
    isWorking,
    error,
    clearError,
    setReady,
    setRoomCategory,
    startGame,
    leaveRoom,
  } = useGame();
  const [copied, setCopied] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  if (!profile || !room) {
    return (
      <ScreenShell>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>جارٍ تحميل الغرفة…</Text>
        </View>
      </ScreenShell>
    );
  }

  const me = room.players.find((player) => player.id === profile.id);
  const isHost = room.hostPlayerId === profile.id;
  const category = categories.find((item) => item.id === room.settings.category);
  const collection = animeCollections.find(
    (item) => item.id === room.settings.collection,
  );
  const readyToStart =
    room.settings.categorySelected &&
    canHostStart(room.players, room.settings.mode);
  const isDuel = room.settings.mode === 'duel';

  const copyCode = () => {
    void Clipboard.setStringAsync(room.code).then(() => {
      setCopied(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const exit = () => {
    void leaveRoom().then(onLeave);
  };

  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="مغادرة الغرفة"
          accessibilityRole="button"
          onPress={exit}
          style={styles.exitButton}
        >
          <Text style={styles.exitText}>خروج</Text>
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>
            {isDuel ? 'مواجهة لاعب ضد لاعب' : 'غرفة الانتظار'}
          </Text>
          <Text style={styles.status}>بانتظار بدء المباراة</Text>
        </View>
        <View style={styles.peopleBadge}>
          <Text style={styles.peopleText}>
            {room.players.length}/{room.settings.maxPlayers}
          </Text>
        </View>
      </View>

      <View style={[styles.codeCard, shadows.card]}>
        <Text style={styles.codeLabel}>رمز الغرفة</Text>
        <Text selectable style={styles.code}>
          {room.code}
        </Text>
        <Pressable
          accessibilityLabel="نسخ رمز الغرفة"
          accessibilityRole="button"
          onPress={copyCode}
          style={styles.copyButton}
        >
          <Text style={styles.copyText}>{copied ? 'تم النسخ ✓' : 'نسخ الرمز'}</Text>
        </Pressable>
        <Text style={styles.codeHint}>أرسل الرمز لأصدقائك ليدخلوا الغرفة</Text>
      </View>

      <View style={styles.settingsBar}>
        {isDuel ? (
          <SettingPill label="لاعبان · مايك مفتوح" emoji="⚔️" />
        ) : (
          <>
            <SettingPill
              label={`${room.settings.freeQuestionsPerPlayer} حر`}
              emoji="💬"
            />
            <SettingPill
              label={`${room.settings.automaticQuestions} تلقائي`}
              emoji="🔁"
            />
          </>
        )}
        <SettingPill
          label={room.settings.categorySelected
            ? collection?.label ?? category?.label ?? 'الصنف'
            : 'لم يُختر التصنيف'}
          emoji={category?.emoji ?? '🎲'}
        />
      </View>

      <View style={styles.chatCard}>
        <Text style={styles.chatTitle}>🎙️ دردشة الغرفة</Text>
        <Text style={styles.chatText}>
          تحدثوا واتفقوا على التصنيف، ويمكن لكل لاعب التحكم بالمايك والصوت.
        </Text>
        <LiveAudioRoom
          access={voiceAccess}
          canSpeak
          onError={setVoiceError}
        />
      </View>

      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>
          {isHost ? 'اختر التصنيف بعد اتفاقكم' : 'التصنيف الذي اختاره المضيف'}
        </Text>
        {isHost ? (
          <>
            <View style={styles.categoryGrid}>
              {categories.map((item) => {
                const selected =
                  room.settings.categorySelected &&
                  room.settings.category === item.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    disabled={isWorking}
                    key={item.id}
                    onPress={() =>
                      void setRoomCategory(
                        item.id,
                        item.id === 'anime' ? 'all-anime' : null,
                      ).catch(() => undefined)
                    }
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  >
                    <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                    <Text style={styles.categoryLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {room.settings.categorySelected && room.settings.category === 'anime' ? (
              <View style={styles.collectionGrid}>
                {animeCollections.map((item) => {
                  const selected = room.settings.collection === item.id;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      disabled={isWorking}
                      key={item.id}
                      onPress={() =>
                        void setRoomCategory('anime', item.id).catch(() => undefined)
                      }
                      style={[styles.collectionChip, selected && styles.collectionChipSelected]}
                    >
                      <Text style={styles.collectionLabel}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.selectedCategoryText}>
            {room.settings.categorySelected
              ? `${category?.emoji ?? '🎲'} ${collection?.label ?? category?.label}`
              : 'بانتظار اختيار المضيف بعد اتفاقكم…'}
          </Text>
        )}
      </View>

      <View style={styles.playersHeader}>
        <Text style={styles.playersCount}>{room.players.length} متصل</Text>
        <Text style={styles.playersTitle}>اللاعبون</Text>
      </View>
      <View style={styles.playerList}>
        {room.players.map((player, index) => (
          <View key={player.id} style={styles.playerRow}>
            <View style={styles.playerStateWrap}>
              {player.isHost ? (
                <Text style={styles.hostBadge}>المضيف</Text>
              ) : (
                <Text
                  style={[
                    styles.readyState,
                    player.isReady ? styles.ready : styles.notReady,
                  ]}
                >
                  {player.isReady ? 'جاهز' : 'غير جاهز'}
                </Text>
              )}
            </View>
            <View style={styles.playerCopy}>
              <Text style={styles.playerName}>
                {player.displayName}
                {player.id === profile.id ? ' (أنت)' : ''}
              </Text>
              <Text style={styles.playerMeta}>
                {index + 1} · {player.totalPoints} نقطة
              </Text>
            </View>
            <PlayerAvatar
              color={player.avatarColor}
              name={player.displayName}
              online={player.isOnline}
            />
          </View>
        ))}
      </View>

      <ErrorBanner
        message={voiceError ?? error}
        onDismiss={() => {
          setVoiceError(null);
          clearError();
        }}
      />

      <View style={styles.bottomActions}>
        {isHost ? (
          <>
            <ActionButton
              disabled={!readyToStart}
              label="ابدأ المباراة"
              loading={isWorking}
              onPress={() => void startGame().catch(() => undefined)}
            />
            {!readyToStart ? (
              <Text style={styles.waitHint}>
                {!room.settings.categorySelected
                  ? 'اتفقوا ثم اختر التصنيف أولًا'
                  : isDuel
                    ? 'بانتظار اللاعب الثاني وأن يضغط جاهز'
                    : 'يلزم 3 لاعبين وأن يكون جميع الأصدقاء جاهزين'}
              </Text>
            ) : null}
          </>
        ) : (
          <ActionButton
            label={me?.isReady ? 'إلغاء الاستعداد' : 'أنا جاهز'}
            onPress={() => void setReady(!me?.isReady).catch(() => undefined)}
            variant={me?.isReady ? 'ghost' : 'secondary'}
          />
        )}
      </View>
    </ScreenShell>
  );
}

function SettingPill({ label, emoji }: { label: string; emoji: string }) {
  return (
    <View style={styles.settingPill}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingEmoji}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
  },
  titleWrap: {
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  status: {
    color: colors.secondary,
    fontSize: 12,
    marginTop: 3,
  },
  exitButton: {
    minWidth: 56,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: '#4B1E3B',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  exitText: {
    color: colors.text,
    fontWeight: '700',
  },
  peopleBadge: {
    minWidth: 52,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  peopleText: {
    color: colors.text,
    fontWeight: '800',
  },
  codeCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    padding: 22,
  },
  codeLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  code: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 8,
    marginTop: 8,
  },
  copyButton: {
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 9,
    marginTop: 12,
  },
  copyText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  codeHint: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 10,
  },
  settingsBar: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  chatCard: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: '#123A42',
    padding: 16,
    marginTop: 16,
  },
  chatTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  chatText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 5,
  },
  categorySection: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    padding: 14,
    marginTop: 14,
  },
  categoryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    minWidth: '30%',
    flexGrow: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  categoryChipSelected: {
    borderColor: colors.secondary,
    backgroundColor: '#134A50',
  },
  categoryEmoji: { fontSize: 17 },
  categoryLabel: { color: colors.text, fontSize: 12, fontWeight: '800' },
  collectionGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },
  collectionChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  collectionChipSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: colors.surfaceBright,
  },
  collectionLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  selectedCategoryText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 8,
  },
  settingPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  settingEmoji: {
    fontSize: 14,
  },
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  playersTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  playersCount: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  playerList: {
    gap: 9,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    padding: 12,
  },
  playerStateWrap: {
    minWidth: 70,
  },
  playerCopy: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 12,
  },
  playerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  playerMeta: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 4,
  },
  hostBadge: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
  },
  readyState: {
    fontSize: 11,
    fontWeight: '800',
  },
  ready: {
    color: colors.success,
  },
  notReady: {
    color: colors.textDim,
  },
  bottomActions: {
    marginTop: 18,
  },
  waitHint: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 9,
  },
});
