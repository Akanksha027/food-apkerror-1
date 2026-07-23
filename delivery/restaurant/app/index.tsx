import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);

  const [target, setTarget] = useState<'/login' | '/dashboard' | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    setTarget(token ? '/dashboard' : '/login');
  }, [isHydrated, token]);

  if (!isHydrated || !target) {
    return <AuthLoadingScreen />;
  }

  return <Redirect href={target} />;
}
