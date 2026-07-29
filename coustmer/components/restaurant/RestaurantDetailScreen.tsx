import { Pressable } from '@/components/common/Pressable';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bike,
  ChevronLeft,
  Crown,
  Percent,
  PersonStanding,
  Search,
  Share2,
  Star,
  UtensilsCrossed,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator,
  InteractionManager,
  LayoutAnimation,
  Platform,
  
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  type LayoutChangeEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { FavoriteHeartButton } from '@/components/common/FavoriteHeartButton';
import { CartFloatingBar } from '@/components/order/CartFloatingBar';
import { MenuItemDetailSheet } from '@/components/restaurant/MenuItemDetailSheet';
import { MenuItemGridCard } from '@/components/restaurant/MenuItemGridCard';
import { RestaurantReviewsPanel } from '@/components/review/RestaurantReviewsPanel';
import { authTheme } from '@/constants/auth-theme';
import { useFavoriteToggle } from '@/lib/customer/useFavoriteToggle';
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
import type { MenuItem, RestaurantOffer } from '@/lib/restaurant/types';

type Tab = 'menu' | 'reviews';
type Fulfillment = 'delivery' | 'pickup';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function normalizeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? '').trim();
  return String(value ?? '').trim();
}

function formatDistance(distance?: number) {
  if (typeof distance !== 'number' || distance <= 0) return null;
  if (distance < 1) return `${(distance * 1000).toFixed(0)} m`;
  return `${distance.toFixed(1)} km`;
}

function offerHeadline(offer: RestaurantOffer) {
  if (typeof offer.discountValue === 'number' && offer.discountValue > 0) {
    if (String(offer.discountType || '').toLowerCase().includes('flat')) {
      return `₹${offer.discountValue} off`;
    }
    return `${offer.discountValue}% off`;
  }
  const title = offer.title?.trim() || 'Special offer';
  return title.length > 18 ? `${title.slice(0, 16)}…` : title;
}

function offerFinePrint(offer: RestaurantOffer) {
  const parts: string[] = [];
  if (typeof offer.minOrderAmount === 'number' && offer.minOrderAmount > 0) {
    parts.push(`Minimum order ₹${offer.minOrderAmount}`);
  }
  if (offer.description?.trim()) {
    parts.push(offer.description.trim());
  } else if (offer.code) {
    parts.push(`Use code ${offer.code}`);
  } else {
    parts.push('Valid for all items. Auto-applied.');
  }
  return parts.join('. ');
}

const FOCUS_SCROLL_EASE = LayoutAnimation.create(
  380,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity
);

