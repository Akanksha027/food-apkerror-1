import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { authTheme } from '@/constants/auth-theme';

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../public/logo.jpeg')} 
        style={styles.logo} 
        contentFit="cover" 
      />
      <Text style={styles.brandName}>TOKAJO FOODS</Text>
      <ActivityIndicator color={authTheme.brand} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#02060C',
    letterSpacing: 0.5,
    marginBottom: 24,
  },
});
