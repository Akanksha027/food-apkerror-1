import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthInput } from '@/components/auth/AuthInput';
import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { AuthSwitchLink } from '@/components/auth/AuthSwitchLink';
import { authTheme } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';
import {
  validateConfirmPassword,
  validateEmail,
  validateIndianPhone,
  validateName,
  validateOptionalName,
  validatePassword,
} from '@/utils/validation';

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={sectionStyles.row}>
      <Text style={sectionStyles.label}>{children}</Text>
      <View style={sectionStyles.line} />
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: authTheme.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  half: {
    flex: 1,
  },
  hint: {
    color: authTheme.textDim,
    fontSize: 11,
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 2,
  },
  eyeBtn: {
    paddingRight: 14,
  },
  terms: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: authTheme.textDim,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  termsLink: {
    color: authTheme.brand,
    fontWeight: '600',
  },
});

const TERMS_FOOTER = (
  <Text style={styles.terms}>
    By signing up, you agree to our{' '}
    <Text style={styles.termsLink}>Terms</Text> &{' '}
    <Text style={styles.termsLink}>Privacy Policy</Text>
  </Text>
);

export function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [banner, setBanner] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  const goToLogin = useCallback(() => router.push('/login'), [router]);

  const headerAction = useMemo(
    () => (
      <AuthSwitchLink
        text="Already have an account?"
        linkText="Sign in"
        onPress={goToLogin}
      />
    ),
    [goToLogin]
  );
  const togglePassword = useCallback(() => setShowPassword((v) => !v), []);
  const toggleConfirmPassword = useCallback(
    () => setShowConfirmPassword((v) => !v),
    []
  );

  const passwordToggle = useMemo(
    () => (
      <Pressable onPress={togglePassword} style={styles.eyeBtn} hitSlop={8}>
        {showPassword ? (
          <EyeOff color={authTheme.textMuted} size={18} />
        ) : (
          <Eye color={authTheme.textMuted} size={18} />
        )}
      </Pressable>
    ),
    [showPassword, togglePassword]
  );

  const confirmPasswordToggle = useMemo(
    () => (
      <Pressable onPress={toggleConfirmPassword} style={styles.eyeBtn} hitSlop={8}>
        {showConfirmPassword ? (
          <EyeOff color={authTheme.textMuted} size={18} />
        ) : (
          <Eye color={authTheme.textMuted} size={18} />
        )}
      </Pressable>
    ),
    [showConfirmPassword, toggleConfirmPassword]
  );

  const handleRegister = async () => {
    const nextErrors = {
      firstName: validateName(firstName, 'First name'),
      lastName: validateOptionalName(lastName, 'Last name'),
      email: validateEmail(email),
      phone: phone.trim() ? validateIndianPhone(phone) : null,
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };

    setErrors(nextErrors);
    setBanner(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        confirmPassword,
      });
      router.replace('/home');
    } catch (error) {
      setBanner({
        message:
          error instanceof Error ? error.message : 'Registration failed',
        type: 'error',
      });
    }
  };

  return (
    <AuthScreenLayout footer={TERMS_FOOTER}>
      <AuthPageHeader
        title="Create account"
        subtitle="Join 50,000+ food lovers. Fast delivery, top restaurants."
        action={headerAction}
      />

      {banner ? (
        <AuthMessageBanner message={banner.message} type={banner.type} />
      ) : null}

      <SectionLabel>About you</SectionLabel>
      <View style={styles.row}>
        <View style={styles.half}>
          <AuthInput
            label="First name"
            icon={User}
            required
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Rahul"
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            returnKeyType="next"
            error={errors.firstName}
            compact
          />
        </View>
        <View style={styles.half}>
          <AuthInput
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Sharma"
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            returnKeyType="next"
            error={errors.lastName}
            compact
          />
        </View>
      </View>

      <SectionLabel>Contact</SectionLabel>
      <AuthInput
        label="Email address"
        icon={Mail}
        required
        value={email}
        onChangeText={setEmail}
        placeholder="rahul@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
        returnKeyType="next"
        importantForAutofill="no"
        error={errors.email}
      />
      <AuthInput
        label="Phone number"
        icon={Phone}
        value={phone}
        onChangeText={setPhone}
        placeholder="9876543210"
        keyboardType="phone-pad"
        autoComplete="off"
        textContentType="none"
        returnKeyType="next"
        maxLength={15}
        importantForAutofill="no"
        error={errors.phone}
      />
      <Text style={styles.hint}>Optional. Add +91 before your 10-digit number.</Text>

      <SectionLabel>Security</SectionLabel>
      <AuthInput
        label="Password"
        icon={Lock}
        required
        value={password}
        onChangeText={setPassword}
        placeholder="Min 8 chars, uppercase & symbol"
        secureTextEntry={!showPassword}
        autoComplete="off"
        textContentType="oneTimeCode"
        returnKeyType="next"
        importantForAutofill="no"
        error={errors.password}
        rightElement={passwordToggle}
      />
      <AuthInput
        label="Confirm password"
        icon={Lock}
        required
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter password"
        secureTextEntry={!showConfirmPassword}
        autoComplete="off"
        textContentType="oneTimeCode"
        returnKeyType="done"
        importantForAutofill="no"
        error={errors.confirmPassword}
        rightElement={confirmPasswordToggle}
      />

      <AuthSubmitButton
        label="Create Account"
        onPress={handleRegister}
        loading={isLoading}
      />
    </AuthScreenLayout>
  );
}
