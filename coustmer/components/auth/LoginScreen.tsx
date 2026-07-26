import { Redirect } from 'expo-router';

export function LoginScreen() {
  return <Redirect href="/?auth=login" />;
}
