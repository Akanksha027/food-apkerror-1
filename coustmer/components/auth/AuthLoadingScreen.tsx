import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/Logo.png')}
        style={styles.logo}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 180,
    height: 180,
  },
});
