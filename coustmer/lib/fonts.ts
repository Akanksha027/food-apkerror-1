import { useFonts } from 'expo-font';

export function useAppFonts() {
  return useFonts({
    'Satoshi-Light': require('../assets/fonts/Satoshi-Light.ttf'),
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.ttf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.ttf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.ttf'),
    'Satoshi-Black': require('../assets/fonts/Satoshi-Black.ttf'),
  });
}
