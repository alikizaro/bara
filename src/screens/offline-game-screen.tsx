import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Text, View } from 'react-native';
import { BackHeader } from '../components/back-header';
import { ScreenShell } from '../components/screen-shell';
import { ActionButton } from '../components/action-button';
import { offlineWords } from '../features/offline/offline-catalog';
import { createOfflineRound, offlineReducer, offlineResult, type OfflineAction, type OfflineRound } from '../features/offline/offline-game';
import { OfflineSetup, type OfflineSettings } from '../features/offline/offline-setup';
import { OfflineRoundPanel } from '../features/offline/offline-round-panel';
import { offlineStyles as s } from '../features/offline/offline-styles';
import { useAndroidBack } from '../hooks/use-android-back';

export function OfflineGameScreen({ onExit }: { onExit: () => void }) {
  const [settings, setSettings] = useState<OfflineSettings>({ names: ['', '', ''], category: 'animals', collection: 'all-anime', questions: 3 });
  const [round, setRound] = useState<OfflineRound | null>(null);
  const [number, setNumber] = useState(1);
  const [scores, setScores] = useState<number[]>([]);
  const [covered, setCovered] = useState(AppState.currentState !== 'active');
  const dispatch = (action: OfflineAction) => setRound((current) => current ? offlineReducer(current, action) : current);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        setCovered(true);
        setRound((current) => current ? offlineReducer(current, { type: 'hide' }) : current);
      }
    });
    return () => subscription.remove();
  }, []);

  const back = useCallback(() => {
    if (!round) { onExit(); return true; }
    setRound((current) => current ? offlineReducer(current, { type: 'hide' }) : current);
    Alert.alert('إنهاء اللعب المحلي؟', 'ستفقد الجولة والنقاط الحالية وتعود إلى إعداد المشاركين.', [
      { text: 'متابعة اللعب', style: 'cancel' },
      { text: 'إنهاء', style: 'destructive', onPress: () => { setRound(null); setScores([]); setNumber(1); } },
    ]);
    return true;
  }, [onExit, round]);
  useAndroidBack(back);

  function start(next: OfflineSettings, replay = false) {
    try {
      const nextRound = createOfflineRound(next.names, offlineWords(next.category, next.collection), next.questions, round?.secret);
      if (replay && round) {
        const points = offlineResult(round).points;
        setScores(points.map((point, index) => (scores[index] ?? 0) + point));
        setNumber(number + 1);
      } else { setScores([]); setNumber(1); }
      setSettings(next);
      setRound(nextRound);
    } catch (error) { Alert.alert('تعذّر بدء الجولة', error instanceof Error ? error.message : 'حاول مرة أخرى'); }
  }

  return <ScreenShell key={covered ? 'covered' : round ? `${round.phase}-${round.cursor}-${round.revealed}` : 'setup'}>
    <BackHeader title="برا السالفة · أوفلاين" onBack={back} />
    {covered ? <View style={s.card}>
      <Text style={s.title}>اللعبة متوقفة مؤقتًا 🔒</Text>
      <Text style={s.hint}>تأكد أن الهاتف مع اللاعب الصحيح قبل المتابعة.</Text>
      <ActionButton label="متابعة اللعب" onPress={() => setCovered(false)} />
    </View> : round ? <OfflineRoundPanel round={round} dispatch={dispatch} number={number} scores={scores} onReplay={() => start(settings, true)} onSetup={() => { setRound(null); setScores([]); setNumber(1); }} />
      : <OfflineSetup settings={settings} setSettings={setSettings} onStart={start} />}
  </ScreenShell>;
}
