import { Pressable } from '@/components/common/Pressable';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronRight, Star } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator,
  Alert,
  
  StyleSheet,
  Text,
  View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { swiggyOrderUi as ui } from '@/constants/swiggy-order-ui';
import { useReorder } from '@/lib/order/hooks';
import {
  isActiveOrderStatus,
  ORDER_STATUS_LABELS,
  type Order,
} from '@/lib/order/types';

function formatOrderWhen(iso?: string) {
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

type Props = {
  order: Order;
};

export function OrderCard({ order }: Props) {
  const router = useRouter();
  const reorder = useReorder(order.id);

  const headline =
    order.restaurantName ||
    order.items[0]?.name ||
    (order.orderNumber ? `Order #${order.orderNumber}` : 'Your order');
  const cover =
    order.items[0]?.imageUrl ||
    (typeof order.restaurantImageUrl === 'string'
      ? order.restaurantImageUrl
      : undefined);
  const when = formatOrderWhen(order.createdAt || order.scheduledFor);
  const total =
    typeof order.total === 'number'
      ? order.total
      : order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const isDelivered = order.status.toLowerCase() === 'delivered';

  const openDetail = () => {
    router.push({
      pathname: '/orders/[orderId]',
      params: { orderId: order.id },
    });
  };

  const handleReorder = () => {
    // Reorder logic here (same as before)
    Alert.alert('Order again?', 'Place a new order with the same items.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Order again',
        onPress: async () => {
          try {
            const next = await reorder.mutateAsync();
            Alert.alert('Order placed', 'Your reorder was created.', [
              {
                text: 'View order',
                onPress: () =>
                  router.push({
                    pathname: '/orders/[orderId]',
                    params: { orderId: next.id },
                  }),
              },
            ]);
          } catch (e) {
            Alert.alert(
              'Reorder failed',
              e instanceof Error ? e.message : 'Could not reorder'
            );
          }
        },
      },
    ]);
  };

  return (
    <Pressable style={styles.card} onPress={openDetail}>
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={styles.heroThumb}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroThumb, styles.thumbEmpty]} />
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headline} numberOfLines={1}>
              {headline}
            </Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {order.restaurantName ? 'Raj Nagar' : 'Location'}
            </Text>
          </View>
        </View>

        <View style={styles.statusBox}>
          <Text style={[styles.statusText, isDelivered && { color: ui.green }]}>
            {isDelivered ? 'Delivered' : ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Text>
          {isDelivered && <CheckCircle2 color={ui.green} fill={ui.green} size={16} strokeWidth={1} />}
        </View>
      </View>

      <View style={styles.itemsBlock}>
        {order.items.slice(0, 2).map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.qtyBox}>
              <Text style={styles.qtyText}>{item.quantity}X</Text>
            </View>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.moreItemsText}>+ {order.items.length - 2} more items</Text>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.ratingRow}>
        <View style={styles.ratingCol}>
          <Text style={styles.ratingLabel}>Your Food Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} color="#D1D5DB" size={18} strokeWidth={1.5} />
            ))}
          </View>
        </View>
        <View style={styles.ratingDivider} />
        <View style={styles.ratingCol}>
          <Text style={styles.ratingLabel}>Delivery Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} color="#D1D5DB" size={18} strokeWidth={1.5} />
            ))}
          </View>
        </View>
      </View>

      <Pressable
        style={styles.reorderBtn}
        onPress={(e) => {
          e.stopPropagation();
          handleReorder();
        }}
        disabled={reorder.isPending}
      >
        {reorder.isPending ? (
          <ActivityIndicator color="#F15700" size="small" />
        ) : (
          <View style={styles.reorderContent}>
            <Text style={styles.reorderText}>REORDER</Text>
            <ChevronRight color="#F15700" size={16} strokeWidth={2.5} />
          </View>
        )}
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Ordered: {when}</Text>
        <Text style={styles.footerDot}>•</Text>
        <Text style={styles.footerText}>Bill Total: ₹{total.toFixed(0)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  thumbEmpty: {
    backgroundColor: authTheme.brandSoft,
  },
  headerInfo: {
    flex: 1,
  },
  headline: {
    fontFamily: fonts.displayBold,
    color: '#1F2937',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  locationText: {
    fontFamily: fonts.ui,
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: '#4B5563',
  },
  itemsBlock: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qtyBox: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  qtyText: {
    fontFamily: fonts.uiBold,
    color: '#6B7280',
    fontSize: 11,
  },
  itemName: {
    fontFamily: fonts.ui,
    color: '#4B5563',
    fontSize: 14,
    flex: 1,
  },
  moreItemsText: {
    fontFamily: fonts.ui,
    color: '#9CA3AF',
    fontSize: 13,
    marginLeft: 32,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingCol: {
    flex: 1,
  },
  ratingLabel: {
    fontFamily: fonts.uiMedium,
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  reorderBtn: {
    backgroundColor: '#FFF0E8', // Light orange tint
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  reorderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderText: {
    fontFamily: fonts.uiBold,
    color: '#F15700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  footerText: {
    fontFamily: fonts.ui,
    color: '#9CA3AF',
    fontSize: 12,
  },
  footerDot: {
    fontFamily: fonts.ui,
    color: '#D1D5DB',
    fontSize: 12,
    marginHorizontal: 8,
  },
});
