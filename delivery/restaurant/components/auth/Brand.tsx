import { UtensilsCrossed } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { BRAND_NAME, theme } from '@/constants/theme';

export function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const iconSize = size === 'lg' ? 22 : 18;
  const textClass = size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <View className="flex-row items-center gap-2">
      <UtensilsCrossed color={theme.primary} size={iconSize} />
      <Text className={`${textClass} font-extrabold tracking-tight text-primary`}>
        {BRAND_NAME}
      </Text>
    </View>
  );
}
