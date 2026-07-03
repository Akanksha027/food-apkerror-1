import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';

export function AuthSignUpLink() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/sign-up')}
      style={styles.container}
    >
      <Text style={styles.text}>
        Don&apos;t have an account?{' '}
        <Text style={styles.link}>Sign Up</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    alignItems: 'center',
    paddingVertical: 4,
  },
  text: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  link: {
    fontWeight: '700',
    color: colors.brand.primary,
  },
});
