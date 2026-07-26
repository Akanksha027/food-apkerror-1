import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  FileText,
  MapPinned,
  RefreshCw,
  Ban,
  IndianRupee,
  CalendarX2,
  Undo2,
  Star,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import {
  ErrorView,
  LoadingView,
} from '@/components/common/StateViews';
import { authTheme } from '@/constants/auth-theme';
import { swiggyOrderUi as ui } from '@/constants/swiggy-order-ui';
import {
  useCancelOrder,
  useCancelScheduledOrder,
  useFetchInvoice,
  useOrder,
  useOrderIssues,
  useReorder,
  useUpdateTip,
} from '@/lib/order/hooks';
import {
  ORDER_STATUS_LABELS,
  canCancelOrder,
  canRateOrder,
  canTipOrder,
  isActiveOrderStatus,
} from '@/lib/order/types';
import { useOrderReview } from '@/lib/review/hooks';

export function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const id = String(orderId ?? '');

  const order = useOrder(id);
  const issues = useOrderIssues(id);
  const cancelOrder = useCancelOrder(id);
  const cancelScheduled = useCancelScheduledOrder(id);
  const reorder = useReorder(id);
  const updateTip = useUpdateTip(id);
  const fetchInvoice = useFetchInvoice(id);
  const orderReview = useOrderReview(id, {
    enabled: Boolean(id) && canRateOrder(order.data?.status),
  });

  const [tipInput, setTipInput] = useState('20');
  const [cancelReason, setCancelReason] = useState('');
  const [banner, setBanner] = useState<string | null>(null);

  const data = order.data;

  const onRefresh = () => {
    order.refetch();
    issues.refetch();
    if (canRateOrder(order.data?.status)) orderReview.refetch();
  };

  const handleCancel = () => {
    Alert.alert('Cancel order?', 'This cannot be undone.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder.mutateAsync({
              reason: cancelReason || 'Changed my mind',
            });
            setBanner('Order cancelled');
            order.refetch();
          } catch (e) {
            Alert.alert(
              'Cancel failed',
              e instanceof Error ? e.message : 'Could not cancel'
            );
          }
        },
      },
    ]);
  };

  const handleCancelScheduled = () => {
    Alert.alert('Cancel scheduled order?', undefined, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelScheduled.mutateAsync();
            setBanner('Scheduled order cancelled');
            order.refetch();
          } catch (e) {
            Alert.alert(
              'Failed',
              e instanceof Error ? e.message : 'Could not cancel scheduled order'
            );
          }
        },
      },
    ]);
  };

  const handleReorder = async () => {
    try {
      const next = await reorder.mutateAsync();
      Alert.alert('Reorder placed', 'A new order was created from this one.', [
        {
          text: 'Open new order',
          onPress: () =>
            router.replace({
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
  };

  const handleTip = async () => {
    const tip = Number(tipInput);
    if (!Number.isFinite(tip) || tip < 0) {
      Alert.alert('Enter a valid tip amount');
      return;
    }
    try {
      await updateTip.mutateAsync({ tip });
      setBanner(`Tip updated to ₹${tip}`);
      order.refetch();
    } catch (e) {
      Alert.alert(
        'Tip update failed',
        e instanceof Error ? e.message : 'Could not update tip'
      );
    }
  };

  const handleInvoice = async () => {
    try {
      const invoice = await fetchInvoice.mutateAsync();
      if (invoice.url) {
        await Linking.openURL(invoice.url);
        return;
      }
      Alert.alert(
        'Invoice',
        invoice.message ||
          'Invoice fetched. No download URL was returned by the server.'
      );
    } catch (e) {
      Alert.alert(
        'Invoice failed',
        e instanceof Error ? e.message : 'Could not fetch invoice'
      );
    }
  };

  if (order.isLoading) {
    return <LoadingView label="Loading order…" />;
  }

  if (order.isError || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.pad}>
          <ScreenHeader title="Order" />
          <ErrorView
            message={
              order.error instanceof Error
                ? order.error.message
                : 'Order not found'
            }
            onRetry={order.refetch}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenHeader
          title={data.restaurantName || 'Order details'}
          subtitle={
            data.orderNumber
              ? `#${data.orderNumber}`
              : `#${data.id.slice(-8)}`
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={order.isRefetching}
            onRefresh={onRefresh}
            tintColor={authTheme.brand}
          />
        }
      >
        {banner ? <Text style={styles.banner}>{banner}</Text> : null}

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>
            {ORDER_STATUS_LABELS[data.status] ?? data.status}
          </Text>
          {data.paymentMethod || data.paymentStatus ? (
            <Text style={styles.muted}>
              Payment · {(data.paymentMethod || '—').toUpperCase()}
              {data.paymentStatus ? ` · ${data.paymentStatus}` : ''}
            </Text>
          ) : null}
          {data.estimatedDeliveryAt ? (
            <Text style={styles.muted}>
              ETA · {new Date(data.estimatedDeliveryAt).toLocaleString()}
            </Text>
          ) : null}
          {data.scheduledFor ? (
            <Text style={styles.scheduled}>
              Scheduled · {new Date(data.scheduledFor).toLocaleString()}
            </Text>
          ) : null}
        </View>

        <Text style={styles.section}>Items</Text>
        {data.items.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.quantity}× {item.name}
            </Text>
            <Text style={styles.itemPrice}>
              ₹{(item.price * item.quantity).toFixed(0)}
            </Text>
          </View>
        ))}

        <View style={styles.totals}>
          {typeof data.subtotal === 'number' ? (
            <Row label="Subtotal" value={`₹${data.subtotal.toFixed(0)}`} />
          ) : null}
          {typeof data.deliveryFee === 'number' ? (
            <Row label="Delivery fee" value={`₹${data.deliveryFee.toFixed(0)}`} />
          ) : null}
          {typeof data.tax === 'number' ? (
            <Row label="Tax" value={`₹${data.tax.toFixed(0)}`} />
          ) : null}
          {typeof data.discount === 'number' && data.discount > 0 ? (
            <Row label="Discount" value={`-₹${data.discount.toFixed(0)}`} />
          ) : null}
          {typeof data.tip === 'number' ? (
            <Row label="Tip" value={`₹${data.tip.toFixed(0)}`} />
          ) : null}
          {typeof data.total === 'number' ? (
            <Row label="Total" value={`₹${data.total.toFixed(0)}`} bold />
          ) : null}
        </View>

        {data.deliveryAddress?.formattedAddress ? (
          <View style={styles.block}>
            <Text style={styles.section}>Delivery address</Text>
            <Text style={styles.muted}>{data.deliveryAddress.formattedAddress}</Text>
          </View>
        ) : null}

        {data.specialInstructions ? (
          <View style={styles.block}>
            <Text style={styles.section}>Instructions</Text>
            <Text style={styles.muted}>{data.specialInstructions}</Text>
          </View>
        ) : null}

        <Text style={styles.section}>Actions</Text>
        <View style={styles.actions}>
          {canRateOrder(data.status) &&
          !orderReview.isLoading &&
          !orderReview.data ? (
            <ActionButton
              icon={<Star color="#FFFFFF" size={16} fill="#FFFFFF" />}
              label="Rate this order"
              onPress={() =>
                router.push({
                  pathname: '/orders/[orderId]/review',
                  params: { orderId: id },
                })
              }
            />
          ) : null}

          {canRateOrder(data.status) && orderReview.data ? (
            <ActionButton
              icon={<Star color={authTheme.brand} size={16} fill={authTheme.brand} />}
              label={`Your rating · ${orderReview.data.rating.toFixed(1)}`}
              onPress={() =>
                router.push({
                  pathname: '/orders/[orderId]/review',
                  params: { orderId: id },
                })
              }
              tone="secondary"
            />
          ) : null}

          {isActiveOrderStatus(data.status) ? (
            <ActionButton
              icon={<MapPinned color="#FFFFFF" size={16} />}
              label="Live tracking"
              onPress={() =>
                router.push({
                  pathname: '/orders/[orderId]/tracking',
                  params: { orderId: id },
                })
              }
            />
          ) : null}

          <ActionButton
            icon={<FileText color="#FFFFFF" size={16} />}
            label="Invoice"
            loading={fetchInvoice.isPending}
            onPress={handleInvoice}
            tone="secondary"
          />

          <ActionButton
            icon={<RefreshCw color="#FFFFFF" size={16} />}
            label="Reorder"
            loading={reorder.isPending}
            onPress={handleReorder}
            tone="secondary"
          />

          <ActionButton
            icon={<AlertTriangle color="#FFFFFF" size={16} />}
            label="Report issue"
            onPress={() =>
              router.push({
                pathname: '/orders/[orderId]/issues',
                params: { orderId: id },
              })
            }
            tone="secondary"
          />

          <ActionButton
            icon={<Undo2 color="#FFFFFF" size={16} />}
            label="Refunds"
            onPress={() =>
              router.push({
                pathname: '/orders/[orderId]/refunds',
                params: { orderId: id },
              })
            }
            tone="secondary"
          />

          {canCancelOrder(data.status) ? (
            <ActionButton
              icon={<Ban color="#FFFFFF" size={16} />}
              label="Cancel order"
              loading={cancelOrder.isPending}
              onPress={handleCancel}
              tone="danger"
            />
          ) : null}

          {data.isScheduled || data.scheduledFor ? (
            <ActionButton
              icon={<CalendarX2 color="#FFFFFF" size={16} />}
              label="Cancel scheduled"
              loading={cancelScheduled.isPending}
              onPress={handleCancelScheduled}
              tone="danger"
            />
          ) : null}
        </View>

        {canTipOrder(data.status) ? (
          <View style={styles.tipBox}>
            <Text style={styles.section}>Add / update tip</Text>
            <View style={styles.tipRow}>
              <IndianRupee color={authTheme.textMuted} size={16} />
              <TextInput
                style={styles.tipInput}
                keyboardType="numeric"
                value={tipInput}
                onChangeText={setTipInput}
                placeholder="Amount"
                placeholderTextColor={authTheme.textDim}
              />
              <Pressable
                style={styles.tipBtn}
                onPress={handleTip}
                disabled={updateTip.isPending}
              >
                {updateTip.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.tipBtnText}>Save tip</Text>
                )}
              </Pressable>
            </View>
            <Text style={styles.hint}>
              Tip can be updated before the restaurant accepts the order.
            </Text>
          </View>
        ) : null}

        {canCancelOrder(data.status) ? (
          <View style={styles.block}>
            <Text style={styles.section}>Cancel reason (optional)</Text>
            <TextInput
              style={styles.input}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Why are you cancelling?"
              placeholderTextColor={authTheme.textDim}
            />
          </View>
        ) : null}

        <Text style={styles.section}>
          Reported issues ({issues.data?.length ?? 0})
        </Text>
        {issues.isLoading ? (
          <ActivityIndicator color={authTheme.brand} />
        ) : issues.data?.length ? (
          issues.data.map((issue) => (
            <View key={issue.id} style={styles.issueCard}>
              <Text style={styles.issueType}>{issue.type}</Text>
              <Text style={styles.muted}>{issue.description}</Text>
              {issue.status ? (
                <Text style={styles.issueStatus}>{issue.status}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.muted}>No issues reported for this order.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.muted, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.itemPrice, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  loading,
  tone = 'primary',
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  loading?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
}) {
  const colors =
    tone === 'danger'
      ? (['#DC2626', '#E8482F'] as const)
      : tone === 'secondary'
        ? ([authTheme.brandLight, authTheme.brand] as const)
        : ([authTheme.brand, authTheme.brandDark] as const);

  return (
    <Pressable
      style={styles.actionBtn}
      onPress={onPress}
      disabled={loading}
    >
      <LinearGradient colors={colors} style={styles.actionGradient}>
        {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : icon}
        <Text style={styles.actionText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ui.pageBg },
  pad: {
    paddingHorizontal: ui.hPad,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: ui.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  scroll: {
    paddingHorizontal: ui.hPad,
    paddingTop: 12,
    paddingBottom: 40,
    gap: ui.sectionGap,
  },
  banner: {
    backgroundColor: ui.greenSoft,
    color: ui.green,
    fontWeight: '700',
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusCard: {
    backgroundColor: ui.card,
    borderRadius: ui.radius,
    padding: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statusLabel: { color: ui.textMuted, fontSize: 12, fontWeight: '600' },
  statusValue: {
    color: ui.text,
    fontSize: 22,
    fontWeight: '900',
  },
  scheduled: { color: '#7C3AED', fontWeight: '700', marginTop: 4 },
  section: {
    color: ui.text,
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: ui.card,
    borderRadius: 12,
    padding: 12,
  },
  itemName: { flex: 1, color: ui.text, fontWeight: '600' },
  itemPrice: { color: ui.text, fontWeight: '800' },
  totals: {
    backgroundColor: ui.card,
    borderRadius: ui.radius,
    padding: 14,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  muted: { color: ui.textSecondary, fontSize: 13, lineHeight: 18 },
  bold: { color: ui.text, fontWeight: '900', fontSize: 15 },
  block: {
    gap: 6,
    backgroundColor: ui.card,
    borderRadius: ui.radius,
    padding: 14,
  },
  actions: { gap: 8 },
  actionBtn: { borderRadius: 12, overflow: 'hidden' },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  actionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  tipBox: {
    gap: 8,
    backgroundColor: ui.card,
    borderRadius: ui.radius,
    padding: 14,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAFAFB',
    borderWidth: 1,
    borderColor: ui.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  tipInput: {
    flex: 1,
    paddingVertical: 12,
    color: ui.text,
    fontWeight: '700',
  },
  tipBtn: {
    backgroundColor: ui.orange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tipBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  hint: { color: ui.textMuted, fontSize: 11 },
  input: {
    borderWidth: 1,
    borderColor: ui.border,
    borderRadius: 12,
    padding: 12,
    color: ui.text,
    backgroundColor: ui.card,
  },
  issueCard: {
    backgroundColor: ui.card,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  issueType: {
    color: ui.orange,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  issueStatus: {
    color: ui.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
});