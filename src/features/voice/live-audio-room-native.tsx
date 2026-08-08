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
    <View>
      <View style={styles.connectionRow}>
        <View style={[styles.connectionDot, connected && styles.connectionDotOnline]} />
        <Text style={styles.connectionText}>
          {connected ? 'الصوت متصل' : 'جارٍ توصيل الصوت…'}
        </Text>
      </View>
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
          disabled={!connected || !canSpeak}
          onPress={() => setMicrophoneEnabled((current) => !current)}
          style={[
            styles.controlButton,
            micIsOn && styles.controlButtonActive,
            (!connected || !canSpeak) && styles.controlButtonDisabled,
          ]}
        >
          <Text style={styles.controlIcon}>{micIsOn ? '🎙️' : '🎤'}</Text>
          <Text style={styles.controlLabel}>
            {!connected ? 'جارٍ الاتصال' : !canSpeak ? 'ليس دورك' : micIsOn ? 'المايك مفتوح' : 'المايك مغلق'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  connectionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  connectionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.warning },
  connectionDotOnline: { backgroundColor: colors.success },
  connectionText: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
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
  controlButtonActive: { borderColor: colors.secondary, backgroundColor: '#134A50' },
  controlButtonDisabled: { opacity: 0.55 },
  controlIcon: { fontSize: 18 },
  controlLabel: { color: colors.text, fontSize: 11, fontWeight: '800' },
});
