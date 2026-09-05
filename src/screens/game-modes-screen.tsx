import { StyleSheet, Text, View } from 'react-native';

import { BackHeader } from '../components/back-header';
import { ModeCard } from '../components/mode-card';
import { ScreenShell } from '../components/screen-shell';
import type { GameId } from '../domain/game-catalog';
import type { RoomSettings } from '../domain/game';
import { colors } from '../theme/tokens';

interface GameModeActions {
  onOffline: () => void;
  onCreate: (preset: Partial<RoomSettings>) => void;
  onJoin: () => void;
}

export function GameModesScreen({
  game,
  onBack,
  actions,
}: {
  game: GameId;
  onBack: () => void;
  actions: GameModeActions;
}) {
  const meta = gameMeta[game];
  return (
    <ScreenShell>
      <BackHeader onBack={onBack} title="لَمّة" />
      <View style={styles.hero}>
        <Text style={styles.emoji}>{meta.emoji}</Text>
        <Text style={styles.title}>{meta.title}</Text>
        <Text style={styles.subtitle}>{meta.subtitle}</Text>
      </View>
      <Text style={styles.section}>اختر وضع اللعب</Text>
      <View style={styles.list}>
        {game === 'outsider' ? (
          <>
            <ModeCard title="بجهاز واحد · أوفلاين" description="اكتبوا أسماءكم ومرّروا الهاتف؛ بدون حساب أو إنترنت" emoji="📱" onPress={actions.onOffline} />
            <ModeCard title="شخص واحد برا السالفة" description="الوضع الأصلي؛ لاعب واحد لا يعرف الموضوع" emoji="1️⃣" onPress={() => actions.onCreate({ mode: 'classic', outsiderCount: 1 })} />
            <ModeCard title="شخصان برا السالفة" description="متخفيان يحاولان النجاة من التصويت" emoji="2️⃣" onPress={() => actions.onCreate({ mode: 'classic', outsiderCount: 2, maxPlayers: 6 })} />
            <ModeCard title="غرفة خاصة" description="أنشئ غرفة وشارك الرمز مع أصدقائك" emoji="🔐" onPress={() => actions.onCreate({ mode: 'classic', outsiderCount: 1 })} />
          </>
        ) : game === 'character' ? (
          <>
            <ModeCard title="1 ضد 1" description="لكل لاعب شخصية، اسأل وخمّن شخصية خصمك" emoji="⚔️" onPress={() => actions.onCreate({ mode: 'duel', teamSize: 1, maxPlayers: 2 })} />
            <ModeCard title="2 ضد 2" description="فريقان يتعاونان للوصول إلى الإجابة" emoji="👥" onPress={() => actions.onCreate({ mode: 'duel', teamSize: 2, maxPlayers: 4 })} />
            <ModeCard title="3 ضد 3" description="مواجهة جماعية بأسئلة صوتية مفتوحة" emoji="👨‍👩‍👧" onPress={() => actions.onCreate({ mode: 'duel', teamSize: 3, maxPlayers: 6 })} />
          </>
        ) : (
          <>
            <ModeCard title="مافيا كلاسيكية" description="مافيا، طبيب، محقق وأهالي القرية" emoji="🌙" onPress={() => actions.onCreate({ mode: 'mafia', maxPlayers: 7 })} />
            <ModeCard title="جولة سريعة" description="خمسة لاعبين وجولة تصويت سريعة" emoji="⚡" onPress={() => actions.onCreate({ mode: 'mafia', maxPlayers: 5 })} />
          </>
        )}
      </View>
      <Text style={styles.or}>لديك رمز غرفة؟</Text>
      <ModeCard title="الدخول إلى غرفة" description="اكتب الرمز الذي أرسله لك صاحب الغرفة" emoji="🚪" onPress={actions.onJoin} />
    </ScreenShell>
  );
}

const gameMeta: Record<GameId, { title: string; subtitle: string; emoji: string }> = {
  outsider: { title: 'برا السالفة', subtitle: 'اسألوا، راقبوا، واكشفوا المتخفي', emoji: '🕵️' },
  character: { title: 'احزر شخصيتي', subtitle: 'أسئلة مفتوحة وتخمينات بين المتنافسين', emoji: '🎭' },
  mafia: { title: 'المافيا', subtitle: 'ليل من الخداع ونهار من الاتهامات', emoji: '🌙' },
};

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 24 },
  emoji: { fontSize: 55 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 9 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },
  section: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: 12 },
  list: { gap: 11 },
  or: { color: colors.textDim, fontSize: 12, fontWeight: '700', textAlign: 'center', marginVertical: 17 },
});