export function RestaurantDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    restaurantId: string;
    category?: string;
    cuisine?: string;
    itemId?: string;
    itemName?: string;
    menuCategory?: string;
    menuCategoryId?: string;
  }>();

  const id = normalizeParam(params.restaurantId);
  const cuisineFilter = normalizeParam(params.category || params.cuisine);
  const focusItemId = normalizeParam(params.itemId);
  const focusItemName = normalizeParam(params.itemName);
  const focusMenuCategory = normalizeParam(params.menuCategory);
  const focusMenuCategoryId = normalizeParam(params.menuCategoryId);
  const foodCategory = findCategoryBySlug(cuisineFilter);
  const hasDishDeepLink = Boolean(focusItemId || focusItemName);

  const [tab, setTab] = useState<Tab>('menu');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [menuQuery, setMenuQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null
  );
  const appliedCategoryFilter = useRef(false);
  const appliedItemFocus = useRef(false);
  const hasSmoothScrolled = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const itemYRef = useRef<Record<string, number>>({});
  const menuAnchorY = useRef(0);

  const restaurant = useRestaurant(id);
  const menu = useFullMenu(id, {
    name: restaurant.data?.name,
    cuisines: restaurant.data?.cuisines,
  });
  const offers = useRestaurantOffers(id);
  const { isFavorite, toggleFavorite: toggleFav } = useFavoriteToggle();
  const favorited = isFavorite(id);

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

  const focusedItem = useMemo(() => {
    if (!hasDishDeepLink || menu.items.length === 0) return null;
    return (
      menu.items.find((item) => focusItemId && item.id === focusItemId) ??
      menu.items.find(
        (item) =>
          focusItemName &&
          item.name.toLowerCase() === focusItemName.toLowerCase()
      ) ??
      menu.items.find(
        (item) =>
          focusItemName &&
          item.name.toLowerCase().includes(focusItemName.toLowerCase())
      ) ??
      null
    );
  }, [hasDishDeepLink, menu.items, focusItemId, focusItemName]);

  useEffect(() => {
    if (appliedItemFocus.current || menu.isLoading) return;
    if (!hasDishDeepLink) return;

    setTab('menu');

    const easeIntoSection = (categoryId: string | null) => {
      LayoutAnimation.configureNext(FOCUS_SCROLL_EASE);
      if (categoryId) setActiveCategory(categoryId);
    };

    const smoothScrollTo = (itemId: string, attempt = 0) => {
      if (hasSmoothScrolled.current) return;

      const measured = itemYRef.current[itemId];
      const targetY =
        typeof measured === 'number'
          ? Math.max(0, measured - 96)
          : menuAnchorY.current > 0
            ? Math.max(0, menuAnchorY.current - 24)
            : null;

      if (targetY == null) {
        if (attempt < 10) {
          setTimeout(() => smoothScrollTo(itemId, attempt + 1), 70);
        }
        return;
      }

      hasSmoothScrolled.current = true;
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
      });
    };

    if (focusedItem) {
      const catId =
        focusedItem.categoryId ||
        focusMenuCategoryId ||
        categories.find(
          (c) =>
            c.id === focusedItem.categoryId ||
            c.id === focusMenuCategoryId ||
            (focusedItem.categoryName &&
              c.name.toLowerCase() === focusedItem.categoryName.toLowerCase()) ||
            (focusMenuCategory &&
              c.name.toLowerCase() === focusMenuCategory.toLowerCase())
        )?.id ||
        null;

      if (catId) easeIntoSection(catId);
      else if (focusMenuCategory) {
        const byName = categories.find(
          (c) => c.name.toLowerCase() === focusMenuCategory.toLowerCase()
        );
        easeIntoSection(byName?.id ?? null);
      } else {
        easeIntoSection(null);
      }

      setHighlightedItemId(focusedItem.id);
      appliedItemFocus.current = true;
      appliedCategoryFilter.current = true;

      const interaction = InteractionManager.runAfterInteractions(() => {
        setTimeout(() => smoothScrollTo(focusedItem.id), 160);
      });

      const clearHighlight = setTimeout(() => {
        setHighlightedItemId(null);
      }, 4200);

      return () => {
        interaction.cancel?.();
        clearTimeout(clearHighlight);
      };
    }

    if (focusMenuCategory && categories.length > 0) {
      const byName = categories.find(
        (c) => c.name.toLowerCase() === focusMenuCategory.toLowerCase()
      );
      if (byName) {
        easeIntoSection(byName.id);
        appliedItemFocus.current = true;
        appliedCategoryFilter.current = true;
      }
    }
  }, [
    hasDishDeepLink,
    focusedItem,
    focusMenuCategory,
    focusMenuCategoryId,
    categories,
    menu.isLoading,
  ]);

  useEffect(() => {
    if (appliedCategoryFilter.current || !cuisineFilter || categories.length === 0) {
      return;
    }
    if (hasDishDeepLink) return;
    const resolved = resolveMenuCategoryId(categories, cuisineFilter);
    if (resolved) {
      setActiveCategory(resolved);
      appliedCategoryFilter.current = true;
    }
  }, [categories, cuisineFilter, hasDishDeepLink]);

  const activeCategoryLabel =
    activeCategory === 'all'
      ? null
      : categories.find((c) => c.id === activeCategory)?.name ??
        foodCategory?.label ??
        null;

  const filteredItems = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    let items =
      activeCategory === 'all'
        ? menu.items
        : menu.items.filter(
            (item) =>
              item.categoryId === activeCategory ||
              item.categoryName ===
                categories.find((c) => c.id === activeCategory)?.name
          );

    if (vegOnly) {
      items = items.filter((item) => item.isVeg === true);
    }

    if (q) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    if (focusedItem && activeCategory !== 'all') {
      items = [
        focusedItem,
        ...items.filter((item) => item.id !== focusedItem.id),
      ];
    }

    return items;
  }, [
    activeCategory,
    menu.items,
    categories,
    focusedItem,
    menuQuery,
    vegOnly,
  ]);

  const gridRows = useMemo(() => {
    const rows: MenuItem[][] = [];
    for (let i = 0; i < filteredItems.length; i += 2) {
      rows.push(filteredItems.slice(i, i + 2));
    }
    return rows;
  }, [filteredItems]);

  const onItemLayout = (itemKey: string, event: LayoutChangeEvent) => {
    itemYRef.current[itemKey] =
      menuAnchorY.current + event.nativeEvent.layout.y;
  };

  const toggleFavorite = () => {
    if (!id) return;
    toggleFav(id, {
      restaurant: restaurant.data
        ? {
            id,
            name: restaurant.data.name,
            imageUrl: restaurant.data.imageUrl || restaurant.data.coverUrl,
            rating: restaurant.data.rating,
            cuisines: restaurant.data.cuisines,
            deliveryTime: restaurant.data.deliveryTime,
          }
        : undefined,
    });
  };

  const shareRestaurant = async () => {
    const name = restaurant.data?.name || 'this restaurant';
    try {
      await Share.share({
        message: `Check out ${name} on Food Delivery — great food, fast delivery!`,
      });
    } catch {
      // user dismissed
    }
  };

  const openItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const addItem = (item: MenuItem) => {
    addMenuItemToCart(item, {
      id,
      name: restaurant.data?.name || 'Restaurant',
      imageUrl: restaurant.data?.logoUrl || restaurant.data?.imageUrl,
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
  const cover = r.coverUrl || r.imageUrl;
  const logo = r.logoUrl || r.imageUrl;
  const distanceLabel = formatDistance(
    typeof r.distance === 'number' ? r.distance : undefined
  );
  const deliveryTime = r.deliveryTime || '25-35 min';
  const minOrder =
    offers.data?.find((o) => typeof o.minOrderAmount === 'number')
      ?.minOrderAmount ?? (typeof r.priceForTwo === 'number' ? Math.round(r.priceForTwo * 0.35) : 199);
  const deliveryCharge = 30;
  const reviewLabel =
    typeof r.reviewCount === 'number' && r.reviewCount > 0
      ? r.reviewCount.toLocaleString()
      : null;

  const couponOffers = offers.data?.slice(0, 8) ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={tab === 'menu' ? [1] : undefined}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Block 0: hero + info + delivery + offers ── */}
        <View>
          <View style={styles.heroWrap}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.heroImage} contentFit="cover" />
            ) : (
              <LinearGradient colors={['#FF5A41', '#C2410C']} style={styles.heroImage}>
                <UtensilsCrossed color="rgba(255,255,255,0.5)" size={48} />
              </LinearGradient>
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.15)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={[styles.heroActions, { top: 12 }]}>
              <Pressable style={styles.iconBtn} onPress={() => { if (router.canGoBack()) { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } } else { router.replace('/'); } }}>
                <ChevronLeft color="#FFFFFF" size={22} strokeWidth={2.4} />
              </Pressable>
              <View style={styles.heroRightActions}>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => {
                    setTab('menu');
                    setSearchOpen((v) => !v);
                  }}
                  accessibilityLabel="Search menu"
                >
                  <Search color="#FFFFFF" size={18} strokeWidth={2.3} />
                </Pressable>
                <FavoriteHeartButton
                  active={favorited}
                  onPress={toggleFavorite}
                  size={18}
                  color="#FFFFFF"
                  activeColor={authTheme.brand}
                  style={styles.iconBtn}
                />
                <Pressable style={styles.iconBtn} onPress={shareRestaurant}>
                  <Share2 color="#FFFFFF" size={18} strokeWidth={2.2} />
                </Pressable>
              </View>
            </View>

            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                {logo ? (
                  <Image
                    source={{ uri: logo }}
                    style={styles.logoImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.logoFallback}>
                    {(r.name || 'R').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.name}>{r.name}</Text>

            <View style={styles.metaLine}>
              {typeof r.rating === 'number' ? (
                <Pressable
                  style={styles.metaInline}
                  onPress={() => setTab('reviews')}
                >
                  <Star color="#F5B041" fill="#F5B041" size={14} />
                  <Text style={styles.metaStrong}>
                    {r.rating.toFixed(1)}
                    {reviewLabel ? (
                      <Text style={styles.metaMuted}> ({reviewLabel})</Text>
                    ) : null}
                  </Text>
                </Pressable>
              ) : null}

              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.proBadge}>FoodyPro+</Text>

              {distanceLabel ? (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaMuted}>{distanceLabel}</Text>
                </>
              ) : r.cuisines?.[0] ? (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaMuted}>{r.cuisines[0]}</Text>
                </>
              ) : null}
            </View>

            {/* Delivery / pickup card — mock + Swiggy time chip */}
            <View style={styles.fulfillCard}>
              <View style={styles.fulfillToggle}>
                <Pressable
                  style={[
                    styles.fulfillBtn,
                    fulfillment === 'delivery' && styles.fulfillBtnActive,
                  ]}
                  onPress={() => setFulfillment('delivery')}
                >
                  <Bike
                    color={fulfillment === 'delivery' ? '#FFFFFF' : '#6B7280'}
                    size={18}
                    strokeWidth={2.2}
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.fulfillBtn,
                    fulfillment === 'pickup' && styles.fulfillBtnActive,
                  ]}
                  onPress={() => setFulfillment('pickup')}
                >
                  <PersonStanding
                    color={fulfillment === 'pickup' ? '#FFFFFF' : '#6B7280'}
                    size={18}
                    strokeWidth={2.2}
                  />
                </Pressable>
              </View>

              <View style={styles.fulfillCopy}>
                <Text style={styles.fulfillTitle}>
                  {fulfillment === 'delivery'
                    ? `Delivery Time: ${deliveryTime}`
                    : `Pickup ready in ${deliveryTime}`}
                </Text>
                <Text style={styles.fulfillSub}>
                  {fulfillment === 'delivery'
                    ? `Charge: ₹${deliveryCharge} • Min. Order: ₹${minOrder}`
                    : 'No delivery fee • Pay at restaurant'}
                </Text>
              </View>
            </View>

            {/* Coupon rail */}
            {offers.isLoading ? (
              <View style={[styles.couponRow, { paddingHorizontal: 20 }]}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>Loading offers...</Text>
              </View>
            ) : offers.isError ? (
              <View style={[styles.couponRow, { paddingHorizontal: 20 }]}>
                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '500' }}>Error loading offers</Text>
              </View>
            ) : couponOffers.length > 0 ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.couponRow}
                >
                  {couponOffers.map((offer, index) => (
                    <Pressable
                      key={offer.id}
                      style={styles.couponCard}
                      onPress={() => openOffer(offer.id)}
                    >
                      <View style={styles.couponIcon}>
                        {index % 2 === 0 ? (
                          <Percent color={authTheme.brand} size={16} strokeWidth={2.6} />
                        ) : (
                          <Crown color={authTheme.brand} size={16} strokeWidth={2.4} />
                        )}
                      </View>
                      <View style={styles.couponBody}>
                        <Text style={styles.couponTitle} numberOfLines={1}>
                          {offerHeadline(offer)}
                        </Text>
                        <Text style={styles.couponSub} numberOfLines={2}>
                          {offerFinePrint(offer)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable
                  style={[styles.couponCard, { marginHorizontal: 20, marginTop: 8, width: 'auto', alignItems: 'center', justifyContent: 'center' }]}
                  onPress={() => router.push({
                    pathname: '/restaurants/[restaurantId]/offers',
                    params: { restaurantId: id, restaurantName: r.name }
                  })}
                >
                  <Text style={{ color: authTheme.brand, fontWeight: '700' }}>View All Offers & Deals</Text>
                </Pressable>
              </>
            ) : (
              <View style={[styles.couponRow, { paddingHorizontal: 20 }]}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>No active offers for this restaurant right now.</Text>
              </View>
            )}

            {searchOpen ? (
              <View style={styles.searchBox}>
                <Search color="#9CA3AF" size={16} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search in menu"
                  placeholderTextColor="#9CA3AF"
                  value={menuQuery}
                  onChangeText={setMenuQuery}
                  autoFocus
                  returnKeyType="search"
                />
                {menuQuery ? (
                  <Pressable onPress={() => setMenuQuery('')}>
                    <Text style={styles.searchClear}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Swiggy-style filters */}
            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterChip, vegOnly && styles.filterChipOn]}
                onPress={() => setVegOnly((v) => !v)}
              >
                <Text style={[styles.filterChipText, vegOnly && styles.filterChipTextOn]}>
                  Pure Veg
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, tab === 'reviews' && styles.filterChipOn]}
                onPress={() => setTab(tab === 'reviews' ? 'menu' : 'reviews')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    tab === 'reviews' && styles.filterChipTextOn,
                  ]}
                >
                  Reviews
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Block 1: sticky category tabs (menu only) ── */}
        {tab === 'menu' ? (
          <View style={styles.stickyCats}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catTabs}
            >
              <Pressable
                style={styles.catTab}
                onPress={() => setActiveCategory('all')}
              >
                <Text
                  style={[
                    styles.catTabText,
                    activeCategory === 'all' && styles.catTabTextActive,
                  ]}
                >
                  Popular
                </Text>
                {activeCategory === 'all' ? <View style={styles.catUnderline} /> : null}
              </Pressable>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={styles.catTab}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.catTabText,
                      activeCategory === cat.id && styles.catTabTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {activeCategory === cat.id ? (
                    <View style={styles.catUnderline} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View />
        )}

        {/* ── Menu grid / Reviews ── */}
        {tab === 'menu' ? (
          <View
            style={styles.menuSection}
            onLayout={(e) => {
              menuAnchorY.current = e.nativeEvent.layout.y;
            }}
          >
            {menu.isLoading ? (
              <LoadingView label="Loading menu…" />
            ) : filteredItems.length === 0 ? (
              <View style={styles.emptyMenu}>
                <UtensilsCrossed color={authTheme.textDim} size={36} />
                <Text style={styles.emptyTitle}>
                  {menuQuery || vegOnly
                    ? 'No matching dishes'
                    : activeCategoryLabel
                      ? `No ${activeCategoryLabel} right now`
                      : 'Menu coming soon'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  Try another category or clear filters.
                </Text>
                {(activeCategory !== 'all' || vegOnly || menuQuery) && (
                  <Pressable
                    onPress={() => {
                      setActiveCategory('all');
                      setVegOnly(false);
                      setMenuQuery('');
                    }}
                    style={styles.emptyAction}
                  >
                    <Text style={styles.emptyActionText}>Reset filters</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              gridRows.map((row, rowIndex) => (
                <View
                  key={`row-${rowIndex}`}
                  style={styles.gridRow}
                  onLayout={(e) => {
                    row.forEach((item) => onItemLayout(item.id, e));
                  }}
                >
                  {row.map((item) => (
                    <MenuItemGridCard
                      key={item.id}
                      item={item}
                      highlighted={highlightedItemId === item.id}
                      onPress={() => openItem(item)}
                      onAdd={() => addItem(item)}
                    />
                  ))}
                  {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                </View>
              ))
            )}
          </View>
        ) : (
          <RestaurantReviewsPanel restaurantId={id} />
        )}

        <View style={{ height: insets.bottom + 88 }} />
      </ScrollView>
      <CartFloatingBar />
      <MenuItemDetailSheet
        visible={!!selectedItem}
        item={selectedItem}
        restaurantId={id}
        restaurantName={restaurant.data?.name || 'Restaurant'}
        restaurantImageUrl={restaurant.data?.logoUrl || restaurant.data?.imageUrl}
        onClose={() => setSelectedItem(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  heroWrap: {
    height: 210,
    backgroundColor: '#1A1816',
    marginBottom: 36,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActions: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -36,
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    fontSize: 28,
    fontWeight: '900',
    color: authTheme.brand,
  },
  infoBlock: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  name: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  metaLine: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaStrong: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  metaMuted: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  metaDot: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  proBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: authTheme.brand,
  },
  fulfillCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F5F5F6',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  fulfillToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  fulfillBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fulfillBtnActive: {
    backgroundColor: authTheme.brand,
  },
  fulfillCopy: {
    flex: 1,
    minWidth: 0,
  },
  fulfillTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  fulfillSub: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  couponRow: {
    paddingTop: 16,
    paddingBottom: 4,
    gap: 10,
  },
  couponCard: {
    width: 210,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8EA',
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  couponIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponBody: {
    flex: 1,
    minWidth: 0,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  couponSub: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  searchBox: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    paddingVertical: 8,
  },
  searchClear: {
    color: authTheme.brand,
    fontWeight: '800',
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterChipOn: {
    borderColor: authTheme.brand,
    backgroundColor: authTheme.brandSoft,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterChipTextOn: {
    color: authTheme.brand,
  },
  stickyCats: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    paddingTop: 6,
  },
  catTabs: {
    paddingHorizontal: 12,
    gap: 4,
  },
  catTab: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: 'center',
  },
  catTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  catTabTextActive: {
    color: '#111827',
    fontWeight: '800',
  },
  catUnderline: {
    marginTop: 8,
    height: 3,
    width: '100%',
    minWidth: 28,
    borderRadius: 2,
    backgroundColor: authTheme.brand,
  },
  menuSection: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
});
