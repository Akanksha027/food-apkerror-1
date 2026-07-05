import { ActivityIndicator, Text, View } from 'react-native';

import { Brand } from '@/components/auth/Brand';
import { theme } from '@/constants/theme';

export function AuthLoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-surface">
      <Brand size="lg" />
      <ActivityIndicator color={theme.primary} size="large" />
      <Text className="text-sm font-medium text-secondary-light">
        Loading your portal…
      </Text>
    </View>
  );
}
