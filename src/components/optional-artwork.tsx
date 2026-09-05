import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import { getArtworkAttemptUrl } from '../services/artwork-image';

// The surrounding card owns the always-visible name. Failed/absent images
// take no space and never block local play, even when a request is pending.
export function OptionalArtwork({ imageUrl, label, size = 150 }: { imageUrl: string | null; label: string; size?: number }) {
  return imageUrl ? <ArtworkRequest key={imageUrl} imageUrl={imageUrl} label={label} size={size} /> : null;
}

function ArtworkRequest({ imageUrl, label, size }: { imageUrl: string; label: string; size: number }) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const url = getArtworkAttemptUrl(imageUrl, attempt);
  if (!url) return null;
  return <View style={{ alignSelf: 'center', width: loaded ? size : 0, height: loaded ? size : 0, overflow: 'hidden', borderRadius: 18 }}>
    <Image key={url} source={url} accessibilityLabel={`صورة ${label}`} accessible={loaded}
      cachePolicy="none" contentFit="contain" style={{ width: size, height: size }}
      onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setAttempt((value) => value + 1); }} />
  </View>;
}
