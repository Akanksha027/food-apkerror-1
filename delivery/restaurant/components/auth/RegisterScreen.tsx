import { useRouter } from 'expo-router';
import { Lock, Mail, Phone, User, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthField } from '@/components/auth/AuthField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuthStore } from '@/store/auth-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (firstName.trim().length < 2) next.firstName = 'Enter your first name';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (phone && phone.replace(/\D/g, '').length < 10)
      next.phone = 'Enter a valid phone number';
    if (password.length < 6)
      next.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword)
      next.confirmPassword = 'Passwords do not match';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    setError(null);
    if (!validate()) return;
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        confirmPassword,
        role,
      });
      // Session is stored on success → jump straight into the portal.
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Join as a partner and start earning with us."
      showBack
      footer={
        <View className="flex-row items-center justify-center">
          <Text className="text-sm text-secondary-light">
            Already a partner?{' '}
          </Text>
          <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
            <Text className="text-sm font-bold text-primary">Sign in</Text>
          </Pressable>
        </View>
      }
    >
      <RoleSelector value={role} onChange={setRole} disabled={isLoading} />

      <AuthBanner type="error" message={error} />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <AuthField
            label="First name"
            icon={User}
            placeholder="John"
            autoCapitalize="words"
            value={firstName}
            onChangeText={setFirstName}
            errorText={fieldErrors.firstName}
          />
        </View>
        <View className="flex-1">
          <AuthField
            label="Last name"
            placeholder="Doe"
            autoCapitalize="words"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
      </View>

      <AuthField
        label="Email"
        icon={Mail}
        placeholder="you@business.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        errorText={fieldErrors.email}
      />

      <AuthField
        label="Phone (optional)"
        icon={Phone}
        placeholder="9876543210"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        errorText={fieldErrors.phone}
      />

      <AuthField
        label="Password"
        icon={Lock}
        placeholder="At least 6 characters"
        secure
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        errorText={fieldErrors.password}
      />

      <AuthField
        label="Confirm password"
        icon={Lock}
        placeholder="Re-enter password"
        secure
        autoCapitalize="none"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        errorText={fieldErrors.confirmPassword}
      />

      <View className="mt-1">
        <PrimaryButton
          label="Create Account"
          icon={UserPlus}
          onPress={handleRegister}
          loading={isLoading}
        />
      </View>

      <Text className="mt-4 text-center text-xs leading-4 text-secondary-light">
        By continuing you agree to our Terms of Service and Privacy Policy.
      </Text>
    </AuthShell>
  );
}
