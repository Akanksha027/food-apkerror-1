import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={authTheme.brand} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.bg,
  },
});
