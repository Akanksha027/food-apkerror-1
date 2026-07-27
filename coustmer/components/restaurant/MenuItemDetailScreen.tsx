import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  ChevronLeft,
  HelpCircle,
  Minus,
  Plus,
  Share2,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView, LoadingView } from '@/components/common/StateViews';
import { VegBadge } from '@/components/restaurant/MenuBadges';
import { authTheme } from '@/constants/auth-theme';
import { addMenuItemToCart } from '@/lib/order/add-to-cart';
import { getMenuItemRating } from '@/lib/restaurant/menu-rating';
import { useMenuItem, useRestaurant } from '@/lib/restaurant/hooks';
import type { MenuItem } from '@/lib/restaurant/types';

type Addon = { id: string; name: string; price: number };

const DEFAULT_ADDONS: Addon[] = [
  { id: 'mushroom', name: 'Mushroom', price: 30 },
  { id: 'chicken-patty', name: 'Chicken Patty', price: 80 },
  { id: 'poached-egg', name: 'Poached egg', price: 40 },
  { id: 'extra-cheese', name: 'Extra cheese', price: 35 },
  { id: 'caramelized-onion', name: 'Caramelized onion', price: 25 },
];

const MAX_ADDONS = 2;

function caloriesFor(item: MenuItem): string | null {
  const raw = item.calories ?? item.calorie ?? item.cal;
  if (typeof raw === 'number' && raw > 0) return `${Math.round(raw)}Cal.`;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.toLowerCase().includes('cal') ? raw : `${raw}Cal.`;
  }
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const calTag = tags.find((t) => String(t).startsWith('cal:'));
  if (calTag) {
    const n = String(calTag).split(':')[1];
    if (n) return `${n}Cal.`;
  }
  return null;
}

function likedBadge(item: MenuItem, rating: number | null): string | null {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  if (tags.some((t) => /most.?liked|bestseller|popular/i.test(String(t)))) {
    return '#1 Most liked';
  }
  if (rating != null && rating >= 4.5) return '#1 Most liked';
  if (item.categoryName?.toLowerCase().includes('recommend')) {
    return 'Recommended';
  }
  return rating != null ? `★ ${rating.toFixed(1)} rated` : null;
}

