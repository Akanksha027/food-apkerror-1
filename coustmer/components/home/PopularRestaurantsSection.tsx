import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import {
  ExploreRestaurantCard,
  ExploreRestaurantSkeleton,
} from '@/components/home/ExploreRestaurantCard';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import type { Restaurant } from '@/lib/restaurant/types';

type Props = {
  restaurants: Restaurant[];
  totalCount?: number;
  favoriteIds?: string[];
  favoriteLoadingId?: string | null;
  onToggleFavorite?: (id: string) => void;
  onPressRestaurant?: (id: string) => void;
  loadingMore?: boolean;
  loading?: boolean;
};

export function PopularRestaurantsSection({
  restaurants,
  totalCount,
  favoriteIds = [],
  favoriteLoadingId = null,
  onToggleFavorite,
  onPressRestaurant,
  loadingMore,
  loading,
}: Props) {
  const count = totalCount ?? restaurants.length;
  const title =
    count > 0
      ? `Top ${count} restaurants to explore`
      : 'Top restaurants to explore';

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      {loading && restaurants.length === 0 ? (
        <View>
          <ExploreRestaurantSkeleton />
          <ExploreRestaurantSkeleton />
          <ExploreRestaurantSkeleton />
        </View>
      ) : (
        <View>
          {restaurants.map((item) => (
            <ExploreRestaurantCard
              key={item.id}
              restaurant={item}
              isFavorite={favoriteIds.includes(item.id)}
              favoriteLoading={favoriteLoadingId === item.id}
              onToggleFavorite={onToggleFavorite}
              onPress={
                onPressRestaurant ? () => onPressRestaurant(item.id) : undefined
              }
            />
          ))}
          {loadingMore ? (
            <View style={styles.moreWrap}>
              <ActivityIndicator color={authTheme.brand} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: '#02060C',
    letterSpacing: -0.3,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  moreWrap: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
