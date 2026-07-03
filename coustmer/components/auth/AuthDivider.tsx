import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

export function AuthDivider() {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.text}>Or continue with</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
    width: '100%',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  text: {
    paddingHorizontal: 14,
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    flexShrink: 0,
  },
});
