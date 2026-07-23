import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Leaf,
  Search,
  Store,
  TrendingUp,
  UtensilsCrossed,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { useRecentActivity } from '@/lib/customer/hooks';
import { FOOD_CATEGORIES } from '@/lib/restaurant/categories';
import {
  useDebouncedValue,
  usePrefetchSearchCatalog,
  useSearchCombined,
  useSearchSuggestions,
} from '@/lib/search/hooks';
import {
  clearLocalRecentSearches,
  loadLocalRecentSearches,
  pushLocalRecentSearch,
  removeLocalRecentSearch,
} from '@/lib/search/recent';
import type {
  SearchDish,
  SearchRestaurant,
  SearchSuggestion,
} from '@/lib/search/types';

const POPULAR = FOOD_CATEGORIES.filter((c) => c.slug !== 'all').slice(0, 10);

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) {
    return (
      <Text style={styles.rowTitle} numberOfLines={1}>
        {text}
      </Text>
    );
  }

  const lower = text.toLowerCase();
  const index = lower.indexOf(q.toLowerCase());
  if (index < 0) {
    return (
      <Text style={styles.rowTitle} numberOfLines={1}>
        {text}
      </Text>
    );
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + q.length);
  const after = text.slice(index + q.length);

  return (
    <Text style={styles.rowTitle} numberOfLines={1}>
      {before}
      <Text style={styles.rowTitleMatch}>{match}</Text>
      {after}
    </Text>
  );
}

