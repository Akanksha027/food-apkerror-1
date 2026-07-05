import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';

import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { refreshCsrfToken } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function AuthLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (isHydrated && !token) {
      refreshCsrfToken().catch(() => {
        // Warm-up only; register/login will surface errors if this fails.
      });
    }
  }, [isHydrated, token]);

  if (!isHydrated) {
    return <AuthLoadingScreen />;
  }

  if (token) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    />
  );
}
