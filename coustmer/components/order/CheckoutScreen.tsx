import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { CalendarClock, CreditCard, MapPin, Phone, User, Wallet } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressPickerSheet } from '@/components/address/AddressPickerSheet';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { DeliveryLocationPicker } from '@/components/location/DeliveryLocationPicker';
import { authTheme } from '@/constants/auth-theme';
import { swiggyOrderUi as ui } from '@/constants/swiggy-order-ui';
import type { SavedAddress } from '@/lib/address/types';
import {
  extractCityFromAddress,
  normalizeCityName,
} from '@/lib/location/format';
import { useCreateOrder } from '@/lib/order/hooks';
import { parseDeliveryAddress } from '@/lib/order/parse-address';
import { isValidIndianPhone, toTenDigitIndianMobile } from '@/lib/order/phone';
import type { CreateOrderPayload } from '@/lib/order/types';
import {
  useInitiatePayment,
  usePaymentMethods,
  usePaymentWallet,
  useVerifyPayment,
} from '@/lib/payment/hooks';
import {
  isPaymentSuccess,
  needsOnlinePayment,
} from '@/lib/payment/types';
import { useUserProfile } from '@/lib/profile/hooks';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useDeliveryLocationStore } from '@/store/delivery-location-store';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on delivery' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
  { id: 'wallet', label: 'Wallet' },
] as const;

