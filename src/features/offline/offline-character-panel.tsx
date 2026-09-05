import { Pressable, Text, View } from 'react-native';
import { ActionButton } from '../../components/action-button';
import { OptionalArtwork } from '../../components/optional-artwork';
import { characterOpponent, characterPoints, type CharacterAction, type CharacterRound } from './offline-character';
import { offlineStyles as s } from './offline-styles';

export function OfflineCharacterPanel({ round, artwork, dispatch, number, scores, onReplay, onSetup }: {
  artwork: ReadonlyMap<string, string | null>;
  round: CharacterRound; dispatch: (action: CharacterAction) => void; number: number; scores: number[]; onReplay: () => void; onSetup: () => void;
}) {
  const player = round.names[round.cursor];
  const opponent = round.names[characterOpponent(round, round.cursor)];
  const privatePhase = ['roles', 'ready', 'voting'].includes(round.phase);
  return <View style={s.stack}>
    <Text style={s.badge}>احزر الشخصية · جهاز واحد · الجولة {number}</Text>
    {privatePhase && !round.revealed && <View style={s.card}>
      <Text style={s.emoji}>📱</Text><Text style={s.title}>مرّر الهاتف إلى {player}</Text>
      <Text style={s.hint}>{round.cursor + 1} / {round.names.length} · {round.phase === 'roles' ? 'معرفة شخصيتك السرية' : round.phase === 'ready' ? 'الموافقة على التصويت' : 'تخمين شخصية خصمك'}</Text>
      <Text style={s.hint}>تأكد أن الشاشة لا يراها غيرك.</Text>
      <ActionButton label={`أنا ${player} — افتح`} onPress={() => dispatch({ type: 'reveal' })} />
    </View>}
    {round.phase === 'roles' && round.revealed && <View style={s.card}>
      <Text style={s.title}>يا {player}، شخصيتك هي:</Text>
      <OptionalArtwork imageUrl={artwork.get(round.secrets[round.cursor]!) ?? null} label={round.secrets[round.cursor]!} />
      <Text style={s.secret}>{round.secrets[round.cursor]}</Text>
      <Text style={s.hint}>احفظها وأجب عن الأسئلة على أساسها. عليك أنت أن تخمّن شخصية {opponent} بالأسئلة، دون أن تراها.</Text>
      <ActionButton label="حفظتها — إخفاء وتسليم الهاتف" onPress={() => dispatch({ type: 'next' })} />
    </View>}
    {round.phase === 'questions' && <View style={s.card}>
      <Text style={s.emoji}>💬</Text><Text style={s.title}>اسألوا وخمّنوا!</Text>
      <Text style={s.hint}>الأسئلة مفتوحة وجهًا لوجه. اسألوا بالتناوب حتى تكونوا مستعدين؛ لا تكشفوا أسماء شخصياتكم.</Text>
      {round.names.map((name, i) => <Text key={i} style={s.text}>{name} يسأل {round.names[characterOpponent(round, i)]}</Text>)}
      <ActionButton label="فلنصوّت" onPress={() => dispatch({ type: 'ready' })} />
    </View>}
    {round.phase === 'ready' && round.revealed && <View style={s.card}>
      <Text style={s.title}>{player}، هل أنت مستعد؟</Text>
      <Text style={s.hint}>لن تظهر الخيارات حتى يوافق الجميع. إذا احتجت مزيدًا من الأسئلة، نعود للنقاش وتبدأ الموافقات من جديد.</Text>
      <ActionButton label="موافق — فلنصوّت" onPress={() => dispatch({ type: 'ready' })} />
      <ActionButton label="نكمل الأسئلة" variant="ghost" onPress={() => dispatch({ type: 'discuss' })} />
    </View>}
    {round.phase === 'voting' && round.revealed && <View style={s.card}>
      <Text style={s.title}>{player}، ما شخصية {opponent}؟</Text>
      <Text style={s.hint}>محاولة واحدة سرية. النتائج تظهر بعد تخمين الجميع.</Text>
      {round.choices[round.cursor]!.map((word) => <Pressable key={word} accessibilityRole="button" accessibilityLabel={word} style={[s.card, s.row]} onPress={() => dispatch({ type: 'guess', word })}>
        <OptionalArtwork imageUrl={artwork.get(word) ?? null} label={word} size={64} />
        <Text style={[s.text, { flex: 1 }]}>{word}</Text>
      </Pressable>)}
      <ActionButton label="لا أعرف" variant="ghost" onPress={() => dispatch({ type: 'guess', word: null })} />
    </View>}
    {round.phase === 'results' && <>
      <Text style={s.title}>نتائج اللمة 🎉</Text>
      {round.names.map((name, i) => <View key={i} style={s.card}>
        <Text style={s.title}>{name} {characterPoints(round)[i] ? '✅' : '❌'}</Text>
        <OptionalArtwork imageUrl={artwork.get(round.secrets[characterOpponent(round, i)]!) ?? null} label={round.secrets[characterOpponent(round, i)]!} />
        <Text style={s.hint}>شخصية {round.names[characterOpponent(round, i)]}: {round.secrets[characterOpponent(round, i)]}</Text>
        <Text style={s.hint}>تخمينك: {round.guesses[i] ?? 'لا أعرف'}</Text>
        <Text style={s.text}>+{characterPoints(round)[i]} نقطة · المجموع {(scores[i] ?? 0) + characterPoints(round)[i]!}</Text>
      </View>)}
      <ActionButton label="جولة جديدة بنفس المشاركين" onPress={onReplay} />
      <ActionButton label="تعديل الأسماء أو الصنف" variant="ghost" onPress={onSetup} />
    </>}
  </View>;
}
