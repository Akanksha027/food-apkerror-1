import { Pressable } from '@/components/common/Pressable';
import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Home,
  Minus,
  MoreVertical,
  Pencil,
  Plus,
  Sparkles,
  ShoppingBag,
  X,
  FileText,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator,
  Alert,
  Linking,
  Modal,
  
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyView, ErrorView, LoadingView } from '@/components/common/StateViews';
import { SmoothPressable } from '@/components/common/SmoothPressable';
import { VegBadge } from '@/components/restaurant/MenuBadges';
import { authTheme } from '@/constants/auth-theme';
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
import { addMenuItemToCart } from '@/lib/order/add-to-cart';
import { useCreateOrder } from '@/lib/order/hooks';
import { parseDeliveryAddress } from '@/lib/order/parse-address';
import { useInitiatePayment, usePaymentMethods, usePaymentWallet, useVerifyPayment } from '@/lib/payment/hooks';
import { isPaymentSuccess, needsOnlinePayment } from '@/lib/payment/types';
import { generateTestPaymentUrl, simulatePaymentSuccess } from '@/lib/payment/test-urls';
import { useUserProfile } from '@/lib/profile/hooks';
import { useFullMenu } from '@/lib/restaurant/hooks';
import type { MenuItem } from '@/lib/restaurant/types';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useDeliveryLocationStore } from '@/store/delivery-location-store';
import { PaymentOptionsModal } from './PaymentOptionsModal';
import { OrderPlacementModal, PlacementPhase } from '@/components/order/OrderPlacementModal';
import { DeliveryPreferences } from '@/components/order/DeliveryPreferences';
import { PaymentGatewayWebView } from '@/components/payment/PaymentGatewayWebView';

const PAGE_BG = '#F0F0F5';
const TEXT = '#02060C';
const TEXT_SEC = '#686B78';
const TEXT_MUTED = '#9197A6';
const BORDER = '#E2E2E7';
const GREEN = '#1BA672';
const GREEN_SOFT = '#E8F8F0';
const GREEN_BORDER = '#B6E5CB';
const ORANGE = '#AC0F45';
const PAY_GREEN = '#1BA672';
const PAYTM_ICON = 'https://img.icons8.com/color/96/paytm.png';

type TipId = 'cutlery' | 'payment' | null;

