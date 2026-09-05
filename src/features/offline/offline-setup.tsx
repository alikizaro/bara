import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ActionButton } from '../../components/action-button';
import { ErrorBanner } from '../../components/error-banner';
import { Stepper } from '../../components/stepper';
import { animeCollections, categories, type CategoryId } from '../../domain/game';
import { colors } from '../../theme/tokens';
import { validateOfflineNames } from './offline-game';
import { offlineStyles as s } from './offline-styles';

export interface OfflineSettings { names: string[]; category: CategoryId; collection: string; questions: number }

export function OfflineSetup({ settings, setSettings, onStart }: { settings: OfflineSettings; setSettings: (settings: OfflineSettings) => void; onStart: (settings: OfflineSettings) => void }) {
  const [error, setError] = useState<string | null>(null);
  const changeNames = (names: string[]) => { setSettings({ ...settings, names }); setError(null); };
  return <View style={s.stack}>
    <Text style={s.title}>جمّع اللمة… ومرّر الهاتف 📱</Text>
    <Text style={s.hint}>من 3 إلى 20 لاعبًا، بجهاز واحد وبدون إنترنت. لاعب واحد برا السالفة والبقية يعرفون نفس الكلمة.</Text>
    <Text style={s.text}>أسماء المشاركين ({settings.names.length}/20)</Text>
    {settings.names.map((name, index) => <View key={index} style={s.row}>
      <TextInput accessibilityLabel={`اسم اللاعب ${index + 1}`} placeholder={`اللاعب ${index + 1}`} placeholderTextColor={colors.textDim} style={s.input} value={name} maxLength={24} autoCorrect={false}
        onChangeText={(value) => changeNames(settings.names.map((old, i) => i === index ? value : old))} />
      <Pressable accessibilityRole="button" accessibilityLabel={`حذف اللاعب ${index + 1}`} disabled={settings.names.length <= 3} style={s.remove} onPress={() => changeNames(settings.names.filter((_, i) => i !== index))}>
        <Text style={[s.removeText, settings.names.length <= 3 && { opacity: 0.25 }]}>×</Text>
      </Pressable>
    </View>)}
    <ActionButton label="＋ إضافة لاعب" variant="ghost" disabled={settings.names.length >= 20} onPress={() => changeNames([...settings.names, ''])} />
    <Text style={s.text}>اختاروا الصنف معًا</Text>
    <View style={s.chips}>{categories.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: settings.category === item.id }} style={[s.chip, settings.category === item.id && s.selected]} onPress={() => setSettings({ ...settings, category: item.id })}>
      <Text style={s.text}>{item.emoji} {item.label}</Text>
    </Pressable>)}</View>
    {settings.category === 'anime' && <View style={s.chips}>{animeCollections.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: settings.collection === item.id }} style={[s.chip, settings.collection === item.id && s.selected]} onPress={() => setSettings({ ...settings, collection: item.id })}>
      <Text style={s.text}>{item.label}</Text>
    </Pressable>)}</View>}
    <Stepper label="أسئلة لكل لاعب" hint="سؤال لكل شخص بالتناوب، ثم نعيد الدور" value={settings.questions} minimum={1} maximum={10} onChange={(questions) => setSettings({ ...settings, questions })} />
    <Text style={s.hint}>كل لاعب يشاهد سرّه وحده ثم يخفيه. اسألوا بصوتكم وجهًا لوجه دون ذكر الكلمة. بعد الأسئلة، مرّروا الهاتف للتصويت السري، ثم يخمّن برا السالفة من 4 خيارات.</Text>
    <ErrorBanner message={error} onDismiss={() => setError(null)} />
    <ActionButton label="وزّع الأدوار السرية" onPress={() => {
      const validation = validateOfflineNames(settings.names);
      if (validation) { setError(validation); return; }
      onStart({ ...settings, names: settings.names.map((name) => name.trim()) });
    }} />
  </View>;
}
