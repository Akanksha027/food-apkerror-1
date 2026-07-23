import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Clock,
  Heart,
  MapPin,
  MessageSquareQuote,
  Star,
  Tag,
  UtensilsCrossed,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { CartFloatingBar } from '@/components/order/CartFloatingBar';
import { MenuItemRow } from '@/components/restaurant/MenuItemRow';
import { RestaurantReviewsPanel } from '@/components/review/RestaurantReviewsPanel';
import { authTheme } from '@/constants/auth-theme';
import {
  useAddFavorite,
  useCustomerProfile,
  useRemoveFavorite,
} from '@/lib/customer/hooks';
import { addMenuItemToCart } from '@/lib/order/add-to-cart';
import {
  findCategoryBySlug,
  resolveMenuCategoryId,
} from '@/lib/restaurant/categories';
import {
  useFullMenu,
  useRestaurant,
  useRestaurantOffers,
} from '@/lib/restaurant/hooks';
import type { MenuItem } from '@/lib/restaurant/types';

type Tab = 'menu' | 'offers' | 'reviews';

export function RestaurantDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { restaurantId, category, cuisine } = useLocalSearchParams<{
    restaurantId: string;
    category?: string;
    cuisine?: string;
  }>();
  const id = String(restaurantId ?? '');
  const cuisineFilter = String(category ?? cuisine ?? '').trim();
  const foodCategory = findCategoryBySlug(cuisineFilter);

  const [tab, setTab] = useState<Tab>('menu');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const appliedCategoryFilter = useRef(false);

  const restaurant = useRestaurant(id);
  const menu = useFullMenu(id, {
    name: restaurant.data?.name,
    cuisines: restaurant.data?.cuisines,
  });
  const offers = useRestaurantOffers(id);
  const profile = useCustomerProfile();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const favoriteIds = profile.data?.favoriteRestaurants ?? [];
  const isFavorite = favoriteIds.includes(id);

  const categories = useMemo(() => {
    const fromApi = menu.categories;
    if (fromApi.length > 0) return fromApi;

    const unique = new Map<string, string>();
    menu.items.forEach((item) => {
      const catId = item.categoryId ?? item.categoryName ?? 'general';
      const catName = item.categoryName ?? 'Popular';
      unique.set(catId, catName);
    });
    return Array.from(unique.entries()).map(([catId, name]) => ({
      id: catId,
      name,
    }));
  }, [menu.categories, menu.items]);

  // Apply deep-link / browse cuisine filter once categories load from API.
  useEffect(() => {
    if (appliedCategoryFilter.current || !cuisineFilter || categories.length === 0) {
      return;
    }
    const resolved = resolveMenuCategoryId(categories, cuisineFilter);
    if (resolved) {
      setActiveCategory(resolved);
      appliedCategoryFilter.current = true;
    }
  }, [categories, cuisineFilter]);

  const activeCategoryLabel =
    activeCategory === 'all'
      ? null
      : categories.find((c) => c.id === activeCategory)?.name ??
        foodCategory?.label ??
        null;

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return menu.items;
    return menu.items.filter(
      (item) =>
        item.categoryId === activeCategory ||
        item.categoryName ===
          categories.find((c) => c.id === activeCategory)?.name
    );
  }, [activeCategory, menu.items, categories]);

  const groupedSections = useMemo(() => {
    if (activeCategory !== 'all') return null;
    const sections = categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        items: menu.items.filter(
          (item) =>
            item.categoryId === cat.id || item.categoryName === cat.name
        ),
      }))
      .filter((section) => section.items.length > 0);
    return sections.length > 0 ? sections : null;
  }, [activeCategory, categories, menu.items]);

  const toggleFavorite = () => {
    if (!id) return;
    if (isFavorite) removeFavorite.mutate(id);
    else addFavorite.mutate(id);
  };

  const openItem = (item: MenuItem) => {
    router.push({
      pathname: '/restaurants/[restaurantId]/items/[itemId]',
      params: { restaurantId: id, itemId: item.id },
    });
  };

  const addItem = (item: MenuItem) => {
    addMenuItemToCart(item, {
      id,
      name: restaurant.data?.name || 'Restaurant',
    });
  };

  const openOffer = (offerId: string) => {
    router.push({
      pathname: '/restaurants/[restaurantId]/offers/[offerId]',
      params: { restaurantId: id, offerId },
    });
  };

  if (restaurant.isLoading) {
    return <LoadingView label="Loading restaurant…" />;
  }

  if (restaurant.isError || !restaurant.data) {
    return (
      <View style={styles.errorWrap}>
        <ErrorView
          message={
            restaurant.error instanceof Error
              ? restaurant.error.message
              : 'Restaurant not found'
          }
          onRetry={restaurant.refetch}
        />
      </View>
    );
  }

  const r = restaurant.data;
  const cuisines = r.cuisines?.join(' • ');

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        <View style={styles.heroWrap}>
          {r.coverUrl || r.imageUrl ? (
            <Image
              source={{ uri: r.coverUrl ?? r.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={['#7A0E22', '#C2410C']}
              style={styles.heroImage}
            >
              <UtensilsCrossed color="rgba(255,255,255,0.5)" size={48} />
            </LinearGradient>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.2)']}
            style={styles.heroScrim}
          />

          <View style={[styles.heroActions, { top: insets.top + 8 }]}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <ChevronLeft color="#FFFFFF" size={22} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={toggleFavorite}>
              {addFavorite.isPending || removeFavorite.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Heart
                  color="#FFFFFF"
                  fill={isFavorite ? authTheme.brand : 'transparent'}
                  size={20}
                />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.name}>{r.name}</Text>
          {cuisines ? <Text style={styles.cuisines}>{cuisines}</Text> : null}
          <View style={styles.metaRow}>
            {typeof r.rating === 'number' ? (
              <Pressable
                style={styles.ratingPill}
                onPress={() => setTab('reviews')}
              >
                <Star color="#FFFFFF" fill="#FFFFFF" size={12} />
                <Text style={styles.ratingText}>{r.rating.toFixed(1)}</Text>
              </Pressable>
            ) : null}
            {typeof r.reviewCount === 'number' && r.reviewCount > 0 ? (
              <Pressable onPress={() => setTab('reviews')}>
                <Text style={styles.meta}>
                  {r.reviewCount} review{r.reviewCount === 1 ? '' : 's'}
                </Text>
              </Pressable>
            ) : null}
            {r.deliveryTime ? (
              <View style={styles.metaChip}>
                <Clock color={authTheme.textMuted} size={13} />
                <Text style={styles.meta}>{r.deliveryTime}</Text>
              </View>
            ) : null}
            {typeof r.priceForTwo === 'number' ? (
              <Text style={styles.meta}>₹{r.priceForTwo} for two</Text>
            ) : null}
          </View>
          {r.address ? (
            <View style={styles.addressRow}>
              <MapPin color={authTheme.textMuted} size={14} />
              <Text style={styles.address}>{r.address}</Text>
            </View>
          ) : null}
          {r.description ? (
            <Text style={styles.description}>{r.description}</Text>
          ) : null}
        </View>

        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, tab === 'menu' && styles.tabActive]}
            onPress={() => setTab('menu')}
          >
            <Text style={[styles.tabText, tab === 'menu' && styles.tabTextActive]}>
              Menu{menu.items.length ? ` (${menu.items.length})` : ''}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'offers' && styles.tabActive]}
            onPress={() => setTab('offers')}
          >
            <Tag color={tab === 'offers' ? '#FFFFFF' : authTheme.brand} size={14} />
            <Text style={[styles.tabText, tab === 'offers' && styles.tabTextActive]}>
              Offers
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'reviews' && styles.tabActive]}
            onPress={() => setTab('reviews')}
          >
            <MessageSquareQuote
              color={tab === 'reviews' ? '#FFFFFF' : authTheme.brand}
              size={14}
            />
            <Text
              style={[styles.tabText, tab === 'reviews' && styles.tabTextActive]}
            >
              Reviews
            </Text>
          </Pressable>
        </View>

        {tab === 'menu' ? (
          <View style={styles.menuSection}>
            {menu.isLoading ? (
              <LoadingView label="Loading menu…" />
            ) : filteredItems.length === 0 && categories.length === 0 ? (
              <View style={styles.emptyMenu}>
                <UtensilsCrossed color={authTheme.textDim} size={36} />
                <Text style={styles.emptyTitle}>Menu coming soon</Text>
                <Text style={styles.emptySubtitle}>
                  This restaurant hasn&apos;t added dishes yet.
                </Text>
              </View>
            ) : (
              <>
                {cuisineFilter && activeCategory !== 'all' && activeCategoryLabel ? (
                  <View style={styles.filterBanner}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.filterTitle}>
                        Showing {activeCategoryLabel}
                      </Text>
                      <Text style={styles.filterSub}>
                        Filtered from your category pick ·{' '}
                        {filteredItems.length} item
                        {filteredItems.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setActiveCategory('all')}
                      hitSlop={8}
                      style={styles.clearChip}
                    >
                      <Text style={styles.clearChipText}>View full menu</Text>
                    </Pressable>
                  </View>
                ) : null}

                {categories.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryRow}
                  >
                    <Pressable
                      style={[
                        styles.categoryChip,
                        activeCategory === 'all' && styles.categoryChipActive,
                      ]}
                      onPress={() => setActiveCategory('all')}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          activeCategory === 'all' && styles.categoryTextActive,
                        ]}
                      >
                        All
                      </Text>
                    </Pressable>
                    {categories.map((cat) => (
                      <Pressable
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          activeCategory === cat.id && styles.categoryChipActive,
                        ]}
                        onPress={() => setActiveCategory(cat.id)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            activeCategory === cat.id && styles.categoryTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}

                {activeCategory !== 'all' && filteredItems.length === 0 ? (
                  <View style={styles.emptyMenu}>
                    <UtensilsCrossed color={authTheme.textDim} size={36} />
                    <Text style={styles.emptyTitle}>
                      No {activeCategoryLabel ?? 'items'} right now
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      Try another category or browse the full menu.
                    </Text>
                    <Pressable
                      onPress={() => setActiveCategory('all')}
                      style={styles.emptyAction}
                    >
                      <Text style={styles.emptyActionText}>View full menu</Text>
                    </Pressable>
                  </View>
                ) : null}

                {groupedSections
                  ? groupedSections.map((section) => (
                      <View key={section.id}>
                        <Text style={styles.sectionTitle}>{section.name}</Text>
                        {section.items.map((item) => (
                          <MenuItemRow
                            key={item.id}
                            item={item}
                            onPress={() => openItem(item)}
                            onAdd={() => addItem(item)}
                          />
                        ))}
                      </View>
                    ))
                  : filteredItems.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        onPress={() => openItem(item)}
                        onAdd={() => addItem(item)}
                      />
                    ))}
              </>
            )}
          </View>
        ) : tab === 'offers' ? (
          <View style={styles.menuSection}>
            {offers.isLoading ? (
              <LoadingView label="Loading offers…" />
            ) : !offers.data?.length ? (
              <View style={styles.emptyMenu}>
                <Tag color={authTheme.textDim} size={36} />
                <Text style={styles.emptyTitle}>No offers right now</Text>
                <Text style={styles.emptySubtitle}>
                  Check back later for deals from this restaurant.
                </Text>
              </View>
            ) : (
              offers.data.map((offer) => (
                <Pressable
                  key={offer.id}
                  style={styles.offerCard}
                  onPress={() => openOffer(offer.id)}
                >
                  <View style={styles.offerIcon}>
                    <Tag color={authTheme.brand} size={20} />
                  </View>
                  <View style={styles.offerBody}>
                    <Text style={styles.offerTitle}>{offer.title}</Text>
                    {offer.description ? (
                      <Text style={styles.offerDesc} numberOfLines={2}>
                        {offer.description}
                      </Text>
                    ) : null}
                    {offer.code ? (
                      <Text style={styles.offerCode}>Code: {offer.code}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))
            )}
          </View>
        ) : (
          <RestaurantReviewsPanel restaurantId={id} />
        )}

        <View style={{ height: insets.bottom + 88 }} />
      </ScrollView>
      <CartFloatingBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  errorWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  heroWrap: {
    height: 220,
    backgroundColor: authTheme.input,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
    heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    marginTop: -24,
    marginHorizontal: 16,
    backgroundColor: authTheme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  name: {
    color: authTheme.text,
    fontSize: 22,
    fontWeight: '800',
  },
  cuisines: {
    color: authTheme.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    color: authTheme.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  address: {
    flex: 1,
    color: authTheme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  description: {
    color: authTheme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: authTheme.bg,
    borderBottomWidth: 1,
    borderBottomColor: authTheme.cardBorder,
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
    fontSize: 14,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  menuSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: authTheme.brandSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.brandMuted,
    padding: 12,
    marginTop: 8,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: authTheme.text,
  },
  filterSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: authTheme.textMuted,
  },
  clearChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: authTheme.brandMuted,
  },
  clearChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: authTheme.brand,
  },
  emptyAction: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: authTheme.brand,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
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
  categoryText: {
    color: authTheme.text,
    fontWeight: '600',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    color: authTheme.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyMenu: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    color: authTheme.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: authTheme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  offerCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 14,
    marginBottom: 12,
  },
  offerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBody: {
    flex: 1,
  },
  offerTitle: {
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  offerDesc: {
    color: authTheme.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  offerCode: {
    color: authTheme.brand,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
