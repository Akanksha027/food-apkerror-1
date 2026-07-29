import { Pressable } from '@/components/common/Pressable';
import { useRouter } from 'expo-router';
import { FlatList,
  
  StyleSheet,
  Text,
  View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Star } from 'lucide-react-native';

import { fonts } from '@/constants/typography';
import type { Restaurant } from '@/lib/restaurant/types';

type Props = {
  restaurants: Restaurant[];
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
};

export function TopRatedNearYou({
  restaurants,
  favoriteIds = [],
  onToggleFavorite,
}: Props) {
  const router = useRouter();

  if (!restaurants || restaurants.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Top rated near you</Text>

      <FlatList
        data={restaurants}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isFav = favoriteIds.includes(item.id);
          const rating = item.rating || 4.2;
          const time = item.deliveryTime || '25-30 mins';
          const cuisines = item.cuisines?.slice(0, 2).join(', ') || 'North Indian';
          
          // Determine mock offer for visual replica of screenshot
          let bigOffer = '₹100 OFF';
          let smallOffer = 'ABOVE ₹999';
          if (item.name.toLowerCase().includes('fresh')) {
            bigOffer = '70% OFF';
            smallOffer = 'UPTO ₹140';
          } else if (item.name.toLowerCase().includes('nazeer')) {
            bigOffer = 'ITEMS';
            smallOffer = 'AT ₹35';
          }

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/restaurants/${item.id}`)}
            >
              <View style={styles.imageWrap}>
                {item.coverUrl || item.imageUrl ? (
                  <Image
                    source={{ uri: item.coverUrl || item.imageUrl }}
                    style={styles.image}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}

                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.gradient}
                >
                  <View style={styles.offerTextWrap}>
                    <Text style={styles.offerBig}>{bigOffer}</Text>
                    <Text style={styles.offerSmall}>{smallOffer}</Text>
                  </View>
                  <View style={styles.adBadge}>
                    <Text style={styles.adText}>AD</Text>
                  </View>
                </LinearGradient>

                <Pressable
                  style={styles.heartBtn}
                  hitSlop={8}
                  onPress={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(item.id);
                  }}
                >
                  <Heart
                    size={22}
                    color={isFav ? '#FF5A41' : '#FFFFFF'}
                    fill={isFav ? '#FF5A41' : 'transparent'}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>

              <View style={styles.details}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                
                <View style={styles.ratingRow}>
                  <View style={styles.starCircle}>
                    <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                  <Text style={styles.ratingText}>
                    {rating.toFixed(1)} • {time}
                  </Text>
                </View>

                <Text style={styles.cuisines} numberOfLines={1}>
                  {cuisines}
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
    marginVertical: 12,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: '#333333',
    paddingHorizontal: 16,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 140,
  },
  imageWrap: {
    width: 140,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    position: 'relative',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  offerTextWrap: {
    flex: 1,
  },
  offerBig: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  offerSmall: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  adBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adText: {
    fontFamily: fonts.uiBold,
    fontSize: 9,
    color: '#FFFFFF',
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  details: {
    paddingHorizontal: 2,
  },
  name: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  starCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#166534', // Green matching screenshot
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: '#1F2937',
  },
  cuisines: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: '#6B7280',
  },
});
