import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { GameCard } from '../components/game-card';
import { PlayerAvatar } from '../components/player-avatar';
import { ScreenShell } from '../components/screen-shell';
import { gameCatalog, type GameId } from '../domain/game-catalog';
import { useGame } from '../state/game-context';
import { colors } from '../theme/tokens';

export function HomeScreen({
  onGame,
  onJoin,
}: {
  onGame: (game: GameId) => void;
  onJoin: () => void;
}) {
  const { profile, mode } = useGame();
  if (!profile) return null;

  return (
    <ScreenShell>
      <View style={styles.header}>
        <View style={styles.profileCopy}>
          <Text style={styles.brand}>لَمّة</Text>
          <Text style={styles.greeting}>أهلًا {profile.displayName} 👋</Text>
        </View>
        <PlayerAvatar color={profile.avatarColor} name={profile.displayName} online size={54} />
      </View>

      <View style={styles.hero}>
        <View style={styles.tokenRow}>
          <View style={[styles.token, styles.tokenOne]}><Text style={styles.tokenEmoji}>🎭</Text></View>
          <View style={[styles.token, styles.tokenTwo]}><Text style={styles.tokenEmoji}>🕵️</Text></View>
          <View style={[styles.token, styles.tokenThree]}><Text style={styles.tokenEmoji}>🌙</Text></View>
        </View>
        <Text style={styles.heroTitle}>كل اللّمة في مكان واحد</Text>
        <Text style={styles.heroText}>اختاروا اللعبة، افتحوا المايك، وابدؤوا السهرة.</Text>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.points}>{profile.totalPoints} نقطة</Text>
        <Text style={styles.sectionTitle}>اختاروا لعبتكم</Text>
      </View>
      <View style={styles.games}>
        {gameCatalog.map((game) => (
          <GameCard key={game.id} game={game} onPress={() => onGame(game.id)} />
        ))}
      </View>

      <ActionButton
        label="الدخول برمز غرفة"
        icon={<Text style={styles.joinIcon}>⌁</Text>}
        onPress={onJoin}
        variant="ghost"
      />

      <View style={styles.serverRow}>
        <View style={[styles.serverDot, { backgroundColor: mode === 'online' ? colors.success : colors.warning }]} />
        <Text style={styles.serverText}>{mode === 'online' ? 'الخادم السحابي متصل' : 'وضع المعاينة المحلية'}</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
  profileCopy: { flex: 1, alignItems: 'flex-end', marginRight: 13 },
  brand: { color: colors.warning, fontSize: 27, fontWeight: '900', letterSpacing: 0.5 },
  greeting: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  hero: { alignItems: 'center', paddingVertical: 26 },
  tokenRow: { flexDirection: 'row', alignItems: 'center', height: 76 },
  token: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 25, borderWidth: 3, borderColor: colors.background },
  tokenOne: { backgroundColor: '#164B52', transform: [{ rotate: '-8deg' }] },
  tokenTwo: { zIndex: 2, backgroundColor: '#5B3EC4', marginHorizontal: -12, transform: [{ translateY: -7 }] },
  tokenThree: { backgroundColor: '#5C243E', transform: [{ rotate: '8deg' }] },
  tokenEmoji: { fontSize: 31 },
  heroTitle: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 12 },
  heroText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  points: { color: colors.warning, fontSize: 12, fontWeight: '800' },
  games: { gap: 12, marginBottom: 16 },
  joinIcon: { color: colors.text, fontSize: 24 },
  serverRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18 },
  serverDot: { width: 8, height: 8, borderRadius: 4 },
  serverText: { color: colors.textDim, fontSize: 11 },
});
