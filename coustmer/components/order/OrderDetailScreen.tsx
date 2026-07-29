import { Pressable } from '@/components/common/Pressable';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Home, Check, Star } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator,
  Alert,
  
  ScrollView,
  StyleSheet,
  Text,
  View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { VegBadge } from '@/components/restaurant/MenuBadges';
import { LoadingView } from '@/components/common/StateViews';
import { OrderStatusTimeline, type OrderStatus } from '@/components/order/OrderStatusTimeline';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useOrder, useReorder } from '@/lib/order/hooks';
import { useOrderReview } from '@/lib/review/hooks';

function formatDeliveryTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${date}, ${time}`;
}

export function OrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const id = String(orderId ?? '');

  const order = useOrder(id);
  const reorder = useReorder(id);
  const review = useOrderReview(id, { enabled: order.data?.status === 'delivered' });

  const data = order.data;

  if (order.isLoading && !data) {
    return <LoadingView label="Loading details…" />;
  }
  if (!data) return null;

  const orderIdLabel = data.orderNumber || data.id.slice(-15).toUpperCase();
  const totalItems = data.items.reduce((s, i) => s + i.quantity, 0);
  const total =
    typeof data.total === 'number'
      ? data.total
      : data.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleReorder = async () => {
    try {
      const next = await reorder.mutateAsync();
      router.push({
        pathname: '/orders/[orderId]',
        params: { orderId: next.id },
      });
    } catch (e) {
      Alert.alert('Reorder failed', e instanceof Error ? e.message : 'Could not reorder');
    }
  };

  const handleRateOrder = () => {
    router.push({ pathname: '/orders/[orderId]/review', params: { orderId: data.id } });
  };

  const isDelivered = data.status === 'delivered';
  const hasReviewed = review.data !== null && review.data !== undefined;

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafe, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ArrowLeft color="#1C1C1C" size={24} />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle} numberOfLines={1}>{data.restaurantName}</Text>
            <Text style={styles.headerSubtitle}>
              ORDER #{orderIdLabel} • {formatDeliveryTime(data.createdAt)}
            </Text>
          </View>
          <Pressable 
            style={styles.helpBtn} 
            onPress={() => router.push({ pathname: '/support/new', params: { orderId: data.id } })}
          >
            <Text style={styles.helpBtnText}>HELP</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Status Timeline */}
        <View style={styles.timelineSection}>
          <OrderStatusTimeline 
            currentStatus={data.status as OrderStatus}
            timestamps={{
              pending: data.createdAt,
              accepted: data.acceptedAt,
              preparing: data.preparingAt,
              ready: data.readyAt,
              'out-for-delivery': data.outForDeliveryAt,
              delivered: data.deliveredAt,
              cancelled: data.cancelledAt,
              rejected: data.rejectedAt,
            }}
          />
        </View>

        {/* Delivery Timeline Block */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>DELIVERY DETAILS</Text>
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <MapPin color="#6B7280" size={18} />
              <View style={styles.timelineDashedLine} />
              <Home color="#1C1C1C" size={18} />
            </View>
            <View style={styles.timelineContent}>
              <View style={styles.timelineAddressBlock}>
                <Text style={styles.restaurantName}>{data.restaurantName || 'Restaurant'}</Text>
                <Text style={styles.addressDesc} numberOfLines={1}>
                  Restaurant Location
                </Text>
              </View>
              <View style={styles.timelineAddressBlockHome}>
                <Text style={styles.homeLabel}>{data.deliveryAddress?.label || 'Delivery Address'}</Text>
                <Text style={styles.addressDesc} numberOfLines={2}>
                  {data.deliveryAddress?.formattedAddress || 'Customer Address'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.timelineDivider} />

          <View style={styles.deliveryStatusRow}>
            {isDelivered ? (
              <>
                <View style={styles.checkCircle}>
                  <Check color="#FFFFFF" size={12} strokeWidth={3} />
                </View>
                <Text style={styles.deliveryStatusText}>
                  Order delivered on {formatDeliveryTime(data.updatedAt || data.createdAt)}
                </Text>
                <View style={styles.onTimeBadge}>
                  <Text style={styles.onTimeText}>DELIVERED</Text>
                </View>
              </>
            ) : (
              <Text style={styles.deliveryStatusText}>
                Order status: {data.status.replace('_', ' ').toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* Bill Details Section */}
        <Text style={styles.sectionTitle}>BILL DETAILS</Text>

        <View style={styles.billCard}>
          {data.items.map((item, idx) => (
            <View key={idx} style={styles.billItemRow}>
              <View style={styles.billItemIconCol}>
                <VegBadge isVeg={item.isVeg ?? true} />
              </View>
              <View style={styles.billItemContent}>
                <Text style={styles.billItemName}>{item.name} x {item.quantity}</Text>
              </View>
              <Text style={styles.billItemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}

          <View style={styles.billDividerSolid} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Item Total</Text>
            <Text style={styles.receiptValue}>₹{total.toFixed(0)}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Taxes & Charges</Text>
            <Text style={styles.receiptValue}>₹{((data.deliveryFee || 0) + (data.tax || 0)).toFixed(0)}</Text>
          </View>

          <View style={styles.billDividerDotted} />

          <View style={styles.receiptRowFinal}>
            <Text style={styles.receiptLabelFinal}>
              {data.paymentMethod ? `Paid via ${data.paymentMethod.toUpperCase()}` : 'Total'}
            </Text>
            <View style={styles.receiptRightFinal}>
              <Text style={styles.receiptTotalLabel}>Bill Total</Text>
              <Text style={styles.receiptTotalValue}>₹{total.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Sticky Bottom Reorder & Rate */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isDelivered && (
          <View style={styles.actionRow}>
            {hasReviewed ? (
              <View style={styles.reviewedBtn}>
                <Star color="#00A160" size={16} fill="#00A160" />
                <Text style={styles.reviewedBtnText}>You rated {review.data?.rating} stars</Text>
              </View>
            ) : (
              <Pressable
                style={styles.rateBtn}
                onPress={handleRateOrder}
              >
                <Star color="#F15700" size={16} />
                <Text style={styles.rateBtnText}>RATE ORDER</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.reorderBtn, styles.reorderBtnHalf]}
              onPress={handleReorder}
              disabled={reorder.isPending}
            >
              {reorder.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.reorderBtnText, styles.reorderBtnTextWhite]}>REORDER</Text>
              )}
            </Pressable>
          </View>
        )}

        {!isDelivered && (
          <Pressable
            style={styles.reorderBtn}
            onPress={handleReorder}
            disabled={reorder.isPending}
          >
            {reorder.isPending ? (
              <ActivityIndicator color="#F15700" />
            ) : (
              <Text style={styles.reorderBtnText}>REORDER</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerSafe: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.displayBold,
    color: '#1C1C1C',
    fontSize: 15,
  },
  headerSubtitle: {
    fontFamily: fonts.uiMedium,
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  helpBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  helpBtnText: {
    fontFamily: fonts.uiBold,
    color: '#F15700',
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  timelineSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineIconCol: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDashedLine: {
    width: 1,
    flex: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineAddressBlock: {
    marginBottom: 24,
  },
  restaurantName: {
    fontFamily: fonts.displayBold,
    color: '#F15700',
    fontSize: 15,
  },
  addressDesc: {
    fontFamily: fonts.ui,
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  timelineAddressBlockHome: {
    marginBottom: 8,
  },
  homeLabel: {
    fontFamily: fonts.displayBold,
    color: '#1C1C1C',
    fontSize: 15,
  },
  timelineDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  deliveryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00A160',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deliveryStatusText: {
    fontFamily: fonts.uiMedium,
    color: '#4B5563',
    fontSize: 13,
    flex: 1,
  },
  onTimeBadge: {
    backgroundColor: '#6C48B2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  onTimeText: {
    fontFamily: fonts.uiBold,
    color: '#FFFFFF',
    fontSize: 9,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
    color: '#4B5563',
    fontSize: 13,
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  billItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  billItemIconCol: {
    marginRight: 10,
    marginTop: 2,
  },
  billItemContent: {
    flex: 1,
  },
  billItemName: {
    fontFamily: fonts.uiMedium,
    color: '#1C1C1C',
    fontSize: 14,
  },
  billItemSub: {
    fontFamily: fonts.ui,
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  billItemPrice: {
    fontFamily: fonts.uiMedium,
    color: '#1C1C1C',
    fontSize: 14,
  },
  billDividerSolid: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  receiptLabel: {
    fontFamily: fonts.uiMedium,
    color: '#6B7280',
    fontSize: 13,
  },
  receiptValue: {
    fontFamily: fonts.uiMedium,
    color: '#1C1C1C',
    fontSize: 13,
  },
  billDividerDotted: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 16,
  },
  receiptRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabelFinal: {
    fontFamily: fonts.uiMedium,
    color: '#6B7280',
    fontSize: 13,
  },
  receiptRightFinal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptTotalLabel: {
    fontFamily: fonts.uiBold,
    color: '#1C1C1C',
    fontSize: 14,
  },
  receiptTotalValue: {
    fontFamily: fonts.displayBold,
    color: '#1C1C1C',
    fontSize: 16,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 16,
  },
  reorderBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  reorderBtnText: {
    fontFamily: fonts.displayBold,
    color: '#F15700',
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFF0ED',
    borderWidth: 1,
    borderColor: '#FFD4C2',
  },
  rateBtnText: {
    fontFamily: fonts.displayBold,
    color: '#F15700',
    fontSize: 15,
  },
  reviewedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E6F6ED',
    borderWidth: 1,
    borderColor: '#AEE4C4',
  },
  reviewedBtnText: {
    fontFamily: fonts.uiBold,
    color: '#00A160',
    fontSize: 14,
  },
  reorderBtnHalf: {
    flex: 1,
    backgroundColor: '#F15700',
  },
  reorderBtnTextWhite: {
    color: '#FFFFFF',
  },
});