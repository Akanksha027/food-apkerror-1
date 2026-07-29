import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
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
import { PopularRestaurantsSection } from '@/components/home/PopularRestaurantsSection';
import { TopRatedNearYou } from '@/components/home/TopRatedNearYou';
import { HomeFilterChips } from '@/components/home/HomeFilterChips';
import { AutoScrollingDeals } from '@/components/home/AutoScrollingDeals';
import { SwiggyHomeChrome } from '@/components/home/SwiggyHomeChrome';
import { VegModeModal } from '@/components/home/VegModeModal';
import {
  MIND_CATEGORIES,
  WhatsOnYourMind,
} from '@/components/home/WhatsOnYourMind';
import { DeliveryLocationPicker } from '@/components/location/DeliveryLocationPicker';
import { InitialLocationSheet } from '@/components/location/InitialLocationSheet';
import { OnboardingPrompt } from '@/components/customer/OnboardingPrompt';
import { CustomerRecommendations } from '@/components/customer/CustomerRecommendations';
import { APP_BOTTOM_NAV_INSET } from '@/components/navigation/AppBottomNav';
import { CartFloatingBar } from '@/components/order/CartFloatingBar';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { addressApi } from '@/lib/address/api';
import { formatAddressLabel } from '@/lib/address/types';
import {
  useCustomerProfile,
  useDeals,
  useHomeFeed,
  useOffersFeed,
  useOnboardingStatus,
} from '@/lib/customer/hooks';
import { useFavoriteToggle } from '@/lib/customer/useFavoriteToggle';
import { useHomeDiscovery } from '@/lib/home/hooks';
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
import { useAuthStore } from '@/store/auth-store';
import {
  useDeliveryCoords,
  useDeliveryLocationStore,
} from '@/store/delivery-location-store';
import {
  type VegMode,
  useVegPreferenceStore,
} from '@/store/veg-preference-store';

