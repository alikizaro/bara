import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

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
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = Boolean(imageUrl && failedUrl === imageUrl);

  return (
    <View
      accessibilityLabel={`صورة ${label}`}
      style={[styles.frame, { width: size, height: size }]}
    >
      {imageUrl && !failed ? (
        <Image
          onError={() => setFailedUrl(imageUrl)}
          resizeMode="cover"
          source={{ uri: imageUrl }}
          style={styles.image}
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
