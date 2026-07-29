import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, MapPin, Star, UtensilsCrossed } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import type { Restaurant } from '@/lib/restaurant/types';
import { prefetchRestaurantMenu } from '@/lib/restaurant/hooks';

type Props = {
  restaurant: Restaurant;
  onPress?: () => void;
};

export function RestaurantListCard({ restaurant, onPress }: Props) {
  const cuisines = restaurant.cuisines?.slice(0, 3).join(' • ');

  return (
    <Pressable 
      style={styles.card} 
      onPressIn={() => prefetchRestaurantMenu(restaurant.id)}
      onPress={onPress} 
      disabled={!onPress}
    >
      <View style={styles.imageWrap}>
        {restaurant.imageUrl || restaurant.coverUrl ? (
          <Image
            source={{ uri: restaurant.imageUrl ?? restaurant.coverUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <LinearGradient colors={['#FEE2D5', '#FED7C3']} style={styles.image}>
            <UtensilsCrossed color="#C4520A" size={32} />
          </LinearGradient>
        )}
        {typeof restaurant.rating === 'number' ? (
          <View style={styles.ratingBadge}>
            <Star color="#FFFFFF" fill="#FFFFFF" size={11} />
            <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
          </View>
        ) : null}
        {restaurant.isOpen === false ? (
          <View style={styles.closedOverlay}>
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>Closed</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
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
          {typeof restaurant.distance === 'number' ? (
            <View style={styles.metaChip}>
              <MapPin color={authTheme.textMuted} size={12} />
              <Text style={styles.meta}>{restaurant.distance.toFixed(1)} km</Text>
            </View>
          ) : null}
        </View>
        {restaurant.offer ? (
          <View style={styles.offerRow}>
            <Text style={styles.offerText}>{restaurant.offer}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: authTheme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    width: 110,
    height: 110,
    backgroundColor: authTheme.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  closedText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  body: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
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
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
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
  offerRow: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: authTheme.brandSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offerText: {
    color: authTheme.brand,
    fontSize: 11,
    fontWeight: '700',
  },
});
