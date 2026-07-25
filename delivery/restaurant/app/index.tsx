import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { resolvePostAuthRoute } from '@/lib/navigation/post-auth';
import { useAuthStore } from '@/store/auth-store';

type Target = '/login' | '/dashboard' | '/restaurant-setup';

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);

  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      setTarget('/login');
      return;
    }

    let active = true;
    const effectiveRole = user?.role ?? role;

    void resolvePostAuthRoute(effectiveRole)
      .then((route) => {
        if (!active) return;
        setTarget(route);
      })
      .catch(() => {
        if (!active) return;
        setTarget(
          effectiveRole === 'delivery' ? '/dashboard' : '/restaurant-setup'
        );
      });

    return () => {
      active = false;
    };
  }, [isHydrated, token, user?.id, user?.role, role]);

  if (!isHydrated || !target) {
    return <AuthLoadingScreen />;
  }

  return <Redirect href={target} />;
}
