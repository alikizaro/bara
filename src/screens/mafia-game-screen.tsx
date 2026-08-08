import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { ErrorBanner } from '../components/error-banner';
import { PlayerAvatar } from '../components/player-avatar';
import { ScreenShell } from '../components/screen-shell';
import type { MafiaRole } from '../domain/game';
import { LiveAudioRoom } from '../features/voice/live-audio-room';
import { useGame } from '../state/game-context';
import { colors, radii } from '../theme/tokens';

const roleCopy: Record<MafiaRole, { title: string; emoji: string; description: string; color: string }> = {
  mafia: { title: 'أنت من المافيا', emoji: '🔪', description: 'اخفِ هويتك ووجّه الشك إلى الأبرياء.', color: colors.danger },
  detective: { title: 'أنت المحقق', emoji: '🔎', description: 'راقب كلام اللاعبين وقد التحقيق بهدوء.', color: colors.secondary },
  doctor: { title: 'أنت الطبيب', emoji: '🩺', description: 'احمِ أهل القرية وساعدهم على كشف المافيا.', color: colors.success },
  citizen: { title: 'أنت من أهل القرية', emoji: '🏘️', description: 'ناقش وصوّت لمن تعتقد أنه من المافيا.', color: colors.warning },
};

export function MafiaGameScreen({ onLeave }: { onLeave: () => void }) {
  const { profile, mafia, voiceAccess, submitMafiaNightAction, beginMafiaVoting, submitMafiaVote, startNextRound, leaveRoom, isWorking, error, clearError } = useGame();
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const handleVoiceError = useCallback((message: string) => setVoiceError(message || null), []);
  if (!profile || !mafia) return <ScreenShell><View style={styles.loading}><Text style={styles.muted}>جارٍ توزيع الأدوار…</Text></View></ScreenShell>;
  const me = mafia.players.find((player) => player.id === profile.id);
  const role = roleCopy[mafia.role];
  const exit = () => Alert.alert('مغادرة المافيا؟', 'ستعود إلى الصفحة الرئيسية.', [
    { text: 'إلغاء', style: 'cancel' },
    { text: 'مغادرة', style: 'destructive', onPress: () => void leaveRoom().then(onLeave) },
  ]);

  return (
    <ScreenShell floating={<LiveAudioRoom access={voiceAccess} canSpeak={mafia.phase === 'mafia_discussion'} onError={handleVoiceError} />}>
      <View style={styles.topBar}>
        <Pressable onPress={exit} style={styles.exit}><Text style={styles.exitText}>خروج</Text></Pressable>
        <View style={styles.heading}><Text style={styles.title}>المافيا · الجولة {mafia.roundNumber}</Text><Text style={styles.muted}>{phaseName(mafia.phase)}</Text></View>
        <Text style={styles.moon}>☾</Text>
      </View>

      <View style={[styles.roleCard, { borderColor: role.color }]}>
        <Text style={styles.roleEmoji}>{role.emoji}</Text>
        <Text style={styles.roleTitle}>{role.title}</Text>
        <Text style={styles.roleDescription}>{role.description}</Text>
        {mafia.role === 'mafia' && mafia.teammates.length ? <Text style={styles.teammates}>شريكك: {mafia.teammates.map((player) => player.displayName).join('، ')}</Text> : null}
      </View>

      {mafia.phase === 'mafia_night' ? (
        <View style={styles.stage}>
          <Text style={styles.stageEmoji}>🌙</Text><Text style={styles.stageTitle}>حلّ الليل</Text>
          {mafia.role === 'citizen' ? (
            <Text style={styles.stageText}>نم بهدوء… أصحاب الأدوار السرية يختارون الآن.</Text>
          ) : mafia.myNightActionSubmitted ? (
            <Text style={styles.wait}>تم تسجيل اختيارك سرًا، بانتظار بقية أصحاب الأدوار…</Text>
          ) : (
            <>
              <Text style={styles.stageText}>{nightPrompt(mafia.role)}</Text>
              <View style={styles.players}>
                {mafia.players.filter((player) => isNightTargetAllowed(mafia.role, player.id, profile.id, mafia.teammates.map((item) => item.id))).map((player) => (
                  <Pressable key={player.id} disabled={isWorking} onPress={() => void submitMafiaNightAction(player.id)} style={styles.player}>
                    <Text style={styles.playerName}>{player.displayName}</Text>
                    <PlayerAvatar color={player.avatarColor} imageUrl={player.avatarUrl} name={player.displayName} size={45} />
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      ) : null}

      {mafia.phase === 'mafia_discussion' ? (
        <View style={styles.stage}>
          <Text style={styles.stageEmoji}>🗣️</Text><Text style={styles.stageTitle}>وقت النقاش</Text>
          {mafia.eliminatedPlayerIds.length ? <Text style={styles.eliminated}>خرج ليلًا: {mafia.players.filter((player) => mafia.eliminatedPlayerIds.includes(player.id)).map((player) => player.displayName).join('، ')}</Text> : <Text style={styles.saved}>الطبيب أنقذ الضحية هذه الليلة!</Text>}
          {mafia.detectiveFinding ? <Text style={[styles.finding, { color: mafia.detectiveFinding.isMafia ? colors.danger : colors.success }]}>نتيجة التحقيق: {mafia.players.find((player) => player.id === mafia.detectiveFinding?.targetPlayerId)?.displayName} {mafia.detectiveFinding.isMafia ? 'من المافيا' : 'ليس من المافيا'}</Text> : null}
          <Text style={styles.stageText}>المايك مفتوح للجميع. اسأل، دافع عن نفسك، وراقب التناقضات.</Text>
          {me?.isHost ? <ActionButton label="ابدأ التصويت" loading={isWorking} onPress={() => void beginMafiaVoting()} /> : <Text style={styles.wait}>المضيف سيبدأ التصويت عندما ينتهي النقاش</Text>}
        </View>
      ) : null}

      {mafia.phase === 'mafia_voting' ? (
        <View style={styles.stage}>
          <Text style={styles.stageTitle}>من تظن أنه من المافيا؟</Text>
          <Text style={styles.counter}>{mafia.submittedVoteCount}/{mafia.totalVoterCount} صوّتوا</Text>
          {mafia.eliminatedPlayerIds.includes(profile.id) ? <Text style={styles.wait}>أنت خارج هذه الجولة؛ شاهد التصويت حتى ينتهي.</Text> : <View style={styles.players}>
            {mafia.players.filter((player) => player.id !== profile.id && !mafia.eliminatedPlayerIds.includes(player.id)).map((player) => (
              <Pressable key={player.id} disabled={Boolean(mafia.myVoteTargetId) || isWorking} onPress={() => void submitMafiaVote(player.id)} style={[styles.player, mafia.myVoteTargetId === player.id && styles.selected]}>
                <Text style={styles.playerName}>{player.displayName}</Text>
                <PlayerAvatar color={player.avatarColor} imageUrl={player.avatarUrl} name={player.displayName} size={45} />
              </Pressable>
            ))}
          </View>}
          {mafia.myVoteTargetId ? <Text style={styles.wait}>تم تسجيل صوتك، بانتظار البقية…</Text> : null}
        </View>
      ) : null}

      {mafia.phase === 'mafia_results' ? (
        <View style={styles.stage}>
          <Text style={styles.resultEmoji}>{mafia.winner === 'village' ? '🏘️' : '🌑'}</Text>
          <Text style={styles.stageTitle}>{mafia.winner === 'village' ? 'فاز أهل القرية' : 'فازت المافيا'}</Text>
          <View style={styles.rolesList}>{mafia.revealedRoles.map((assignment) => {
            const player = mafia.players.find((item) => item.id === assignment.playerId);
            return <Text key={assignment.playerId} style={styles.roleLine}>{player?.displayName}: {roleCopy[assignment.role].title.replace('أنت ', '')}</Text>;
          })}</View>
          {me?.isHost ? <ActionButton label="جولة مافيا جديدة" loading={isWorking} onPress={() => void startNextRound()} /> : <Text style={styles.wait}>بانتظار المضيف للجولة التالية</Text>}
        </View>
      ) : null}
      <ErrorBanner message={voiceError ?? error} onDismiss={() => { setVoiceError(null); clearError(); }} />
    </ScreenShell>
  );
}

function phaseName(phase: string) { return phase === 'mafia_night' ? 'الليل' : phase === 'mafia_discussion' ? 'النقاش' : phase === 'mafia_voting' ? 'التصويت' : 'كشف الأدوار'; }

function nightPrompt(role: MafiaRole) {
  if (role === 'mafia') return 'اختر ضحية الليل. يبقى اختيارك سريًا.';
  if (role === 'doctor') return 'اختر لاعبًا لتحميه من هجوم المافيا. يمكنك حماية نفسك.';
  return 'اختر لاعبًا للتحقيق في هويته.';
}

function isNightTargetAllowed(role: MafiaRole, targetId: string, myId: string, teammateIds: string[]) {
  if (role === 'mafia') return targetId !== myId && !teammateIds.includes(targetId);
  if (role === 'detective') return targetId !== myId;
  return true;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, muted: { color: colors.textMuted, fontSize: 11 },
  topBar: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exit: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: radii.pill, backgroundColor: colors.surface }, exitText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  heading: { alignItems: 'center' }, title: { color: colors.text, fontSize: 18, fontWeight: '900' }, moon: { color: colors.warning, fontSize: 31 },
  roleCard: { alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, backgroundColor: colors.backgroundElevated, padding: 20 },
  roleEmoji: { fontSize: 47 }, roleTitle: { color: colors.text, fontSize: 23, fontWeight: '900', marginTop: 8 }, roleDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7 }, teammates: { color: colors.danger, fontWeight: '900', marginTop: 12 },
  stage: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 17, marginTop: 14, gap: 12 },
  stageEmoji: { fontSize: 37, textAlign: 'center' }, stageTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' }, stageText: { color: colors.textMuted, fontSize: 13, lineHeight: 21, textAlign: 'center' }, wait: { color: colors.textDim, fontSize: 12, textAlign: 'center' }, counter: { color: colors.warning, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  eliminated: { color: colors.danger, fontSize: 13, fontWeight: '900', textAlign: 'center' }, saved: { color: colors.success, fontSize: 13, fontWeight: '900', textAlign: 'center' }, finding: { fontSize: 13, fontWeight: '900', textAlign: 'center' },
  players: { gap: 8 }, player: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 10, backgroundColor: colors.backgroundElevated }, selected: { borderColor: colors.warning }, playerName: { color: colors.text, fontWeight: '800' },
  resultEmoji: { fontSize: 48, textAlign: 'center' }, rolesList: { gap: 5 }, roleLine: { color: colors.textMuted, fontSize: 13, textAlign: 'right' },
});
