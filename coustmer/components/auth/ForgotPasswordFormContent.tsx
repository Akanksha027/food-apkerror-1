import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { AuthMessageBanner } from '@/components/auth/AuthMessageBanner';
import { loginFormStyles } from '@/components/auth/LoginFormContent';
import { authTheme } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';
import { validateEmail } from '@/utils/validation';

type Props = {
  onBackToLogin?: () => void;
};

export function ForgotPasswordFormContent({ onBackToLogin }: Props) {
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    setError(emailError);
    setBanner(null);
    if (emailError) return;

    try {
      const message = await forgotPassword({ email: email.trim() });
      setBanner({
        message: message || 'If that email exists, a reset link has been sent. Check your inbox.',
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
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView enableOnAndroid={true} extraScrollHeight={20} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email and we&apos;ll send you a password reset link.</Text>

        {banner ? (
          <View style={{ marginBottom: 16 }}>
            <AuthMessageBanner message={banner.message} type={banner.type} />
          </View>
        ) : null}

        <View style={styles.fieldWrap}>
          <View style={[styles.inputContainer, focused && styles.inputFocused, error && styles.inputError]}>
            <View style={[styles.iconCircle, focused && styles.iconCircleFocused]}>
              <Mail color={error ? authTheme.error : focused ? authTheme.brand : authTheme.textDim} size={18} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={authTheme.textDim}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              underlineColorAndroid="transparent"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed, isLoading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitBtnText}>{isLoading ? '...' : 'SEND RESET LINK'}</Text>
        </Pressable>

        {onBackToLogin ? (
          <View style={styles.bottomLinks}>
            <Text style={styles.signupText}>
              Remember your password?{' '}
              <Text style={styles.signupLink} onPress={onBackToLogin}>
                Sign in
              </Text>
            </Text>
          </View>
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = loginFormStyles;
