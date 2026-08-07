import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '../../components/action-button';
import { PlayerAvatar } from '../../components/player-avatar';
import type { GameView, PlayerProfile } from '../../domain/game';
import { colors, radii } from '../../theme/tokens';

export function VotingPanel({
  game,
  profile,
  isWorking,
  onSubmit,
}: {
  game: GameView;
  profile: PlayerProfile;
  isWorking: boolean;
  onSubmit: (playerId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    game.myVoteTargetId,
  );

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>🗳️</Text>
      <Text style={styles.title}>من هو برا السالفة؟</Text>
      <Text style={styles.hint}>
        اختر لاعبًا واحدًا. لا يمكنك التصويت لنفسك.
      </Text>

      <View style={styles.progressPill}>
        <Text style={styles.progressText}>
          صوّت {game.submittedVoteCount} من {game.totalVoterCount}
        </Text>
      </View>

      <View style={styles.players}>
        {game.players
          .filter((player) => player.id !== profile.id)
          .map((player) => {
            const selected = player.id === selectedId;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                key={player.id}
                onPress={() => setSelectedId(player.id)}
                style={({ pressed }) => [
                  styles.playerRow,
                  selected && styles.playerSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.selectionMark}>
                  <Text style={styles.selectionText}>{selected ? '✓' : ''}</Text>
                </View>
                <View style={styles.playerCopy}>
                  <Text style={styles.playerName}>{player.displayName}</Text>
                  <Text style={styles.playerMeta}>
                    {player.roomScore} نقطة في الغرفة
                  </Text>
                </View>
                <PlayerAvatar
                  color={player.avatarColor}
                  name={player.displayName}
                  online={player.isOnline}
                  size={48}
                />
              </Pressable>
            );
          })}
      </View>

      <View style={styles.action}>
        <ActionButton
          disabled={!selectedId}
          label={game.myVoteTargetId ? 'تغيير تصويتي' : 'تأكيد التصويت'}
          loading={isWorking}
          onPress={() => {
            if (selectedId) {
              onSubmit(selectedId);
            }
          }}
        />
      </View>
      {game.myVoteTargetId ? (
        <Text style={styles.waiting}>
          تم إرسال تصويتك، ويمكنك تغييره قبل اكتمال تصويت الجميع.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'stretch',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.backgroundElevated,
    padding: 18,
  },
  emoji: {
    fontSize: 42,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  progressPill: {
    alignSelf: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 12,
  },
  progressText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '800',
  },
  players: {
    gap: 8,
    marginTop: 16,
  },
  playerRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 10,
  },
  playerSelected: {
    borderColor: colors.secondary,
    backgroundColor: '#173E49',
  },
  selectionMark: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  selectionText: {
    color: colors.secondary,
    fontSize: 17,
    fontWeight: '900',
  },
  playerCopy: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 12,
  },
  playerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  playerMeta: {
    color: colors.textDim,
    fontSize: 10,
    marginTop: 4,
  },
  action: {
    marginTop: 16,
  },
  waiting: {
    color: colors.textDim,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 9,
  },
  pressed: {
    opacity: 0.82,
  },
});
