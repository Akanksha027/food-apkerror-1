import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { authTheme } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';

export function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [banner, setBanner] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setBanner({
          message: 'Invalid or missing verification token',
          type: 'error',
        });
        return;
      }

      try {
        const message = await verifyEmail(String(token));
        setBanner({ message, type: 'success' });
        setDone(true);
      } catch (error) {
        setBanner({
          message:
            error instanceof Error ? error.message : 'Verification failed',
          type: 'error',
        });
      }
    };

    run();
  }, [token, verifyEmail]);

  return (
    <AuthScreenLayout scrollable={false}>
      <Text style={styles.title}>Email Verification</Text>

      {isLoading && !banner ? (
        <ActivityIndicator color={authTheme.accent} style={styles.loader} />
      ) : null}

      {banner ? (
        <AuthMessageBanner message={banner.message} type={banner.type} />
      ) : null}

      {done ? (
        <AuthSubmitButton
          label="Continue to Home"
          onPress={() => router.replace('/home')}
        />
      ) : (
        <AuthSubmitButton
          label="Go to Login"
          onPress={() => router.replace('/login')}
        />
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    color: authTheme.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  loader: {
    marginBottom: 20,
  },
});
