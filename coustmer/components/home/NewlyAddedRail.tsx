import { Pressable } from '@/components/common/Pressable';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Star } from 'lucide-react-native';
import { FlatList,
  Platform,
  
  StyleSheet,
  Text,
  View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import type { HomeRestaurantCard } from '@/lib/home/types';

type Props = {
  restaurants: HomeRestaurantCard[];
  onPressRestaurant: (id: string) => void;
  loading?: boolean;
};

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={[styles.imageWrap, styles.skeletonBlock]} />
      <View style={[styles.skeletonLine, { width: '78%', marginTop: 10 }]} />
      <View style={[styles.skeletonLine, { width: '52%', marginTop: 6 }]} />
    </View>
  );
}

export function NewlyAddedRail({
  restaurants,
  onPressRestaurant,
  loading,
}: Props) {
  if (!loading && !restaurants.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Sparkles color="#FFF" size={14} fill="#FFF" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Newly added</Text>
          <Text style={styles.subtitle}>Fresh partners joining near you</Text>
        </View>
      </View>

      {loading && restaurants.length === 0 ? (
        <View style={styles.skeletonRow}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          horizontal
          data={restaurants}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          decelerationRate="fast"
          snapToInterval={156 + 14}
          snapToAlignment="start"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const cover = item.coverUrl || item.imageUrl || item.logoUrl;
            const rating =
              typeof item.rating === 'number' && item.rating > 0
                ? item.rating
                : null;

            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => {
                  if (item.id.startsWith('dummy-')) return;
                  onPressRestaurant(item.id);
                }}
              >
                <View style={styles.imageWrap}>
                  {cover ? (
                    <Image
                      source={{ uri: cover }}
                      style={styles.image}
                      contentFit="cover"
                      transition={180}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#AC0F45', '#AC0F45']}
                      style={styles.image}
                    />
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.55)']}
                    style={styles.scrim}
                  />
                  <View style={styles.newPill}>
                    <Text style={styles.newPillText}>
                      {item.badge || 'NEW'}
                    </Text>
                  </View>
                  {rating != null ? (
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                      <Star color="#FFF" fill="#FFF" size={9} />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.cuisines?.slice(0, 2).join(' · ') ||
                    item.deliveryTime ||
                    'Just listed'}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -16,
    marginVertical: 6,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: '#FFF8F6',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 90, 65,0.10)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: authTheme.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: authTheme.text,
    letterSpacing: -0.35,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: authTheme.textMuted,
  },
  list: {
    paddingHorizontal: 16,
    gap: 14,
    paddingBottom: 2,
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 14,
  },
  card: {
    width: 156,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  imageWrap: {
    width: 156,
    height: 128,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A1816',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  newPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: authTheme.brand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  newPillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ratingPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1BA672',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  name: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    color: authTheme.text,
    letterSpacing: -0.2,
  },
  meta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: authTheme.textMuted,
  },
  skeletonBlock: {
    backgroundColor: '#F1E4E0',
  },
  skeletonLine: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#F1E4E0',
  },
});
