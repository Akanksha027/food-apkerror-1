import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

type FeatureBadgeProps = {
  icon: LucideIcon;
  label: string;
};

export function FeatureBadge({ icon: Icon, label }: FeatureBadgeProps) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-white/25 bg-black/50 px-3.5 py-2">
      <Icon color="#FFFFFF" size={13} strokeWidth={2.5} />
      <Text className="text-[11px] font-semibold text-white">{label}</Text>
    </View>
  );
}
