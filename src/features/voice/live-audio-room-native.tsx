import {
  AndroidAudioTypePresets,
  AudioSession,
  LiveKitRoom,
  useConnectionState,
  useLocalParticipant,
  useTracks,
} from '@livekit/react-native';
import { ConnectionState, Track, type RemoteParticipant } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LiveAudioRoomProps } from './live-audio-room';
import { colors, radii } from '../../theme/tokens';

export default function NativeLiveAudioRoom({
  access,
  canSpeak,
  onError,
}: LiveAudioRoomProps) {
  const [microphoneAllowed, setMicrophoneAllowed] = useState<boolean | null>(
    Platform.OS === 'android' ? null : true,
  );
  const errorHandler = useRef(onError);

  useEffect(() => {
    errorHandler.current = onError;
  }, [onError]);

  useEffect(() => {
    void (async () => {
      try {
        await AudioSession.configureAudio({
          android: {
            preferredOutputList: ['bluetooth', 'headset', 'speaker', 'earpiece'],
            audioTypeOptions: AndroidAudioTypePresets.communication,
          },
          ios: { defaultOutput: 'speaker' },
        });
        await AudioSession.startAudioSession();
      } catch (error) {
        errorHandler.current(
          error instanceof Error ? error.message : 'تعذر تشغيل جلسة الصوت',
        );
      }
    })();
    return () => {
      void AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;
    void PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
      title: 'السماح بالمايكروفون',
      message: 'تحتاج لَمّة إلى المايكروفون لتتحدث مع اللاعبين داخل الغرفة.',
      buttonPositive: 'سماح',
      buttonNegative: 'ليس الآن',
    }).then((result) => {
      if (!active) return;
      const granted = result === PermissionsAndroid.RESULTS.GRANTED;
      setMicrophoneAllowed(granted);
      if (!granted) {
        errorHandler.current('فعّل إذن المايكروفون من إعدادات الهاتف للمشاركة بالصوت');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!access || microphoneAllowed === null) return null;

  return (
    <LiveKitRoom
      serverUrl={access.serverUrl}
      token={access.token}
      connect
      audio={microphoneAllowed && canSpeak}
      video={false}
      onConnected={() => errorHandler.current('')}
      onError={(error) => errorHandler.current(error.message)}
    >
      <VoiceControls canSpeak={canSpeak && microphoneAllowed} onError={onError} />
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
  const connectionState = useConnectionState();
  const audioTracks = useTracks([Track.Source.Microphone]);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    void localParticipant
      .setMicrophoneEnabled(canSpeak && microphoneEnabled)
      .catch((error) => onError(error.message));
  }, [canSpeak, connectionState, localParticipant, microphoneEnabled, onError]);

  useEffect(() => {
    void AudioSession.setDefaultRemoteAudioTrackVolume(speakerEnabled ? 1 : 0);
    for (const track of audioTracks) {
      if (!track.participant.isLocal) {
        (track.participant as RemoteParticipant).setVolume(speakerEnabled ? 1 : 0);
      }
    }
  }, [audioTracks, speakerEnabled]);

  const connected = connectionState === ConnectionState.Connected;
  const micIsOn = connected && canSpeak && microphoneEnabled;
  return (
    <View style={styles.dock}>
      <View style={[styles.connectionDot, connected && styles.connectionDotOnline]} />
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel={speakerEnabled ? 'كتم الصوت' : 'فتح الصوت'}
          accessibilityRole="button"
          onPress={() => setSpeakerEnabled((current) => !current)}
          style={[
            styles.controlButton,
            speakerEnabled ? styles.controlButtonOn : styles.controlButtonOff,
          ]}
        >
          <Text style={styles.controlIcon}>{speakerEnabled ? '🔊' : '🔇'}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={micIsOn ? 'إغلاق المايك' : 'فتح المايك'}
          accessibilityRole="button"
          disabled={!connected || !canSpeak}
          onPress={() => setMicrophoneEnabled((current) => !current)}
          style={[
            styles.controlButton,
            micIsOn ? styles.controlButtonOn : styles.controlButtonOff,
            (!connected || !canSpeak) && styles.controlButtonDisabled,
          ]}
        >
          <Text style={styles.controlIcon}>{micIsOn ? '🎙️' : '🎤'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,13,43,0.95)',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  connectionDot: { position: 'absolute', top: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
  connectionDotOnline: { backgroundColor: colors.success },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 9,
  },
  controlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.82)',
  },
  controlButtonOn: { backgroundColor: '#20A84B' },
  controlButtonOff: { backgroundColor: '#D9342B' },
  controlButtonDisabled: { opacity: 0.55 },
  controlIcon: { fontSize: 22 },
});
