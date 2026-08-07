import {
  AudioSession,
  LiveKitRoom,
  useLocalParticipant,
  useTracks,
} from '@livekit/react-native';
import { Track, type RemoteParticipant } from 'livekit-client';
import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LiveAudioRoomProps } from './live-audio-room';
import { colors, radii } from '../../theme/tokens';

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
      <VoiceControls
        canSpeak={canSpeak && microphoneAllowed}
        onError={onError}
      />
    </LiveKitRoom>
  );
}

function VoiceControls({
  canSpeak,
  onError,
}: {
  canSpeak: boolean;
  onError: (message: string) => void;
}) {
  const { localParticipant } = useLocalParticipant();
  const audioTracks = useTracks([Track.Source.Microphone]);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);

  useEffect(() => {
    void localParticipant
      .setMicrophoneEnabled(canSpeak && microphoneEnabled)
      .catch((error) => {
      onError(error.message);
    });
  }, [canSpeak, localParticipant, microphoneEnabled, onError]);

  useEffect(() => {
    for (const track of audioTracks) {
      if (!track.participant.isLocal) {
        (track.participant as RemoteParticipant).setVolume(speakerEnabled ? 1 : 0);
      }
    }
  }, [audioTracks, speakerEnabled]);

  const micIsOn = canSpeak && microphoneEnabled;
  return (
    <View style={styles.controls}>
      <Pressable
        accessibilityLabel={speakerEnabled ? 'كتم الصوت' : 'فتح الصوت'}
        accessibilityRole="button"
        onPress={() => setSpeakerEnabled((current) => !current)}
        style={[styles.controlButton, speakerEnabled && styles.controlButtonActive]}
      >
        <Text style={styles.controlIcon}>{speakerEnabled ? '🔊' : '🔇'}</Text>
        <Text style={styles.controlLabel}>{speakerEnabled ? 'الصوت مفتوح' : 'الصوت مكتوم'}</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={micIsOn ? 'إغلاق المايك' : 'فتح المايك'}
        accessibilityRole="button"
        disabled={!canSpeak}
        onPress={() => setMicrophoneEnabled((current) => !current)}
        style={[
          styles.controlButton,
          micIsOn && styles.controlButtonActive,
          !canSpeak && styles.controlButtonDisabled,
        ]}
      >
        <Text style={styles.controlIcon}>{micIsOn ? '🎙️' : '🎤'}</Text>
        <Text style={styles.controlLabel}>
          {!canSpeak ? 'ليس دورك' : micIsOn ? 'المايك مفتوح' : 'المايك مغلق'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  controlButton: {
    minWidth: 126,
    minHeight: 54,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  controlButtonActive: {
    borderColor: colors.secondary,
    backgroundColor: '#134A50',
  },
  controlButtonDisabled: { opacity: 0.55 },
  controlIcon: { fontSize: 18 },
  controlLabel: { color: colors.text, fontSize: 11, fontWeight: '800' },
});
