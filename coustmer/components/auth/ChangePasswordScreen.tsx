import { useRouter } from 'expo-router';
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

export function ChangePasswordScreen() {
  const router = useRouter();
  const changePassword = useAuthStore((s) => s.changePassword);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [banner, setBanner] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  const handleSubmit = async () => {
    const nextErrors = {
      oldPassword: !oldPassword ? 'Current password is required' : null,
      newPassword: validatePassword(newPassword),
      confirmPassword: validateConfirmPassword(newPassword, confirmPassword),
    };

    if (oldPassword && newPassword && oldPassword === newPassword) {
      nextErrors.newPassword =
        'New password must be different from current password';
    }

    setErrors(nextErrors);
    setBanner(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      const message = await changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      setBanner({ message, type: 'success' });
      setTimeout(() => { if (router.canGoBack()) { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } } else { router.replace('/'); } }, 1500);
    } catch (error) {
      setBanner({
        message:
          error instanceof Error ? error.message : 'Failed to change password',
        type: 'error',
      });
    }
  };

  return (
    <AuthScreenLayout>
      <Pressable onPress={() => { if (router.canGoBack()) { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } } else { router.replace('/'); } }}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.subtitle}>
        Update your password to keep your account secure.
      </Text>

      {banner ? (
        <AuthMessageBanner message={banner.message} type={banner.type} />
      ) : null}

      <AuthInput
        label="Current Password"
        icon={Lock}
        required
        value={oldPassword}
        onChangeText={setOldPassword}
        placeholder="Enter current password"
        secureTextEntry={!showOld}
        error={errors.oldPassword}
        rightElement={
          <Pressable onPress={() => setShowOld((v) => !v)}>
            {showOld ? (
              <EyeOff color={authTheme.textMuted} size={18} />
            ) : (
              <Eye color={authTheme.textMuted} size={18} />
            )}
          </Pressable>
        }
      />

      <AuthInput
        label="New Password"
        icon={Lock}
        required
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Min 8 chars with uppercase & symbol"
        secureTextEntry={!showNew}
        error={errors.newPassword}
        rightElement={
          <Pressable onPress={() => setShowNew((v) => !v)}>
            {showNew ? (
              <EyeOff color={authTheme.textMuted} size={18} />
            ) : (
              <Eye color={authTheme.textMuted} size={18} />
            )}
          </Pressable>
        }
      />

      <AuthInput
        label="Confirm New Password"
        icon={Lock}
        required
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter new password"
        secureTextEntry={!showConfirm}
        error={errors.confirmPassword}
        rightElement={
          <Pressable onPress={() => setShowConfirm((v) => !v)}>
            {showConfirm ? (
              <EyeOff color={authTheme.textMuted} size={18} />
            ) : (
              <Eye color={authTheme.textMuted} size={18} />
            )}
          </Pressable>
        }
      />

      <AuthSubmitButton
        label="Update Password"
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
