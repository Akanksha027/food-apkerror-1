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
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  EmptyView,
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
    <SafeAreaView style={styles.safe} edges={['top']}>
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

        <View style={styles.filters}>
          <Pressable
            style={[styles.chip, filter === 'all' && styles.chipActive]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.chipText,
                filter === 'all' && styles.chipTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, filter === 'unread' && styles.chipActive]}
            onPress={() => setFilter('unread')}
          >
            <Text
              style={[
                styles.chipText,
                filter === 'unread' && styles.chipTextActive,
              ]}
            >
              Unread{count > 0 ? ` · ${count}` : ''}
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
          <EmptyView
            icon={
              filter === 'unread' ? (
                <BellOff color={authTheme.textDim} size={42} />
              ) : (
                <Bell color={authTheme.textDim} size={42} />
              )
            }
            title={
              filter === 'unread' ? 'No unread notifications' : 'No notifications yet'
            }
            subtitle={
              filter === 'unread'
                ? 'You are up to date. New order updates will show here.'
                : 'Order status, offers, and account alerts will appear here.'
            }
          />
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
    </SafeAreaView>
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
    paddingTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: authTheme.card,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: authTheme.card,
    borderWidth: 1.5,
    borderColor: authTheme.inputBorder,
  },
  chipActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: authTheme.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingBottom: 32,
  },
  hint: {
    textAlign: 'center',
    color: authTheme.textDim,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
});
