import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

export function LoginWelcomeHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Your gourmet journey continues here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 22,
  },
});
