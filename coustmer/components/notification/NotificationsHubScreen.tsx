import { Pressable } from '@/components/common/Pressable';
import { useRouter } from 'expo-router';
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator,
  Alert,
  FlatList,
  
  RefreshControl,
  StyleSheet,
  Text,
  View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { NotificationRow } from '@/components/notification/NotificationRow';
import { authTheme } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';
import {
  useClearAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/lib/notification/hooks';
import type { AppNotification } from '@/lib/notification/types';

type Filter = 'all' | 'unread';

function openNotificationDeepLink(
  router: ReturnType<typeof useRouter>,
  item: AppNotification
) {
  const data = item.data ?? {};
  const orderId = String(
    data.orderId ?? data.order_id ?? data.order ?? ''
  ).trim();
  const restaurantId = String(
    data.restaurantId ?? data.restaurant_id ?? data.restaurant ?? ''
  ).trim();
  const paymentId = String(
    data.paymentId ?? data.payment_id ?? data.payment ?? ''
  ).trim();

  if (orderId) {
    router.push({
      pathname: '/orders/[orderId]',
      params: { orderId },
    } as never);
    return;
  }
  if (restaurantId) {
    router.push({
      pathname: '/restaurants/[restaurantId]',
      params: { restaurantId },
    } as never);
    return;
  }
  if (paymentId) {
    router.push({
      pathname: '/payments/[paymentId]',
      params: { paymentId },
    } as never);
    return;
  }
}

export function NotificationsHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  const listQuery = useNotifications(
    {
      page: 1,
      limit: 50,
      unread: filter === 'unread' ? true : undefined,
    },
    { refetchInterval: 20_000 }
  );
  const unreadCount = useUnreadNotificationCount({ refetchInterval: 12_000 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const notifications = listQuery.data?.notifications ?? [];
  const count = unreadCount.data ?? 0;

  const subtitle = useMemo(() => {
    if (count > 0) return `${count} unread`;
    if (notifications.length > 0) return 'You are all caught up';
    return 'Order updates & offers';
  }, [count, notifications.length]);

  const onOpen = (item: AppNotification) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
    openNotificationDeepLink(router, item);
  };

  const onDelete = (item: AppNotification) => {
    Alert.alert('Delete notification?', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteOne.mutate(item.id),
      },
    ]);
  };

  const onMarkAll = () => {
    if (count <= 0) return;
    markAllRead.mutate();
  };

  const onClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear all notifications?',
      'This permanently removes every notification from your inbox.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => clearAll.mutate(),
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
      style={[styles.safe, { paddingTop: Math.max(insets.top, 16) }]}
    >
      <View style={styles.container}>
        <ScreenHeader
          title="Notifications"
          subtitle={subtitle}
          right={
            <View style={styles.headerActions}>
              <Pressable
                style={styles.headerBtn}
                onPress={onMarkAll}
                disabled={count <= 0 || markAllRead.isPending}
                hitSlop={6}
                accessibilityLabel="Mark all as read"
              >
                {markAllRead.isPending ? (
                  <ActivityIndicator color={authTheme.brand} size="small" />
                ) : (
                  <CheckCheck
                    color={count > 0 ? authTheme.brand : authTheme.textDim}
                    size={18}
                  />
                )}
              </Pressable>
              <Pressable
                style={styles.headerBtn}
                onPress={onClearAll}
                disabled={notifications.length === 0 || clearAll.isPending}
                hitSlop={6}
                accessibilityLabel="Clear all notifications"
              >
                {clearAll.isPending ? (
                  <ActivityIndicator color={authTheme.brand} size="small" />
                ) : (
                  <Trash2
                    color={
                      notifications.length > 0
                        ? authTheme.brand
                        : authTheme.textDim
                    }
                    size={18}
                  />
                )}
              </Pressable>
            </View>
          }
        />

        <View style={styles.segmentedControl}>
          <Pressable
            style={[styles.segmentBtn, filter === 'all' && styles.segmentBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.segmentText,
                filter === 'all' && styles.segmentTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, filter === 'unread' && styles.segmentBtnActive]}
            onPress={() => setFilter('unread')}
          >
            <Text
              style={[
                styles.segmentText,
                filter === 'unread' && styles.segmentTextActive,
              ]}
            >
              Unread{count > 0 ? ` (${count})` : ''}
            </Text>
          </Pressable>
        </View>

        {listQuery.isLoading ? (
          <LoadingView label="Loading notifications…" />
        ) : listQuery.isError ? (
          <ErrorView
            message={getApiErrorMessage(listQuery.error)}
            onRetry={() => listQuery.refetch()}
          />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              {filter === 'unread' ? (
                <BellOff color={authTheme.brand} size={48} strokeWidth={1.5} />
              ) : (
                <Bell color={authTheme.brand} size={48} strokeWidth={1.5} />
              )}
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread'
                ? 'You are all caught up! New order updates will show here.'
                : 'Order status, exclusive offers, and account alerts will appear here.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={listQuery.isRefetching}
                onRefresh={() => {
                  listQuery.refetch();
                  unreadCount.refetch();
                }}
                tintColor={authTheme.brand}
              />
            }
            renderItem={({ item }) => (
              <NotificationRow
                notification={item}
                onPress={() => onOpen(item)}
                onDelete={() => onDelete(item)}
              />
            )}
            ListFooterComponent={
              <Text style={styles.hint}>Long-press a notification to delete</Text>
            }
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authTheme.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    marginTop: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  list: {
    paddingBottom: 40,
  },
  hint: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: authTheme.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
});
