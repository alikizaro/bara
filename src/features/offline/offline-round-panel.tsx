import { Text, View } from 'react-native';
import { ActionButton } from '../../components/action-button';
import { offlineResult, type OfflineAction, type OfflineRound } from './offline-game';
import { offlineStyles as s } from './offline-styles';

export function OfflineRoundPanel({ round, dispatch, number, scores, onReplay, onSetup }: {
  round: OfflineRound; dispatch: (action: OfflineAction) => void; number: number; scores: number[];
  onReplay: () => void; onSetup: () => void;
}) {
  const result = offlineResult(round);
  const privatePhase = ['roles', 'voting', 'guess'].includes(round.phase);
  const asker = round.cursor % round.names.length;
  const cycle = Math.floor(round.cursor / round.names.length);
  const answerer = (asker + 1 + cycle % (round.names.length - 1)) % round.names.length;
  return <View style={s.stack}>
    <Text style={s.badge}>جهاز واحد · الجولة {number} · بدون إنترنت</Text>
    {privatePhase && !round.revealed ? <View style={s.card}>
      <Text style={s.emoji}>📱</Text>
      <Text style={s.title}>مرّر الهاتف إلى {round.names[round.cursor]}</Text>
      <Text style={s.hint}>{round.phase === 'roles' ? `كشف الأدوار ${round.cursor + 1} / ${round.names.length}` : round.phase === 'voting' ? `التصويت السري ${round.cursor + 1} / ${round.names.length}` : 'فرصة برا السالفة لتخمين الكلمة'}</Text>
      <Text style={s.hint}>تأكد أن الشاشة لا يراها غيرك، ثم اضغط الزر.</Text>
      <ActionButton label={`أنا ${round.names[round.cursor]} — افتح`} onPress={() => dispatch({ type: 'reveal' })} />
    </View> : null}
    {round.phase === 'roles' && round.revealed && <View style={s.card}>
      <Text style={s.title}>{round.names[round.cursor]}</Text>
      <Text style={s.secret}>{round.cursor === round.outsider ? 'أنت برا السالفة! 🕵️' : round.secret}</Text>
      <Text style={s.hint}>{round.cursor === round.outsider ? 'لا تعرف الكلمة. اسمع الأسئلة وحاول تندمج بدون ما تنكشف.' : 'هذه السالفة! تذكّر الكلمة ولا تقلها مباشرة أثناء الأسئلة.'}</Text>
      <ActionButton label={round.cursor === round.names.length - 1 ? 'إخفاء السر وبدء الأسئلة' : 'إخفاء السر وتسليم الهاتف'} onPress={() => dispatch({ type: 'next' })} />
    </View>}
    {round.phase === 'questions' && <View style={s.card}>
      <Text style={s.emoji}>💬</Text>
      <Text style={s.hint}>لفة الأسئلة {cycle + 1} من {round.questionsPerPlayer}</Text>
      <Text style={s.title}>{round.names[asker]} يسأل {round.names[answerer]}</Text>
      <Text style={s.hint}>اسأل سؤالًا واحدًا عن السالفة وانتظر الجواب، ثم مرّر الدور. لا تذكروا الكلمة نفسها!</Text>
      <Text style={s.hint}>السؤال {round.cursor + 1} من {round.names.length * round.questionsPerPlayer}</Text>
      <ActionButton label={round.cursor + 1 === round.names.length * round.questionsPerPlayer ? 'انتهت الأسئلة — فلنصوّت' : 'انتهى السؤال — الدور التالي'} onPress={() => dispatch({ type: 'next' })} />
    </View>}
    {round.phase === 'voting' && round.revealed && <View style={s.card}>
      <Text style={s.title}>{round.names[round.cursor]}، من برا السالفة؟</Text>
      <Text style={s.hint}>اختر لاعبًا آخر. اختيارك نهائي وسري حتى نهاية الجولة.</Text>
      {round.names.map((name, index) => index !== round.cursor && <ActionButton key={index} label={name} variant="ghost" onPress={() => dispatch({ type: 'vote', target: index })} />)}
    </View>}
    {round.phase === 'guess' && round.revealed && <View style={s.card}>
      <Text style={s.title}>ما هي السالفة؟</Text>
      <Text style={s.hint}>يا {round.names[round.outsider]}، لديك محاولة واحدة. اختر الكلمة التي استنتجتها من الأسئلة.</Text>
      {round.choices.map((word) => <ActionButton key={word} label={word} variant="ghost" onPress={() => dispatch({ type: 'guess', word })} />)}
      <ActionButton label="لا أعرف — إظهار النتيجة" variant="ghost" onPress={() => dispatch({ type: 'guess', word: null })} />
    </View>}
    {round.phase === 'results' && <>
      <View style={s.card}>
        <Text style={s.emoji}>🎉</Text>
        <Text style={s.title}>برا السالفة: {round.names[round.outsider]}</Text>
        <Text style={s.secret}>{round.secret}</Text>
        <Text style={s.hint}>{result.tied ? 'تعادلت الأصوات! لم تتفقوا على متهم واحد.' : result.caught ? 'كشفتم برا السالفة بالتصويت!' : 'برا السالفة أفلت من التصويت!'}</Text>
        <Text style={s.hint}>{result.guessed ? 'وخَمّن السالفة بشكل صحيح! +1 نقطة' : `لم يخمّن السالفة. اختياره: ${round.guess ?? 'لا أعرف'}`}</Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>نقاط اللمة</Text>
        <Text style={s.hint}>نقطة لكل تصويت صحيح، ونقطة لبرا السالفة إذا خمّن الكلمة. النقاط محفوظة خلال هذه الجلسة.</Text>
        {round.names.map((name, index) => <Text key={index} style={s.text}>{name} · {result.counts[index]} أصوات · +{result.points[index]} · المجموع {(scores[index] ?? 0) + result.points[index]!}</Text>)}
      </View>
      <ActionButton label="جولة جديدة بنفس المشاركين" onPress={onReplay} />
      <ActionButton label="تعديل الأسماء أو الصنف" variant="ghost" onPress={onSetup} />
    </>}
  </View>;
}
