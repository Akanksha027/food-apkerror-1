import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

export function AuthLegalText() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        By signing in, you agree to our{' '}
        <Text style={styles.link}>Terms of Service</Text> and{' '}
        <Text style={styles.link}>Privacy Policy</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.text.muted,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
