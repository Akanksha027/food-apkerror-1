import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Bookmark,
  Bike,
  MapPin,
  Minus,
  Plus,
  Store,
  Tag,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/common/StateViews';
import { APP_BOTTOM_NAV_INSET } from '@/components/navigation/AppBottomNav';
import { VegBadge } from '@/components/restaurant/MenuBadges';
import { authTheme } from '@/constants/auth-theme';
import {
  useApplyCoupon,
  useCart,
  useCartHealth,
  useClearRemoteCart,
  useRemoveCartItem,
  useRemoveCoupon,
  useSaveCart,
  useUpdateCartDeliveryAddress,
  useUpdateCartDeliveryType,
  useUpdateCartItem,
  useUpdateCartTip,
  useValidateCart,
} from '@/lib/cart/hooks';
import { parseDeliveryAddress } from '@/lib/order/parse-address';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useDeliveryLocationStore } from '@/store/delivery-location-store';

const TIP_OPTIONS = [0, 20, 30, 50];

export function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);
  const isLoggedIn = Boolean(token);

  const restaurant = useCartStore((s) => s.restaurant);
  const items = useCartStore((s) => s.items);
  const specialInstructions = useCartStore((s) => s.specialInstructions);
  const tip = useCartStore((s) => s.tip);
  const couponCode = useCartStore((s) => s.couponCode);
  const discount = useCartStore((s) => s.discount);
  const deliveryType = useCartStore((s) => s.deliveryType);
  const deliveryFee = useCartStore((s) => s.deliveryFee);
  const tax = useCartStore((s) => s.tax);
  const setSpecialInstructions = useCartStore((s) => s.setSpecialInstructions);
  const setTipLocal = useCartStore((s) => s.setTip);
  const setDeliveryTypeLocal = useCartStore((s) => s.setDeliveryType);
  const clearLocal = useCartStore((s) => s.clearCart);
  const removeLocal = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());
  const estimatedTotal = useCartStore((s) => s.estimatedTotal());

  const location = useDeliveryLocationStore((s) => s.location);

  const remoteCart = useCart();
  const health = useCartHealth();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearRemote = useClearRemoteCart();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const updateTip = useUpdateCartTip();
  const updateAddress = useUpdateCartDeliveryAddress();
  const updateDeliveryType = useUpdateCartDeliveryType();
  const validateCart = useValidateCart();
  const saveCart = useSaveCart();

  const [couponInput, setCouponInput] = useState(couponCode ?? '');
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<'error' | 'success'>('success');
  const [busyId, setBusyId] = useState<string | null>(null);

  const showBanner = (message: string, type: 'error' | 'success' = 'success') => {
    setBannerType(type);
    setBanner(message);
  };

  useEffect(() => {
    setCouponInput(couponCode ?? '');
  }, [couponCode]);

  useEffect(() => {
    if (!location || !isLoggedIn) return;
    const parsed = parseDeliveryAddress({
      formattedAddress: location.formattedAddress,
      label: location.label,
      city: location.city,
      lat: location.lat,
      lng: location.lng,
    });
    void updateAddress.mutateAsync({
      label: parsed.label,
      formattedAddress: parsed.formattedAddress,
      street: parsed.street,
      area: parsed.area,
      city: parsed.city,
      state: parsed.state,
      pincode: parsed.pincode,
      lat: parsed.lat,
      lng: parsed.lng,
    }).catch(() => {
      // optional sync
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.formattedAddress, isLoggedIn]);

  const onRefresh = () => {
    remoteCart.refetch();
    health.refetch();
  };

  const syncQty = async (itemId: string, quantity: number) => {
    setBusyId(itemId);
    try {
      if (quantity <= 0) {
        removeLocal(itemId);
        await removeItem.mutateAsync(itemId);
      } else {
        useCartStore.getState().setQuantity(itemId, quantity);
        await updateItem.mutateAsync({ itemId, payload: { quantity } });
      }
    } catch (e) {
      showBanner(e instanceof Error ? e.message : 'Could not update item', 'error');
      remoteCart.refetch();
    } finally {
      setBusyId(null);
    }
  };

  const handleClear = () => {
    Alert.alert('Clear cart?', 'Remove all items from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearRemote.mutateAsync();
          } catch {
            clearLocal();
          }
        },
      },
    ]);
  };

  const handleTip = async (amount: number) => {
    setTipLocal(amount);
    try {
      await updateTip.mutateAsync({ tip: amount });
    } catch (e) {
      showBanner(e instanceof Error ? e.message : 'Could not update tip', 'error');
    }
  };

  const handleDeliveryType = async (type: 'delivery' | 'takeaway') => {
    setDeliveryTypeLocal(type);
    try {
      await updateDeliveryType.mutateAsync({ deliveryType: type });
    } catch (e) {
      showBanner(
        e instanceof Error ? e.message : 'Could not update delivery type',
        'error'
      );
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      showBanner('Enter a promo code', 'error');
      return;
    }
    if (!isLoggedIn) {
      showBanner('Sign in to apply coupons', 'error');
      return;
    }
    try {
      const cart = await applyCoupon.mutateAsync({ code });
      if (!cart.coupon?.code) {
        showBanner('Invalid promo code', 'error');
        return;
      }
      showBanner(`Coupon ${cart.coupon.code.toUpperCase()} applied`, 'success');
    } catch {
      showBanner('Invalid promo code', 'error');
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon.mutateAsync();
      setCouponInput('');
      showBanner('Coupon removed', 'success');
    } catch (e) {
      showBanner(
        e instanceof Error ? e.message : 'Could not remove coupon',
        'error'
      );
    }
  };

  const handleSave = async () => {
    if (!isLoggedIn) {
      Alert.alert('Sign in required', 'Log in to save carts for later.');
      return;
    }
    try {
      await saveCart.mutateAsync({
        name: restaurant?.name
          ? `${restaurant.name} · ${new Date().toLocaleDateString()}`
          : undefined,
      });
      showBanner('Cart saved for later', 'success');
    } catch (e) {
      showBanner(e instanceof Error ? e.message : 'Could not save cart', 'error');
    }
  };

  const handleCheckout = async () => {
    try {
      const result = await validateCart.mutateAsync();
      if (!result.valid) {
        const msg =
          result.issues.map((i) => i.message).join('\n') ||
          result.message ||
          'Cart validation failed';
        Alert.alert('Cart needs attention', msg);
        if (result.cart) remoteCart.refetch();
        return;
      }
    } catch {
      // If validate endpoint fails, still allow checkout locally
    }
    router.push('/checkout');
  };

  if (remoteCart.isLoading && !items.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingView label="Loading cart…" />
      </SafeAreaView>
    );
  }

  if (!items.length || !restaurant) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.pad}>
          <ScreenHeader
            title="Cart"
            right={
              <Pressable
                style={styles.iconBtn}
                onPress={() => router.push('/cart/saved' as import('expo-router').Href)}
              >
                <Bookmark color={authTheme.brand} size={18} />
              </Pressable>
            }
          />
          {remoteCart.isError ? (
            <ErrorView
              message={
                remoteCart.error instanceof Error
                  ? remoteCart.error.message
                  : 'Could not sync cart'
              }
              onRetry={onRefresh}
            />
          ) : (
            <EmptyView
              title="Your cart is empty"
              subtitle="Add dishes from a restaurant to get started."
            />
          )}
          <Pressable
            style={styles.browseBtn}
            onPress={() => router.push('/restaurants')}
          >
            <Text style={styles.browseText}>Browse restaurants</Text>
          </Pressable>
          <Pressable
            style={styles.savedLink}
            onPress={() => router.push('/cart/saved' as import('expo-router').Href)}
          >
            <Text style={styles.savedLinkText}>View saved carts</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenHeader
          title="Cart"
          subtitle={restaurant.name}
          right={
            <View style={styles.headerActions}>
              <Pressable
                style={styles.iconBtn}
                onPress={() =>
                  router.push('/cart/saved' as import('expo-router').Href)
                }
              >
                <Bookmark color={authTheme.brand} size={18} />
              </Pressable>
              <Pressable onPress={handleClear} hitSlop={8}>
                <Trash2 color={authTheme.error} size={18} />
              </Pressable>
            </View>
          }
        />
        <Text style={styles.health}>
          Cart service ·{' '}
          {health.isLoading
            ? 'checking…'
            : health.isSuccess
              ? health.data?.status ?? 'ok'
              : 'offline mode'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={remoteCart.isRefetching}
            onRefresh={onRefresh}
            tintColor={authTheme.brand}
          />
        }
      >
        {banner ? (
          <Pressable onPress={() => setBanner(null)}>
            <Text
              style={[
                styles.banner,
                bannerType === 'error' ? styles.bannerError : styles.bannerSuccess,
              ]}
            >
              {banner}
            </Text>
          </Pressable>
        ) : null}

        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.thumb}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]} />
            )}
            <View style={styles.rowBody}>
              <View style={styles.titleRow}>
                <VegBadge isVeg={item.isVeg} />
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
              <Text style={styles.price}>₹{item.price.toFixed(0)}</Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyBtn}
                  disabled={busyId === item.id}
                  onPress={() => syncQty(item.id, item.quantity - 1)}
                >
                  <Minus color={authTheme.brand} size={14} />
                </Pressable>
                <Text style={styles.qty}>
                  {busyId === item.id ? '…' : item.quantity}
                </Text>
                <Pressable
                  style={styles.qtyBtn}
                  disabled={busyId === item.id}
                  onPress={() => syncQty(item.id, item.quantity + 1)}
                >
                  <Plus color={authTheme.brand} size={14} />
                </Pressable>
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => syncQty(item.id, 0)}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.sectionLabel}>Delivery type</Text>
        <View style={styles.typeRow}>
          <Pressable
            style={[
              styles.typeChip,
              deliveryType === 'delivery' && styles.typeChipActive,
            ]}
            onPress={() => handleDeliveryType('delivery')}
          >
            <Bike
              color={deliveryType === 'delivery' ? '#FFFFFF' : authTheme.brand}
              size={16}
            />
            <Text
              style={[
                styles.typeText,
                deliveryType === 'delivery' && styles.typeTextActive,
              ]}
            >
              Delivery
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.typeChip,
              deliveryType === 'takeaway' && styles.typeChipActive,
            ]}
            onPress={() => handleDeliveryType('takeaway')}
          >
            <Store
              color={deliveryType === 'takeaway' ? '#FFFFFF' : authTheme.brand}
              size={16}
            />
            <Text
              style={[
                styles.typeText,
                deliveryType === 'takeaway' && styles.typeTextActive,
              ]}
            >
              Takeaway
            </Text>
          </Pressable>
        </View>

        {location ? (
          <View style={styles.addressCard}>
            <MapPin color={authTheme.brand} size={16} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressTitle}>{location.label}</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {location.formattedAddress}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Coupon</Text>
        <View style={styles.couponRow}>
          <Tag color={authTheme.brand} size={16} />
          <TextInput
            style={styles.couponInput}
            value={couponInput}
            onChangeText={setCouponInput}
            placeholder="Promo code"
            placeholderTextColor={authTheme.textDim}
            autoCapitalize="characters"
          />
          {couponCode ? (
            <Pressable onPress={handleRemoveCoupon} disabled={removeCoupon.isPending}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.applyBtn}
              onPress={handleApplyCoupon}
              disabled={applyCoupon.isPending}
            >
              {applyCoupon.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.applyText}>Apply</Text>
              )}
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionLabel}>Cooking instructions</Text>
        <TextInput
          style={styles.input}
          placeholder="Less spicy, no onion…"
          placeholderTextColor={authTheme.textDim}
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          multiline
        />

        <Text style={styles.sectionLabel}>Delivery tip</Text>
        <View style={styles.tipRow}>
          {TIP_OPTIONS.map((amount) => (
            <Pressable
              key={amount}
              style={[styles.tipChip, tip === amount && styles.tipChipActive]}
              onPress={() => handleTip(amount)}
            >
              <Text
                style={[
                  styles.tipChipText,
                  tip === amount && styles.tipChipTextActive,
                ]}
              >
                {amount === 0 ? 'No tip' : `₹${amount}`}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item total</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(0)}</Text>
          </View>
          {discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Discount{couponCode ? ` (${couponCode})` : ''}
              </Text>
              <Text style={[styles.summaryValue, styles.discount]}>
                -₹{discount.toFixed(0)}
              </Text>
            </View>
          ) : null}
          {deliveryFee > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery fee</Text>
              <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(0)}</Text>
            </View>
          ) : null}
          {tax > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>₹{tax.toFixed(0)}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery tip</Text>
            <Text style={styles.summaryValue}>₹{tip.toFixed(0)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>To pay</Text>
            <Text style={styles.totalValue}>₹{estimatedTotal.toFixed(0)}</Text>
          </View>
        </View>

        <Pressable
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saveCart.isPending}
        >
          {saveCart.isPending ? (
            <ActivityIndicator color={authTheme.brand} />
          ) : (
            <>
              <Bookmark color={authTheme.brand} size={16} />
              <Text style={styles.saveText}>Save cart for later</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: 16 + APP_BOTTOM_NAV_INSET + Math.max(insets.bottom - 10, 0) },
        ]}
      >
        <Pressable
          onPress={handleCheckout}
          style={styles.checkoutBtn}
          disabled={validateCart.isPending}
        >
          <LinearGradient
            colors={[authTheme.brand, authTheme.brandDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutGradient}
          >
            {validateCart.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.checkoutText}>Proceed to checkout</Text>
                <Text style={styles.checkoutAmount}>
                  ₹{estimatedTotal.toFixed(0)}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: authTheme.bg },
  pad: { paddingHorizontal: 20, paddingTop: 8, gap: 6 },
  health: { color: authTheme.textDim, fontSize: 11, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.brandSoft,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 + APP_BOTTOM_NAV_INSET, gap: 12 },
  banner: {
    fontWeight: '700',
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerSuccess: {
    color: authTheme.brand,
    backgroundColor: authTheme.brandSoft,
  },
  bannerError: {
    color: '#B91C1C',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 12,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: authTheme.surface,
  },
  thumbEmpty: { backgroundColor: authTheme.brandSoft },
  rowBody: { flex: 1, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: {
    flex: 1,
    color: authTheme.text,
    fontWeight: '800',
    fontSize: 15,
  },
  price: { color: authTheme.text, fontWeight: '700', fontSize: 14 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: authTheme.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  qty: {
    fontWeight: '800',
    color: authTheme.text,
    minWidth: 16,
    textAlign: 'center',
  },
  removeBtn: { marginLeft: 'auto' },
  removeText: { color: authTheme.error, fontWeight: '700', fontSize: 12 },
  sectionLabel: {
    marginTop: 8,
    color: authTheme.text,
    fontWeight: '800',
    fontSize: 14,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: authTheme.cardBorder,
    backgroundColor: authTheme.card,
  },
  typeChipActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  typeText: { color: authTheme.text, fontWeight: '700', fontSize: 13 },
  typeTextActive: { color: '#FFFFFF' },
  addressCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: authTheme.surface,
    borderRadius: 14,
    padding: 12,
  },
  addressTitle: { color: authTheme.text, fontWeight: '800', fontSize: 13 },
  addressText: { color: authTheme.textMuted, fontSize: 12, marginTop: 2 },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: authTheme.card,
  },
  couponInput: { flex: 1, color: authTheme.text, paddingVertical: 6 },
  applyBtn: {
    backgroundColor: authTheme.brand,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  applyText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  input: {
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
    borderRadius: 14,
    padding: 12,
    textAlignVertical: 'top',
    color: authTheme.text,
    backgroundColor: authTheme.card,
  },
  tipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: authTheme.cardBorder,
    backgroundColor: authTheme.card,
  },
  tipChipActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  tipChipText: { color: authTheme.text, fontWeight: '700', fontSize: 13 },
  tipChipTextActive: { color: '#FFFFFF' },
  summary: {
    marginTop: 8,
    backgroundColor: authTheme.surface,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: { color: authTheme.textMuted, fontSize: 13 },
  summaryValue: { color: authTheme.text, fontWeight: '700', fontSize: 13 },
  discount: { color: '#16A34A' },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: authTheme.cardBorder,
    paddingTop: 10,
  },
  totalLabel: { color: authTheme.text, fontWeight: '800', fontSize: 15 },
  totalValue: { color: authTheme.text, fontWeight: '900', fontSize: 16 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: authTheme.brandSoft,
  },
  saveText: { color: authTheme.brand, fontWeight: '800' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: authTheme.bg,
    borderTopWidth: 1,
    borderTopColor: authTheme.cardBorder,
  },
  checkoutBtn: { borderRadius: 16, overflow: 'hidden' },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  checkoutText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  checkoutAmount: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  browseBtn: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: authTheme.brand,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseText: { color: '#FFFFFF', fontWeight: '800' },
  savedLink: { alignSelf: 'center', marginTop: 14 },
  savedLinkText: { color: authTheme.brand, fontWeight: '700' },
});
