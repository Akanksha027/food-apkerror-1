import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { refreshCsrfToken } from '@/lib/api';
import { resolvePostAuthRoute } from '@/lib/navigation/post-auth';
import { useAuthStore } from '@/store/auth-store';

type Target = '/dashboard' | '/restaurant-setup';

export default function AuthLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);

  const [authedTarget, setAuthedTarget] = useState<Target | null>(null);

  useEffect(() => {
    if (isHydrated && !token) {
      refreshCsrfToken().catch(() => {
        // Warm-up only; register/login will surface errors if this fails.
      });
    }
  }, [isHydrated, token]);

  useEffect(() => {
    if (!isHydrated || !token) {
      setAuthedTarget(null);
      return;
    }

    let active = true;
    const effectiveRole = user?.role ?? role;

    void resolvePostAuthRoute(effectiveRole)
      .then((route) => {
        if (!active) return;
        setAuthedTarget(route);
      })
      .catch(() => {
        if (!active) return;
        setAuthedTarget(
          effectiveRole === 'delivery' ? '/dashboard' : '/restaurant-setup'
        );
      });

    return () => {
      active = false;
    };
  }, [isHydrated, token, user?.id, user?.role, role]);

  if (!isHydrated) {
    return <AuthLoadingScreen />;
  }

  if (token) {
    if (!authedTarget) {
      return <AuthLoadingScreen />;
    }
    return <Redirect href={authedTarget} />;
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
