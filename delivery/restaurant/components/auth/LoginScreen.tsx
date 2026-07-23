import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Lock, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import {
  AuthDivider,
  CheckboxRow,
  LegalFooter,
  SocialButtons,
} from '@/components/auth/AuthExtras';
import { AuthField } from '@/components/auth/AuthField';
import { AuthShell } from '@/components/auth/AuthShell';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { BRAND_NAME } from '@/constants/theme';
import {
  resolvePostAuthRoute,
} from '@/lib/navigation/post-auth';
import { useAuthStore } from '@/store/auth-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const router = useRouter();
  const { registered, email: registeredEmail } = useLocalSearchParams<{
    registered?: string;
    email?: string;
  }>();
  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  useEffect(() => {
    if (registered === '1') {
      setSuccess('Account created successfully. Sign in to complete your restaurant profile.');
      if (typeof registeredEmail === 'string' && registeredEmail) {
        setEmail(registeredEmail);
      }
    }
  }, [registered, registeredEmail]);

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    setError(null);
    setSuccess(null);
    if (!validate()) return;
    try {
      await login({ email: email.trim().toLowerCase(), password, role });
      const userRole = useAuthStore.getState().user?.role ?? role;
      const target = await resolvePostAuthRoute(userRole);
      router.replace(target === '/restaurant-setup' ? '/restaurant-setup' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const comingSoon = (provider: string) =>
    Alert.alert(`${provider} sign-in`, 'Social sign-in is coming soon.');

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Log in to manage your outlet and track your growth."
      footer={
        <>
          <AuthDivider label="Or continue with" />
          <SocialButtons
            onGoogle={() => comingSoon('Google')}
            onApple={() => comingSoon('Apple')}
          />

          <View className="mt-5 flex-row items-center justify-center">
            <Text className="text-sm text-secondary-light">
              New to {BRAND_NAME}?{' '}
            </Text>
            <Pressable onPress={() => router.push('/register')} hitSlop={8}>
              <Text className="text-sm font-bold text-primary">
                Become a Partner
              </Text>
            </Pressable>
          </View>

          <LegalFooter />
        </>
      }
    >
      <RoleSelector value={role} onChange={setRole} disabled={isLoading} />

      <AuthBanner type="success" message={success} />
      <AuthBanner type="error" message={error} />

      <AuthField
        label="Work Email"
        icon={Mail}
        placeholder="name@outlet.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        errorText={fieldErrors.email}
      />

      <AuthField
        label="Password"
        icon={Lock}
        placeholder="••••••••"
        secure
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        errorText={fieldErrors.password}
        labelAccessory={
          <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8}>
            <Text className="text-sm font-semibold text-primary">Forgot?</Text>
          </Pressable>
        }
      />

      <View className="mb-5 mt-1">
        <CheckboxRow
          checked={keepLoggedIn}
          onToggle={() => setKeepLoggedIn((v) => !v)}
          label="Keep me logged in"
        />
      </View>

      <PrimaryButton
        label="Continue to Dashboard"
        trailingIcon={ChevronRight}
        onPress={handleLogin}
        loading={isLoading}
      />

      <Pressable
        onPress={() => router.push('/verify-otp')}
        hitSlop={8}
        className="mt-4"
      >
        <Text className="text-center text-sm font-semibold text-primary">
          Sign in with OTP instead
        </Text>
      </Pressable>
    </AuthShell>
  );
}