export function CheckoutScreen() {
  const router = useRouter();
  const createOrder = useCreateOrder();
  const initiatePayment = useInitiatePayment();
  const verifyPayment = useVerifyPayment();
  const paymentMethods = usePaymentMethods();
  const wallet = usePaymentWallet();
  const profile = useUserProfile();
  const authUser = useAuthStore((s) => s.user);

  const restaurant = useCartStore((s) => s.restaurant);
  const items = useCartStore((s) => s.items);
  const tip = useCartStore((s) => s.tip);
  const specialInstructions = useCartStore((s) => s.specialInstructions);
  const scheduledFor = useCartStore((s) => s.scheduledFor);
  const setScheduledFor = useCartStore((s) => s.setScheduledFor);
  const clearCart = useCartStore((s) => s.clearCart);

  const clearAllCarts = async () => {
    clearCart();
    try {
      const { cartApi } = await import('@/lib/cart/api');
      await cartApi.clearCart();
    } catch {
      // local already cleared
    }
  };
  const subtotal = useCartStore((s) => s.subtotal());

  const location = useDeliveryLocationStore((s) => s.location);
  const setDeliveryLocation = useDeliveryLocationStore((s) => s.setLocation);

  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHODS)[number]['id']>('cod');
  const [savedMethodId, setSavedMethodId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(Boolean(scheduledFor));
  const [scheduleInput, setScheduleInput] = useState(() => {
    if (scheduledFor) return scheduledFor.slice(0, 16);
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const name =
      profile.data?.displayName ||
      [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(' ') ||
      [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') ||
      authUser?.email?.split('@')[0] ||
      '';
    const phone = profile.data?.phone || authUser?.phone || '';
    setContactName((prev) => prev || name);
    setContactPhone((prev) => {
      if (prev) return prev;
      return toTenDigitIndianMobile(phone) || phone;
    });
  }, [profile.data, authUser]);

  useEffect(() => {
    const defaults = paymentMethods.data ?? [];
    const match = defaults.find(
      (m) =>
        m.isDefault &&
        (paymentMethod === 'upi'
          ? m.type === 'upi'
          : paymentMethod === 'card'
            ? m.type === 'card'
            : false)
    );
    setSavedMethodId(match?.id ?? null);
  }, [paymentMethod, paymentMethods.data]);

  const estimatedTotal = subtotal + tip;

  const matchingSavedMethods = useMemo(() => {
    const all = paymentMethods.data ?? [];
    if (paymentMethod === 'upi') return all.filter((m) => m.type === 'upi');
    if (paymentMethod === 'card') return all.filter((m) => m.type === 'card');
    return [];
  }, [paymentMethod, paymentMethods.data]);

  const parsedAddress = useMemo(() => {
    if (!location) return null;
    return parseDeliveryAddress({
      formattedAddress: location.formattedAddress,
      label: location.label,
      city: location.city,
      lat: location.lat,
      lng: location.lng,
    });
  }, [location]);

  const canPlace = Boolean(
    restaurant &&
      items.length &&
      parsedAddress &&
      contactName.trim() &&
      isValidIndianPhone(contactPhone)
  );

  const isBusy =
    paying ||
    createOrder.isPending ||
    initiatePayment.isPending ||
    verifyPayment.isPending;

  const payload = useMemo((): CreateOrderPayload | null => {
    if (!restaurant || !items.length || !parsedAddress) return null;
    const phone = toTenDigitIndianMobile(contactPhone);
    if (!contactName.trim() || !phone) return null;

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
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
        contactName: contactName.trim(),
        contactPhone: phone,
        lat: parsedAddress.lat,
        lng: parsedAddress.lng,
      },
      addressId: location?.savedAddressId,
      paymentMethod,
      specialInstructions: specialInstructions || undefined,
      tip: tip > 0 ? tip : undefined,
      scheduledFor:
        scheduleEnabled && scheduleInput
          ? new Date(scheduleInput).toISOString()
          : undefined,
    };
  }, [
    restaurant,
    items,
    parsedAddress,
    contactName,
    contactPhone,
    paymentMethod,
    specialInstructions,
    tip,
    scheduleEnabled,
    scheduleInput,
    location?.savedAddressId,
  ]);

  const applySavedAddress = (address: SavedAddress) => {
    setDeliveryLocation({
      label: address.label || 'Saved',
      formattedAddress: address.formattedAddress,
      city: normalizeCityName(
        address.city || extractCityFromAddress(address.formattedAddress)
      ),
      lat: address.lat,
      lng: address.lng,
      source: 'saved',
      savedAddressId: address.id,
      updatedAt: Date.now(),
    });
    if (address.contactName) setContactName(address.contactName);
    if (address.contactPhone) setContactPhone(address.contactPhone);
    setAddressSheetOpen(false);
  };

  const goToOrder = (orderId: string) => {
    router.replace({
      pathname: '/orders/[orderId]',
      params: { orderId },
    });
  };

  const placeOrder = async () => {
    if (!location || !parsedAddress) {
      setError('Set a delivery address on the Home screen first.');
      return;
    }
    if (!contactName.trim() || !toTenDigitIndianMobile(contactPhone)) {
      setError('Enter a valid 10-digit Indian mobile (starts with 6–9).');
      return;
    }
    if (!payload) {
      setError('Add cart items before placing an order.');
      return;
    }

    if (
      paymentMethod === 'wallet' &&
      wallet.data &&
      wallet.data.balance < estimatedTotal
    ) {
      setError(
        `Insufficient wallet balance (₹${wallet.data.balance.toFixed(0)}). Top up or choose another method.`
      );
      return;
    }

    setError(null);
    setPaying(true);
    try {
      const order = await createOrder.mutateAsync(payload);
      const amount = order.total ?? estimatedTotal;

      if (!needsOnlinePayment(paymentMethod)) {
        await clearAllCarts();
        setScheduledFor(null);
        Alert.alert('Order placed', 'Pay cash on delivery when your order arrives.', [
          { text: 'Track order', onPress: () => goToOrder(order.id) },
        ]);
        return;
      }

      const payment = await initiatePayment.mutateAsync({
        orderId: order.id,
        amount,
        currency: 'INR',
        method: paymentMethod,
        methodId: savedMethodId || undefined,
        description: `Order ${order.orderNumber || order.id}`,
      });

      if (payment.paymentUrl) {
        await Linking.openURL(payment.paymentUrl);
      }

      let verified = payment;
      try {
        if (!isPaymentSuccess(payment.status)) {
          verified = await verifyPayment.mutateAsync({
            paymentId: payment.id,
            orderId: order.id,
            gatewayPaymentId: payment.gatewayPaymentId,
            gatewayOrderId: payment.gatewayOrderId ?? payment.razorpayOrderId,
            razorpay_payment_id: payment.gatewayPaymentId,
            razorpay_order_id: payment.razorpayOrderId ?? payment.gatewayOrderId,
            transactionId: payment.gatewayPaymentId,
            status: paymentMethod === 'wallet' ? 'success' : undefined,
          });
        }
      } catch {
        verified = payment;
      }

      await clearAllCarts();
      setScheduledFor(null);

      const paid = isPaymentSuccess(verified.status);
      Alert.alert(
        paid ? 'Payment successful' : 'Order placed',
        paid
          ? 'Your payment was confirmed and the order is confirmed.'
          : `Order created. Payment status: ${verified.status}. You can verify from Payments if needed.`,
        [
          {
            text: paid ? 'Track order' : 'View payment',
            onPress: () => {
              if (paid) goToOrder(order.id);
              else
                router.replace({
                  pathname: '/payments/[paymentId]',
                  params: { paymentId: verified.id },
                });
            },
          },
          ...(paid
            ? []
            : [{ text: 'Track order', onPress: () => goToOrder(order.id) }]),
        ]
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setPaying(false);
    }
  };

  if (!restaurant || !items.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.pad}>
          <ScreenHeader title="Checkout" />
          <Text style={styles.empty}>Your cart is empty.</Text>
          <Pressable style={styles.linkBtn} onPress={() => router.replace('/cart')}>
            <Text style={styles.linkText}>Go to cart</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenHeader title="Checkout" subtitle={restaurant.name} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Pressable
          style={styles.card}
          onPress={() => setAddressSheetOpen(true)}
        >
          <MapPin color={authTheme.brand} size={18} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Deliver to</Text>
            <Text style={styles.cardText}>
              {location
                ? location.label + ' · ' + location.formattedAddress
                : 'Choose a delivery address'}
            </Text>
            {parsedAddress ? (
              <Text style={styles.addressMeta}>
                {parsedAddress.street}, {parsedAddress.area}, {parsedAddress.city},{' '}
                {parsedAddress.state} {parsedAddress.pincode}
              </Text>
            ) : null}
            <Text style={styles.changeHint}>Tap to change</Text>
          </View>
        </Pressable>

        <View style={styles.card}>
          <User color={authTheme.brand} size={18} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Contact name</Text>
            <TextInput
              style={styles.input}
              value={contactName}
              onChangeText={setContactName}
              placeholder="Receiver name"
              placeholderTextColor={authTheme.textDim}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Phone color={authTheme.brand} size={18} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Contact phone</Text>
            <TextInput
              style={styles.input}
              value={contactPhone}
              onChangeText={(text) =>
                setContactPhone(text.replace(/[^\d+]/g, '').slice(0, 13))
              }
              placeholder="9876543210"
              placeholderTextColor={authTheme.textDim}
              keyboardType="phone-pad"
              maxLength={13}
            />
            <Text style={styles.hint}>
              Enter 10-digit mobile only (example: 9876543210)
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Wallet color={authTheme.brand} size={18} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Payment</Text>
            {wallet.data ? (
              <Text style={styles.hint}>
                Wallet balance ₹{wallet.data.balance.toFixed(0)}
              </Text>
            ) : null}
            <View style={styles.payRow}>
              {PAYMENT_METHODS.map((method) => (
                <Pressable
                  key={method.id}
                  style={[
                    styles.payChip,
                    paymentMethod === method.id && styles.payChipActive,
                  ]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <Text
                    style={[
                      styles.payChipText,
                      paymentMethod === method.id && styles.payChipTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {matchingSavedMethods.length > 0 ? (
              <View style={styles.savedBlock}>
                <Text style={styles.savedLabel}>Saved method</Text>
                {matchingSavedMethods.map((method) => (
                  <Pressable
                    key={method.id}
                    style={[
                      styles.savedChip,
                      savedMethodId === method.id && styles.savedChipActive,
                    ]}
                    onPress={() => setSavedMethodId(method.id)}
                  >
                    <CreditCard
                      color={
                        savedMethodId === method.id
                          ? '#FFFFFF'
                          : authTheme.brand
                      }
                      size={14}
                    />
                    <Text
                      style={[
                        styles.savedChipText,
                        savedMethodId === method.id &&
                          styles.savedChipTextActive,
                      ]}
                    >
                      {method.label}
                      {method.isDefault ? ' · Default' : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : paymentMethod === 'upi' || paymentMethod === 'card' ? (
              <Pressable onPress={() => router.push('/payments/methods')}>
                <Text style={styles.linkInline}>
                  Save a {paymentMethod.toUpperCase()} method for faster checkout
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <CalendarClock color={authTheme.brand} size={18} />
          <View style={styles.cardBody}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.cardTitle}>Schedule for later</Text>
              <Pressable
                style={[styles.toggle, scheduleEnabled && styles.toggleOn]}
                onPress={() => {
                  const next = !scheduleEnabled;
                  setScheduleEnabled(next);
                  setScheduledFor(
                    next ? new Date(scheduleInput).toISOString() : null
                  );
                }}
              >
                <Text style={styles.toggleText}>
                  {scheduleEnabled ? 'ON' : 'OFF'}
                </Text>
              </Pressable>
            </View>
            {scheduleEnabled ? (
              <TextInput
                style={styles.input}
                value={scheduleInput}
                onChangeText={(v) => {
                  setScheduleInput(v);
                  const parsed = new Date(v);
                  if (!Number.isNaN(parsed.getTime())) {
                    setScheduledFor(parsed.toISOString());
                  }
                }}
                placeholder="YYYY-MM-DDTHH:mm"
                placeholderTextColor={authTheme.textDim}
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.cardText}>
                Order will be placed for ASAP delivery
              </Text>
            )}
          </View>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {item.quantity}× {item.name}
              </Text>
              <Text style={styles.summaryValue}>
                ₹{(item.price * item.quantity).toFixed(0)}
              </Text>
            </View>
          ))}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tip</Text>
            <Text style={styles.summaryValue}>₹{tip.toFixed(0)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.totalValue}>₹{estimatedTotal.toFixed(0)}</Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          disabled={!canPlace || isBusy}
          onPress={placeOrder}
          style={[styles.placeBtn, (!canPlace || isBusy) && styles.disabled]}
        >
          <LinearGradient
            colors={[authTheme.brand, authTheme.brandDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.placeGradient}
          >
            {isBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View>
                  <Text style={styles.placeAmount}>
                    ₹{estimatedTotal.toFixed(0)}
                  </Text>
                  <Text style={styles.placeAmountSub}>TOTAL</Text>
                </View>
                <Text style={styles.placeText}>
                  {needsOnlinePayment(paymentMethod)
                    ? 'PAY & PLACE ORDER'
                    : 'PLACE ORDER'}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      <AddressPickerSheet
        visible={addressSheetOpen}
        activeAddressId={location?.savedAddressId}
        onClose={() => setAddressSheetOpen(false)}
        onSelectSaved={applySavedAddress}
        onChooseOnMap={() => {
          setAddressSheetOpen(false);
          setMapPickerOpen(true);
        }}
        onAddNew={() => {
          setAddressSheetOpen(false);
          router.push('/profile/addresses/new' as import('expo-router').Href);
        }}
      />

      <DeliveryLocationPicker
        visible={mapPickerOpen}
        initial={
          location ? { lat: location.lat, lng: location.lng } : undefined
        }
        autoDetectOnOpen={!location}
        onClose={() => setMapPickerOpen(false)}
        onConfirm={(result) => {
          setMapPickerOpen(false);
          setDeliveryLocation({
            label: result.label,
            formattedAddress: result.formattedAddress,
            city: normalizeCityName(
              extractCityFromAddress(result.formattedAddress)
            ),
            lat: result.lat,
            lng: result.lng,
            source: result.source === 'saved' ? 'saved' : result.source,
            savedAddressId: result.savedAddressId,
            updatedAt: Date.now(),
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ui.pageBg },
  pad: {
    paddingHorizontal: ui.hPad,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: ui.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  scroll: {
    paddingHorizontal: ui.hPad,
    paddingTop: 12,
    paddingBottom: 120,
    gap: ui.sectionGap,
  },
  empty: { color: ui.textSecondary, marginTop: 24, textAlign: 'center' },
  linkBtn: {
    alignSelf: 'center',
    marginTop: 16,
    backgroundColor: ui.orange,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  linkText: { color: '#FFFFFF', fontWeight: '800' },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: ui.card,
    borderRadius: ui.radius,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardBody: { flex: 1, gap: 8 },
  cardTitle: { color: ui.text, fontWeight: '800', fontSize: 14 },
  cardText: { color: ui.textSecondary, fontSize: 13, lineHeight: 18 },
  addressMeta: {
    color: ui.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  changeHint: {
    color: ui.orange,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  payRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  payChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: ui.border,
    backgroundColor: '#FFFFFF',
  },
  payChipActive: {
    backgroundColor: ui.orangeSoft,
    borderColor: ui.orange,
  },
  payChipText: { color: ui.text, fontWeight: '700', fontSize: 12 },
  payChipTextActive: { color: ui.orange },
  savedBlock: { gap: 8, marginTop: 4 },
  savedLabel: {
    color: ui.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: '#FAFAFB',
  },
  savedChipActive: {
    backgroundColor: ui.orange,
    borderColor: ui.orange,
  },
  savedChipText: {
    color: ui.text,
    fontWeight: '600',
    fontSize: 12,
    flex: 1,
  },
  savedChipTextActive: { color: '#FFFFFF' },
  linkInline: {
    color: ui.orange,
    fontWeight: '700',
    fontSize: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    backgroundColor: '#F0F0F5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  toggleOn: { backgroundColor: ui.greenSoft },
  toggleText: { color: ui.orange, fontWeight: '800', fontSize: 11 },
  input: {
    borderWidth: 1,
    borderColor: ui.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: ui.text,
    backgroundColor: '#FAFAFB',
  },
  hint: {
    color: ui.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  summary: {
    backgroundColor: ui.card,
    borderRadius: ui.radius,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryTitle: {
    color: ui.text,
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: { flex: 1, color: ui.textSecondary, fontSize: 13 },
  summaryValue: { color: ui.text, fontWeight: '700', fontSize: 13 },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: ui.border,
    borderStyle: 'dashed',
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { color: ui.text, fontWeight: '900', letterSpacing: 0.2 },
  totalValue: { color: ui.text, fontWeight: '900', fontSize: 16 },
  error: { color: authTheme.error, fontWeight: '600', fontSize: 13 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: ui.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  placeBtn: { borderRadius: 12, overflow: 'hidden' },
  disabled: { opacity: 0.6 },
  placeGradient: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  placeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  placeAmount: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  placeAmountSub: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
