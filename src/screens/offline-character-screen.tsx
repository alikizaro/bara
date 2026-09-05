import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Text, View } from 'react-native';
import { BackHeader } from '../components/back-header';
import { ScreenShell } from '../components/screen-shell';
import { ActionButton } from '../components/action-button';
import { getPlayableCatalogItems } from '../../convex/data/catalog/catalog';
import { characterReducer, characterPoints, createCharacterRound, type CharacterAction, type CharacterRound } from '../features/offline/offline-character';
import { OfflineCharacterPanel } from '../features/offline/offline-character-panel';
import { OfflineSetup, type OfflineSettings } from '../features/offline/offline-setup';
import { offlineStyles as s } from '../features/offline/offline-styles';
import { useAndroidBack } from '../hooks/use-android-back';

export function OfflineCharacterScreen({ onExit }: { onExit: () => void }) {
  const [settings, setSettings] = useState<OfflineSettings>({ names: ['', ''], category: 'animals', collection: 'all-anime', questions: 3 });
  const [round, setRound] = useState<CharacterRound | null>(null);
  const [number, setNumber] = useState(1);
  const [scores, setScores] = useState<number[]>([]);
  const [covered, setCovered] = useState(AppState.currentState !== 'active');
  const artwork = useMemo(() => new Map(getPlayableCatalogItems(settings.category, settings.collection).map((item) => [item.name, item.imageUrl])), [settings.category, settings.collection]);
  const dispatch = (action: CharacterAction) => setRound((current) => current ? characterReducer(current, action) : current);
  const reset = () => { setRound(null); setScores([]); setNumber(1); };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        setCovered(true);
        setRound((current) => current ? characterReducer(current, { type: 'hide' }) : current);
      }
    });
    return () => subscription.remove();
  }, []);

  const back = useCallback(() => {
    if (!round) { onExit(); return true; }
    setRound((current) => current ? characterReducer(current, { type: 'hide' }) : current);
    Alert.alert('إنهاء اللعب المحلي؟', 'ستفقد الجولة والنقاط الحالية وتعود إلى إعداد المشاركين.', [
      { text: 'متابعة اللعب', style: 'cancel' },
      { text: 'إنهاء', style: 'destructive', onPress: () => { setRound(null); setScores([]); setNumber(1); } },
    ]);
    return true;
  }, [onExit, round]);
  useAndroidBack(back);

  function start(next: OfflineSettings, replay = false) {
    try {
      const nextRound = createCharacterRound(next.names, getPlayableCatalogItems(next.category, next.collection).map((item) => item.name));
      if (replay && round) {
        setScores(characterPoints(round).map((point, i) => (scores[i] ?? 0) + point));
        setNumber(number + 1);
      } else { setScores([]); setNumber(1); }
      setSettings(next); setRound(nextRound);
    } catch (error) { Alert.alert('تعذّر بدء الجولة', error instanceof Error ? error.message : 'حاول مرة أخرى'); }
  }
  return <ScreenShell key={covered ? 'covered' : round ? `${round.phase}-${round.cursor}-${round.revealed}` : 'setup'}>
    <BackHeader title="احزر الشخصية · أوفلاين" onBack={back} />
    {covered ? <View style={s.card}>
      <Text style={s.title}>اللعبة متوقفة مؤقتًا 🔒</Text><Text style={s.hint}>تأكد أن الهاتف مع اللاعب الصحيح.</Text>
      <ActionButton label="متابعة اللعب" onPress={() => setCovered(false)} />
    </View> : round ? <OfflineCharacterPanel round={round} artwork={artwork} dispatch={dispatch} number={number} scores={scores} onReplay={() => start(settings, true)} onSetup={reset} />
      : <OfflineSetup character settings={settings} setSettings={setSettings} onStart={start} />}
  </ScreenShell>;
}
