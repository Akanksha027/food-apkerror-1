import { Redirect, Stack, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { resolvePostAuthRoute } from '@/lib/navigation/post-auth';
import { useAuthStore } from '@/store/auth-store';

type Gate = 'loading' | 'setup' | 'ready';

export default function AppLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();

  const [gate, setGate] = useState<Gate>('loading');
  const [gateToken, setGateToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      setGate('loading');
      setGateToken(null);
      return;
    }

    const effectiveRole = user?.role ?? role;
    if (effectiveRole === 'delivery') {
      setGate('ready');
      setGateToken(token);
      return;
    }

    let active = true;
    setGate('loading');
    setGateToken(token);

    void resolvePostAuthRoute(effectiveRole)
      .then((route) => {
        if (!active) return;
        setGate(route === '/restaurant-setup' ? 'setup' : 'ready');
      })
      .catch(() => {
        if (!active) return;
        // Fail closed: incomplete / unknown → keep on setup, never open dashboard.
        setGate('setup');
      });

    return () => {
      active = false;
    };
    // Re-check after setup finishes (segment change) or auth changes.
  }, [isHydrated, token, user?.id, user?.role, role, segments.join('/')]);

  if (!isHydrated) {
    return <AuthLoadingScreen />;
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  if (gate === 'loading' || gateToken !== token) {
    return <AuthLoadingScreen />;
  }

  const onSetup = segments.includes('restaurant-setup');

  if (gate === 'setup' && !onSetup) {
    return <Redirect href="/restaurant-setup" />;
  }

  if (gate === 'ready' && onSetup) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFF7F2' },
      }}
    />
  );
}
