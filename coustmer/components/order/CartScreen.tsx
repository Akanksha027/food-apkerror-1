import { Pressable } from '@/components/common/Pressable';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  Minus,
  MoreVertical,
  Plus,
  Star,
  Tag,
  ShoppingBag,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SmoothPressable } from '@/components/common/SmoothPressable';
import { fonts } from '@/constants/typography';
import {
  useCart,
  useClearRemoteCart,
  useRemoveCartItem,
  useSaveCart,
  useUpdateCartDeliveryAddress,
  useUpdateCartItem,
  useValidateCart,
} from '@/lib/cart/hooks';

import { useCreateOrder } from '@/lib/order/hooks';
import { parseDeliveryAddress } from '@/lib/order/parse-address';
import {
  useInitiatePayment,
  usePaymentMethods,
  usePaymentWallet,
  useVerifyPayment,
} from '@/lib/payment/hooks';
import { needsOnlinePayment } from '@/lib/payment/types';
import { generateTestPaymentUrl, simulatePaymentSuccess } from '@/lib/payment/test-urls';
import { useUserProfile } from '@/lib/profile/hooks';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useDeliveryLocationStore } from '@/store/delivery-location-store';
import { PaymentOptionsModal } from './PaymentOptionsModal';
import { OrderPlacementModal, PlacementPhase } from '@/components/order/OrderPlacementModal';
import { PaymentGatewayWebView } from '@/components/payment/PaymentGatewayWebView';

// ─── Design tokens ─────────────────────────────────────────────────────────
const BG = '#FFFFFF';
const WHITE = '#FFFFFF';
const ORANGE = '#F97316';
const ORANGE_DARK = '#EA580C';
const TEXT = '#111827';
const TEXT_SEC = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';
const STAR_COLOR = '#F97316';
const GREEN = '#16A34A';

// ─── Sub-components ─────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.ratingRow}>
      <Star color={STAR_COLOR} fill={STAR_COLOR} size={13} strokeWidth={0} />
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function QuantityStepper({
  quantity,
  onDecrement,
  onIncrement,
  busy,
}: {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  busy: boolean;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepMinus}
        onPress={onDecrement}
        disabled={busy}
        activeOpacity={0.7}
      >
        <Minus color={TEXT_SEC} size={14} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.stepQty}>
        {busy ? '…' : quantity}
      </Text>
      <TouchableOpacity
        style={styles.stepPlus}
        onPress={onIncrement}
        disabled={busy}
        activeOpacity={0.7}
      >
        <Plus color={WHITE} size={14} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

