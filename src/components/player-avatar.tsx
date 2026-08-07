import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/tokens';

export function PlayerAvatar({
  name,
  color,
  size = 48,
  online,
}: {
  name: string;
  color: string;
  size?: number;
  online?: boolean;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      >
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
          {name.trim().charAt(0)}
        </Text>
      </View>
      {online !== undefined ? (
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: online ? colors.success : colors.textDim,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  initial: {
    color: colors.text,
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.backgroundElevated,
  },
});
