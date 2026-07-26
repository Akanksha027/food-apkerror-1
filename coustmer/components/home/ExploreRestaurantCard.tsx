import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MoreVertical, Star } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FavoriteHeartButton } from '@/components/common/FavoriteHeartButton';
import { fonts } from '@/constants/typography';
import type { Restaurant } from '@/lib/restaurant/types';

type Props = {
  restaurant: Restaurant;
  isFavorite?: boolean;
  favoriteLoading?: boolean;
  onToggleFavorite?: (id: string) => void;
  onPress?: () => void;
};

function offerOverlay(restaurant: Restaurant) {
  const raw = restaurant.offer?.trim();
  if (raw) return raw.toUpperCase();
  const offers = [
    '70% OFF UPTO ₹130',
    'ITEMS AT ₹49',
    'FLAT ₹125 OFF',
    '50% OFF UPTO ₹100',
  ];
  const idx =
    Math.abs(restaurant.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
    offers.length;
  return offers[idx];
}

function formatReviews(n?: number) {
  if (!n || n <= 0) return null;
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}K+`;
  }
  return String(n);
}

function areaLabel(restaurant: Restaurant) {
  const addr = restaurant.address?.trim();
  if (addr) {
    const part = addr.split(',')[0]?.trim();
    if (part) return part;
  }
  return restaurant.city?.trim() || null;
}

/** Swiggy-style row card: tall image left, details right. */
export function ExploreRestaurantCard({
  restaurant,
  isFavorite,
  favoriteLoading,
  onToggleFavorite,
  onPress,
}: Props) {
  const cover = restaurant.coverUrl || restaurant.imageUrl || restaurant.logoUrl;
  const rating =
    typeof restaurant.rating === 'number' && restaurant.rating > 0
      ? restaurant.rating
      : undefined;
  const reviews = formatReviews(restaurant.reviewCount);
  const cuisines =
    (restaurant.cuisines ?? []).slice(0, 3).join(', ') || 'Restaurant';
  const time = restaurant.deliveryTime || '30-35 mins';
  const offer = offerOverlay(restaurant);
  const area = areaLabel(restaurant);
  const distance =
    typeof restaurant.distance === 'number' && restaurant.distance > 0
      ? `${restaurant.distance.toFixed(1)} km`
      : null;
  const badge =
    typeof restaurant.badge === 'string' ? restaurant.badge : undefined;

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onPress}
          disabled={!onPress}
        />
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            pointerEvents="none"
          />
        ) : (
          <View
            style={[styles.image, styles.imageFallback]}
            pointerEvents="none"
          />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.82)']}
          style={styles.offerGrad}
          pointerEvents="none"
        >
          <Text style={styles.offerText} numberOfLines={2}>
            {offer}
          </Text>
        </LinearGradient>

        {onToggleFavorite ? (
          <FavoriteHeartButton
            active={!!isFavorite}
            disabled={favoriteLoading}
            onPress={() => onToggleFavorite(restaurant.id)}
            size={18}
            color="#686B78"
            activeColor="#E23744"
            withBackdrop
            style={styles.heartBtn}
          />
        ) : null}
      </View>

      <Pressable
        style={({ pressed }) => [styles.details, pressed && styles.pressed]}
        onPress={onPress}
        disabled={!onPress}
      >
        {badge ? (
          <Text style={styles.badge} numberOfLines={1}>
            {badge}
          </Text>
        ) : null}

        <View style={{ width: '85%' }}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={2}>
              {restaurant.name}
            </Text>
          </View>

        <View style={styles.ratingRow}>
          {rating ? (
            <>
              <View style={styles.ratingCircle}>
                <Star color="#FFFFFF" fill="#FFFFFF" size={9} />
              </View>
              <Text style={styles.ratingNum}>
                {rating.toFixed(1)}
                {reviews ? ` (${reviews})` : ''}
              </Text>
              <Text style={styles.dot}>·</Text>
            </>
          ) : null}
          <Text style={styles.time}>{time}</Text>
        </View>

        <Text style={styles.cuisine} numberOfLines={3}>
          {cuisines}
        </Text>

        {area || distance ? (
          <Text style={styles.location} numberOfLines={1}>
            {[area, distance].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        </View>
      </Pressable>
      <View style={styles.moreWrapOuter}>
        <MoreVertical color="#9CA3AF" size={18} strokeWidth={2.2} />
      </View>
    </View>
  );
}

export function ExploreRestaurantSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.imageWrap, styles.skelBlock]} />
      <View style={styles.details}>
        <View style={[styles.skelLine, { width: '70%' }]} />
        <View style={[styles.skelLine, { width: '55%', marginTop: 10 }]} />
        <View style={[styles.skelLine, { width: '80%', marginTop: 8 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 22,
    gap: 14,
    position: 'relative',
  },
  pressed: {
    opacity: 0.92,
  },
  imageWrap: {
    width: 118,
    height: 148,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  imageFallback: {
    backgroundColor: '#D1D5DB',
  },
  offerGrad: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingTop: 28,
    paddingBottom: 8,
  },
  offerText: {
    fontFamily: fonts.displayBold,
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  details: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: 48,
  },
  badge: {
    fontFamily: fonts.uiSemi,
    fontSize: 12,
    color: '#B8860B',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 4,
  },
  name: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: '#02060C',
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  moreWrapOuter: {
    position: 'absolute',
    top: 10,
    right: 16,
    padding: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  ratingCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1BA672',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  ratingNum: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: '#02060C',
  },
  dot: {
    marginHorizontal: 5,
    fontFamily: fonts.ui,
    fontSize: 13,
    color: '#686B78',
  },
  time: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: '#02060C',
  },
  cuisine: {
    marginTop: 4,
    fontFamily: fonts.ui,
    fontSize: 13,
    color: '#686B78',
  },
  location: {
    marginTop: 2,
    fontFamily: fonts.ui,
    fontSize: 13,
    color: '#686B78',
  },
  skelBlock: {
    backgroundColor: '#ECECEC',
  },
  skelLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E8E8',
  },
});
