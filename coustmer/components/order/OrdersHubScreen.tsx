import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  Package,
  Receipt,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EmptyView,
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { SmoothPressable } from '@/components/common/SmoothPressable';
import { APP_BOTTOM_NAV_INSET } from '@/components/navigation/AppBottomNav';
import { OrderCard } from '@/components/order/OrderCard';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { swiggyOrderUi as ui } from '@/constants/swiggy-order-ui';
import {
  useActiveOrders,
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
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('all');
  const [tipVisible, setTipVisible] = useState(true);
  const [oneVisible, setOneVisible] = useState(true);

  const all = useOrders({ limit: 50 });
  const active = useActiveOrders();
  const scheduled = useScheduledOrders();

  const allOrders = all.data?.orders ?? [];

  const orders: Order[] = useMemo(() => {
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

  const activeCount = useMemo(() => {
    return mergeOrders(
      active.data ?? [],
      allOrders.filter(
        (o) => isActiveOrderStatus(o.status) && !isScheduledOrder(o)
      )
    ).length;
  }, [active.data, allOrders]);

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
    all.refetch();
    active.refetch();
    scheduled.refetch();
  };

  const refreshing =
    all.isRefetching || active.isRefetching || scheduled.isRefetching;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <SmoothPressable
          onPress={goBack}
          style={styles.backBtn}
          pressScale={0.9}
          hitSlop={8}
        >
          <ArrowLeft color={ui.text} size={22} strokeWidth={2.2} />
        </SmoothPressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Your orders</Text>
          <Text style={styles.subtitle}>
            {activeCount > 0
              ? `${activeCount} active right now`
              : 'Track, reorder & browse past meals'}
          </Text>
        </View>
        <View style={styles.backBtn} />
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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refetch}
              tintColor={authTheme.brand}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {tipVisible ? (
                <View style={styles.tipBanner}>
                  <View style={styles.tipIcon}>
                    <Package color={authTheme.brand} size={20} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipTitle}>Need help with an order?</Text>
                    <Pressable onPress={() => router.push('/support')}>
                      <Text style={styles.tipLink}>See how support works</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={() => setTipVisible(false)}
                    accessibilityLabel="Dismiss tip"
                  >
                    <X color={ui.textMuted} size={16} />
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.tabs}>
                {(
                  [
                    { id: 'all', label: 'All', icon: Receipt },
                    { id: 'active', label: 'Active', icon: Activity },
                    {
                      id: 'scheduled',
                      label: 'Scheduled',
                      icon: CalendarClock,
                    },
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
                        color={selected ? authTheme.brand : ui.textMuted}
                        size={14}
                        strokeWidth={2.2}
                      />
                      <Text
                        style={[
                          styles.tabText,
                          selected && styles.tabTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          ListFooterComponent={
            oneVisible ? (
              <LinearGradient
                colors={['#FFF5F3', '#FFE8E2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.oneBanner}
              >
                <View style={styles.oneBadge}>
                  <Sparkles color="#FFFFFF" size={12} strokeWidth={2.4} />
                  <Text style={styles.oneBadgeText}>one</Text>
                </View>
                <Text style={styles.oneCopy}>
                  Unlimited free deliveries & extra discounts
                </Text>
                <Pressable
                  onPress={() => router.push('/deals' as import('expo-router').Href)}
                  hitSlop={6}
                >
                  <Text style={styles.oneCta}>Join</Text>
                </Pressable>
                <Pressable
                  hitSlop={8}
                  onPress={() => setOneVisible(false)}
                  style={styles.oneClose}
                >
                  <X color={authTheme.brand} size={14} />
                </Pressable>
              </LinearGradient>
            ) : (
              <View style={{ height: 8 }} />
            )
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ui.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: ui.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: ui.textMuted,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28 + APP_BOTTOM_NAV_INSET,
    flexGrow: 1,
  },
  listHeader: {
    gap: 12,
    marginBottom: 10,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF5F3',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD5CD',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: ui.text,
  },
  tipLink: {
    marginTop: 2,
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: authTheme.brand,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: authTheme.brandSoft,
  },
  tabText: {
    fontFamily: fonts.uiSemi,
    color: ui.textMuted,
    fontSize: 12,
  },
  tabTextActive: {
    fontFamily: fonts.uiBold,
    color: authTheme.brand,
  },
  oneBanner: {
    marginTop: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FFD5CD',
  },
  oneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: authTheme.brand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  oneBadgeText: {
    fontFamily: fonts.script,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
  },
  oneCopy: {
    flex: 1,
    fontFamily: fonts.uiMedium,
    color: ui.text,
    fontSize: 12,
    lineHeight: 16,
  },
  oneCta: {
    fontFamily: fonts.uiBold,
    color: authTheme.brand,
    fontSize: 13,
  },
  oneClose: {
    marginLeft: 2,
  },
});
