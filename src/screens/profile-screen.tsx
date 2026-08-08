import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '../components/action-button';
import { BackHeader } from '../components/back-header';
import { ErrorBanner } from '../components/error-banner';
import { PlayerAvatar } from '../components/player-avatar';
import { ScreenShell } from '../components/screen-shell';
import { useGame } from '../state/game-context';
import { colors, radii } from '../theme/tokens';

export function ProfileScreen({ onBack }: { onBack: () => void }) {
  const { profile, updateProfile, isWorking, error, clearError } = useGame();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [image, setImage] = useState<{ uri: string; mimeType: string } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  if (!profile) return null;

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset) setImage({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
    }
  };

  const save = async () => {
    if (name.trim().length < 2) {
      setLocalError('اكتب اسمًا من حرفين على الأقل');
      return;
    }
    setLocalError(null);
    await updateProfile(name, image ?? undefined);
    onBack();
  };

  return (
    <ScreenShell>
      <BackHeader title="الملف الشخصي" onBack={onBack} />
      <View style={styles.avatarArea}>
        <Pressable accessibilityRole="button" onPress={() => void chooseImage()} style={styles.avatarButton}>
          <PlayerAvatar
            color={profile.avatarColor}
            imageUrl={image?.uri ?? profile.avatarUrl}
            name={name || profile.displayName}
            size={112}
          />
          <View style={styles.cameraBadge}><Text style={styles.cameraIcon}>✦</Text></View>
        </Pressable>
        <Text style={styles.changePhoto}>اضغط لتغيير الصورة</Text>
      </View>

      <Text style={styles.label}>اسمك داخل اللّمة</Text>
      <TextInput
        accessibilityLabel="الاسم"
        maxLength={28}
        onChangeText={setName}
        placeholder="اكتب اسمك"
        placeholderTextColor={colors.textDim}
        style={styles.input}
        textAlign="right"
        value={name}
      />
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{profile.totalPoints}</Text>
        <Text style={styles.statLabel}>إجمالي النقاط</Text>
      </View>
      <ActionButton label="حفظ التغييرات" loading={isWorking} onPress={() => void save()} />
      <ErrorBanner message={localError ?? error} onDismiss={() => { setLocalError(null); clearError(); }} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  avatarArea: { alignItems: 'center', paddingVertical: 28 },
  avatarButton: { width: 118, height: 118 },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 3, borderColor: colors.background, backgroundColor: colors.warning },
  cameraIcon: { color: '#24170A', fontSize: 18, fontWeight: '900' },
  changePhoto: { color: colors.secondary, fontSize: 12, fontWeight: '800', marginTop: 12 },
  label: { color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'right', marginBottom: 9 },
  input: { minHeight: 58, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, fontSize: 17, fontWeight: '800', paddingHorizontal: 16 },
  statCard: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderRadius: radii.md, backgroundColor: colors.backgroundElevated, padding: 17, marginVertical: 16 },
  statValue: { color: colors.warning, fontSize: 22, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
});
