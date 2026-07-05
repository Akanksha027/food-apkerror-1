import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Search, UtensilsCrossed } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/common/StateViews';
import { RestaurantListCard } from '@/components/restaurant/RestaurantListCard';
import { authTheme } from '@/constants/auth-theme';
import {
  findCategoryBySlug,
  FOOD_CATEGORIES,
  restaurantMatchesCategory,
} from '@/lib/restaurant/categories';
import { useNearbyRestaurants, useRestaurants } from '@/lib/restaurant/hooks';

type Tab = 'all' | 'nearby';

export function RestaurantBrowseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; cuisine?: string }>();

  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState(params.q ?? '');
  const [selectedCuisine, setSelectedCuisine] = useState(params.cuisine ?? '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const activeCategory = findCategoryBySlug(selectedCuisine);

  useEffect(() => {
    if (params.q) setSearch(params.q);
  }, [params.q]);

  useEffect(() => {
    if (params.cuisine) setSelectedCuisine(params.cuisine);
  }, [params.cuisine]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setCoords({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    })();
  }, []);

  const allQuery = useRestaurants({
    search: search.trim() || undefined,
    cuisine: selectedCuisine || undefined,
    limit: 20,
  });

  const nearbyQuery = useNearbyRestaurants(
    coords ? { lat: coords.lat, lng: coords.lng, limit: 20 } : null
  );

  const activeQuery = tab === 'nearby' ? nearbyQuery : allQuery;
  const restaurants = activeQuery.data?.restaurants ?? [];

  const filteredNearby = useMemo(() => {
    let list = restaurants;
    if (selectedCuisine) {
      list = list.filter((r) => restaurantMatchesCategory(r, selectedCuisine));
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisines?.some((c) => c.toLowerCase().includes(q))
    );
  }, [restaurants, search, selectedCuisine]);

  const displayList = tab === 'nearby' ? filteredNearby : restaurants;

  const openRestaurant = (id: string) => {
    router.push({
      pathname: '/restaurants/[restaurantId]/index' as const,
      params: { restaurantId: id },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader
          title={activeCategory ? activeCategory.label : 'Restaurants'}
          subtitle={
            activeCategory
              ? `${activeCategory.label} restaurants near you`
              : 'Discover food near you'
          }
        />

        <View style={styles.searchBar}>
          <Search color={authTheme.brand} size={18} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search restaurants or cuisines"
            placeholderTextColor={authTheme.textDim}
            returnKeyType="search"
          />
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'all' && styles.tabActive]}
            onPress={() => setTab('all')}
          >
            <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>
              All restaurants
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'nearby' && styles.tabActive]}
            onPress={() => setTab('nearby')}
          >
            <MapPin color={tab === 'nearby' ? '#FFFFFF' : authTheme.brand} size={14} />
            <Text style={[styles.tabText, tab === 'nearby' && styles.tabTextActive]}>
              Nearby
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <Pressable
            style={[styles.categoryChip, !selectedCuisine && styles.categoryChipActive]}
            onPress={() => setSelectedCuisine('')}
          >
            <Text
              style={[
                styles.categoryChipText,
                !selectedCuisine && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
          {FOOD_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.slug}
              style={[
                styles.categoryChip,
                selectedCuisine === cat.slug && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCuisine(cat.slug)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCuisine === cat.slug && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {tab === 'nearby' && locationError ? (
          <Text style={styles.locationHint}>{locationError}</Text>
        ) : null}

        {activeQuery.isLoading ? (
          <LoadingView label="Finding restaurants…" />
        ) : activeQuery.isError ? (
          <ErrorView
            message={
              activeQuery.error instanceof Error
                ? activeQuery.error.message
                : 'Failed to load'
            }
            onRetry={() => activeQuery.refetch()}
          />
        ) : displayList.length === 0 ? (
          <EmptyView
            icon={<UtensilsCrossed color={authTheme.textDim} size={44} />}
            title={
              activeCategory
                ? `No ${activeCategory.label} restaurants yet`
                : 'No restaurants yet'
            }
            subtitle={
              activeCategory
                ? `We're adding ${activeCategory.label.toLowerCase()} partners soon. Try another category or check back later.`
                : tab === 'nearby'
                  ? 'No restaurants found near your location. Try All restaurants or check back soon.'
                  : 'Restaurants will appear here once partners join the platform.'
            }
          />
        ) : (
          <FlatList
            data={displayList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={activeQuery.isRefetching}
                onRefresh={() => activeQuery.refetch()}
                tintColor={authTheme.brand}
              />
            }
            renderItem={({ item }) => (
              <RestaurantListCard
                restaurant={item}
                onPress={() => openRestaurant(item.id)}
              />
            )}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: authTheme.card,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: authTheme.text,
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: authTheme.card,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
  },
  tabActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  tabText: {
    color: authTheme.text,
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  locationHint: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: authTheme.card,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
  },
  categoryChipActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  categoryChipText: {
    color: authTheme.text,
    fontWeight: '600',
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingBottom: 24,
  },
});
