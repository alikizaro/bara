export type NavigationScreen =
  | 'home'
  | 'profile'
  | 'game-modes'
  | 'create'
  | 'duel-create'
  | 'join'
  | 'lobby';

export type BackAction = 'exit-app' | 'home' | 'game-modes' | 'leave-room';

export function resolveBackAction(
  screen: NavigationScreen,
  hasActiveRoom: boolean,
): BackAction {
  if (hasActiveRoom || screen === 'lobby') return 'leave-room';
  if (screen === 'create' || screen === 'duel-create') return 'game-modes';
  if (screen !== 'home') return 'home';
  return 'exit-app';
}
