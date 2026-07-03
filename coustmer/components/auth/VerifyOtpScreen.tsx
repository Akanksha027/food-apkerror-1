import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthInput } from '@/components/auth/AuthInput';
import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { authTheme } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';
import { validateOtp } from '@/utils/validation';

export function VerifyOtpScreen() {
  const router = useRouter();
  const { identifier } = useLocalSearchParams<{ identifier?: string }>();
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  const handleVerify = async () => {
    if (!identifier) {
      setBanner({
        message: 'Missing email or phone. Please go back and try again.',
        type: 'error',
      });
      return;
    }

    const otpError = validateOtp(otp);
    setError(otpError);
    setBanner(null);
    if (otpError) return;

    try {
      await verifyOtp({
        emailOrPhone: String(identifier),
        otp: otp.trim(),
      });
      router.replace('/home');
    } catch (err) {
      setBanner({
        message: err instanceof Error ? err.message : 'Verification failed',
        type: 'error',
      });
    }
  };

  return (
    <AuthScreenLayout>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter the code sent to{'\n'}
        <Text style={styles.identifier}>{identifier}</Text>
      </Text>

      {banner ? (
        <AuthMessageBanner message={banner.message} type={banner.type} />
      ) : null}

      <AuthInput
        label="One-Time Password"
        icon={ShieldCheck}
        required
        value={otp}
        onChangeText={setOtp}
        placeholder="Enter OTP"
        keyboardType="number-pad"
        maxLength={8}
        error={error}
      />

      <AuthSubmitButton
        label="Verify & Login"
        onPress={handleVerify}
        loading={isLoading}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
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
  identifier: {
    color: authTheme.text,
    fontWeight: '600',
  },
});
