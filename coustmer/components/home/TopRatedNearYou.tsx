import { Pressable } from '@/components/common/Pressable';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, Heart, Percent, Star } from 'lucide-react-native';
import { useState } from 'react';

import { fonts } from '@/constants/typography';
import type { Restaurant } from '@/lib/restaurant/types';

type Props = {
  restaurants: Restaurant[];
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
};

/** Build offer text for the orange pill on each card */
function getOfferLabel(restaurant: Restaurant): string {
  const raw = (restaurant as any).offer?.trim();
  if (raw) return raw;
  const options = ['15% off: NEW15', '20% off: FIRST', '10% off: SAVE10', '25% off: MEGA25'];
  const idx =
    Math.abs(restaurant.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
    options.length;
  return options[idx]!;
}

export function TopRatedNearYou({
  restaurants,
  favoriteIds = [],
  onToggleFavorite,
}: Props) {
  const router = useRouter();
  const [localFavs, setLocalFavs] = useState<Set<string>>(new Set(favoriteIds));

  if (!restaurants || restaurants.length === 0) return null;

  const toggleFav = (id: string) => {
    setLocalFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    onToggleFavorite?.(id);
  };

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Popular Restaurants</Text>
        <Pressable
          style={styles.seeAllBtn}
          onPress={() => router.push('/restaurants')}
        >
          <ArrowUpRight color="#F97316" size={22} strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Horizontal scrolling cards */}
      <FlatList
        data={restaurants}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isFav = localFavs.has(item.id);
          const rating =
            typeof item.rating === 'number' && item.rating > 0
              ? item.rating
              : 4.2;
          const reviewCount =
            typeof item.reviewCount === 'number' && item.reviewCount > 0
              ? item.reviewCount >= 1000
                ? `${Math.round(item.reviewCount / 100) / 10}K`
                : String(item.reviewCount)
              : null;
          const cuisines =
            (item.cuisines ?? []).slice(0, 2).join(', ') || 'Restaurant';
          const cost =
            item.costForTwo
              ? `$$`
              : item.priceForTwo
                ? `$$`
                : `$$`;
          const offerLabel = getOfferLabel(item);
          const cover = item.coverUrl || item.imageUrl || item.logoUrl;

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/restaurants/${item.id}`)}
            >
              {/* Image section */}
              <View style={styles.imageWrap}>
                {cover ? (
                  <Image
                    source={{ uri: cover }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={[styles.image, styles.imageFallback]} />
                )}

                {/* Bottom gradient for readability */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.5)']}
                  style={styles.imageGrad}
                  pointerEvents="none"
                />

                {/* Orange offer pill — bottom left */}
                <View style={styles.offerPill}>
                  <View style={styles.offerIconWrap}>
                    <Percent color="#FFFFFF" size={9} strokeWidth={3.5} />
                  </View>
                  <Text style={styles.offerText} numberOfLines={1}>
                    {offerLabel}
                  </Text>
                </View>

                {/* Heart — top right */}
                <Pressable
                  style={styles.heartBtn}
                  hitSlop={10}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFav(item.id);
                  }}
                >
                  <Heart
                    size={20}
                    color={isFav ? '#F97316' : '#FFFFFF'}
                    fill={isFav ? '#F97316' : 'transparent'}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>

              {/* Details */}
              <View style={styles.details}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.ratingRow}>
                  <Star
                    size={13}
                    color="#F97316"
                    fill="#F97316"
                    strokeWidth={0}
                  />
                  <Text style={styles.ratingText}>
                    {rating.toFixed(1)}
                    {reviewCount ? ` (${reviewCount})` : ''}
                  </Text>
                </View>
                <Text style={styles.subLine} numberOfLines={1}>
                  {cost} · {cuisines}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: '#111827',
    letterSpacing: -0.4,
  },
  seeAllBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── List ──
  listContent: {
    paddingHorizontal: 16,
    gap: 14,
    paddingBottom: 4,
  },

  // ── Card ──
  card: {
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // ── Image ──
  imageWrap: {
    width: '100%',
    height: 140,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: '#F3F4F6',
  },
  imageGrad: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },

  // ── Offer pill ──
  offerPill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F97316',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  offerIconWrap: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },

  // ── Heart ──
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Details ──
  details: {
    padding: 12,
    paddingTop: 10,
    gap: 3,
  },
  name: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: '#111827',
    letterSpacing: -0.2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: '#F97316',
  },
  subLine: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: '#6B7280',
  },
});
