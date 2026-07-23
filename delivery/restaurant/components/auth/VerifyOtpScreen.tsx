import { useRouter } from 'expo-router';
import { ArrowLeft, MessageSquareCode, ShieldCheck, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthField } from '@/components/auth/AuthField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { AuthShell } from '@/components/auth/AuthShell';
import {
  resolvePostAuthRoute,
} from '@/lib/navigation/post-auth';
import { useAuthStore } from '@/store/auth-store';

export function VerifyOtpScreen() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSend = async () => {
    setError(null);
    setSuccess(null);
    if (identifier.trim().length < 4) {
      setError('Enter your email or phone number');
      return;
    }
    try {
      const message = await sendOtp({
        emailOrPhone: identifier.trim(),
        purpose: 'login',
      });
      setSuccess(message);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (otp.trim().length < 4) {
      setError('Enter the OTP code sent to you');
      return;
    }
    try {
      await verifyOtp({
        emailOrPhone: identifier.trim(),
        otp: otp.trim(),
        role,
        purpose: 'login',
      });
      const userRole = useAuthStore.getState().user?.role ?? role;
      const target = await resolvePostAuthRoute(userRole);
      router.replace(
        target === '/restaurant-setup' ? '/restaurant-setup' : '/dashboard'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    }
  };

  return (
    <AuthShell
      title="OTP sign in"
      subtitle={
        step === 'request'
          ? 'Get a one-time code on your email or phone.'
          : `Enter the code sent to ${identifier}`
      }
      showBack
      footer={
        <Pressable
          onPress={() => router.replace('/login')}
          hitSlop={8}
          className="flex-row items-center justify-center gap-1.5"
        >
          <ArrowLeft color="#FF6B35" size={16} />
          <Text className="text-sm font-bold text-primary">
            Back to password sign in
          </Text>
        </Pressable>
      }
    >
      <RoleSelector value={role} onChange={setRole} disabled={isLoading} />

      <AuthBanner type="error" message={error} />
      <AuthBanner type="success" message={success} />

      {step === 'request' ? (
        <>
          <AuthField
            label="Email or phone"
            icon={User}
            placeholder="you@business.com or 9876543210"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <View className="mt-2">
            <PrimaryButton
              label="Send OTP"
              icon={MessageSquareCode}
              onPress={handleSend}
              loading={isLoading}
            />
          </View>
        </>
      ) : (
        <>
          <AuthField
            label="OTP code"
            icon={ShieldCheck}
            placeholder="Enter 6-digit code"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
          <View className="mt-2">
            <PrimaryButton
              label="Verify & continue"
              icon={ShieldCheck}
              onPress={handleVerify}
              loading={isLoading}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={isLoading}
            className="mt-4"
            hitSlop={8}
          >
            <Text className="text-center text-sm font-semibold text-primary">
              Resend code
            </Text>
          </Pressable>
        </>
      )}
    </AuthShell>
  );
}
