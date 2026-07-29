import { Pressable } from '@/components/common/Pressable';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthInput } from '@/components/auth/AuthInput';
import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { authTheme } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';
import { validateEmail } from '@/utils/validation';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    setError(emailError);
    setBanner(null);
    if (emailError) return;

    try {
      const message = await forgotPassword({ email: email.trim() });
      setBanner({
        message:
          message ||
          'If that email exists, a reset link has been sent. Check your inbox.',
        type: 'success',
      });
    } catch (err) {
      setBanner({
        message: err instanceof Error ? err.message : 'Request failed',
        type: 'error',
      });
    }
  };

  return (
    <AuthScreenLayout>
      <Pressable onPress={() => { if (router.canGoBack()) { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } } else { router.replace('/'); } }}>
        <Text style={styles.back}>← Back to login</Text>
      </Pressable>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email and we&apos;ll send you a password reset link.
      </Text>

      {banner ? (
        <AuthMessageBanner message={banner.message} type={banner.type} />
      ) : null}

      <AuthInput
        label="Email"
        icon={Mail}
        required
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={error}
      />

      <AuthSubmitButton
        label="Send Reset Link"
        onPress={handleSubmit}
        loading={isLoading}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  back: {
    color: authTheme.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  title: {
    color: authTheme.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
});
