import { StyleSheet } from 'react-native';
import { colors, radii } from '../../theme/tokens';

export const offlineStyles = StyleSheet.create({
  stack: { gap: 14 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900', textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 25 },
  badge: { color: colors.secondary, textAlign: 'center', fontWeight: '800', marginVertical: 12 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 22, gap: 18 },
  secret: { color: colors.warning, fontSize: 34, fontWeight: '900', textAlign: 'center', paddingVertical: 22 },
  emoji: { fontSize: 58, textAlign: 'center' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  input: { flex: 1, minHeight: 52, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: 14, color: colors.text, fontSize: 17, textAlign: 'right' },
  remove: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.danger, fontSize: 25 },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 9 },
  chip: { padding: 13, minHeight: 48, borderRadius: radii.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  selected: { backgroundColor: colors.surfaceBright, borderColor: colors.secondary },
  text: { color: colors.text, fontSize: 16, textAlign: 'right' },
});