function OneWord() {
  return (
    <MaskedView
      style={styles.oneWordMask}
      maskElement={
        <Text style={styles.oneWordText} numberOfLines={1}>
          one
        </Text>
      }
    >
      <LinearGradient
        colors={['#AC0F45', '#E53935']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </MaskedView>
  );
}

function BlackTip({
  text,
  top,
  onClose,
  align = 'center',
}: {
  text: string;
  top: number;
  onClose: () => void;
  align?: 'left' | 'center' | 'right';
}) {
  const alignSelf =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const tipLeft =
    align === 'left' ? 24 : align === 'right' ? undefined : undefined;
  const tipRight = align === 'right' ? 28 : undefined;

  return (
    <View
      style={[styles.tipLayer, { top }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.tipBubble,
          { alignSelf, marginLeft: tipLeft, marginRight: tipRight },
        ]}
      >
        <Text style={styles.tipText}>{text}</Text>
        <Pressable onPress={onClose} hitSlop={10} style={styles.tipClose}>
          <X color="#FFFFFF" size={14} strokeWidth={2.6} />
        </Pressable>
      </View>
      <View
        style={[
          styles.tipTail,
          align === 'left' && { alignSelf: 'flex-start', marginLeft: 72 },
          align === 'right' && { alignSelf: 'flex-end', marginRight: 88 },
          align === 'center' && { alignSelf: 'center' },
        ]}
      />
    </View>
  );
}

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
  const scrollViewRef = useRef<ScrollView>(null);
  const [orderPlacementPhase, setOrderPlacementPhase] = useState<PlacementPhase>('none');
  const menu = useFullMenu(restaurant?.id ?? '', {
    name: restaurant?.name,
  });

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
  const [cutleryNeeded, setCutleryNeeded] = useState(false);
  const [oneAdded, setOneAdded] = useState(false);
  const [isBillExpanded, setIsBillExpanded] = useState(true);
  const [cookingOpen, setCookingOpen] = useState(false);
  const [cookingDraft, setCookingDraft] = useState(specialInstructions);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTip, setActiveTip] = useState<TipId>(null);
  const [cutleryTipTop, setCutleryTipTop] = useState(0);
  const [payTipTop, setPayTipTop] = useState(0);
  const tipsStarted = useRef(false);
  const cutleryRef = useRef<View>(null);
  const payUsingRef = useRef<View>(null);

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
  const addressLine =
    location?.formattedAddress || 'Add a delivery address';

  const savedAmount = useMemo(() => {
    if (discount > 0) return Math.round(discount);
    const mrp = items.reduce(
      (sum, item) => sum + Math.round(item.price * 0.35) * item.quantity,
      0
    );
    return mrp;
  }, [discount, items]);

  const payLabel = 
    paymentMethod === 'upi' ? 'Paytm UPI' :
    paymentMethod === 'gpay' ? 'Google Pay' :
    paymentMethod === 'card' ? 'Credit/Debit Card' :
    paymentMethod === 'wallet' ? 'Wallet' :
    paymentMethod === 'cod' ? 'Pay on Delivery' : 'Paytm UPI';

  const payIcon = 
    paymentMethod === 'upi' ? PAYTM_ICON :
    paymentMethod === 'gpay' ? 'https://img.icons8.com/color/96/google-pay-india.png' :
    paymentMethod === 'card' ? 'https://img.icons8.com/color/96/bank-cards.png' :
    paymentMethod === 'wallet' ? 'https://img.icons8.com/color/96/wallet.png' :
    paymentMethod === 'cod' ? 'https://img.icons8.com/color/96/cash-in-hand.png' : PAYTM_ICON;

  const mealSuggestions = useMemo(() => {
    const inCart = new Set(
      items.map((i) => i.menuItemId || i.id).filter(Boolean)
    );
    return menu.items
      .filter((m) => m.isAvailable !== false && !inCart.has(m.id))
      .slice(0, 10);
  }, [menu.items, items]);

  useEffect(() => {
    setCookingDraft(specialInstructions);
  }, [specialInstructions]);

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

  const measureCutleryTip = () => {
    cutleryRef.current?.measureInWindow((_x, y, _w, h) => {
      setCutleryTipTop(Math.max(y - 56, insets.top + 80));
    });
  };

  const measurePayTip = () => {
    payUsingRef.current?.measureInWindow((_x, y) => {
      setPayTipTop(Math.max(y - 62, insets.top + 120));
    });
  };

  useEffect(() => {
    if (!items.length) {
      tipsStarted.current = false;
      setActiveTip(null);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/home');
      }
    }
  }, [items.length]);

  useEffect(() => {
    if (!items.length || !restaurant || tipsStarted.current) return;
    tipsStarted.current = true;
    const t = setTimeout(() => {
      measureCutleryTip();
      setActiveTip('cutlery');
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, restaurant]);

  const dismissTip = () => {
    if (activeTip === 'cutlery') {
      setActiveTip(null);
      setTimeout(() => {
        measurePayTip();
        setActiveTip('payment');
      }, 450);
      return;
    }
    setActiveTip(null);
  };

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
    console.log('Payment completed:', success, data);
    setPaymentGatewayOpen(false);
    
    if (success) {
      setOrderPlacementPhase('placed');
      
      // Try to verify payment if we have payment details
      if (currentOrder) {
        try {
          // For test URLs, simulate successful payment verification
          if (paymentUrl.includes('test') || paymentUrl.includes('httpbin')) {
            const simulatedResult = simulatePaymentSuccess(currentOrder.id, currentOrder.total ?? estimatedTotal);
            console.log('Simulated payment result:', simulatedResult);
          } else {
            // Real payment verification
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
      
      await new Promise(r => setTimeout(r, 1500));
      router.replace({ 
        pathname: '/orders/[orderId]/tracking', 
        params: { orderId: currentOrder?.id || '', newOrder: 'true' } 
      });
      setOrderPlacementPhase('none');
    } else {
      // Payment failed
      Alert.alert(
        'Payment Failed',
        'Your payment could not be processed. The order has been placed and you can try paying again or contact support.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              if (paymentUrl) {
                setPaymentGatewayOpen(true);
              }
            }
          },
          {
            text: 'Contact Support',
            onPress: () => {
              router.push('/support');
            }
          }
        ]
      );
    }
  };

  const handlePaymentGatewayClose = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel the payment? Your order has been placed and can be paid later.',
      [
        { text: 'Continue Payment', style: 'cancel' },
        { 
          text: 'Cancel Payment', 
          onPress: () => {
            setPaymentGatewayOpen(false);
            if (currentOrder) {
              router.replace({ 
                pathname: '/orders/[orderId]/tracking', 
                params: { orderId: currentOrder.id, newOrder: 'true' } 
              });
            }
          }
        }
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
      } else if (paymentMethods.data?.some(m => m.id === paymentMethod)) {
        const saved = paymentMethods.data.find(m => m.id === paymentMethod);
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

      // Handle COD - no payment gateway needed
      if (!needsOnlinePayment(mappedMethod)) {
        setOrderPlacementPhase('placed');
        await new Promise(r => setTimeout(r, 1500));
        router.replace({ 
          pathname: '/orders/[orderId]/tracking', 
          params: { orderId: order.id, newOrder: 'true' } 
        });
        setOrderPlacementPhase('none');
        return;
      }

      // Try to get payment URL from multiple sources
      let paymentUrlToOpen: string | undefined = undefined;
      let payment: any = null;
      
      // Method 1: Check if order creation response contains payment URL
      if (order.raw && typeof order.raw.paymentUrl === 'string') {
        paymentUrlToOpen = order.raw.paymentUrl;
        console.log('Payment URL from order creation:', paymentUrlToOpen);
      } 
      // Method 2: Check other possible fields in order response
      else if (order.raw) {
        paymentUrlToOpen = 
          (order.raw.checkoutUrl as string | undefined) || 
          (order.raw.redirectUrl as string | undefined) || 
          (order.raw.gatewayUrl as string | undefined) ||
          (order.raw.url as string | undefined);
        if (paymentUrlToOpen) {
          console.log('Payment URL from order response fields:', paymentUrlToOpen);
        }
      }
      
      // Method 3: Call payment initiate API if no URL found
      if (!paymentUrlToOpen) {
        try {
          console.log('Initiating payment with payload:', {
            orderId: order.id,
            amount,
            currency: 'INR',
            method: mappedMethod,
            methodId: mappedMethodId,
          });
          
          payment = await initiatePayment.mutateAsync({
            orderId: order.id,
            amount,
            currency: 'INR',
            method: mappedMethod as any,
            methodId: mappedMethodId,
            description: `Order ${order.orderNumber || order.id}`,
          });
          
          console.log('Payment initiate response:', payment);
          
          // Try multiple possible field names for payment URL
          paymentUrlToOpen = 
            payment.paymentUrl || 
            payment.checkoutUrl || 
            payment.redirectUrl || 
            payment.gatewayUrl ||
            payment.url;
            
          if (paymentUrlToOpen) {
            console.log('Payment URL from initiate API:', paymentUrlToOpen);
          }
        } catch (initiateError) {
          console.error('Payment initiate failed:', initiateError);
          
          // Fallback: Try to construct a generic payment URL if we have gateway info
          if (payment?.razorpayKey && payment?.razorpayOrderId) {
            // For Razorpay, we could try to construct a checkout URL
            console.log('Attempting Razorpay fallback with key:', payment.razorpayKey, 'order:', payment.razorpayOrderId);
            
            Alert.alert(
              'Payment Gateway Setup',
              'Payment gateway integration needs to be completed. For now, the order has been placed and you can pay on delivery or contact support.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setOrderPlacementPhase('placed');
                    setTimeout(() => {
                      router.replace({ 
                        pathname: '/orders/[orderId]/tracking', 
                        params: { orderId: order.id, newOrder: 'true' } 
                      });
                    }, 1500);
                  }
                }
              ]
            );
            return;
          }
        }
      }

      // If we have a payment URL, use the WebView
      if (paymentUrlToOpen && paymentUrlToOpen.startsWith('http')) {
        setPaymentUrl(paymentUrlToOpen);
        setPaymentGatewayOpen(true);
        setOrderPlacementPhase('none'); // Hide loading modal
        return;
      }

      // If no payment URL is available, show helpful error with test option
      console.error('No payment URL found in any response');
      
      Alert.alert(
        'Payment Configuration Issue',
        'The payment gateway is not properly configured on the server. Would you like to:\n\n• Use Test Payment (for development)\n• Place order as Cash on Delivery\n• Contact support for assistance',
        [
          {
            text: 'Test Payment',
            onPress: () => {
              // Generate a test payment URL for development/testing
              const testUrl = generateTestPaymentUrl('razorpay', {
                orderId: order.id,
                amount,
                currency: 'INR',
                description: `Test Order ${order.orderNumber || order.id}`,
              });
              console.log('Using test payment URL:', testUrl);
              setPaymentUrl(testUrl);
              setPaymentGatewayOpen(true);
              setOrderPlacementPhase('none');
            }
          },
          {
            text: 'Cash on Delivery',
            onPress: async () => {
              try {
                setOrderPlacementPhase('placed');
                await new Promise(r => setTimeout(r, 1000));
                router.replace({ 
                  pathname: '/orders/[orderId]/tracking', 
                  params: { orderId: order.id, newOrder: 'true' } 
                });
                setOrderPlacementPhase('none');
              } catch (error) {
                console.error('COD fallback failed:', error);
              }
            }
          },
          {
            text: 'Contact Support',
            onPress: () => {
              router.push('/support');
              setOrderPlacementPhase('none');
            }
          }
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
      Alert.alert(
        'Could not save',
        e instanceof Error ? e.message : 'Try again'
      );
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
      // allow local checkout
    }
    placeOrder();
  };

  const addSuggestion = (item: MenuItem) => {
    if (!restaurant) return;
    addMenuItemToCart(item, restaurant);
  };

  const itemMrp = (price: number) => Math.round(price / 0.72);

  if (remoteCart.isLoading && !items.length) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LoadingView label="Loading cart…" />
      </View>
    );
  }

  if (!items.length || !restaurant) {
    return <View style={[styles.root, { backgroundColor: PAGE_BG }]} />;
  }

  const footerPad = 12 + Math.max(insets.bottom, 10);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
      <View style={styles.root}>
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <SmoothPressable onPress={goBack} style={styles.iconBtn} pressScale={0.9}>
          <ArrowLeft color={TEXT} size={22} strokeWidth={2.2} />
        </SmoothPressable>

        <View style={styles.topCenter}>
          <Text style={styles.restoName} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Pressable
            style={styles.addressRow}
            onPress={() =>
              router.push('/profile/addresses' as import('expo-router').Href)
            }
          >
            <Home color={TEXT} size={13} strokeWidth={2.2} />
            <Text style={styles.addressLabel} numberOfLines={1}>
              {addressLabel}
            </Text>
            <Text style={styles.addressPipe}>|</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {addressLine}
            </Text>
            <ChevronDown color={TEXT_MUTED} size={14} strokeWidth={2.2} />
          </Pressable>
        </View>

        <SmoothPressable
          onPress={() => setMenuOpen(true)}
          style={styles.iconBtn}
          pressScale={0.9}
        >
          <MoreVertical color={TEXT} size={20} strokeWidth={2.2} />
        </SmoothPressable>
      </View>

      {savedAmount > 0 ? (
        <View style={styles.savingsBanner}>
          <Sparkles color={GREEN} size={14} strokeWidth={2} />
          <Text style={styles.savingsText}>
            <Text style={styles.savingsBold}>₹{savedAmount} saved!</Text>
            {'  '}On this order
          </Text>
        </View>
      ) : null}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 118 + footerPad },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={remoteCart.isRefetching}
            onRefresh={onRefresh}
            tintColor={ORANGE}
          />
        }
      >
        {/* Ordering for */}
        <View style={styles.card}>
          <View style={styles.orderForRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderForTitle}>
                You are ordering for{' '}
                <Text style={styles.orderForName}>
                  {displayName} 🎁
                </Text>
              </Text>
              <Text style={styles.orderForSub}>
                We will share order tracking and delivery communication on{' '}
                {phone}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                router.push('/profile/contact' as import('expo-router').Href)
              }
            >
              <Text style={styles.editLink}>EDIT</Text>
            </Pressable>
          </View>
        </View>

        {/* One lite upsell */}
        <View style={styles.oneCard}>
          <View style={styles.oneLeft}>
            <View style={styles.oneTitleRow}>
              <Text style={styles.onePrefix}>Add </Text>
              <OneWord />
              <Text style={styles.onePrefix}> at ₹1</Text>
            </View>
            <Text style={styles.oneSub}>
              Get unlimited free deliveries & more for 3 months{' '}
              <Text style={styles.oneChevron}>{'>'}</Text>
            </Text>
          </View>
          <View style={styles.oneRight}>
            <Text style={styles.onePrice}>₹1</Text>
            <Pressable
              style={[styles.oneAddBtn, oneAdded && styles.oneAddBtnOn]}
              onPress={() => setOneAdded((v) => !v)}
            >
              <Text
                style={[styles.oneAddText, oneAdded && styles.oneAddTextOn]}
              >
                {oneAdded ? 'Added' : 'Add'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Items + actions */}
        <View style={styles.card}>
          {items.map((item, index) => {
            const mrp = itemMrp(item.price);
            return (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  index > 0 && styles.itemRowBorder,
                ]}
              >
                <View style={styles.itemLeft}>
                  <VegBadge isVeg={item.isVeg ?? true} />
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>

                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepBtn}
                    disabled={busyId === item.id}
                    onPress={() => syncQty(item.id, item.quantity - 1)}
                  >
                    <Minus color={GREEN} size={14} strokeWidth={2.8} />
                  </Pressable>
                  <Text style={styles.stepQty}>
                    {busyId === item.id ? '…' : item.quantity}
                  </Text>
                  <Pressable
                    style={styles.stepBtn}
                    disabled={busyId === item.id}
                    onPress={() => syncQty(item.id, item.quantity + 1)}
                  >
                    <Plus color={GREEN} size={14} strokeWidth={2.8} />
                  </Pressable>
                </View>

                <View style={styles.priceCol}>
                  {mrp > item.price ? (
                    <Text style={styles.mrp}>₹{mrp}</Text>
                  ) : null}
                  <Text style={styles.itemPrice}>
                    ₹{(item.price * item.quantity).toFixed(0)}
                  </Text>
                </View>
              </View>
            );
          })}

          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionChip}
              onPress={() =>
                router.push(
                  `/restaurants/${restaurant.id}` as import('expo-router').Href
                )
              }
            >
              <Text style={styles.actionChipText}>+ Add Items</Text>
            </Pressable>
          </View>
        </View>


        {/* Complete your meal */}
        {mealSuggestions.length > 0 ? (
          <View style={styles.mealSection}>
            <Text style={styles.mealTitle}>COMPLETE YOUR MEAL</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mealScroll}
            >
              {mealSuggestions.map((item) => (
                <View key={item.id} style={styles.mealCard}>
                  <View style={styles.mealImageWrap}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.mealImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.mealImage, styles.mealImageEmpty]} />
                    )}
                    <Pressable
                      style={styles.mealPlus}
                      onPress={() => addSuggestion(item)}
                    >
                      <Plus color={GREEN} size={16} strokeWidth={2.8} />
                    </Pressable>
                  </View>
                  <View style={styles.mealMeta}>
                    <VegBadge isVeg={item.isVeg ?? true} />
                    <Text style={styles.mealName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.mealPrice}>₹{item.price.toFixed(0)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <DeliveryPreferences 
          tip={tip} 
          setTip={setTip} 
          specialInstructions={specialInstructions} 
          setSpecialInstructions={setSpecialInstructions} 
        />

        {/* Swiggy Style Bill Details */}
        <View style={styles.billContainer}>
          {/* Header */}
          <Pressable 
            style={styles.billHeader}
            onPress={() => setIsBillExpanded(!isBillExpanded)}
          >
            <View style={styles.billHeaderLeft}>
              <View style={styles.receiptIconBox}>
                <FileText color="#fff" size={14} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.billTitle}>
                  To Pay {discount > 0 && <Text style={styles.strikeText}>₹{subtotal.toFixed(0)} </Text>}₹{(estimatedTotal + (oneAdded ? 1 : 0)).toFixed(0)}
                </Text>
                {discount > 0 && (
                   <Text style={styles.savedText}>₹{discount.toFixed(0)} saved on the total!</Text>
                )}
              </View>
            </View>
            {isBillExpanded ? (
              <ChevronUp size={20} color="#000" />
            ) : (
              <ChevronDown size={20} color="#000" />
            )}
          </Pressable>

          {/* Solid Divider */}
          {isBillExpanded && <View style={styles.billDivider} />}

          {/* Body */}
          {isBillExpanded && (
            <View style={styles.billBody}>
            {/* Row 1 */}
            <View style={styles.billRow}>
              <Text style={styles.billLabelDark}>Item Total</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                 {discount > 0 && <Text style={styles.strikeText}>₹{subtotal.toFixed(0)}</Text>}
                 <Text style={[styles.billValueDark, discount > 0 && {color: GREEN}]}>₹{(subtotal - discount).toFixed(0)}</Text>
              </View>
            </View>

            {/* Dotted Divider */}
            <View style={styles.dottedDivider} />

            {/* Row 2 */}
            <View style={styles.billRowGroup}>
               <View style={styles.billRow}>
                 <View style={styles.dashedUnderline}>
                   <Text style={styles.billLabelDark}>Delivery Fee | 10.5 kms</Text>
                 </View>
                 <Text style={styles.billValueDark}>₹81</Text>
               </View>
               <Text style={styles.billSubText}>Free delivery applicable on orders above ₹99</Text>
            </View>

            <View style={styles.dottedDivider} />

            {/* Row 3 - Tip */}
            {tip > 0 && (
              <>
                <View style={styles.billRow}>
                  <Text style={styles.billLabelDark}>Delivery Tip</Text>
                  <Text style={styles.billValueDark}>₹{tip}</Text>
                </View>
              </>
            )}

            {/* Row 4 - GST */}
            <View style={styles.billRow}>
              <View style={styles.dashedUnderline}>
                <Text style={styles.billLabelDark}>GST & Other Charges</Text>
              </View>
              <Text style={styles.billValueDark}>₹43.46</Text>
            </View>
            
            <View style={styles.dottedDivider} />

            <View style={[styles.billRow, { paddingTop: 4 }]}>
              <Text style={styles.billTotalLabel}>To Pay</Text>
              <Text style={styles.billTotalValue}>₹{(estimatedTotal + (oneAdded ? 1 : 0)).toFixed(0)}</Text>
            </View>

          </View>
          )}
        </View>

        {/* Cancellation Policy */}
        <View style={styles.cancellationBox}>
           <Text style={styles.cancelTitle}>Cancellation policy:</Text>
           <Text style={styles.cancelText}>Please double-check your order and address details. Orders are non-refundable once placed.</Text>
        </View>
      </ScrollView>

      {/* Bottom pay bar */}
      <View style={[styles.payBar, { paddingBottom: footerPad }]}>
        <View ref={payUsingRef} collapsable={false} style={styles.payUsing}>
          <Pressable
            onPress={() => {
              if (activeTip === 'payment') dismissTip();
              setPaymentModalOpen(true);
            }}
          >
            <View style={styles.payUsingTop}>
              <Text style={styles.payUsingLabel}>PAY USING</Text>
              <ChevronUp color={TEXT_MUTED} size={12} strokeWidth={2.4} />
            </View>
            <View style={styles.payMethodRow}>
              <Image
                source={{ uri: payIcon }}
                style={styles.paytmIcon}
                contentFit="contain"
              />
              <Text style={styles.payMethodName} numberOfLines={1}>
                {payLabel}
              </Text>
              <ChevronRight color={TEXT_MUTED} size={16} strokeWidth={2.2} />
            </View>
          </Pressable>
        </View>

        <Pressable
          style={styles.payBtn}
          onPress={handleCheckout}
          disabled={validateCart.isPending}
        >
          {validateCart.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payBtnText}>
              Pay ₹{(estimatedTotal + (oneAdded ? 1 : 0)).toFixed(0)}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Sequential black tips — one at a time, dismiss with × */}
      {activeTip === 'cutlery' && cutleryTipTop > 0 ? (
        <BlackTip
          text="Tap here if you need cutlery"
          top={cutleryTipTop}
          onClose={dismissTip}
          align="right"
        />
      ) : null}
      {activeTip === 'payment' && payTipTop > 0 ? (
        <BlackTip
          text="Tap here to choose other payment methods"
          top={payTipTop}
          onClose={dismissTip}
          align="left"
        />
      ) : null}

      {/* Cooking requests modal */}
      <Modal
        visible={cookingOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCookingOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCookingOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Cooking requests</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Less spicy, no onion…"
              placeholderTextColor={TEXT_MUTED}
              value={cookingDraft}
              onChangeText={setCookingDraft}
              multiline
              autoFocus
            />
            <Pressable
              style={styles.modalSave}
              onPress={() => {
                setSpecialInstructions(cookingDraft.trim());
                setCookingOpen(false);
              }}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <PaymentOptionsModal
        visible={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        selectedMethod={paymentMethod}
        onSelectMethod={(m) => {
          setPaymentMethod(m);
          setPaymentModalOpen(false); // Close immediately when a method is selected
        }}
        onPay={() => {}} // not used anymore
        itemCount={items.length}
        total={estimatedTotal + (oneAdded ? 1 : 0)}
        savings={savedAmount}
        restaurantName={restaurant?.name || ''}
        deliveryTime="35-45 mins"
        addressLabel={addressLabel}
        addressText={addressLine}
        savedMethods={paymentMethods.data}
        wallet={wallet.data}
      />

      <OrderPlacementModal 
        phase={orderPlacementPhase}
        addressLabel={addressLabel}
        addressText={addressLine}
        savings={savedAmount}
      />

      {/* Overflow menu */}
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
          <View style={[styles.menuSheet, { top: insets.top + 48 }]}>
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
              <Text style={[styles.menuItemText, { color: '#E53935' }]}>
                Clear cart
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  emptyTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: TEXT,
  },
  browseBtn: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseText: {
    fontFamily: fonts.uiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 6,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    flex: 1,
    paddingTop: 6,
    gap: 4,
  },
  restoName: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    color: TEXT,
    letterSpacing: -0.2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addressLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: TEXT,
    maxWidth: 72,
  },
  addressPipe: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: TEXT_MUTED,
  },
  addressText: {
    flex: 1,
    fontFamily: fonts.ui,
    fontSize: 12,
    color: TEXT_SEC,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: GREEN_SOFT,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 10,
  },
  savingsText: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: GREEN,
  },
  savingsBold: {
    fontFamily: fonts.uiBold,
    color: GREEN,
  },
  scroll: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  orderForRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  orderForTitle: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: TEXT,
    lineHeight: 20,
  },
  orderForName: {
    fontFamily: fonts.uiBold,
    color: TEXT,
  },
  orderForSub: {
    marginTop: 6,
    fontFamily: fonts.ui,
    fontSize: 12,
    color: TEXT_SEC,
    lineHeight: 17,
  },
  editLink: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: ORANGE,
    letterSpacing: 0.3,
    paddingTop: 2,
  },
  oneCard: {
    backgroundColor: '#FFF5F3',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFD5CD',
  },
  oneLeft: {
    flex: 1,
    gap: 4,
  },
  oneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onePrefix: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: '#C62828',
  },
  oneWordMask: {
    width: 36,
    height: 22,
  },
  oneWordText: {
    fontFamily: fonts.script,
    fontSize: 20,
    color: '#000',
    lineHeight: 22,
  },
  oneSub: {
    fontFamily: fonts.ui,
    fontSize: 12.5,
    color: TEXT_SEC,
    lineHeight: 17,
  },
  oneChevron: {
    fontFamily: fonts.uiBold,
    color: TEXT,
  },
  oneRight: {
    alignItems: 'center',
    gap: 6,
  },
  onePrice: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: TEXT,
  },
  oneAddBtn: {
    borderWidth: 1.2,
    borderColor: GREEN,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  oneAddBtnOn: {
    backgroundColor: GREEN,
  },
  oneAddText: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: GREEN,
  },
  oneAddTextOn: {
    color: '#FFFFFF',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 2,
  },
  itemName: {
    flex: 1,
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: TEXT,
    lineHeight: 19,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: 2,
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQty: {
    minWidth: 18,
    textAlign: 'center',
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: GREEN,
  },
  priceCol: {
    alignItems: 'flex-end',
    minWidth: 48,
    paddingTop: 2,
  },
  mrp: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: TEXT_MUTED,
    textDecorationLine: 'line-through',
  },
  itemPrice: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: TEXT,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 4,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: '#FFFFFF',
  },
  actionChipText: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    color: TEXT_SEC,
  },
  cutleryBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.4,
    borderColor: TEXT_MUTED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutleryBoxOn: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  mealSection: {
    gap: 10,
  },
  mealTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.8,
    paddingHorizontal: 2,
  },
  mealScroll: {
    gap: 10,
    paddingRight: 8,
  },
  mealCard: {
    width: 118,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  mealImageWrap: {
    position: 'relative',
  },
  mealImage: {
    width: 118,
    height: 118,
    backgroundColor: '#EEE',
  },
  mealImageEmpty: {
    backgroundColor: '#FFE8E2',
  },
  mealPlus: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  mealMeta: {
    padding: 8,
    gap: 4,
  },
  mealName: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: TEXT,
    lineHeight: 15,
    minHeight: 30,
  },
  mealPrice: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: TEXT,
  },
  // Swiggy Bill Styles
  billContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  billHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiptIconBox: {
    width: 24,
    height: 24,
    backgroundColor: '#1BA672',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billTitle: {
    fontFamily: fonts.uiMedium,
    fontSize: 15,
    color: '#000',
  },
  strikeText: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  savedText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: '#1BA672',
    marginTop: 2,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
  },
  billBody: {
    padding: 16,
    paddingTop: 20,
    gap: 16,
  },
  billRowGroup: {
    gap: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabelDark: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: '#555',
  },
  billSubText: {
    fontFamily: fonts.ui,
    fontSize: 12.5,
    color: '#888',
  },
  dashedUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    borderStyle: 'dashed',
    paddingBottom: 2,
  },
  billValueDark: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: '#333',
  },
  dottedDivider: {
    height: 1,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  billTotalLabel: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: '#000',
  },
  billTotalValue: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: '#000',
  },
  cancellationBox: {
    paddingHorizontal: 6,
    paddingBottom: 32,
    gap: 4,
  },
  cancelTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: '#888',
  },
  cancelText: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  payBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
  },
  payUsing: {
    flex: 1,
    gap: 4,
  },
  payUsingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payUsingLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 10,
    color: TEXT_MUTED,
    letterSpacing: 0.6,
  },
  payMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paytmIcon: {
    width: 26,
    height: 26,
    borderRadius: 4,
  },
  payMethodName: {
    flexShrink: 1,
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: TEXT,
  },
  payBtn: {
    backgroundColor: PAY_GREEN,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    minWidth: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  tipLayer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
  },
  tipBubble: {
    maxWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 10,
  },
  tipText: {
    flex: 1,
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  tipClose: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTail: {
    width: 12,
    height: 12,
    backgroundColor: '#1A1A1A',
    transform: [{ rotate: '45deg' }],
    marginTop: -7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: TEXT,
  },
  modalInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    fontFamily: fonts.ui,
    fontSize: 14,
    color: TEXT,
  },
  modalSave: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  menuSheet: {
    position: 'absolute',
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 190,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: TEXT,
  },
  emptyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyHeaderBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHeaderTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: '#000000',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  emptyCartImage: {
    width: 240,
    height: 240,
    marginBottom: 32,
  },
  emptyCartTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: '#000000',
    marginBottom: 12,
  },
  emptyCartSubtitle: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  startShoppingBtn: {
    marginHorizontal: 24,
    marginBottom: 40,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  startShoppingText: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: '#F4737E',
  },
});
