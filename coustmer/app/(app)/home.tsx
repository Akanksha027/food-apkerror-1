import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { SaveAddressLabelModal } from '@/components/address/SaveAddressLabelModal';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeStickyChrome } from '@/components/home/HomeStickyChrome';
import { OfferBannerTicker } from '@/components/home/OfferBannerTicker';
import { RestaurantFeedCard } from '@/components/home/RestaurantFeedCard';
import { DeliveryLocationPicker } from '@/components/location/DeliveryLocationPicker';
import { APP_BOTTOM_NAV_INSET } from '@/components/navigation/AppBottomNav';
import { authTheme } from '@/constants/auth-theme';
import { addressApi } from '@/lib/address/api';
import { formatAddressLabel } from '@/lib/address/types';
import {
  useAddFavorite,
  useCustomerProfile,
  useDeals,
  useHomeFeed,
  useOffersFeed,
  useRemoveFavorite,
} from '@/lib/customer/hooks';
import { useHomeDiscovery } from '@/lib/home/hooks';
import { homeCategoriesPinnedSV } from '@/lib/home/pin-shared';
import {
  deliveryHeaderSubtitle,
  deliveryHeaderTitle,
  extractCityFromAddress,
  isCoordinateFallbackAddress,
  normalizeCityName,
  restaurantMatchesCity,
} from '@/lib/location/format';
import { resolvePlaceFromCoords } from '@/lib/location/resolve-place';
import { useDeliveryLocationInit } from '@/lib/location/use-delivery-location-init';
import { parseDeliveryAddress } from '@/lib/order/parse-address';
import { useInfiniteRestaurants } from '@/lib/restaurant/hooks';
import type { Restaurant } from '@/lib/restaurant/types';
import { useAuthStore } from '@/store/auth-store';
import {
  useDeliveryCoords,
  useDeliveryLocationStore,
} from '@/store/delivery-location-store';
import { useUiStore } from '@/store/ui-store';

type FeedRow = { key: string; kind: 'restaurant'; restaurant: Restaurant };

