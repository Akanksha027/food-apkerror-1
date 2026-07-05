import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Heart, Star, UtensilsCrossed } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import type { RestaurantCard as RestaurantCardType } from '@/lib/customer/types';

type Props = {
  restaurant: RestaurantCardType;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  favoriteLoading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
};

export function RestaurantCard({
  restaurant,
  isFavorite,
  onToggleFavorite,
  favoriteLoading,
  fullWidth,
  onPress,
}: Props) {
  const id = String(restaurant.id ?? (restaurant as Record<string, unknown>)._id ?? '');
  const cuisines = restaurant.cuisines?.slice(0, 3).join(', ');
  const offer = (restaurant as Record<string, unknown>).offer as string | undefined;

  return (
    <Pressable
      style={[styles.card, fullWidth && styles.cardFullWidth]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.imageWrap}>
        {restaurant.imageUrl ? (
          <Image
            source={{ uri: restaurant.imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={['#FEE2D5', '#FED7C3']}
            style={styles.image}
          >
            <View style={styles.placeholderInner}>
              <UtensilsCrossed color="#C4520A" size={30} />
            </View>
          </LinearGradient>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.imageScrim}
        />

        {offer ? (
          <View style={styles.offerRibbon}>
            <Text style={styles.offerText}>{offer}</Text>
          </View>
        ) : null}

        {onToggleFavorite ? (
          <Pressable
            style={styles.favoriteButton}
            onPress={() => onToggleFavorite(id)}
            hitSlop={8}
            disabled={favoriteLoading}
          >
            {favoriteLoading ? (
              <ActivityIndicator size="small" color={authTheme.brand} />
            ) : (
              <Heart
                color={isFavorite ? authTheme.brand : authTheme.textMuted}
                fill={isFavorite ? authTheme.brand : 'transparent'}
                size={18}
              />
            )}
          </Pressable>
        ) : null}

        {typeof restaurant.rating === 'number' ? (
          <View style={styles.ratingBadge}>
            <Star color="#FFFFFF" fill="#FFFFFF" size={11} />
            <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name || 'Restaurant'}
        </Text>
        {cuisines ? (
          <Text style={styles.cuisines} numberOfLines={1}>
            {cuisines}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          {restaurant.deliveryTime ? (
            <View style={styles.metaChip}>
              <Clock color={authTheme.textMuted} size={12} />
              <Text style={styles.meta}>{restaurant.deliveryTime}</Text>
            </View>
          ) : null}
          {typeof restaurant.priceForTwo === 'number' ? (
            <Text style={styles.meta}>₹{restaurant.priceForTwo} for two</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    backgroundColor: authTheme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardFullWidth: {
    width: '100%',
    flex: 1,
  },
  imageWrap: {
    height: 132,
    backgroundColor: authTheme.input,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  offerRibbon: {
    position: 'absolute',
    left: 0,
    bottom: 10,
    backgroundColor: authTheme.brand,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  offerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#16A34A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  body: {
    padding: 12,
  },
  name: {
    color: authTheme.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cuisines: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
