import { type ReactNode } from 'react';
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

/** Extra space below the status bar so screens sit a little lower. */
export const SCREEN_TOP_OFFSET = 14;

/**
 * Bumps the top safe-area inset for the whole app so every screen
 * that uses SafeAreaView / useSafeAreaInsets shifts down slightly.
 */
export function ScreenTopOffsetProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaInsetsContext.Provider
      value={{
        ...insets,
        top: insets.top + SCREEN_TOP_OFFSET,
      }}
    >
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}
