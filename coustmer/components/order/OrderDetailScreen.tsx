import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Home, Check } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { VegBadge } from '@/components/restaurant/MenuBadges';
import { LoadingView } from '@/components/common/StateViews';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useOrder, useReorder } from '@/lib/order/hooks';

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

  const isDelivered = data.status.toLowerCase() === 'delivered';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color="#1C1C1C" size={24} />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              ORDER #{orderIdLabel}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isDelivered ? 'Delivered' : data.status}, {totalItems} Item{totalItems > 1 ? 's' : ''}, ₹{total.toFixed(0)}
            </Text>
          </View>
          <Pressable style={styles.helpBtn}>
            <Text style={styles.helpBtnText}>HELP</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Timeline Section */}
        <View style={styles.timelineCard}>
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
                  Raj Nagar-SHOP NO.1, GROUND FLOOR, PLOT NO.B-34...
                </Text>
              </View>
              <View style={styles.timelineAddressBlockHome}>
                <Text style={styles.homeLabel}>{data.deliveryAddress?.label || 'House'}</Text>
                <Text style={styles.addressDesc} numberOfLines={2}>
                  {data.deliveryAddress?.formattedAddress || 'Anand Dham Flats Ashok Nagar B Block Market Ghaziabad...'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.timelineDivider} />

          <View style={styles.deliveryStatusRow}>
            <View style={styles.checkCircle}>
              <Check color="#FFFFFF" size={12} strokeWidth={3} />
            </View>
            <Text style={styles.deliveryStatusText}>
              Order delivered on {formatDeliveryTime(data.createdAt)} by SOMPAL
            </Text>
            <View style={styles.onTimeBadge}>
              <Text style={styles.onTimeText}>ON TIME</Text>
            </View>
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
                <Text style={styles.billItemSub}>Without Ice-cream</Text>
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
            <Text style={styles.receiptLabel}>Restaurant Packaging</Text>
            <Text style={styles.receiptValue}>₹20</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Platform fee with GST</Text>
            <Text style={styles.receiptValue}>₹17.69</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Discount Applied (TRYNEW)</Text>
            <Text style={[styles.receiptValue, { color: '#00A160' }]}>-₹72</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Delivery Fee | 2.9 kms</Text>
            <Text style={styles.receiptValue}>₹37</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Expiry Cash Discount</Text>
            <Text style={[styles.receiptValue, { color: '#00A160' }]}>-₹30</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Taxes</Text>
            <Text style={styles.receiptValue}>₹13.06</Text>
          </View>

          <View style={styles.billDividerDotted} />

          <View style={styles.receiptRowFinal}>
            <Text style={styles.receiptLabelFinal}>Paid Via Bank</Text>
            <View style={styles.receiptRightFinal}>
              <Text style={styles.receiptTotalLabel}>Bill Total</Text>
              <Text style={styles.receiptTotalValue}>₹{(total + 20 + 17.69 - 72 + 37 - 30 + 13.06).toFixed(0)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom Reorder */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
  },
  reorderBtnText: {
    fontFamily: fonts.uiBold,
    color: '#F15700',
    fontSize: 15,
  },
});