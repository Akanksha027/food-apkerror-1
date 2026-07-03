import { Star } from 'lucide-react-native';
import { Text, View } from 'react-native';

type StatColumnProps = {
  value: string;
  label?: string;
  showStars?: boolean;
};

const STAR_COLOR = '#C4786A';

export function StatColumn({ value, label, showStars }: StatColumnProps) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[26px] font-bold text-white">{value}</Text>
      {showStars ? (
        <View className="mt-1.5 flex-row gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              color={STAR_COLOR}
              fill={STAR_COLOR}
              size={11}
              strokeWidth={0}
            />
          ))}
        </View>
      ) : (
        <Text className="mt-1.5 text-[10px] font-medium tracking-[1.5px] text-white/45">
          {label}
        </Text>
      )}
    </View>
  );
}
