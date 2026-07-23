import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Leaf, Percent, Star, Zap } from 'lucide-react-native';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import type { Restaurant } from '@/lib/restaurant/types';

type Props = {
  restaurant: Restaurant;
  isFavorite?: boolean;
  favoriteLoading?: boolean;
  onToggleFavorite?: (id: string) => void;
  onPress?: () => void;
};

function formatReviewCount(n?: number) {
  if (!n || n <= 0) return 'New';
  if (n >= 1000) return `By ${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return `By ${n}`;
}

export function RestaurantFeedCard({
  restaurant,
  isFavorite,
  favoriteLoading,
  onToggleFavorite,
  onPress,
}: Props) {
  const cover = restaurant.coverUrl || restaurant.imageUrl || restaurant.logoUrl;
  const price = restaurant.priceForTwo ?? restaurant.costForTwo;
  const rating =
    typeof restaurant.rating === 'number' && restaurant.rating > 0
      ? restaurant.rating
      : undefined;
  const isNew = restaurant.status === 'pending';
  const isClosed = restaurant.isOpen === false;
  const topCuisine = restaurant.cuisines?.[0];
  const offerText =
    restaurant.offer ||
    (isNew ? 'Newly added · Opening soon' : 'Free delivery on orders above ₹199');

  return (
    <View style={styles.outer}>
      <Pressable
        style={({ pressed }) => [styles.shadowWrap, pressed && styles.pressed]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.card}>
          <View style={styles.hero}>
            {cover ? (
              <Image
                source={{ uri: cover }}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <LinearGradient
                colors={['#2D2A26', '#1A1816']}
                style={styles.heroImage}
              />
            )}

            <View style={styles.topChip}>
              {restaurant.isPureVeg ? <View style={styles.vegDot} /> : null}
              <Text style={styles.topChipText} numberOfLines={1}>
                {topCuisine
                  ? `${topCuisine}${price ? ` · ₹${price}` : ''}`
                  : price
                    ? `₹${price} for two`
                    : restaurant.name}
              </Text>
            </View>

            {onToggleFavorite ? (
              <Pressable
                style={styles.bookmark}
                onPress={() => onToggleFavorite(restaurant.id)}
                hitSlop={10}
                disabled={favoriteLoading}
              >
                {favoriteLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Bookmark
                    size={22}
                    color="#FFFFFF"
                    fill={isFavorite ? '#FFFFFF' : 'transparent'}
                    strokeWidth={2.2}
                  />
                )}
              </Pressable>
            ) : null}

            <View
              style={[
                styles.offerRibbon,
                isNew && !restaurant.offer ? styles.offerRibbonBrand : null,
              ]}
            >
              <Text style={styles.offerRibbonText} numberOfLines={1}>
                {offerText}
              </Text>
            </View>

            {isClosed ? (
              <View style={styles.closedScrim}>
                <View style={styles.closedPill}>
                  <Text style={styles.closedLabel}>Currently closed</Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <View style={styles.titleLeft}>
                <Text style={styles.name} numberOfLines={1}>
                  {restaurant.name}
                </Text>
                <View style={styles.nearRow}>
                  <Zap color="#1BA672" size={13} fill="#1BA672" />
                  <Text style={styles.nearFast} numberOfLines={1}>
                    {restaurant.distance != null
                      ? `${restaurant.distance.toFixed(1)} km · Near & Fast`
                      : 'Near & Fast'}
                    {restaurant.deliveryTime
                      ? ` · ${restaurant.deliveryTime}`
                      : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingCol}>
                <View
                  style={[styles.ratingBadge, !rating && styles.ratingBadgeMuted]}
                >
                  <Text style={styles.ratingValue}>
                    {rating ? rating.toFixed(1) : '—'}
                  </Text>
                  <Star color="#FFFFFF" fill="#FFFFFF" size={11} />
                </View>
                <Text style={styles.reviewCount}>
                  {formatReviewCount(restaurant.reviewCount)}
                </Text>
              </View>
            </View>

            <View style={styles.offerRow}>
              <View style={styles.percentIcon}>
                <Percent color="#FFFFFF" size={10} strokeWidth={3} />
              </View>
              <Text style={styles.offerLine} numberOfLines={1}>
                {restaurant.offer
                  ? restaurant.offer
                  : price
                    ? `₹${price} for two · Great value meals`
                    : 'Special deals on select items'}
              </Text>
            </View>

            {restaurant.isPureVeg ? (
              <View style={styles.vegPill}>
                <Leaf color="#0F766E" size={13} />
                <Text style={styles.vegText}>Pure Veg restaurant</Text>
              </View>
            ) : restaurant.cuisines?.length ? (
              <Text style={styles.cuisines} numberOfLines={1}>
                {restaurant.cuisines.slice(0, 3).join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: 16,
  },
  shadowWrap: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  hero: {
    height: 176,
    backgroundColor: '#1A1816',
    overflow: 'hidden',
    width: '100%',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  topChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  vegDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#22C55E',
    backgroundColor: 'transparent',
  },
  topChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  bookmark: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerRibbon: {
    position: 'absolute',
    left: 0,
    bottom: 14,
    maxWidth: '82%',
    backgroundColor: '#3B5BDB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  offerRibbonBrand: {
    backgroundColor: authTheme.brand,
  },
  offerRibbonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  closedScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedPill: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
  },
  closedLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 2,
  },
  titleLeft: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1C',
    letterSpacing: -0.3,
  },
  nearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  nearFast: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1BA672',
    flex: 1,
  },
  ratingCol: {
    alignItems: 'center',
    minWidth: 48,
    paddingTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1BA672',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 46,
    justifyContent: 'center',
  },
  ratingBadgeMuted: {
    backgroundColor: '#A0A0A0',
  },
  ratingValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  reviewCount: {
    marginTop: 3,
    fontSize: 10,
    color: '#9C9C9C',
    fontWeight: '600',
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
  },
  percentIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#3B5BDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    flex: 1,
  },
  vegPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F7F4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vegText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  cuisines: {
    marginTop: 2,
    fontSize: 12,
    color: '#8E8E8E',
    fontWeight: '500',
  },
});
