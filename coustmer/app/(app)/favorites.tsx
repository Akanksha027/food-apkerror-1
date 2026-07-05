import { Heart } from 'lucide-react-native';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { RestaurantCard } from '@/components/home/RestaurantCard';
import { authTheme } from '@/constants/auth-theme';
import { useFavorites, useRemoveFavorite } from '@/lib/customer/hooks';

export default function FavoritesScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useFavorites();
  const removeFavorite = useRemoveFavorite();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader
          title="Favorites"
          subtitle="Restaurants you love"
        />

        {isLoading ? (
          <LoadingView label="Loading favorites…" />
        ) : isError ? (
          <ErrorView
            message={error instanceof Error ? error.message : 'Failed to load'}
            onRetry={refetch}
          />
        ) : !data || data.length === 0 ? (
          <EmptyView
            icon={<Heart color={authTheme.textDim} size={40} />}
            title="No favorites yet"
            subtitle="Tap the heart on a restaurant to save it here."
          />
        ) : (
          <FlatList
            data={data}
            numColumns={2}
            keyExtractor={(item, index) =>
              String(item.id ?? (item as Record<string, unknown>)._id ?? index)
            }
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isRefetching}
            renderItem={({ item }) => {
              const id = String(
                item.id ?? (item as Record<string, unknown>)._id ?? ''
              );
              return (
                <View style={styles.cardWrap}>
                  <RestaurantCard
                    restaurant={item}
                    isFavorite
                    fullWidth
                    onToggleFavorite={() => removeFavorite.mutate(id)}
                    favoriteLoading={
                      removeFavorite.isPending &&
                      removeFavorite.variables === id
                    }
                  />
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  list: {
    paddingBottom: 24,
    gap: 12,
  },
  row: {
    gap: 12,
  },
  cardWrap: {
    flex: 1,
  },
});
