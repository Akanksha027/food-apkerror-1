import { Pressable } from '@/components/common/Pressable';
import { useEffect, useState } from 'react';
import { ActivityIndicator,
  
  StyleSheet,
  Text,
  View } from 'react-native';

import { AuthInput } from '@/components/auth/AuthInput';
import { ProfileFormLayout } from '@/components/profile/ProfileFormLayout';
import { authTheme } from '@/constants/auth-theme';
import {
  useUpdateEmail,
  useUpdatePhone,
  useUserProfile,
} from '@/lib/profile/hooks';

export function ContactScreen() {
  const { data: profile } = useUserProfile();
  const updatePhone = useUpdatePhone();
  const updateEmail = useUpdateEmail();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [banner, setBanner] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setPhone(profile.phone ?? '');
    setEmail(profile.email ?? '');
  }, [profile]);

  const handleUpdatePhone = () => {
    setBanner(null);
    updatePhone.mutate(
      { phone: phone.trim() },
      {
        onSuccess: (message) => setBanner({ message, type: 'success' }),
        onError: (error) =>
          setBanner({
            message: error instanceof Error ? error.message : 'Update failed',
            type: 'error',
          }),
      }
    );
  };

  const handleUpdateEmail = () => {
    setBanner(null);
    updateEmail.mutate(
      { email: email.trim() },
      {
        onSuccess: (message) => setBanner({ message, type: 'success' }),
        onError: (error) =>
          setBanner({
            message: error instanceof Error ? error.message : 'Update failed',
            type: 'error',
          }),
      }
    );
  };

  return (
    <ProfileFormLayout
      title="Phone & email"
      subtitle="Updates may require verification"
      banner={banner}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phone number</Text>
        <AuthInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+919876543210"
          keyboardType="phone-pad"
        />
        <Text style={styles.hint}>
          Changing your phone may trigger OTP verification.
        </Text>
        <Pressable
          style={styles.button}
          onPress={handleUpdatePhone}
          disabled={updatePhone.isPending}
        >
          {updatePhone.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Update phone</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email address</Text>
        <AuthInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.hint}>
          A verification link will be sent to your new email.
        </Text>
        <Pressable
          style={styles.button}
          onPress={handleUpdateEmail}
          disabled={updateEmail.isPending}
        >
          {updateEmail.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Update email</Text>
          )}
        </Pressable>
      </View>
    </ProfileFormLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: authTheme.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  hint: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  button: {
    marginTop: 16,
    backgroundColor: authTheme.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
