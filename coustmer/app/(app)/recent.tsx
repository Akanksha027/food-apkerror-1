import { Clock, Search } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { RestaurantCard } from '@/components/home/RestaurantCard';
import { authTheme } from '@/constants/auth-theme';
import { useRecentActivity } from '@/lib/customer/hooks';

export default function RecentScreen() {
  const { data, isLoading, isError, error, refetch } = useRecentActivity();

  const hasSearches = (data?.recentSearches.length ?? 0) > 0;
  const hasRestaurants = (data?.recentRestaurants.length ?? 0) > 0;
  const isEmpty = !hasSearches && !hasRestaurants;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader title="Recent activity" subtitle="Your latest browsing" />

        {isLoading ? (
          <LoadingView label="Loading recent activity…" />
        ) : isError ? (
          <ErrorView
            message={error instanceof Error ? error.message : 'Failed to load'}
            onRetry={refetch}
          />
        ) : isEmpty ? (
          <EmptyView
            icon={<Clock color={authTheme.textDim} size={40} />}
            title="Nothing recent"
            subtitle="Your recent searches and restaurants will show up here."
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {hasSearches ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent searches</Text>
                <View style={styles.chipRow}>
                  {data!.recentSearches.map((term, index) => (
                    <View key={`${term}-${index}`} style={styles.chip}>
                      <Search color={authTheme.textMuted} size={14} />
                      <Text style={styles.chipText}>{term}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {hasRestaurants ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recently viewed</Text>
                <View style={styles.cardList}>
                  {data!.recentRestaurants.map((restaurant, index) => (
                    <RestaurantCard
                      key={String(
                        restaurant.id ??
                          (restaurant as Record<string, unknown>)._id ??
                          index
                      )}
                      restaurant={restaurant}
                      fullWidth
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>
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
  scroll: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: authTheme.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: authTheme.card,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: authTheme.text,
    fontSize: 13,
  },
  cardList: {
    gap: 12,
  },
});