function CartItemCard({
  item,
  busy,
  onDecrement,
  onIncrement,
}: {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    isVeg?: boolean;
  };
  busy: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  // Fallback food image
  const imageUri =
    item.imageUrl ||
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&h=200&fit=crop';

  // Random-ish rating seeded by item name length
  const rating = 4.5 + ((item.name.length % 5) * 0.1);

  // Fake "restaurant" label from item name or use a placeholder
  const byLabel = 'By ' + (item.name.split(' ')[0] || 'Partner');

  return (
    <View style={styles.itemCard}>
      {/* Food Image */}
      <Image
        source={{ uri: imageUri }}
        style={styles.itemImage}
        contentFit="cover"
      />

      {/* Item Info */}
      <View style={styles.itemInfo}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>

        {/* Price + Stepper row */}
        <View style={styles.itemBottomRow}>
          <Text style={styles.itemPrice}>
            ₹{(item.price * item.quantity).toFixed(2)}
          </Text>
          <QuantityStepper
            quantity={item.quantity}
            onDecrement={onDecrement}
            onIncrement={onIncrement}
            busy={busy}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);
  const authUser = useAuthStore((s) => s.user);
  const isLoggedIn = Boolean(token);

  const restaurant = useCartStore((s) => s.restaurant);
  const items = useCartStore((s) => s.items);
  const specialInstructions = useCartStore((s) => s.specialInstructions);
  const discount = useCartStore((s) => s.discount);
  const clearLocal = useCartStore((s) => s.clearCart);
  const removeLocal = useCartStore((s) => s.removeItem);
  const setSpecialInstructions = useCartStore((s) => s.setSpecialInstructions);
  const tip = useCartStore((s) => s.tip);
  const setTip = useCartStore((s) => s.setTip);
  const subtotal = useCartStore((s) => s.subtotal());
  const estimatedTotal = useCartStore((s) => s.estimatedTotal());

  const location = useDeliveryLocationStore((s) => s.location);
  const profile = useUserProfile();
  const paymentMethods = usePaymentMethods();
  const wallet = usePaymentWallet();

  const [orderPlacementPhase, setOrderPlacementPhase] = useState<PlacementPhase>('none');

  const remoteCart = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearRemote = useClearRemoteCart();
  const updateAddress = useUpdateCartDeliveryAddress();
  const validateCart = useValidateCart();
  const saveCart = useSaveCart();

  const createOrder = useCreateOrder();
  const initiatePayment = useInitiatePayment();
  const verifyPayment = useVerifyPayment();

  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paying, setPaying] = useState(false);

  const [paymentGatewayOpen, setPaymentGatewayOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(false);

  const DELIVERY_FEE = 2.0;

  const displayName =
    profile.data?.displayName ||
    [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(' ') ||
    authUser?.firstName ||
    'Guest';

  const phoneDigits = (
    profile.data?.phone ||
    authUser?.phone ||
    ''
  ).replace(/\D/g, '');
  const phone =
    phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits || '—';

  const addressLabel = location?.label || 'Home';
  const addressLine = location?.formattedAddress || 'Add a delivery address';

  // Voucher discount (simple mock: 10% off if code entered)
  const voucherDiscount = voucherApplied ? subtotal * 0.10 : 0;
  const displaySubtotal = subtotal - discount;
  const displayTotal = displaySubtotal + DELIVERY_FEE - voucherDiscount;

  useEffect(() => {
    if (!location || !isLoggedIn) return;
    const parsed = parseDeliveryAddress({
      formattedAddress: location.formattedAddress,
      label: location.label,
      city: location.city,
      lat: location.lat,
      lng: location.lng,
    });
    void updateAddress
      .mutateAsync({
        label: parsed.label,
        formattedAddress: parsed.formattedAddress,
        street: parsed.street,
        area: parsed.area,
        city: parsed.city,
        state: parsed.state,
        pincode: parsed.pincode,
        lat: parsed.lat,
        lng: parsed.lng,
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.formattedAddress, isLoggedIn]);

  useEffect(() => {
    if (!items.length) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/home');
      }
    }
  }, [items.length]);

  const onRefresh = () => {
    remoteCart.refetch();
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
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
    } catch (e: any) {
      console.log('Update quantity error:', e);
    } finally {
      setBusyId(null);
    }
  };

  const handlePaymentComplete = async (success: boolean, data?: any) => {
    setPaymentGatewayOpen(false);

    if (success) {
      setOrderPlacementPhase('placed');
      if (currentOrder) {
        try {
          if (paymentUrl.includes('test') || paymentUrl.includes('httpbin')) {
            const simulatedResult = simulatePaymentSuccess(currentOrder.id, currentOrder.total ?? estimatedTotal);
            console.log('Simulated payment result:', simulatedResult);
          } else {
            await verifyPayment.mutateAsync({
              paymentId: data?.paymentId || 'unknown',
              orderId: currentOrder.id,
              gatewayPaymentId: data?.gatewayPaymentId || data?.paymentId,
              gatewayOrderId: data?.gatewayOrderId,
              status: 'success',
            });
          }
        } catch (verifyError) {
          console.warn('Payment verification failed:', verifyError);
        }
      }

      await new Promise((r) => setTimeout(r, 1500));
      router.replace({
        pathname: '/orders/[orderId]/tracking',
        params: { orderId: currentOrder?.id || '', newOrder: 'true' },
      });
      setOrderPlacementPhase('none');
    } else {
      Alert.alert(
        'Payment Failed',
        'Your payment could not be processed.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              if (paymentUrl) setPaymentGatewayOpen(true);
            },
          },
          { text: 'Contact Support', onPress: () => router.push('/support') },
        ]
      );
    }
  };

  const handlePaymentGatewayClose = () => {
    Alert.alert(
      'Cancel Payment?',
      'Your order has been placed and can be paid later.',
      [
        { text: 'Continue Payment', style: 'cancel' },
        {
          text: 'Cancel Payment',
          onPress: () => {
            setPaymentGatewayOpen(false);
            if (currentOrder) {
              router.replace({
                pathname: '/orders/[orderId]/tracking',
                params: { orderId: currentOrder.id, newOrder: 'true' },
              });
            }
          },
        },
      ]
    );
  };

  const placeOrder = async () => {
    if (!location) {
      Alert.alert('Address Missing', 'Please select a delivery address');
      return;
    }

    setPaying(true);
    setOrderPlacementPhase('placing');
    try {
      const parsedAddress = parseDeliveryAddress({
        formattedAddress: location.formattedAddress,
        label: location.label,
        city: location.city,
        lat: location.lat,
        lng: location.lng,
      });

      let mappedMethod = paymentMethod;
      let mappedMethodId: string | undefined = undefined;

      if (paymentMethod === 'paytm_upi' || paymentMethod === 'gpay') {
        mappedMethod = 'upi';
      } else if (paymentMethods.data?.some((m) => m.id === paymentMethod)) {
        const saved = paymentMethods.data.find((m) => m.id === paymentMethod);
        if (saved) {
          mappedMethod = saved.type;
          mappedMethodId = saved.id;
        }
      }

      const payload = {
        restaurantId: restaurant!.id,
        restaurantName: restaurant!.name,
        items: items.map((item) => ({
          menuItemId: item.menuItemId || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions,
        })),
        deliveryAddress: {
          label: parsedAddress.label,
          formattedAddress: parsedAddress.formattedAddress,
          street: parsedAddress.street,
          area: parsedAddress.area,
          city: parsedAddress.city,
          state: parsedAddress.state,
          pincode: parsedAddress.pincode,
          contactName: displayName,
          contactPhone: phone.replace(/\D/g, ''),
          lat: parsedAddress.lat,
          lng: parsedAddress.lng,
        },
        addressId: location.savedAddressId,
        paymentMethod: mappedMethod,
        specialInstructions: specialInstructions || undefined,
        tip: tip > 0 ? tip : undefined,
      };

      const order = await createOrder.mutateAsync(payload as any);
      setCurrentOrder(order);
      const amount = order.total ?? estimatedTotal;

      if (!needsOnlinePayment(mappedMethod)) {
        setOrderPlacementPhase('placed');
        await new Promise((r) => setTimeout(r, 1500));
        router.replace({
          pathname: '/orders/[orderId]/tracking',
          params: { orderId: order.id, newOrder: 'true' },
        });
        setOrderPlacementPhase('none');
        return;
      }

      let paymentUrlToOpen: string | undefined = undefined;
      let payment: any = null;

      if (order.raw && typeof order.raw.paymentUrl === 'string') {
        paymentUrlToOpen = order.raw.paymentUrl;
      } else if (order.raw) {
        paymentUrlToOpen =
          (order.raw.checkoutUrl as string | undefined) ||
          (order.raw.redirectUrl as string | undefined) ||
          (order.raw.gatewayUrl as string | undefined) ||
          (order.raw.url as string | undefined);
      }

      if (!paymentUrlToOpen) {
        try {
          payment = await initiatePayment.mutateAsync({
            orderId: order.id,
            amount,
            currency: 'INR',
            method: mappedMethod as any,
            methodId: mappedMethodId,
            description: `Order ${order.orderNumber || order.id}`,
          });

          paymentUrlToOpen =
            payment.paymentUrl ||
            payment.checkoutUrl ||
            payment.redirectUrl ||
            payment.gatewayUrl ||
            payment.url;
        } catch (initiateError) {
          console.error('Payment initiate failed:', initiateError);
          Alert.alert(
            'Payment Configuration Issue',
            'Payment gateway not properly configured.',
            [
              {
                text: 'Test Payment',
                onPress: () => {
                  const testUrl = generateTestPaymentUrl('razorpay', {
                    orderId: order.id,
                    amount,
                    currency: 'INR',
                    description: `Test Order ${order.orderNumber || order.id}`,
                  });
                  setPaymentUrl(testUrl);
                  setPaymentGatewayOpen(true);
                  setOrderPlacementPhase('none');
                },
              },
              {
                text: 'Cash on Delivery',
                onPress: async () => {
                  setOrderPlacementPhase('placed');
                  await new Promise((r) => setTimeout(r, 1000));
                  router.replace({
                    pathname: '/orders/[orderId]/tracking',
                    params: { orderId: order.id, newOrder: 'true' },
                  });
                  setOrderPlacementPhase('none');
                },
              },
              { text: 'Contact Support', onPress: () => router.push('/support') },
            ]
          );
          return;
        }
      }

      if (paymentUrlToOpen && paymentUrlToOpen.startsWith('http')) {
        setPaymentUrl(paymentUrlToOpen);
        setPaymentGatewayOpen(true);
        setOrderPlacementPhase('none');
        return;
      }

      Alert.alert(
        'Payment Issue',
        'No payment URL found.',
        [
          {
            text: 'Test Payment',
            onPress: () => {
              const testUrl = generateTestPaymentUrl('razorpay', {
                orderId: order.id,
                amount,
                currency: 'INR',
                description: `Test Order ${order.orderNumber || order.id}`,
              });
              setPaymentUrl(testUrl);
              setPaymentGatewayOpen(true);
              setOrderPlacementPhase('none');
            },
          },
          {
            text: 'Cash on Delivery',
            onPress: async () => {
              setOrderPlacementPhase('placed');
              await new Promise((r) => setTimeout(r, 1000));
              router.replace({
                pathname: '/orders/[orderId]/tracking',
                params: { orderId: order.id, newOrder: 'true' },
              });
              setOrderPlacementPhase('none');
            },
          },
          { text: 'Contact Support', onPress: () => router.push('/support') },
        ]
      );
    } catch (err: any) {
      console.error('Order placement error:', err);
      Alert.alert('Checkout Failed', err.message || 'Could not place order');
      setOrderPlacementPhase('none');
    } finally {
      setPaying(false);
    }
  };

  const handleClear = () => {
    setMenuOpen(false);
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

  const handleSave = async () => {
    setMenuOpen(false);
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
      Alert.alert('Saved', 'Cart saved for later');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again');
    }
  };

  const handleCheckout = async () => {
    try {
      const result = await validateCart.mutateAsync();
      if (!result.valid) {
        const msg =
          result.issues.map((i: any) => i.message).join('\n') ||
          result.message ||
          'Cart validation failed';
        Alert.alert('Cart needs attention', msg);
        if (result.cart) remoteCart.refetch();
        return;
      }
    } catch {
      // allow local checkout
    }
    placeOrder();
  };

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) {
      Alert.alert('Enter a voucher code');
      return;
    }
    setVoucherApplied(true);
    Alert.alert('Voucher Applied', '10% discount applied!');
  };

  // ── Loading / Empty states ──────────────────────────────────────────────
  if (remoteCart.isLoading && !items.length) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={ORANGE} size="large" />
          <Text style={styles.loadingText}>Loading cart…</Text>
        </View>
      </View>
    );
  }

  if (!items.length || !restaurant) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.topBar}>
          <SmoothPressable onPress={goBack} style={styles.iconBtn} pressScale={0.9}>
            <ArrowLeft color={TEXT} size={22} strokeWidth={2.2} />
          </SmoothPressable>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.emptyWrap}>
          <ShoppingBag color={TEXT_MUTED} size={80} strokeWidth={1.2} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items from a restaurant to get started</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.replace('/home')}
            activeOpacity={0.85}
          >
            <Text style={styles.browseBtnText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const footerPad = Math.max(insets.bottom, 12);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { backgroundColor: BG }]}>
        {/* ── Top Bar ─────────────────────────────────────────────── */}
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
          <SmoothPressable onPress={goBack} style={styles.iconBtn} pressScale={0.9}>
            <View style={styles.backBtnCircle}>
              <ArrowLeft color={TEXT} size={20} strokeWidth={2} />
            </View>
          </SmoothPressable>

          <Text style={styles.headerTitle}>Cart</Text>

          <SmoothPressable
            onPress={() => setMenuOpen(true)}
            style={styles.iconBtn}
            pressScale={0.9}
          >
            <MoreVertical color={TEXT} size={20} strokeWidth={2} />
          </SmoothPressable>
        </View>

        {/* ── Scroll Content ─────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 + footerPad },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={remoteCart.isRefetching}
              onRefresh={onRefresh}
              tintColor={ORANGE}
            />
          }
        >
          {/* ── Cart Items ──────────────────────────────────────── */}
          <View style={styles.section}>
            {/* Restaurant Info Header */}
            {restaurant && (
              <View style={styles.restaurantHeader}>
                <Text style={styles.restaurantTitle}>Ordering from</Text>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {restaurant.name}
                </Text>
                <View style={styles.restaurantDivider} />
              </View>
            )}

            {items.map((item, index) => (
              <View key={item.id}>
                <CartItemCard
                  item={item}
                  busy={busyId === item.id}
                  onDecrement={() => syncQty(item.id, item.quantity - 1)}
                  onIncrement={() => syncQty(item.id, item.quantity + 1)}
                />
                {index < items.length - 1 && <View style={styles.itemDivider} />}
              </View>
            ))}

            {/* View More Items Button */}
            <View style={styles.addMoreWrap}>
              <TouchableOpacity
                style={styles.addMoreBtn}
                activeOpacity={0.7}
                onPress={() => {
                  if (restaurant?.id) {
                    router.push(`/restaurants/${restaurant.id}`);
                  } else {
                    router.push('/home');
                  }
                }}
              >
                <Plus color={ORANGE} size={18} strokeWidth={2.5} />
                <Text style={styles.addMoreText}>View more items</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Voucher Code ─────────────────────────────────────── */}
          <View style={styles.voucherCard}>
            <View style={styles.voucherLeft}>
              <View style={styles.voucherIconWrap}>
                <Tag color={TEXT_SEC} size={18} strokeWidth={2} />
              </View>
              <TextInput
                style={styles.voucherInput}
                placeholder="Enter your voucher code"
                placeholderTextColor={TEXT_MUTED}
                value={voucherCode}
                onChangeText={setVoucherCode}
                returnKeyType="done"
                onSubmitEditing={handleApplyVoucher}
                editable={!voucherApplied}
              />
            </View>
            <TouchableOpacity
              onPress={voucherApplied ? () => {
                setVoucherApplied(false);
                setVoucherCode('');
              } : handleApplyVoucher}
              activeOpacity={0.7}
            >
              <ChevronRight color={TEXT_SEC} size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* ── Bill Summary ─────────────────────────────────────── */}
          <View style={styles.billCard}>
            {/* Subtotal */}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal:</Text>
              <Text style={styles.billValue}>₹{displaySubtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.billDivider} />

            {/* Delivery Fee */}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee:</Text>
              <Text style={styles.billValue}>₹{DELIVERY_FEE.toFixed(2)}</Text>
            </View>

            {/* Voucher discount */}
            {voucherApplied && (
              <>
                <View style={styles.billDivider} />
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: GREEN }]}>Voucher Discount:</Text>
                  <Text style={[styles.billValue, { color: GREEN }]}>
                    -₹{voucherDiscount.toFixed(2)}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.billSeparator} />

            {/* Total */}
            <View style={styles.billRow}>
              <Text style={styles.billTotalLabel}>Total Amount:</Text>
              <Text style={styles.billTotalValue}>₹{displayTotal.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* ── Bottom Checkout Bar ─────────────────────────────────── */}
        <View style={[styles.checkoutBar, { paddingBottom: footerPad }]}>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleCheckout}
            disabled={validateCart.isPending || paying}
            activeOpacity={0.9}
          >
            {/* Left price pill */}
            <View style={styles.checkoutPriceWrap}>
              {validateCart.isPending || paying ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <Text style={styles.checkoutPrice}>₹{displayTotal.toFixed(2)}</Text>
              )}
            </View>

            {/* Right label */}
            <View style={styles.checkoutLabelWrap}>
              <Text style={styles.checkoutLabel}>Checkout</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Overflow Menu Modal ─────────────────────────────────── */}
        <Modal
          visible={menuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setMenuOpen(false)}
          >
            <View style={[styles.menuSheet, { top: insets.top + 56 }]}>
              <Pressable style={styles.menuItem} onPress={handleSave}>
                <Text style={styles.menuItemText}>Save cart for later</Text>
              </Pressable>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/cart/saved' as import('expo-router').Href);
                }}
              >
                <Text style={styles.menuItemText}>View saved carts</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={handleClear}>
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>
                  Clear cart
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* ── Payment Options Modal ───────────────────────────────── */}
        <PaymentOptionsModal
          visible={isPaymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          selectedMethod={paymentMethod}
          onSelectMethod={(m) => {
            setPaymentMethod(m);
            setPaymentModalOpen(false);
          }}
          onPay={() => { }}
          itemCount={items.length}
          total={estimatedTotal}
          savings={discount}
          restaurantName={restaurant?.name || ''}
          deliveryTime="35-45 mins"
          addressLabel={addressLabel}
          addressText={addressLine}
          savedMethods={paymentMethods.data}
          wallet={wallet.data}
        />

        {/* ── Order Placement Modal ───────────────────────────────── */}
        <OrderPlacementModal
          phase={orderPlacementPhase}
          addressLabel={addressLabel}
          addressText={addressLine}
          savings={discount}
        />

        {/* ── Payment Gateway WebView ─────────────────────────────── */}
        <PaymentGatewayWebView
          visible={paymentGatewayOpen}
          onClose={handlePaymentGatewayClose}
          paymentUrl={paymentUrl}
          onPaymentComplete={handlePaymentComplete}
          orderAmount={currentOrder?.total ?? estimatedTotal}
          orderNumber={currentOrder?.orderNumber}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Loading ──
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: fonts.uiMedium,
    fontSize: 15,
    color: TEXT_SEC,
  },

  // ── Empty ──
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: TEXT,
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: TEXT_SEC,
    textAlign: 'center',
    lineHeight: 20,
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: ORANGE,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  browseBtnText: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: WHITE,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: WHITE,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: TEXT,
    letterSpacing: -0.3,
  },

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },

  // ── Section card (items) ──
  section: {
    backgroundColor: WHITE,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  restaurantHeader: {
    padding: 16,
    paddingBottom: 4,
  },
  restaurantTitle: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: TEXT_SEC,
    marginBottom: 2,
  },
  restaurantName: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: TEXT,
    marginBottom: 12,
  },
  restaurantDivider: {
    height: 1,
    backgroundColor: BORDER,
    width: '100%',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 14,
  },
  addMoreWrap: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFF5EE',
  },
  addMoreText: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: ORANGE,
  },

  // ── Cart Item Card ──
  itemCard: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  itemImage: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: TEXT,
    flex: 1,
    marginRight: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: STAR_COLOR,
  },
  itemByLine: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  itemPrice: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: TEXT,
  },

  // ── Stepper ──
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    overflow: 'hidden',
    height: 36,
  },
  stepMinus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  stepQty: {
    minWidth: 28,
    textAlign: 'center',
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: TEXT,
    paddingHorizontal: 4,
  },
  stepPlus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  itemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginHorizontal: 14,
  },

  // ── Voucher Card ──
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  voucherLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voucherIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherInput: {
    flex: 1,
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: TEXT,
    paddingVertical: 0,
  },

  // ── Bill Card ──
  billCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: TEXT_SEC,
  },
  billValue: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: TEXT,
  },
  billDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
  },
  billSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  billTotalLabel: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: TEXT,
  },
  billTotalValue: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: TEXT,
  },

  // ── Checkout Bar ──
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: WHITE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ORANGE_DARK,
    borderRadius: 50,
    height: 58,
    padding: 4,
    width: '100%',
  },
  checkoutPriceWrap: {
    backgroundColor: 'transparent',
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  checkoutPrice: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: WHITE,
  },
  checkoutLabelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
    borderRadius: 50,
    height: '100%',
    paddingHorizontal: 28,
  },
  checkoutLabel: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: TEXT,
  },

  // ── Overflow Menu ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  menuSheet: {
    position: 'absolute',
    right: 14,
    backgroundColor: WHITE,
    borderRadius: 14,
    minWidth: 200,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  menuItem: {
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  menuItemText: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: TEXT,
  },
});
