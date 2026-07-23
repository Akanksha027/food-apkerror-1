import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock3, Package } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import {
  ORDER_STATUS_LABELS,
  isActiveOrderStatus,
  type Order,
} from '@/lib/order/types';

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (['delivered', 'completed'].includes(s)) return '#16A34A';
  if (['cancelled', 'canceled', 'failed'].includes(s)) return '#DC2626';
  if (['out_for_delivery', 'ready'].includes(s)) return '#2563EB';
  if (['scheduled'].includes(s)) return '#7C3AED';
  return '#D97706';
}

type Props = {
  order: Order;
};

export function OrderCard({ order }: Props) {
  const router = useRouter();
  const color = statusColor(order.status);
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const title =
    order.restaurantName ||
    (order.orderNumber ? `Order #${order.orderNumber}` : `Order ${order.id.slice(-6)}`);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() =>
        router.push({
          pathname: '/orders/[orderId]',
          params: { orderId: order.id },
        })
      }
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          {isActiveOrderStatus(order.status) ? (
            <Clock3 color={authTheme.brand} size={18} />
          ) : (
            <Package color={authTheme.brand} size={18} />
          )}
        </View>
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {itemCount} item{itemCount === 1 ? '' : 's'}
            {order.createdAt
              ? ` · ${new Date(order.createdAt).toLocaleString()}`
              : ''}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.badgeText, { color }]}>
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Text>
        </View>
      </View>

      {order.items[0]?.imageUrl ? (
        <Image
          source={{ uri: order.items[0].imageUrl }}
          style={styles.thumb}
          contentFit="cover"
        />
      ) : null}

      <View style={styles.bottomRow}>
        <Text style={styles.itemsPreview} numberOfLines={1}>
          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ') ||
            'No items listed'}
        </Text>
        {typeof order.total === 'number' ? (
          <Text style={styles.total}>₹{order.total.toFixed(0)}</Text>
        ) : null}
      </View>

      {order.scheduledFor ? (
        <Text style={styles.scheduled}>
          Scheduled · {new Date(order.scheduledFor).toLocaleString()}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: authTheme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  pressed: {
    opacity: 0.94,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  thumb: {
    width: '100%',
    height: 96,
    borderRadius: 12,
    backgroundColor: authTheme.surface,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemsPreview: {
    flex: 1,
    color: authTheme.textMuted,
    fontSize: 12,
  },
  total: {
    color: authTheme.text,
    fontSize: 15,
    fontWeight: '900',
  },
  scheduled: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '700',
  },
});
