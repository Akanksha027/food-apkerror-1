import { Redirect, useLocalSearchParams } from 'expo-router';

export default function VerifyOtpPage() {
  const { identifier } = useLocalSearchParams<{ identifier?: string }>();

  return (
    <Redirect
      href={{
        pathname: '/',
        params: {
          auth: 'verify-otp',
          ...(identifier ? { identifier: String(identifier) } : {}),
        },
      }}
    />
  );
}
