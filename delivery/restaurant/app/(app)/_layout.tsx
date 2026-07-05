import { Redirect, Stack } from 'expo-router';

import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { useAuthStore } from '@/store/auth-store';

export default function AppLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);

  if (!isHydrated) {
    return <AuthLoadingScreen />;
  }

  if (!token) {
    return <Redirect href="/login" />;
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
