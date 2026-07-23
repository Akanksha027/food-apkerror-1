import { useRouter } from 'expo-router';
import { Activity, CalendarClock, HeartPulse, Receipt } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { APP_BOTTOM_NAV_INSET } from '@/components/navigation/AppBottomNav';
import { OrderCard } from '@/components/order/OrderCard';
import { authTheme } from '@/constants/auth-theme';
import {
  useActiveOrders,
  useOrderServiceHealth,
  useOrders,
  useScheduledOrders,
} from '@/lib/order/hooks';
import {
  isActiveOrderStatus,
  isScheduledOrder,
  type Order,
} from '@/lib/order/types';

type Tab = 'all' | 'active' | 'scheduled';

function mergeOrders(...lists: Order[][]): Order[] {
  const map = new Map<string, Order>();
  for (const list of lists) {
    for (const order of list) {
      if (!order.id) continue;
      map.set(order.id, order);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bTime - aTime;
  });
}

export function OrdersHubScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('all');

  const health = useOrderServiceHealth();
  const all = useOrders({ limit: 50 });
  const active = useActiveOrders();
  const scheduled = useScheduledOrders();

  const allOrders = all.data?.orders ?? [];

  const orders: Order[] = useMemo(() => {
    // /orders/active and /orders/scheduled are often empty or shaped differently
    // than /orders — always merge with client-side filters from All so tabs stay in sync.
    if (tab === 'active') {
      const fromAll = allOrders.filter(
        (order) => isActiveOrderStatus(order.status) && !isScheduledOrder(order)
      );
      return mergeOrders(active.data ?? [], fromAll);
    }
    if (tab === 'scheduled') {
      const fromAll = allOrders.filter(isScheduledOrder);
      return mergeOrders(scheduled.data ?? [], fromAll);
    }
    return allOrders;
  }, [tab, active.data, scheduled.data, allOrders]);

  const isLoading =
    tab === 'all'
      ? all.isLoading
      : tab === 'active'
        ? active.isLoading && all.isLoading
        : scheduled.isLoading && all.isLoading;

  const isError =
    tab === 'all'
      ? all.isError
      : tab === 'active'
        ? active.isError && all.isError
        : scheduled.isError && all.isError;

  const error =
    tab === 'all'
      ? all.error
      : tab === 'active'
        ? active.error ?? all.error
        : scheduled.error ?? all.error;

  const refetch = () => {
    health.refetch();
    all.refetch();
    active.refetch();
    scheduled.refetch();
  };

  const refreshing =
    all.isRefetching || active.isRefetching || scheduled.isRefetching;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenHeader
          title="My orders"
          subtitle="History, active & scheduled"
          right={
            <Pressable
              style={styles.cartLink}
              onPress={() => router.push('/cart')}
            >
              <Receipt color={authTheme.brand} size={18} />
            </Pressable>
          }
        />

        <View style={styles.healthRow}>
          <HeartPulse
            color={health.isSuccess ? '#16A34A' : authTheme.textMuted}
            size={14}
          />
          <Text style={styles.healthText}>
            Order service:{' '}
            {health.isLoading
              ? 'checking…'
              : health.isSuccess
                ? health.data?.status ?? 'ok'
                : health.isError
                  ? 'unavailable'
                  : '—'}
          </Text>
        </View>

        <View style={styles.tabs}>
          {(
            [
              { id: 'all', label: 'All', icon: Receipt },
              { id: 'active', label: 'Active', icon: Activity },
              { id: 'scheduled', label: 'Scheduled', icon: CalendarClock },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const selected = tab === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.tab, selected && styles.tabActive]}
                onPress={() => setTab(item.id)}
              >
                <Icon
                  color={selected ? '#FFFFFF' : authTheme.textMuted}
                  size={14}
                />
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <LoadingView label="Loading orders…" />
      ) : isError ? (
        <ErrorView
          message={
            error instanceof Error ? error.message : 'Failed to load orders'
          }
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refetch}
              tintColor={authTheme.brand}
            />
          }
          ListEmptyComponent={
            <EmptyView
              title={
                tab === 'active'
                  ? 'No active orders'
                  : tab === 'scheduled'
                    ? 'No scheduled orders'
                    : 'No orders yet'
              }
              subtitle={
                tab === 'all'
                  ? 'Place an order from a restaurant menu to see it here.'
                  : undefined
              }
            />
          }
          renderItem={({ item }) => <OrderCard order={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: authTheme.bg },
  pad: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  cartLink: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.brandSoft,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthText: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: authTheme.surface,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: authTheme.brand,
  },
  tabText: {
    color: authTheme.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32 + APP_BOTTOM_NAV_INSET,
  },
});
