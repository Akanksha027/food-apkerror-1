import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Star } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { PriceTag, VegBadge } from '@/components/restaurant/MenuBadges';
import { authTheme } from '@/constants/auth-theme';
import { getMenuItemRating } from '@/lib/restaurant/menu-rating';
import type { MenuItem } from '@/lib/restaurant/types';

type Props = {
  item: MenuItem;
  onPress?: () => void;
  onAdd?: () => void;
  /** Soft highlight when opened from search deep-link. */
  highlighted?: boolean;
};

export function MenuItemRow({ item, onPress, onAdd, highlighted }: Props) {
  const rating = getMenuItemRating(item);
  const highlight = useSharedValue(0);

  useEffect(() => {
    if (highlighted) {
      highlight.value = 0;
      highlight.value = withSequence(
        withTiming(1, {
          duration: 420,
          easing: Easing.out(Easing.cubic),
        }),
        withDelay(
          2400,
          withTiming(0, {
            duration: 700,
            easing: Easing.inOut(Easing.quad),
          })
        )
      );
    } else {
      highlight.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [highlighted, highlight]);

  const highlightStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      highlight.value,
      [0, 1],
      ['transparent', 'rgba(255, 90, 65, 0.08)']
    ),
    borderColor: interpolateColor(
      highlight.value,
      [0, 1],
      ['transparent', 'rgba(255, 90, 65, 0.28)']
    ),
    borderWidth: highlight.value > 0.01 ? 1 : 0,
    transform: [
      {
        scale: 1 + highlight.value * 0.012,
      },
    ],
    marginHorizontal: -8 * highlight.value,
    paddingHorizontal: 8 * highlight.value,
    borderRadius: 12 * highlight.value,
  }));

  return (
    <Animated.View style={highlightStyle}>
      <Pressable style={styles.row} onPress={onPress}>
        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <VegBadge isVeg={item.isVeg} />
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <PriceTag price={item.price} />
            {rating != null ? (
              <View style={styles.ratingPill}>
                <Star color="#FFFFFF" fill="#FFFFFF" size={10} />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
          {item.description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          {!item.isAvailable ? (
            <Text style={styles.unavailable}>Currently unavailable</Text>
          ) : null}
        </View>

        <View style={styles.imageWrap}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              contentFit="cover"
              recyclingKey={item.id}
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={['#FFF7ED', '#FFEDD5']}
              style={styles.imagePlaceholder}
            />
          )}
          {item.isAvailable ? (
            <Pressable
              style={styles.addButton}
              onPress={(e) => {
                e.stopPropagation?.();
                onAdd?.();
              }}
            >
              <Text style={styles.addLabel}>ADD</Text>
              <Plus color={authTheme.brand} size={14} />
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: authTheme.cardBorder,
  },
  textWrap: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  desc: {
    color: authTheme.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  unavailable: {
    color: authTheme.error,
    fontSize: 12,
    fontWeight: '600',
  },
  imageWrap: {
    width: 128,
    height: 108,
    borderRadius: 14,
    overflow: 'visible',
    backgroundColor: authTheme.input,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  addButton: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: authTheme.brand,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  addLabel: {
    color: authTheme.brand,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
