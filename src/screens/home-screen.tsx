import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { PlayerAvatar } from '../components/player-avatar';
import { ScreenShell } from '../components/screen-shell';
import {
  checkForAppUpdate,
  type AppUpdate,
} from '../services/app-updates';
import { useGame } from '../state/game-context';
import { colors, radii, shadows } from '../theme/tokens';

export function HomeScreen({
  onCreate,
  onJoin,
  onDuel,
}: {
  onCreate: () => void;
  onJoin: () => void;
  onDuel: () => void;
}) {
  const { profile, mode } = useGame();
  const [update, setUpdate] = useState<AppUpdate | null>(null);

  useEffect(() => {
    let active = true;
    void checkForAppUpdate().then((available) => {
      if (active) {
        setUpdate(available);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  if (!profile) {
    return null;
  }

  return (
    <ScreenShell>
      <View style={styles.header}>
        <View style={styles.profileCopy}>
          <Text style={styles.greeting}>هلا، {profile.displayName} 👋</Text>
          <Text style={styles.points}>{profile.totalPoints} نقطة</Text>
        </View>
        <PlayerAvatar
          color={profile.avatarColor}
          name={profile.displayName}
          online
          size={56}
        />
      </View>

      <View style={[styles.heroCard, shadows.card]}>
        <View style={styles.decorOne} />
        <View style={styles.decorTwo} />
        <Text style={styles.heroEmoji}>🕵️‍♂️</Text>
        <Text style={styles.heroTitle}>من هو برا السالفة؟</Text>
        <Text style={styles.heroBody}>
          اجمع أصدقاءك في غرفة واحدة، اسألوا بالصوت ثم صوّتوا للمتخفي
        </Text>
      </View>

      <View style={styles.actions}>
        <ActionButton
          label="لاعب ضد لاعب"
          icon={<Text style={styles.actionIcon}>⚔️</Text>}
          onPress={onDuel}
          variant="secondary"
        />
        <ActionButton
          label="إنشاء غرفة جديدة"
          icon={<Text style={styles.actionIcon}>＋</Text>}
          onPress={onCreate}
        />
        <ActionButton
          label="الدخول برمز غرفة"
          icon={<Text style={styles.actionIcon}>⌁</Text>}
          onPress={onJoin}
          variant="ghost"
        />
      </View>

      {update ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void Linking.openURL(update.apkUrl)}
          style={styles.updateBanner}
        >
          <View style={styles.updateCopy}>
            <Text style={styles.updateTitle}>يتوفر تحديث جديد</Text>
            <Text style={styles.updateText}>
              الإصدار {update.versionName} جاهز للتنزيل والتثبيت
            </Text>
          </View>
          <Text style={styles.updateIcon}>⬇️</Text>
        </Pressable>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>كيف ستكون الجولة؟</Text>
      </View>
      <View style={styles.featureGrid}>
        <FeatureCard emoji="🎙️" label="سؤال وجواب صوتي" />
        <FeatureCard emoji="👥" label="من 3 إلى 10 لاعبين" />
        <FeatureCard emoji="🗳️" label="تصويت ونقاط" />
        <FeatureCard emoji="🎭" label="دور سري لكل لاعب" />
      </View>

      <View style={styles.serverBanner}>
        <View
          style={[
            styles.serverDot,
            { backgroundColor: mode === 'online' ? colors.success : colors.warning },
          ]}
        />
        <Text style={styles.serverText}>
          {mode === 'online'
            ? 'الخادم متصل — الغرف تعمل بين الأجهزة'
            : 'معاينة محلية — اربط الخادم لتشغيل الغرف بين الأجهزة'}
        </Text>
      </View>
    </ScreenShell>
  );
}

function FeatureCard({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 22,
  },
  profileCopy: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 14,
  },
  greeting: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  points: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  heroCard: {
    minHeight: 245,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
    padding: 24,
  },
  decorOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(124,92,255,0.24)',
    top: -80,
    right: -50,
  },
  decorTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(25,211,197,0.14)',
    bottom: -55,
    left: -30,
  },
  heroEmoji: {
    fontSize: 58,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 14,
  },
  heroBody: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 9,
    maxWidth: 310,
  },
  actions: {
    gap: 12,
    marginTop: 20,
  },
  actionIcon: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  sectionHeader: {
    alignItems: 'flex-end',
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  featureGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureCard: {
    width: '48%',
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    padding: 10,
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 7,
    textAlign: 'center',
  },
  serverBanner: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 22,
  },
  updateBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: '#17463D',
    padding: 14,
    marginTop: 16,
  },
  updateCopy: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  updateTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  updateText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  updateIcon: {
    fontSize: 28,
  },
  serverDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  serverText: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
});
