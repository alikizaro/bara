import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { useMemo, type ReactNode } from 'react';

import { DemoGameProvider } from './demo-game-provider';
import { OnlineGameProvider } from './online-game-provider';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

export function GameBackendProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    if (!convexUrl?.startsWith('https://')) {
      return null;
    }
    return new ConvexReactClient(convexUrl);
  }, []);

  if (!client) {
    return <DemoGameProvider>{children}</DemoGameProvider>;
  }

  return (
    <ConvexProvider client={client}>
      <OnlineGameProvider>{children}</OnlineGameProvider>
    </ConvexProvider>
  );
}
