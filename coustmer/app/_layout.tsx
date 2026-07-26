import 'react-native-gesture-handler';

import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { ScreenTopOffsetProvider } from '@/components/common/ScreenTopOffsetProvider';
import { useAppFonts } from '@/lib/fonts';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth-store';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [fontsLoaded] = useAppFonts();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: authTheme.bg,
        }}
      >
        <ActivityIndicator color={authTheme.brand} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <ScreenTopOffsetProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: authTheme.bg },
              }}
            />
          </QueryClientProvider>
        </ScreenTopOffsetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
