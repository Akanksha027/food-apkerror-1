import { Redirect } from 'expo-router';

import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);

  if (!isHydrated) {
    return <AuthLoadingScreen />;
  }

  return <Redirect href={token ? '/dashboard' : '/login'} />;
}