export function MenuItemDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { restaurantId, itemId } = useLocalSearchParams<{
    restaurantId: string;
    itemId: string;
  }>();

  const rid = String(restaurantId ?? '');
  const restaurant = useRestaurant(rid);
  const { data: item, isLoading, isError, error, refetch } = useMenuItem(
    rid,
    String(itemId ?? '')
  );

  const [qty, setQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const rating = item ? getMenuItemRating(item) : null;
  const badge = item ? likedBadge(item, rating) : null;
  const cal = item ? caloriesFor(item) : null;

  const addons = useMemo(() => {
    if (!item) return DEFAULT_ADDONS;
    const fromApi = (item.addons ?? item.customizations) as
      | Addon[]
      | undefined;
    if (Array.isArray(fromApi) && fromApi.length > 0) {
      return fromApi.map((a, i) => ({
        id: String(a.id ?? `addon-${i}`),
        name: String(a.name ?? 'Add-on'),
        price: Number(a.price) || 0,
      }));
    }
    return DEFAULT_ADDONS;
  }, [item]);

  const addonExtra = useMemo(() => {
    return addons
      .filter((a) => selectedAddons.includes(a.id))
      .reduce((s, a) => s + a.price, 0);
  }, [addons, selectedAddons]);

  const unitPrice = (item?.price ?? 0) + addonExtra;
  const lineTotal = unitPrice * qty;

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_ADDONS) {
        Alert.alert('Limit reached', `You can select up to ${MAX_ADDONS} add-ons.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      await Share.share({
        message: `Check out ${item.name} at ${restaurant.data?.name || 'this restaurant'}!`,
      });
    } catch {
      // dismissed
    }
  };

  const handleAdd = () => {
    if (!item || item.isAvailable === false) return;
    const addonNames = addons
      .filter((a) => selectedAddons.includes(a.id))
      .map((a) => a.name);
    const note =
      addonNames.length > 0 ? `Add-ons: ${addonNames.join(', ')}` : undefined;

    const cartItem: MenuItem = {
      ...item,
      price: unitPrice,
      specialInstructions: note || item.specialInstructions,
    };

    let ok = false;
    for (let i = 0; i < qty; i += 1) {
      ok =
        addMenuItemToCart(cartItem, {
          id: rid,
          name: restaurant.data?.name || 'Restaurant',
        }) || ok;
    }

    if (ok) {
      Alert.alert('Added to cart', `${qty}× ${item.name}`, [
        { text: 'Keep browsing', style: 'cancel' },
        { text: 'View cart', onPress: () => router.push('/cart') },
      ]);
    }
  };

  if (isLoading) {
    return <LoadingView label="Loading dish…" />;
  }

  if (isError || !item) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.errorPad}>
          <Pressable style={styles.floatBtn} onPress={() => { if (router.canGoBack()) { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } } else { router.replace('/'); } }}>
            <ChevronLeft color="#111827" size={22} />
          </Pressable>
          <ErrorView
            message={error instanceof Error ? error.message : 'Item not found'}
            onRetry={refetch}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              recyclingKey={item.id}
              transition={200}
            />
          ) : (
            <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.heroImage} />
          )}

          <View style={[styles.heroActions, { top: insets.top + 12 }]}>
            <Pressable style={styles.floatBtn} onPress={() => { if (router.canGoBack()) { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } } else { router.replace('/'); } }}>
              <ChevronLeft color="#111827" size={22} strokeWidth={2.4} />
            </Pressable>
            <View style={styles.heroRight}>
              <Pressable style={styles.floatBtn} onPress={handleShare}>
                <Share2 color="#111827" size={18} strokeWidth={2.2} />
              </Pressable>
              <Pressable
                style={styles.helpBtn}
                onPress={() => router.push('/support')}
              >
                <HelpCircle color="#111827" size={14} />
                <Text style={styles.helpText}>Help</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {badge ? (
            <View style={styles.likedPill}>
              <Text style={styles.likedText}>{badge}</Text>
            </View>
          ) : null}

          <View style={styles.titleRow}>
            <VegBadge isVeg={item.isVeg} />
            <Text style={styles.name}>{item.name}</Text>
          </View>

          {cal ? <Text style={styles.calories}>{cal}</Text> : null}

          <Text style={styles.price}>₹{item.price.toFixed(0)}</Text>

          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : null}

          {item.categoryName ? (
            <Text style={styles.category}>In {item.categoryName}</Text>
          ) : null}

          {!item.isAvailable ? (
            <Text style={styles.unavailable}>Currently unavailable</Text>
          ) : null}

          <View style={styles.addonsHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.addonsTitle}>
                Add ons for {item.name.split(' ')[0] || 'item'}
              </Text>
              <Text style={styles.addonsHint}>Select up to 0{MAX_ADDONS}</Text>
            </View>
            <View style={styles.optionalPill}>
              <Text style={styles.optionalText}>Optional</Text>
            </View>
          </View>

          <View style={styles.addonList}>
            {addons.map((addon) => {
              const on = selectedAddons.includes(addon.id);
              return (
                <Pressable
                  key={addon.id}
                  style={styles.addonRow}
                  onPress={() => toggleAddon(addon.id)}
                >
                  <View style={[styles.checkbox, on && styles.checkboxOn]}>
                    {on ? <Check color="#FFFFFF" size={12} strokeWidth={3} /> : null}
                  </View>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  <Text style={styles.addonPrice}>
                    + ₹{addon.price.toFixed(0)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {item.isAvailable !== false ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={styles.qtyWrap}>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus color="#374151" size={18} strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.qtyValue}>{qty}</Text>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => setQty((q) => Math.min(20, q + 1))}
            >
              <Plus color="#374151" size={18} strokeWidth={2.4} />
            </Pressable>
          </View>

          <Pressable style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>
              Add to cart · ₹{lineTotal.toFixed(0)}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorPad: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  hero: {
    height: 300,
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  helpText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  likedPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  likedText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  calories: {
    marginTop: 6,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  price: {
    marginTop: 8,
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  category: {
    marginTop: 8,
    color: authTheme.brand,
    fontSize: 13,
    fontWeight: '700',
  },
  unavailable: {
    marginTop: 10,
    color: authTheme.error,
    fontWeight: '700',
    fontSize: 14,
  },
  addonsHeader: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addonsTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  addonsHint: {
    marginTop: 4,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  optionalPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  optionalText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
  },
  addonList: {
    marginTop: 14,
    gap: 4,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxOn: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  addonName: {
    flex: 1,
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  addonPrice: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  qtyValue: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  addBtn: {
    flex: 1,
    backgroundColor: authTheme.brand,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