function buildFeedRows(restaurants: Restaurant[]): FeedRow[] {
  return restaurants.map((restaurant) => ({
    key: `r-${restaurant.id}`,
    kind: 'restaurant' as const,
    restaurant,
  }));
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savePrompt, setSavePrompt] = useState<{
    label: string;
    formattedAddress: string;
    city?: string;
    lat: number;
    lng: number;
    source: 'gps' | 'search';
  } | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  /** StatusBar / pointerEvents only — visual pin is driven on the UI thread. */
  const [pinned, setPinned] = useState(false);
  const setHomeCategoriesPinned = useUiStore((s) => s.setHomeCategoriesPinned);

  const scrollY = useSharedValue(0);
  const pinAt = useSharedValue(0);

  const syncCategoriesPinned = (isPinned: boolean) => {
    setPinned(isPinned);
    setHomeCategoriesPinned(isPinned);
  };

  useEffect(() => {
    return () => {
      homeCategoriesPinnedSV.value = 0;
      setHomeCategoriesPinned(false);
    };
  }, [setHomeCategoriesPinned]);

  useDeliveryLocationInit();

  const deliveryLocation = useDeliveryLocationStore((s) => s.location);
  const isDetectingLocation = useDeliveryLocationStore((s) => s.isDetecting);
  const setDeliveryLocation = useDeliveryLocationStore((s) => s.setLocation);
  const coords = useDeliveryCoords();

  const city = useMemo(() => {
    const raw =
      deliveryLocation?.city ||
      (deliveryLocation?.formattedAddress
        ? extractCityFromAddress(deliveryLocation.formattedAddress)
        : null) ||
      null;
    return normalizeCityName(raw);
  }, [deliveryLocation]);

  const deliveryTitle = useMemo(() => {
    if (!deliveryLocation) return 'Set delivery address';
    if (
      isCoordinateFallbackAddress(deliveryLocation.formattedAddress) ||
      isCoordinateFallbackAddress(deliveryLocation.label)
    ) {
      return isDetectingLocation ? 'Detecting your location…' : 'Current location';
    }
    return deliveryHeaderTitle(
      deliveryLocation.label,
      deliveryLocation.formattedAddress
    );
  }, [deliveryLocation, isDetectingLocation]);

  const deliverySubtitle = useMemo(() => {
    if (!deliveryLocation) return '';
    if (
      isCoordinateFallbackAddress(deliveryLocation.formattedAddress) ||
      isCoordinateFallbackAddress(deliveryLocation.label)
    ) {
      return '';
    }
    return deliveryHeaderSubtitle(
      deliveryTitle,
      deliveryLocation.formattedAddress
    );
  }, [deliveryLocation, deliveryTitle]);

  const home = useHomeFeed();
  const deals = useDeals();
  const offers = useOffersFeed();
  const profile = useCustomerProfile();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const discovery = useHomeDiscovery(city);

  const feed = useInfiniteRestaurants(
    {
      city: city || undefined,
      sort: '-createdAt',
      limit: 12,
    },
    { enabled: Boolean(city) }
  );

  const restaurants = useMemo(() => {
    const rows = feed.data?.pages.flatMap((p) => p.restaurants) ?? [];
    if (!city) return [];

    const matched = rows.filter((r) => restaurantMatchesCity(r, city));
    if (matched.length > 0) return matched;

    const hasLocationFields = rows.some((r) => r.city || r.address);
    if (!hasLocationFields) return rows;

    return [];
  }, [feed.data?.pages, city]);

  /** Prefer API meta.total so the count includes pages not loaded yet. */
  const totalInCity = useMemo(() => {
    const pages = feed.data?.pages ?? [];
    for (let i = pages.length - 1; i >= 0; i -= 1) {
      const total = pages[i]?.meta?.total;
      if (typeof total === 'number' && total >= 0) return total;
    }
    return restaurants.length;
  }, [feed.data?.pages, restaurants.length]);

  const homeCategories = discovery.data?.categories ?? [];

  const feedRows = useMemo(() => buildFeedRows(restaurants), [restaurants]);

  const favoriteIds = profile.data?.favoriteRestaurants ?? [];
  const greeting =
    user?.firstName?.trim() || user?.email?.split('@')[0] || 'there';

  const toggleFavorite = (id: string) => {
    if (!id) return;
    if (favoriteIds.includes(id)) removeFavorite.mutate(id);
    else addFavorite.mutate(id);
  };

  const openRestaurant = (id: string) => {
    router.push({
      pathname: '/restaurants/[restaurantId]',
      params: { restaurantId: id },
    });
  };

  const refreshing =
    feed.isRefetching ||
    home.isRefetching ||
    deals.isRefetching ||
    offers.isRefetching ||
    discovery.isRefetching;

  const onRefresh = () => {
    feed.refetch();
    home.refetch();
    deals.refetch();
    offers.refetch();
    profile.refetch();
    discovery.refetch();
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useAnimatedReaction(
    () => pinAt.value > 0 && scrollY.value >= pinAt.value,
    (isPinned, prev) => {
      homeCategoriesPinnedSV.value = isPinned ? 1 : 0;
      if (isPinned !== prev) {
        runOnJS(syncCategoriesPinned)(isPinned);
      }
    }
  );

  const pinOverlayStyle = useAnimatedStyle(() => {
    const show = pinAt.value > 0 && scrollY.value >= pinAt.value;
    return {
      opacity: show ? 1 : 0,
    };
  });

  const inlineChromeStyle = useAnimatedStyle(() => {
    const show = !(pinAt.value > 0 && scrollY.value >= pinAt.value);
    return {
      opacity: show ? 1 : 0,
    };
  });

  const onConfirmLocation = async (result: {
    lat: number;
    lng: number;
    formattedAddress: string;
    label: string;
    source: 'gps' | 'search';
  }) => {
    setPickerOpen(false);

    const applyLocal = (loc: {
      label: string;
      formattedAddress: string;
      city?: string;
      lat: number;
      lng: number;
      source: 'gps' | 'search';
    }) => {
      const next: {
        label: string;
        formattedAddress: string;
        city?: string;
        lat: number;
        lng: number;
        source: 'gps' | 'search';
      } = {
        label: loc.label,
        formattedAddress: loc.formattedAddress,
        lat: loc.lat,
        lng: loc.lng,
        source: loc.source,
      };
      const city = normalizeCityName(loc.city);
      if (city) next.city = city;
      setDeliveryLocation({
        ...next,
        savedAddressId: undefined,
        updatedAt: Date.now(),
      });
      return next;
    };

    let applied: {
      label: string;
      formattedAddress: string;
      city?: string;
      lat: number;
      lng: number;
      source: 'gps' | 'search';
    } = {
      label: result.label,
      formattedAddress: result.formattedAddress,
      lat: result.lat,
      lng: result.lng,
      source: result.source,
    };
    const initialCity = normalizeCityName(
      extractCityFromAddress(result.formattedAddress)
    );
    if (initialCity) applied.city = initialCity;

    try {
      const resolved = await resolvePlaceFromCoords({
        lat: result.lat,
        lng: result.lng,
        source: result.source,
        preferredAddress: result.formattedAddress,
      });
      applied = applyLocal({
        label: resolved.label || result.label,
        formattedAddress: resolved.formattedAddress,
        city: normalizeCityName(resolved.city),
        lat: resolved.lat,
        lng: resolved.lng,
        source: result.source,
      });
    } catch {
      applied = applyLocal(applied);
    }

    if (!user) return;
    setSavePrompt(applied);
  };

  const closeSavePrompt = () => {
    if (savingAddress) return;
    setSavePrompt(null);
  };

  const onSaveAddressWithLabel = (payload: {
    label: 'home' | 'work' | 'other';
    displayLabel: string;
  }) => {
    if (!savePrompt || savingAddress) return;
    const applied = savePrompt;
    const parsed = parseDeliveryAddress({
      formattedAddress: applied.formattedAddress,
      label: payload.displayLabel,
      city: applied.city,
      lat: applied.lat,
      lng: applied.lng,
    });

    setSavingAddress(true);
    void addressApi
      .create({
        label: payload.label,
        formattedAddress: applied.formattedAddress,
        street: parsed.street,
        area: parsed.area,
        city: parsed.city,
        state: parsed.state,
        pincode: parsed.pincode,
        lat: applied.lat,
        lng: applied.lng,
        setAsDefault: true,
      })
      .then((saved) => {
        setDeliveryLocation({
          label:
            payload.displayLabel ||
            formatAddressLabel(saved.label) ||
            'Home',
          formattedAddress:
            saved.formattedAddress || applied.formattedAddress,
          city: normalizeCityName(
            saved.city ||
              extractCityFromAddress(
                saved.formattedAddress || applied.formattedAddress
              )
          ),
          lat: saved.lat || applied.lat,
          lng: saved.lng || applied.lng,
          source: 'saved',
          savedAddressId: saved.id,
          updatedAt: Date.now(),
        });
        setSavePrompt(null);
      })
      .catch((e) => {
        Alert.alert(
          'Could not save',
          e instanceof Error ? e.message : 'Try again from Profile'
        );
      })
      .finally(() => {
        setSavingAddress(false);
      });
  };

  const locationPicker = (
    <DeliveryLocationPicker
      visible={pickerOpen}
      initial={coords}
      autoDetectOnOpen
      onClose={() => setPickerOpen(false)}
      onConfirm={onConfirmLocation}
    />
  );

  const saveLabelModal = (
    <SaveAddressLabelModal
      visible={Boolean(savePrompt)}
      addressPreview={savePrompt?.formattedAddress}
      saving={savingAddress}
      onClose={closeSavePrompt}
      onSave={onSaveAddressWithLabel}
    />
  );

  const headerProps = {
    greeting,
    tier: profile.data?.tier,
    loyaltyPoints: profile.data?.loyaltyPoints,
    topInset: insets.top,
    deliveryTitle,
    deliverySubtitle,
    isDetectingLocation,
    onLocationPress: () => setPickerOpen(true),
    showSearch: true as const,
  };

  /**
   * Scroll order: red header (with search) → offers → categories.
   * Pin when categories hit the top; sticky overlay = search + categories.
   */
  const listHeader = (
    <View>
      <View
        onLayout={(e) => {
          pinAt.value = e.nativeEvent.layout.height;
        }}
      >
        <HomeHeader {...headerProps} />
        <OfferBannerTicker
          banners={offers.data?.banners ?? home.data?.banners}
          deals={offers.data?.deals ?? deals.data}
        />
      </View>

      {/* In-flow categories only — search is already in the red header */}
      <Animated.View
        style={inlineChromeStyle}
        pointerEvents={pinned ? 'none' : 'auto'}
      >
        <HomeStickyChrome
          categories={homeCategories}
          categoriesLoading={discovery.isLoading}
          topInset={0}
          elevated={false}
          showSearch={false}
          compactCategories={false}
        />
      </Animated.View>

      <View style={styles.paddedBlock}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>
            {city ? `Restaurants in ${city}` : 'Choose delivery city'}
          </Text>
          <Text style={styles.sectionSub}>
            {city
              ? `${totalInCity} place${totalInCity === 1 ? '' : 's'} in ${city}`
              : 'Set your location to see local restaurants'}
          </Text>
        </View>
        {!city && !isDetectingLocation ? (
          <View style={styles.hintCard}>
            <Text style={styles.hintText}>
              Set your delivery location above to see restaurants in your city.
            </Text>
          </View>
        ) : null}
        {feed.isError ? (
          <View style={styles.errorWrap}>
            <ErrorView
              message={
                feed.error instanceof Error
                  ? feed.error.message
                  : 'Could not load restaurants'
              }
              onRetry={() => feed.refetch()}
            />
          </View>
        ) : null}
      </View>
    </View>
  );

  if (feed.isLoading && restaurants.length === 0 && city) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <HomeHeader {...headerProps} showSearch />
        <LoadingView label="Finding restaurants near you…" />
        {locationPicker}
        {saveLabelModal}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style={pinned ? 'dark' : 'light'} />

      <Animated.FlatList
        data={feedRows}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{
          paddingBottom:
            insets.bottom + 28 + (pinned ? APP_BOTTOM_NAV_INSET : 0),
        }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !feed.isLoading && restaurants.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {city
                  ? `No restaurants in ${city} yet`
                  : 'No restaurants found'}
              </Text>
              <Text style={styles.emptyText}>
                {city
                  ? 'Partners in your city will appear here once they register. Pull to refresh.'
                  : 'Set your delivery location or pull to refresh.'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={authTheme.brand} />
              <Text style={styles.footerText}>Loading more…</Text>
            </View>
          ) : !feed.hasNextPage && restaurants.length > 0 ? (
            <Text style={styles.endText}>
              You&apos;ve seen all {totalInCity} restaurants
              {city ? ` in ${city}` : ''}
            </Text>
          ) : null
        }
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) {
            feed.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={authTheme.brand}
            progressViewOffset={insets.top}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.paddedBlock}>
            <RestaurantFeedCard
              restaurant={item.restaurant}
              isFavorite={favoriteIds.includes(item.restaurant.id)}
              onToggleFavorite={toggleFavorite}
              onPress={() => openRestaurant(item.restaurant.id)}
            />
          </View>
        )}
      />

      {/* Pinned overlay: search + categories (appears when categories hit top) */}
      <Animated.View
        style={[
          styles.pinOverlay,
          { paddingTop: insets.top },
          pinOverlayStyle,
        ]}
        pointerEvents={pinned ? 'auto' : 'none'}
      >
        <HomeStickyChrome
          categories={homeCategories}
          categoriesLoading={discovery.isLoading}
          topInset={0}
          elevated
          showSearch
          compactCategories
        />
      </Animated.View>

      {locationPicker}
      {saveLabelModal}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  pinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  paddedBlock: {
    paddingHorizontal: 16,
  },
  sectionHead: {
    marginTop: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: authTheme.text,
    letterSpacing: -0.3,
  },
  sectionSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: authTheme.textMuted,
  },
  hintCard: {
    marginBottom: 12,
    backgroundColor: authTheme.brandSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: authTheme.brandMuted,
  },
  hintText: {
    fontSize: 13,
    color: authTheme.brand,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorWrap: {
    marginBottom: 8,
  },
  emptyCard: {
    marginTop: 8,
    marginHorizontal: 16,
    padding: 28,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: authTheme.text,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: authTheme.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  footer: {
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: authTheme.textMuted,
    fontWeight: '600',
  },
  endText: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 12,
    color: authTheme.textDim,
    fontWeight: '600',
  },
});
