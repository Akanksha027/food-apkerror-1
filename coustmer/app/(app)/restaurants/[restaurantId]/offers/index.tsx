import { Pressable } from '@/components/common/Pressable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Tag } from 'lucide-react-native';
import { FlatList,  StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/common/StateViews';
import { authTheme } from '@/constants/auth-theme';
import { useRestaurantOffers } from '@/lib/restaurant/hooks';

export default function RestaurantOffersPage() {
  const router = useRouter();
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const id = String(restaurantId ?? '');

  const { data, isLoading, isError, error, refetch } = useRestaurantOffers(id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader title="Restaurant offers" subtitle="Save on your order" />

        {isLoading ? (
          <LoadingView label="Loading offers…" />
        ) : isError ? (
          <ErrorView
            message={error instanceof Error ? error.message : 'Failed to load'}
            onRetry={refetch}
          />
        ) : !data?.length ? (
          <EmptyView
            icon={<Tag color={authTheme.textDim} size={40} />}
            title="No offers"
            subtitle="This restaurant has no active offers right now."
          />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/restaurants/[restaurantId]/offers/[offerId]',
                    params: { restaurantId: id, offerId: item.id },
                  })
                }
              >
                <Text style={styles.title}>{item.title}</Text>
                {item.code ? (
                  <Text style={styles.code}>Code: {item.code}</Text>
                ) : null}
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: authTheme.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  list: { gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 16,
  },
  title: { color: authTheme.text, fontSize: 16, fontWeight: '700' },
  code: { color: authTheme.brand, fontSize: 13, fontWeight: '700', marginTop: 6 },
});
