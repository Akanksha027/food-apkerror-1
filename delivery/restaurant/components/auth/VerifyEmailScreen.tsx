import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';

type Status = 'verifying' | 'success' | 'error';

export function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const token = useAuthStore((s) => s.token);

  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('Verifying your email…');

  useEffect(() => {
    const linkToken = params.token;
    if (!linkToken) {
      setStatus('error');
      setMessage('Verification link is missing a token.');
      return;
    }

    let active = true;
    verifyEmail(linkToken)
      .then((msg) => {
        if (!active) return;
        setStatus('success');
        setMessage(msg);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setStatus('error');
        setMessage(
          err instanceof Error ? err.message : 'Email verification failed'
        );
      });

    return () => {
      active = false;
    };
  }, [params.token, verifyEmail]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-5 px-8">
        {status === 'verifying' ? (
          <>
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <MailCheck color={theme.primary} size={38} />
            </View>
            <ActivityIndicator color={theme.primary} size="large" />
          </>
        ) : null}

        {status === 'success' ? (
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-success/10">
            <CheckCircle2 color={theme.success} size={40} />
          </View>
        ) : null}

        {status === 'error' ? (
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-danger/10">
            <XCircle color={theme.danger} size={40} />
          </View>
        ) : null}

        <Text className="text-center text-2xl font-extrabold text-secondary">
          {status === 'success'
            ? 'Email verified'
            : status === 'error'
              ? 'Verification failed'
              : 'Please wait'}
        </Text>
        <Text className="text-center text-base leading-5 text-secondary-light">
          {message}
        </Text>

        {status !== 'verifying' ? (
          <View className="mt-2 w-full">
            <PrimaryButton
              label={token ? 'Go to dashboard' : 'Back to sign in'}
              onPress={() => router.replace(token ? '/dashboard' : '/login')}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