const HOME_BG = '#FFFFFF';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [vegModalOpen, setVegModalOpen] = useState(false);
  const [hasPromptedLocation, setHasPromptedLocation] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [mindPinned, setMindPinned] = useState(false);
  const [savePrompt, setSavePrompt] = useState<{
    label: string;
    formattedAddress: string;
    city?: string;
    lat: number;
    lng: number;
    source: 'gps' | 'search';
  } | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const vegMode = useVegPreferenceStore((s) => s.mode);
  const setVegMode = useVegPreferenceStore((s) => s.setMode);

  const scrollY = useSharedValue(0);
  /** Y offset in the list where mind *items* begin (title already above this). */
  const pinAt = useSharedValue(0);

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
  const onboarding = useOnboardingStatus();
  const discovery = useHomeDiscovery(city);
  const { favoriteIds, toggleFavorite } = useFavoriteToggle();

  const greeting =
    user?.firstName?.trim() || user?.email?.split('@')[0] || 'foodie';

  const mindCategories = useMemo(() => {
    const fromApi = (discovery.data?.categories ?? []).filter(
      (c) => c.slug !== 'all' && c.imageUrl
    );
    return fromApi.length >= 4 ? fromApi : MIND_CATEGORIES;
  }, [discovery.data?.categories]);

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

    let matched = rows.filter((r) => restaurantMatchesCity(r, city));
    if (matched.length === 0) {
      const hasLocationFields = rows.some((r) => r.city || r.address);
      if (!hasLocationFields) matched = rows;
      else return [];
    }

    if (vegMode === 'pure_veg') {
      matched = matched.filter((r) => r.isPureVeg === true);
    }

    if (activeFilter === 'fast') {
      matched = [...matched].sort((a, b) => {
        const ta = parseInt(String(a.deliveryTime || '40'), 10) || 40;
        const tb = parseInt(String(b.deliveryTime || '40'), 10) || 40;
        return ta - tb;
      });
    } else if (activeFilter === 'rating') {
      matched = matched.filter((r) => (r.rating ?? 0) >= 4);
    } else if (activeFilter === 'offers' || activeFilter === 'min_off') {
      matched = [...matched].sort((a, b) => {
        const ao = a.offer ? 0 : 1;
        const bo = b.offer ? 0 : 1;
        return ao - bo;
      });
    }

    return matched;
  }, [feed.data?.pages, city, vegMode, activeFilter]);

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
    onboarding.refetch();
    discovery.refetch();
  };

  const onVegApply = (mode: VegMode) => {
    setVegMode(mode);
  };

  const onFilterPress = (id: string) => {
    setActiveFilter((prev) => (prev === id ? null : id));
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useAnimatedReaction(
    () => pinAt.value > 0 && scrollY.value >= pinAt.value - insets.top,
    (isPinned, prev) => {
      if (isPinned !== prev) {
        runOnJS(setMindPinned)(!!isPinned);
      }
    },
    [insets.top]
  );

  const pinOverlayStyle = useAnimatedStyle(() => {
    const show = pinAt.value > 0 && scrollY.value >= pinAt.value - insets.top;
    return { opacity: show ? 1 : 0 };
  });

  const inlineMindStyle = useAnimatedStyle(() => {
    const show = !(pinAt.value > 0 && scrollY.value >= pinAt.value - insets.top);
    return { opacity: show ? 1 : 0 };
  });

  useEffect(() => {
    return () => setMindPinned(false);
  }, []);

  const onConfirmLocation = async (result: {
    lat: number;
    lng: number;
    formattedAddress: string;
    label: string;
    source: 'gps' | 'search' | 'saved';
    savedAddressId?: string;
  }) => {
    setPickerOpen(false);
    setHasPromptedLocation(true);

    if (result.source === 'saved') {
      setDeliveryLocation({
        label: result.label,
        formattedAddress: result.formattedAddress,
        city: normalizeCityName(
          extractCityFromAddress(result.formattedAddress)
        ),
        lat: result.lat,
        lng: result.lng,
        source: 'saved',
        savedAddressId: result.savedAddressId,
        updatedAt: Date.now(),
      });
      return;
    }

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
      const cityName = normalizeCityName(loc.city);
      if (cityName) next.city = cityName;
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

  const showInitialSheet = !hasPromptedLocation && !isDetectingLocation && !pickerOpen;

  const initialSheet = (
    <InitialLocationSheet
      visible={showInitialSheet}
      onManual={() => setPickerOpen(true)}
      onClose={() => setHasPromptedLocation(true)}
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

  const chrome = (
    <SwiggyHomeChrome
      topInset={insets.top}
      greeting={greeting}
      deliveryTitle={deliveryTitle}
      deliverySubtitle={deliverySubtitle}
      isDetectingLocation={isDetectingLocation}
      onLocationPress={() => setPickerOpen(true)}
      vegActive={vegMode === 'pure_veg'}
      onVegPress={() => setVegModalOpen(true)}
      banners={offers.data?.banners ?? home.data?.banners}
      deals={offers.data?.deals ?? deals.data}
      activeFilter={activeFilter}
      onFilterPress={onFilterPress}
    />
  );

  /**
   * Title scrolls away with content above.
   * Only the mind *items* pin when they reach the top (shrunk overlay).
   */
  const listHeader = (
    <View>
      <View
        onLayout={(e) => {
          pinAt.value = e.nativeEvent.layout.height;
        }}
      >
        {chrome}

        {restaurants.length > 0 ? (
          <TopRatedNearYou 
            restaurants={restaurants.slice(0, 10)} 
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
        ) : null}

        <Text style={styles.mindTitle}>What&apos;s on your mind?</Text>

        {!city && !isDetectingLocation ? (
          <View style={[styles.paddedBlock, styles.hintCard]}>
            <Text style={styles.hintText}>
              Set your delivery location above to see restaurants in your city.
            </Text>
          </View>
        ) : null}

        {feed.isError ? (
          <View style={[styles.paddedBlock, styles.errorWrap]}>
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

      <Animated.View
        style={inlineMindStyle}
        pointerEvents={mindPinned ? 'none' : 'auto'}
      >
        <WhatsOnYourMind categories={mindCategories} hideTitle />
      </Animated.View>

      <AutoScrollingDeals deals={deals.data || []} />

      <HomeFilterChips
        activeFilter={activeFilter}
        onFilterPress={onFilterPress}
      />

      <CustomerRecommendations />

      {restaurants.length > 0 || (feed.isLoading && !!city) ? (
        <PopularRestaurantsSection
          restaurants={restaurants}
          totalCount={
            feed.data?.pages?.[0]?.meta?.total ?? restaurants.length
          }
          favoriteIds={favoriteIds}
          onToggleFavorite={(id) => {
            const r = restaurants.find((x) => x.id === id);
            toggleFavorite(id, r ? { restaurant: r } : undefined);
          }}
          onPressRestaurant={openRestaurant}
          loadingMore={feed.isFetchingNextPage}
          loading={feed.isLoading && restaurants.length === 0}
        />
      ) : null}
    </View>
  );

  if (feed.isLoading && restaurants.length === 0 && city) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        {chrome}
        <LoadingView label="Finding restaurants near you…" />
        {locationPicker}
        {initialSheet}
        {saveLabelModal}
        <VegModeModal
          visible={vegModalOpen}
          onClose={() => setVegModalOpen(false)}
          onApply={onVegApply}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Animated.FlatList
        data={[] as { key: string }[]}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) {
            feed.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 28 + APP_BOTTOM_NAV_INSET,
          flexGrow: 1,
        }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !feed.isLoading && restaurants.length === 0 && !!city ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {vegMode === 'pure_veg'
                  ? `No pure veg restaurants in ${city}`
                  : `No restaurants in ${city} yet`}
              </Text>
              <Text style={styles.emptyText}>
                {vegMode === 'pure_veg'
                  ? 'Try “All restaurants” in the VEG filter, or pull to refresh.'
                  : 'Partners in your city will appear here once they register. Pull to refresh.'}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={authTheme.brand}
            progressViewOffset={insets.top}
          />
        }
        renderItem={() => null}
      />

      {/* Sticky mind items only (title does NOT stick) */}
      <Animated.View
        style={[
          styles.pinOverlay,
          { paddingTop: insets.top },
          pinOverlayStyle,
        ]}
        pointerEvents={mindPinned ? 'auto' : 'none'}
      >
        <WhatsOnYourMind categories={mindCategories} compact hideTitle />
      </Animated.View>

      {locationPicker}
      {initialSheet}
      {saveLabelModal}
      <VegModeModal
        visible={vegModalOpen}
        onClose={() => setVegModalOpen(false)}
        onApply={onVegApply}
      />

      <View style={{ position: 'absolute', bottom: Math.max(insets.bottom, 16), left: 0, right: 0, zIndex: 1000 }}>
        <OnboardingPrompt />
      </View>

      <CartFloatingBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HOME_BG,
  },
  mindTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: '#02060C',
    letterSpacing: -0.4,
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 4,
  },
  pinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  paddedBlock: {
    paddingHorizontal: 16,
  },
  hintCard: {
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: authTheme.brandSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: authTheme.brandMuted,
  },
  hintText: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: authTheme.brand,
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
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: authTheme.text,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    fontFamily: fonts.ui,
    fontSize: 13,
    color: authTheme.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});
