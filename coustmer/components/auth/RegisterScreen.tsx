import { Redirect } from 'expo-router';

export function RegisterScreen() {
  return <Redirect href="/?auth=sign-up" />;
}
