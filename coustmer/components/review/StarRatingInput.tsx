import { Pressable } from '@/components/common/Pressable';
import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

type Props = {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
};

export function StarRatingInput({
  value,
  onChange,
  size = 28,
  readonly = false,
}: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        return (
          <Pressable
            key={star}
            disabled={readonly || !onChange}
            hitSlop={6}
            onPress={() => onChange?.(star)}
            accessibilityRole="button"
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
          >
            <Star
              color={filled ? '#F59E0B' : '#D1D5DB'}
              fill={filled ? '#F59E0B' : 'transparent'}
              size={size}
              strokeWidth={1.8}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
