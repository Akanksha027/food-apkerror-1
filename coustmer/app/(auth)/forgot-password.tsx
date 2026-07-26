import { Redirect } from 'expo-router';

export default function ForgotPasswordPage() {
  return <Redirect href="/?auth=forgot-password" />;
}
