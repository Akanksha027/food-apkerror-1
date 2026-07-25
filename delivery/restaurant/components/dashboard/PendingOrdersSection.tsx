import { Bike, ChevronRight, UtensilsCrossed } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatOrderTime, statusLabel, summarizeItems } from '@/lib/dashboard/format';
import type { OwnerOrder } from '@/lib/dashboard/types';

type Props = {
  orders: OwnerOrder[];
  onQueuePress?: () => void;
};

function statusStyle(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('prepar')) {
    return { bg: '#FFF7ED', text: '#EA580C', label: 'PREPARING' };
  }
  if (normalized.includes('ready')) {
    return { bg: '#ECFDF5', text: '#059669', label: 'READY' };
  }
  return { bg: authTheme.brandSoft, text: authTheme.brand, label: statusLabel(status) };
}

function fulfillmentStyle(tone: OwnerOrder['fulfillmentTone']) {
  if (tone === 'delivery') {
    return { bg: '#EFF6FF', text: '#2563EB', Icon: Bike };
  }
  return { bg: authTheme.brandSoft, text: authTheme.brand, Icon: UtensilsCrossed };
}

export function PendingOrdersSection({ orders, onQueuePress }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.accentBar} />
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Pending Orders</Text>
            {orders.length > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{orders.length}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle}>Live kitchen queue</Text>
        </View>
        <Pressable onPress={onQueuePress}>
          <Text style={styles.queueLink}>QUEUE</Text>
        </Pressable>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No pending orders right now. New orders will appear here live.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {orders.map((order) => {
            const status = statusStyle(order.status);
            const fulfillment = fulfillmentStyle(order.fulfillmentTone);
            const FulfillmentIcon = fulfillment.Icon;
            const displayNumber = order.orderNumber || order.id.slice(-4);

            return (
              <Pressable
                key={order.id}
                style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}
              >
                <View style={styles.orderBody}>
                  <View style={styles.orderTop}>
                    <Text style={styles.orderId}>Order #{displayNumber}</Text>
                    <Text style={styles.orderTime}>{formatOrderTime(order.createdAt)}</Text>
                  </View>
                  <Text style={styles.items} numberOfLines={2}>
                    {summarizeItems(order.items)}
                  </Text>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.badgeText, { color: status.text }]}>
                        {status.label}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: fulfillment.bg }]}>
                      <FulfillmentIcon color={fulfillment.text} size={11} />
                      <Text style={[styles.badgeText, { color: fulfillment.text }]}>
                        {order.fulfillmentLabel}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.chevron}>
                  <ChevronRight color={authTheme.textMuted} size={18} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  accentBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: authTheme.brand,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: authTheme.text,
    fontSize: 19,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: 1,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    backgroundColor: authTheme.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fonts.extraBold,
  },
  queueLink: {
    color: authTheme.brand,
    fontSize: 11,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.8,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    borderStyle: 'dashed',
    backgroundColor: authTheme.bgSoft,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: authTheme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: fonts.medium,
  },
  list: {
    gap: 10,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
  },
  orderBody: {
    flex: 1,
    paddingRight: 8,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    color: authTheme.text,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  orderTime: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  items: {
    color: authTheme.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginBottom: 10,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fonts.extraBold,
    letterSpacing: 0.3,
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
