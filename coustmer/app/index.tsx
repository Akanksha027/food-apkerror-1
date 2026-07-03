import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { WelcomeScreen } from '@/components/welcome/WelcomeScreen';
import { authTheme } from '@/constants/auth-theme';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isHydrated) return;

    let cancelled = false;

    hasCompletedOnboarding()
      .then((completed) => {
        if (!cancelled) setOnboardingDone(completed);
      })
      .catch(() => {
        if (!cancelled) setOnboardingDone(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isHydrated]);

  if (!isHydrated || onboardingDone === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={authTheme.brand} size="large" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/home" />;
  }

  if (onboardingDone) {
    return <Redirect href="/login" />;
  }

  return <WelcomeScreen />;
}

const styles = {
  loading: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: authTheme.bg,
  },
};
