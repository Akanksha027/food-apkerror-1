import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeSection } from '@/components/home/HomeSection';
import { OnboardingCard } from '@/components/home/OnboardingCard';
import { QuickActions } from '@/components/home/QuickActions';
import { authTheme } from '@/constants/auth-theme';
import {
  useAddFavorite,
  useCustomerProfile,
  useHomeFeed,
  useRecommended,
  useRemoveFavorite,
} from '@/lib/customer/hooks';
import { useNearbyRestaurants } from '@/lib/restaurant/hooks';
import { useAuthStore } from '@/store/auth-store';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const home = useHomeFeed();
  const recommended = useRecommended();
  const profile = useCustomerProfile();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const nearby = useNearbyRestaurants(
    coords ? { lat: coords.lat, lng: coords.lng, limit: 10 } : null
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({});
      setCoords({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    })();
  }, []);

  const favoriteIds = profile.data?.favoriteRestaurants ?? [];

  const greeting =
    user?.firstName?.trim() || user?.email?.split('@')[0] || 'there';

  const toggleFavorite = (id: string) => {
    if (!id) return;
    if (favoriteIds.includes(id)) {
      removeFavorite.mutate(id);
    } else {
      addFavorite.mutate(id);
    }
  };

  const openRestaurant = (id: string) => {
    router.push({
      pathname: '/restaurants/[restaurantId]/index' as const,
      params: { restaurantId: id },
    });
  };

  const refreshing = home.isRefetching || recommended.isRefetching || nearby.isRefetching;
  const onRefresh = () => {
    home.refetch();
    recommended.refetch();
    profile.refetch();
    nearby.refetch();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {home.isLoading ? (
        <View style={styles.centered}>
          <HomeHeader
            greeting={greeting}
            tier={profile.data?.tier}
            loyaltyPoints={profile.data?.loyaltyPoints}
            topInset={insets.top}
          />
          <LoadingView label="Loading your home feed…" />
        </View>
      ) : home.isError ? (
        <View style={styles.centered}>
          <HomeHeader greeting={greeting} topInset={insets.top} />
          <ErrorView
            message={
              home.error instanceof Error ? home.error.message : 'Failed to load'
            }
            onRetry={() => home.refetch()}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 28 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={authTheme.brand}
              progressViewOffset={insets.top + 40}
            />
          }
        >
          <HomeHeader
            greeting={greeting}
            tier={profile.data?.tier}
            loyaltyPoints={profile.data?.loyaltyPoints}
            topInset={insets.top}
          />

          <QuickActions />

          <CategoryStrip />

          <BannerCarousel banners={home.data?.banners ?? []} />

          <OnboardingCard />

          <HomeSection
            title="Near you"
            subtitle="Restaurants close to your location"
            data={nearby.data?.restaurants ?? []}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onRestaurantPress={openRestaurant}
            emptyLabel="No nearby restaurants yet — explore all restaurants."
          />

          <HomeSection
            title="Trending now"
            subtitle="Most-loved spots this week"
            data={home.data?.trending ?? []}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onRestaurantPress={openRestaurant}
            emptyLabel="No trending restaurants yet — check back soon."
          />

          <HomeSection
            title="For you"
            subtitle="Handpicked based on your taste"
            data={home.data?.forYou ?? []}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onRestaurantPress={openRestaurant}
            emptyLabel="Personalised picks will appear here."
          />

          <HomeSection
            title="Recommended"
            subtitle="Powered by your activity"
            data={recommended.data ?? []}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onRestaurantPress={openRestaurant}
            emptyLabel="We'll recommend restaurants as you order."
          />

          <HomeSection
            title="Newly added"
            subtitle="Fresh kitchens near you"
            data={home.data?.newlyAdded ?? []}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onRestaurantPress={openRestaurant}
            emptyLabel="New restaurants are coming soon."
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  centered: {
    flex: 1,
  },
  scroll: {
    backgroundColor: authTheme.bg,
  },
});
