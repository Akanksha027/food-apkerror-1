import 'react-native-gesture-handler';

import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { ScreenTopOffsetProvider } from '@/components/common/ScreenTopOffsetProvider';
import { useAppFonts } from '@/lib/fonts';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth-store';

// Keep the native splash visible while we initialise — must be called
// before any rendering so the splash never disappears prematurely.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [fontsLoaded] = useAppFonts();
  const [appReady, setAppReady] = useState(false);

  // Kick off auth hydration once on mount.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Once both fonts and auth store are ready, mark the app ready.
  useEffect(() => {
    if (fontsLoaded && isHydrated) {
      setAppReady(true);
    }
  }, [fontsLoaded, isHydrated]);

  // Hide the native splash screen only after the first frame has painted,
  // so there is zero white-flash between splash and real UI.
  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  // While not ready, keep rendering nothing so the native splash stays on top.
  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <ScreenTopOffsetProvider>
          <QueryClientProvider client={queryClient}>
            <View
              style={{ flex: 1, backgroundColor: authTheme.bg }}
              onLayout={onLayoutRootView}
            >
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'fade',
                  contentStyle: { backgroundColor: authTheme.bg },
                }}
              />
            </View>
          </QueryClientProvider>
        </ScreenTopOffsetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
