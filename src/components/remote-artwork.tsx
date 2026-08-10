import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getArtworkAttemptUrl } from '../services/artwork-image';
import { colors, radii } from '../theme/tokens';

export function RemoteArtwork({
  imageUrl,
  label,
  size = 120,
  fallback = '🎭',
}: {
  imageUrl: string | null;
  label: string;
  size?: number;
  fallback?: string;
}) {
  const [failure, setFailure] = useState({ imageUrl: '', attempt: 0 });
  const attempt = failure.imageUrl === imageUrl ? failure.attempt : 0;
  const displayUrl = imageUrl ? getArtworkAttemptUrl(imageUrl, attempt) : null;

  return (
    <View
      accessibilityLabel={`صورة ${label}`}
      style={[styles.frame, { width: size, height: size }]}
    >
      {displayUrl ? (
        <Image
          cachePolicy="disk"
          contentFit="cover"
          onError={() => setFailure({ imageUrl: imageUrl ?? '', attempt: attempt + 1 })}
          source={displayUrl}
          style={styles.image}
          transition={120}
        />
      ) : (
        <Text style={[styles.fallback, { fontSize: Math.round(size * 0.4) }]}>
          {fallback}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    textAlign: 'center',
  },
});
