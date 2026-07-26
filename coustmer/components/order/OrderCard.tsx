import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { VegBadge } from '@/components/restaurant/MenuBadges';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { swiggyOrderUi as ui } from '@/constants/swiggy-order-ui';
import { useReorder } from '@/lib/order/hooks';
import {
  isActiveOrderStatus,
  ORDER_STATUS_LABELS,
  type Order,
} from '@/lib/order/types';

function statusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

function statusTone(status: string): { bg: string; text: string } {
  const s = status.toLowerCase();
  if (s === 'delivered') {
    return { bg: ui.greenSoft, text: ui.green };
  }
  if (s === 'cancelled') {
    return { bg: 'rgba(239,68,68,0.1)', text: authTheme.error };
  }
  if (isActiveOrderStatus(s) || s === 'scheduled') {
    return { bg: authTheme.brandSoft, text: authTheme.brand };
  }
  return { bg: '#F3F4F6', text: ui.textSecondary };
}

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
  return `${date} · ${time}`;
}

function lineTotal(price: number, qty: number) {
  return price * qty;
}

function wasPrice(price: number) {
  return Math.round(price * 1.35);
}

type Props = {
  order: Order;
};

export function OrderCard({ order }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const reorder = useReorder(order.id);

  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const headline =
    order.restaurantName ||
    order.items[0]?.name ||
    (order.orderNumber ? `Order #${order.orderNumber}` : 'Your order');
  const orderIdLabel =
    order.orderNumber || order.id.slice(-8).toUpperCase();
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
  const tone = statusTone(order.status);

  const openDetail = () => {
    router.push({
      pathname: '/orders/[orderId]',
      params: { orderId: order.id },
    });
  };

  const handleReorder = () => {
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
    <View style={styles.card}>
      <Pressable onPress={openDetail}>
        <View style={styles.topRow}>
          <Text style={styles.when}>{when || 'Recent order'}</Text>
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.statusText, { color: tone.text }]}>
              {statusLabel(order.status)}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={styles.heroThumb}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroThumb, styles.thumbEmpty]} />
          )}
          <View style={styles.summaryCopy}>
            <Text style={styles.headline} numberOfLines={1}>
              {headline}
            </Text>
            <Text style={styles.orderId}>Order ID · {orderIdLabel}</Text>
            {order.restaurantName && order.items[0]?.name ? (
              <Text style={styles.itemPreview} numberOfLines={1}>
                {order.items
                  .slice(0, 2)
                  .map((i) => i.name)
                  .join(', ')}
                {order.items.length > 2 ? '…' : ''}
              </Text>
            ) : null}
          </View>
          <Pressable
            style={styles.expandBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              setExpanded((v) => !v);
            }}
            hitSlop={8}
          >
            <Text style={styles.expandLabel}>
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </Text>
            {expanded ? (
              <ChevronUp color={ui.textSecondary} size={16} />
            ) : (
              <ChevronDown color={ui.textSecondary} size={16} />
            )}
          </Pressable>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.itemsBlock}>
          {order.items.map((item, index) => (
            <View
              key={`${item.menuItemId || item.name}-${index}`}
              style={styles.itemRow}
            >
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemThumb}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.itemThumb, styles.thumbEmpty]} />
              )}
              <View style={styles.itemMid}>
                <View style={styles.itemNameRow}>
                  {item.isVeg !== undefined ? (
                    <VegBadge isVeg={item.isVeg} />
                  ) : null}
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.quantity > 1 ? `${item.quantity}× ` : ''}
                    {item.name}
                  </Text>
                </View>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.priceNow}>
                  ₹{lineTotal(item.price, item.quantity).toFixed(0)}
                </Text>
                <Text style={styles.priceWas}>
                  ₹{wasPrice(lineTotal(item.price, item.quantity)).toFixed(0)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <View>
          <Text style={styles.grandLabel}>Bill total</Text>
          <Text style={styles.vatLabel}>Taxes included</Text>
        </View>
        <Text style={styles.totalValue}>₹{total.toFixed(0)}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.orderAgain}
          onPress={handleReorder}
          disabled={reorder.isPending}
        >
          {reorder.isPending ? (
            <ActivityIndicator color={authTheme.brand} />
          ) : (
            <>
              <RotateCcw color={authTheme.brand} size={16} strokeWidth={2.4} />
              <Text style={styles.orderAgainText}>Reorder</Text>
            </>
          )}
        </Pressable>
        <Pressable style={styles.detailsBtn} onPress={openDetail}>
          <Text style={styles.detailsBtnText}>Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ui.card,
    borderRadius: ui.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.border,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  when: {
    fontFamily: fonts.ui,
    color: ui.textMuted,
    fontSize: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: fonts.uiBold,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  thumbEmpty: {
    backgroundColor: authTheme.brandSoft,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  headline: {
    fontFamily: fonts.displayBold,
    color: ui.text,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  orderId: {
    marginTop: 3,
    fontFamily: fonts.ui,
    color: ui.textMuted,
    fontSize: 12,
  },
  itemPreview: {
    marginTop: 3,
    fontFamily: fonts.ui,
    color: ui.textSecondary,
    fontSize: 12,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  expandLabel: {
    fontFamily: fonts.uiSemi,
    color: ui.textSecondary,
    fontSize: 12,
  },
  itemsBlock: {
    marginTop: 14,
    gap: 12,
    paddingTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  itemMid: {
    flex: 1,
    minWidth: 0,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    flex: 1,
    fontFamily: fonts.uiMedium,
    color: ui.text,
    fontSize: 13,
  },
  priceCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  priceNow: {
    fontFamily: fonts.uiBold,
    color: authTheme.brand,
    fontSize: 13,
  },
  priceWas: {
    fontFamily: fonts.ui,
    color: ui.textMuted,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ui.border,
    marginVertical: 14,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  grandLabel: {
    fontFamily: fonts.displayBold,
    color: ui.text,
    fontSize: 14,
  },
  vatLabel: {
    fontFamily: fonts.ui,
    color: ui.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  totalValue: {
    fontFamily: fonts.displayBold,
    color: ui.text,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  orderAgain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: authTheme.brand,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  orderAgainText: {
    fontFamily: fonts.uiBold,
    color: authTheme.brand,
    fontSize: 14,
  },
  detailsBtn: {
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: authTheme.brand,
    paddingVertical: 12,
  },
  detailsBtnText: {
    fontFamily: fonts.uiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