export function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const inputRef = useRef<TextInput>(null);

  const initialQ = typeof params.q === 'string' ? params.q : '';
  const [query, setQuery] = useState(initialQ);
  const [vegOnly, setVegOnly] = useState(false);
  const [localRecent, setLocalRecent] = useState<string[]>([]);

  const debounced = useDebouncedValue(query.trim(), 180);
  const recentQuery = useRecentActivity();
  usePrefetchSearchCatalog();

  useEffect(() => {
    if (typeof params.q === 'string') setQuery(params.q);
  }, [params.q]);

  useEffect(() => {
    let alive = true;
    loadLocalRecentSearches().then((items) => {
      if (alive) setLocalRecent(items);
    });
    const timer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const combined = useSearchCombined(
    {
      q: debounced,
      veg: vegOnly || undefined,
      limit: 30,
    },
    { enabled: debounced.length >= 1 }
  );

  const suggestions = useSearchSuggestions(
    { q: debounced, limit: 8 },
    { enabled: debounced.length >= 1 }
  );

  const remember = useCallback(async (term: string) => {
    const next = await pushLocalRecentSearch(term);
    setLocalRecent(next);
  }, []);

  const applyQuery = useCallback(
    (term: string) => {
      const cleaned = term.trim();
      setQuery(cleaned);
      if (cleaned.length >= 1) void remember(cleaned);
    },
    [remember]
  );

  const openRestaurant = (id: string, name?: string) => {
    if (!id) return;
    void remember(name || query.trim());
    Keyboard.dismiss();
    router.push({
      pathname: '/restaurants/[restaurantId]',
      params: { restaurantId: id },
    });
  };

  const openDish = (dish: SearchDish) => {
    if (!dish.restaurantId) return;
    void remember(dish.name);
    Keyboard.dismiss();
    router.push({
      pathname: '/restaurants/[restaurantId]',
      params: {
        restaurantId: dish.restaurantId,
        ...(dish.id ? { itemId: dish.id } : {}),
        itemName: dish.name,
        ...(dish.categoryId ? { menuCategoryId: dish.categoryId } : {}),
        ...(dish.categoryName ? { menuCategory: dish.categoryName } : {}),
      },
    });
  };

  const recentTerms = useMemo(() => {
    const server = recentQuery.data?.recentSearches ?? [];
    const merged = [
      ...localRecent,
      ...server.filter(
        (term) =>
          !localRecent.some((local) => local.toLowerCase() === term.toLowerCase())
      ),
    ];
    return merged.slice(0, 10);
  }, [localRecent, recentQuery.data?.recentSearches]);

  const restaurants = combined.data?.restaurants ?? [];
  const dishes = useMemo(() => {
    const list = combined.data?.dishes ?? [];
    if (!vegOnly) return list;
    return list.filter((d) => d.isVeg !== false);
  }, [combined.data?.dishes, vegOnly]);

  const suggestionList = suggestions.data?.suggestions ?? [];
  const showIdle = query.trim().length === 0;
  const isLoading = combined.isFetching && restaurants.length === 0 && dishes.length === 0;
  const hasResults = restaurants.length > 0 || dishes.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Swiggy/Zomato sticky search header */}
        <View style={styles.searchHeader}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={10}
            accessibilityLabel="Go back"
          >
            <ChevronLeft color={authTheme.text} size={24} strokeWidth={2.2} />
          </Pressable>

          <View style={styles.searchField}>
            <Search color={authTheme.brand} size={18} strokeWidth={2.4} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Search for restaurants, dishes..."
              placeholderTextColor="#9AA3B2"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
              onSubmitEditing={() => {
                if (query.trim()) {
                  void remember(query.trim());
                  Keyboard.dismiss();
                }
              }}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                style={styles.clearBtn}
                accessibilityLabel="Clear"
              >
                <X color="#64748B" size={16} strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.toolRow}>
          <Pressable
            onPress={() => setVegOnly((v) => !v)}
            style={[styles.vegToggle, vegOnly && styles.vegToggleOn]}
          >
            <Leaf
              color={vegOnly ? '#15803D' : '#64748B'}
              size={14}
              strokeWidth={2.4}
            />
            <Text style={[styles.vegToggleText, vegOnly && styles.vegToggleTextOn]}>
              Pure Veg
            </Text>
          </Pressable>
          {debounced.length > 0 && (restaurants.length > 0 || dishes.length > 0) ? (
            <Text style={styles.resultHint}>
              {restaurants.length + dishes.length} results
            </Text>
          ) : null}
        </View>

        {showIdle ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {recentTerms.length > 0 ? (
              <View style={styles.block}>
                <View style={styles.blockHeader}>
                  <Text style={styles.blockTitle}>Recent searches</Text>
                  <Pressable
                    onPress={async () => {
                      await clearLocalRecentSearches();
                      setLocalRecent([]);
                    }}
                    hitSlop={8}
                  >
                    <Text style={styles.clearAll}>Clear all</Text>
                  </Pressable>
                </View>
                {recentTerms.map((term) => (
                  <Pressable
                    key={term}
                    style={styles.recentRow}
                    onPress={() => applyQuery(term)}
                    onLongPress={async () => {
                      const next = await removeLocalRecentSearch(term);
                      setLocalRecent(next);
                    }}
                  >
                    <View style={styles.recentIcon}>
                      <Clock color="#64748B" size={16} />
                    </View>
                    <Text style={styles.recentText}>{term}</Text>
                    <ChevronRight color="#CBD5E1" size={16} />
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <TrendingUp color={authTheme.brand} size={16} />
                <Text style={[styles.blockTitle, { marginBottom: 0 }]}>
                  Popular cuisines
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.popularRow}
              >
                {POPULAR.map((cat) => (
                  <Pressable
                    key={cat.slug}
                    style={styles.popularCard}
                    onPress={() => applyQuery(cat.label)}
                  >
                    <Image
                      source={{ uri: cat.imageUrl }}
                      style={styles.popularImage}
                      contentFit="cover"
                    />
                    <Text style={styles.popularLabel} numberOfLines={1}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {/* Instant typeahead suggestions */}
            {suggestionList.length > 0 ? (
              <View style={styles.block}>
                {suggestionList.map((item) => (
                  <SuggestionRow
                    key={item.id}
                    item={item}
                    query={debounced}
                    onPress={() => {
                      if (item.restaurantId && item.type === 'restaurant') {
                        openRestaurant(item.restaurantId, item.text);
                        return;
                      }
                      if (item.restaurantId && item.dishId) {
                        openDish({
                          id: item.dishId,
                          name: item.text,
                          price: 0,
                          restaurantId: item.restaurantId,
                        });
                        return;
                      }
                      applyQuery(item.text);
                    }}
                  />
                ))}
              </View>
            ) : null}

            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={authTheme.brand} />
                <Text style={styles.loadingText}>Finding matches…</Text>
              </View>
            ) : null}

            {!isLoading && !hasResults && debounced.length >= 1 ? (
              <View style={styles.emptyBox}>
                <Search color="#94A3B8" size={36} />
                <Text style={styles.emptyTitle}>
                  No matches for “{debounced}”
                </Text>
                <Text style={styles.emptySub}>
                  Try a restaurant name, or a dish that restaurants actually serve
                </Text>
              </View>
            ) : null}

            {restaurants.length > 0 && dishes.length === 0 && !isLoading ? (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  Showing restaurants that have “{debounced}” in their menu
                  categories
                </Text>
              </View>
            ) : null}

            {restaurants.length > 0 ? (
              <View style={styles.block}>
                <Text style={styles.sectionLabel}>RESTAURANTS</Text>
                {restaurants.map((restaurant) => (
                  <RestaurantRow
                    key={restaurant.id}
                    restaurant={restaurant}
                    query={debounced}
                    onPress={() =>
                      openRestaurant(restaurant.id, restaurant.name)
                    }
                  />
                ))}
              </View>
            ) : null}

            {dishes.length > 0 ? (
              <View style={styles.block}>
                <Text style={styles.sectionLabel}>DISHES</Text>
                {dishes.map((dish) => (
                  <DishRow
                    key={`${dish.restaurantId}-${dish.id}`}
                    dish={dish}
                    query={debounced}
                    onPress={() => openDish(dish)}
                  />
                ))}
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function SuggestionRow({
  item,
  query,
  onPress,
}: {
  item: SearchSuggestion;
  query: string;
  onPress: () => void;
}) {
  const isRestaurant = item.type === 'restaurant';
  const isDish = item.type === 'dish' || item.type === 'item';

  return (
    <Pressable style={styles.typeaheadRow} onPress={onPress}>
      <View style={styles.typeaheadIcon}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.typeaheadImage}
            contentFit="cover"
          />
        ) : isRestaurant ? (
          <Store color={authTheme.brand} size={18} />
        ) : isDish ? (
          <UtensilsCrossed color={authTheme.brand} size={18} />
        ) : (
          <Search color={authTheme.brand} size={18} />
        )}
      </View>
      <View style={styles.typeaheadCopy}>
        {highlightMatch(item.text, query)}
        <Text style={styles.rowMeta}>
          {isRestaurant ? 'Restaurant' : isDish ? 'Dish' : 'Search'}
        </Text>
      </View>
      <ChevronRight color="#CBD5E1" size={16} />
    </Pressable>
  );
}

function RestaurantRow({
  restaurant,
  query,
  onPress,
}: {
  restaurant: SearchRestaurant;
  query: string;
  onPress: () => void;
}) {
  const image = restaurant.imageUrl || restaurant.coverUrl;
  const cuisines = restaurant.cuisines?.slice(0, 2).join(', ');

  return (
    <Pressable style={styles.resultCard} onPress={onPress}>
      <View style={styles.resultThumbWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.resultThumb} contentFit="cover" />
        ) : (
          <LinearGradient colors={['#FEE2D5', '#FED7C3']} style={styles.resultThumb}>
            <Store color="#C4520A" size={22} />
          </LinearGradient>
        )}
      </View>
      <View style={styles.resultCopy}>
        {highlightMatch(restaurant.name, query)}
        {cuisines ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {cuisines}
          </Text>
        ) : restaurant.city ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {restaurant.city}
          </Text>
        ) : null}
        <View style={styles.metaChips}>
          {typeof restaurant.rating === 'number' && restaurant.rating > 0 ? (
            <Text style={styles.ratingChip}>★ {restaurant.rating.toFixed(1)}</Text>
          ) : null}
          {typeof restaurant.priceForTwo === 'number' ? (
            <Text style={styles.rowMeta}>₹{restaurant.priceForTwo} for two</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function DishRow({
  dish,
  query,
  onPress,
}: {
  dish: SearchDish;
  query: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.resultCard} onPress={onPress}>
      <View style={styles.resultThumbWrap}>
        {dish.imageUrl ? (
          <Image
            source={{ uri: dish.imageUrl }}
            style={styles.resultThumb}
            contentFit="cover"
          />
        ) : (
          <LinearGradient colors={['#FEE2D5', '#FED7C3']} style={styles.resultThumb}>
            <UtensilsCrossed color="#C4520A" size={22} />
          </LinearGradient>
        )}
        {dish.isVeg !== undefined ? (
          <View
            style={[
              styles.vegBadge,
              { borderColor: dish.isVeg ? '#15803D' : '#B91C1C' },
            ]}
          >
            <View
              style={[
                styles.vegBadgeDot,
                { backgroundColor: dish.isVeg ? '#15803D' : '#B91C1C' },
              ]}
            />
          </View>
        ) : null}
      </View>
      <View style={styles.resultCopy}>
        {highlightMatch(dish.name, query)}
        {dish.restaurantName ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {dish.restaurantName}
          </Text>
        ) : null}
        <Text style={styles.price}>₹{Math.round(dish.price)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#ECECEE',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 0,
    fontWeight: '500',
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  vegToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  vegToggleOn: {
    backgroundColor: 'rgba(21,128,61,0.08)',
    borderColor: '#86EFAC',
  },
  vegToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  vegToggleTextOn: {
    color: '#15803D',
  },
  resultHint: {
    marginLeft: 'auto',
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  scroll: {
    paddingBottom: 48,
  },
  block: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  blockTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  clearAll: {
    color: authTheme.brand,
    fontSize: 13,
    fontWeight: '700',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  popularRow: {
    paddingHorizontal: 16,
    gap: 14,
  },
  popularCard: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  popularImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F4F4F5',
  },
  popularLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  typeaheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  typeaheadIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFF1F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  typeaheadImage: {
    width: 42,
    height: 42,
  },
  typeaheadCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  rowTitleMatch: {
    color: authTheme.brand,
    fontWeight: '800',
  },
  rowMeta: {
    color: '#64748B',
    fontSize: 12,
  },
  sectionLabel: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resultCard: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultThumbWrap: {
    position: 'relative',
  },
  resultThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCopy: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  metaChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  ratingChip: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  price: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  vegBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  noticeBox: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  noticeText: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});
