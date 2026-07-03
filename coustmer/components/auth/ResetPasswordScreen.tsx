import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AuthInput } from '@/components/auth/AuthInput';
import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { authTheme } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';
import {
  validateConfirmPassword,
  validatePassword,
} from '@/utils/validation';

export function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [banner, setBanner] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  const handleSubmit = async () => {
    if (!token) {
      setBanner({
        message: 'Invalid or missing reset token',
        type: 'error',
      });
      return;
    }

    const nextErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setErrors(nextErrors);
    setBanner(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      const message = await resetPassword({
        token: String(token),
        password,
        confirmPassword,
      });
      setBanner({ message, type: 'success' });
      setTimeout(() => router.replace('/login'), 1500);
    } catch (error) {
      setBanner({
        message:
          error instanceof Error ? error.message : 'Failed to reset password',
        type: 'error',
      });
    }
  };

  return (
    <AuthScreenLayout>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your new password below.</Text>

      {banner ? (
        <AuthMessageBanner message={banner.message} type={banner.type} />
      ) : null}

      <AuthInput
        label="New Password"
        icon={Lock}
        required
        value={password}
        onChangeText={setPassword}
        placeholder="Min 8 chars with uppercase & symbol"
        secureTextEntry={!showPassword}
        error={errors.password}
        rightElement={
          <Pressable onPress={() => setShowPassword((v) => !v)}>
            {showPassword ? (
              <EyeOff color={authTheme.textMuted} size={18} />
            ) : (
              <Eye color={authTheme.textMuted} size={18} />
            )}
          </Pressable>
        }
      />

      <AuthInput
        label="Confirm Password"
        icon={Lock}
        required
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter password"
        secureTextEntry={!showConfirmPassword}
        error={errors.confirmPassword}
        rightElement={
          <Pressable onPress={() => setShowConfirmPassword((v) => !v)}>
            {showConfirmPassword ? (
              <EyeOff color={authTheme.textMuted} size={18} />
            ) : (
              <Eye color={authTheme.textMuted} size={18} />
            )}
          </Pressable>
        }
      />

      <AuthSubmitButton
        label="Reset Password"
        onPress={handleSubmit}
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
});
