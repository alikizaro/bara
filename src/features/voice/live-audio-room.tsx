import { lazy, Suspense } from 'react';

import type { VoiceAccess } from '../../domain/game';

const NativeLiveAudioRoom = lazy(() => import('./live-audio-room-native'));

export interface LiveAudioRoomProps {
  access: VoiceAccess | null;
  canSpeak: boolean;
  onError: (message: string) => void;
  onDisconnected: () => void;
}

export function LiveAudioRoom(props: LiveAudioRoomProps) {
  if (!props.access) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <NativeLiveAudioRoom {...props} />
    </Suspense>
  );
}
