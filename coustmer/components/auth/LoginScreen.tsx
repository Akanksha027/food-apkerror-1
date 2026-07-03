import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthInput } from '@/components/auth/AuthInput';
import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { AuthSwitchLink } from '@/components/auth/AuthSwitchLink';
import { AuthTabSwitcher } from '@/components/auth/AuthTabSwitcher';
import { AuthTrustBadges } from '@/components/auth/AuthTrustBadges';
import { authTheme } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';
import {
  validateEmail,
  validateEmailOrPhone,
  validatePassword,
} from '@/utils/validation';

type LoginTab = 'password' | 'otp';

export function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [tab, setTab] = useState<LoginTab>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [banner, setBanner] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  const handlePasswordLogin = async () => {
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    setBanner(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      await login({ email: email.trim(), password });
      router.replace('/home');
    } catch (error) {
      setBanner({
        message: error instanceof Error ? error.message : 'Login failed',
        type: 'error',
      });
    }
  };

  const handleSendOtp = async () => {
    const identifierError = validateEmailOrPhone(emailOrPhone);
    setErrors({ emailOrPhone: identifierError });
    setBanner(null);
    if (identifierError) return;

    try {
      await sendOtp({ emailOrPhone: emailOrPhone.trim() });
      router.push({
        pathname: '/verify-otp',
        params: { identifier: emailOrPhone.trim() },
      });
    } catch (error) {
      setBanner({
        message: error instanceof Error ? error.message : 'Failed to send OTP',
        type: 'error',
      });
    }
  };

  return (
    <AuthScreenLayout footer={<AuthTrustBadges />}>
      <AuthPageHeader
        title="Welcome back!"
        subtitle="Sign in and get your favourite food delivered in minutes."
        action={
          <AuthSwitchLink
            text="New here?"
            linkText="Create account"
            onPress={() => router.push('/sign-up')}
          />
        }
      />

      <AuthTabSwitcher
        tabs={[
          { key: 'password', label: 'Password' },
          { key: 'otp', label: 'OTP Login' },
        ]}
        activeTab={tab}
        onChange={(key) => {
          setTab(key as LoginTab);
          setErrors({});
          setBanner(null);
        }}
      />

      {banner ? (
        <AuthMessageBanner message={banner.message} type={banner.type} />
      ) : null}

      {tab === 'password' ? (
        <View>
          <AuthInput
            label="Email address"
            icon={Mail}
            required
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />

          <View style={styles.passwordHeader}>
            <Text style={styles.passwordLabel}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <Pressable
              onPress={() => router.push('/forgot-password')}
              hitSlop={8}
            >
              <Text style={styles.forgotLink}>Forgot?</Text>
            </Pressable>
          </View>
          <AuthInput
            hideLabel
            icon={Lock}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            error={errors.password}
            rightElement={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff color={authTheme.textMuted} size={18} />
                ) : (
                  <Eye color={authTheme.textMuted} size={18} />
                )}
              </Pressable>
            }
          />

          <AuthSubmitButton
            label="Login"
            onPress={handlePasswordLogin}
            loading={isLoading}
          />
        </View>
      ) : (
        <View>
          <View style={styles.otpCard}>
            <Text style={styles.otpTitle}>Quick OTP login</Text>
            <Text style={styles.otpHint}>
              We&apos;ll send a one-time code to your email or phone number.
            </Text>
          </View>
          <AuthInput
            label="Email or phone"
            icon={Phone}
            required
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            placeholder="you@example.com or +91XXXXXXXXXX"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.emailOrPhone}
          />
          <AuthSubmitButton
            label="Send OTP"
            onPress={handleSendOtp}
            loading={isLoading}
          />
        </View>
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  passwordLabel: {
    color: authTheme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  required: {
    color: authTheme.brand,
  },
  forgotLink: {
    color: authTheme.foodAccent,
    fontSize: 13,
    fontWeight: '700',
  },
  eyeBtn: {
    paddingRight: 14,
  },
  otpCard: {
    backgroundColor: authTheme.foodAccentSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.15)',
  },
  otpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: authTheme.text,
    marginBottom: 4,
  },
  otpHint: {
    fontSize: 13,
    lineHeight: 19,
    color: authTheme.textMuted,
  },
});
