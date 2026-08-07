import {
  AudioSession,
  LiveKitRoom,
  useLocalParticipant,
} from '@livekit/react-native';
import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

import type { LiveAudioRoomProps } from './live-audio-room';

export default function NativeLiveAudioRoom({
  access,
  canSpeak,
  onError,
}: LiveAudioRoomProps) {
  const [microphoneAllowed, setMicrophoneAllowed] = useState(
    Platform.OS !== 'android',
  );

  useEffect(() => {
    void AudioSession.startAudioSession().catch((error: unknown) => {
      onError(error instanceof Error ? error.message : 'تعذر تشغيل جلسة الصوت');
    });
    return () => {
      void AudioSession.stopAudioSession();
    };
  }, [onError]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    let active = true;
    void PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'السماح بالمايكروفون',
        message: 'تحتاج اللعبة إلى المايكروفون لطرح الأسئلة والإجابة بالصوت.',
        buttonPositive: 'سماح',
        buttonNegative: 'ليس الآن',
      },
    ).then((result) => {
      if (!active) {
        return;
      }
      const granted = result === PermissionsAndroid.RESULTS.GRANTED;
      setMicrophoneAllowed(granted);
      if (!granted) {
        onError('فعّل إذن المايكروفون من إعدادات الهاتف للمشاركة بالصوت');
      }
    });
    return () => {
      active = false;
    };
  }, [onError]);

  if (!access) {
    return null;
  }

  return (
    <LiveKitRoom
      serverUrl={access.serverUrl}
      token={access.token}
      connect
      audio={false}
      video={false}
      onError={(error) => onError(error.message)}
    >
      <MicrophoneGate
        canSpeak={canSpeak && microphoneAllowed}
        onError={onError}
      />
    </LiveKitRoom>
  );
}

function MicrophoneGate({
  canSpeak,
  onError,
}: {
  canSpeak: boolean;
  onError: (message: string) => void;
}) {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    void localParticipant.setMicrophoneEnabled(canSpeak).catch((error) => {
      onError(error.message);
    });
  }, [canSpeak, localParticipant, onError]);

  return null;
}
