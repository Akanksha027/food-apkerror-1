import { useLocalSearchParams } from 'expo-router';
import { Bike, Clock3, MapPin, Phone } from 'lucide-react-native';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
import { useOrder, useOrderTracking } from '@/lib/order/hooks';
import { ORDER_STATUS_LABELS } from '@/lib/order/types';
import * as Linking from 'expo-linking';

export function OrderTrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const id = String(orderId ?? '');

  const order = useOrder(id);
  const tracking = useOrderTracking(id, { refetchInterval: 8_000 });

  const t = tracking.data;
  const o = order.data;

  if (tracking.isLoading && !t) {
    return <LoadingView label="Loading tracking…" />;
  }

  if (tracking.isError && !t) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.pad}>
          <ScreenHeader title="Live tracking" />
          <ErrorView
            message={
              tracking.error instanceof Error
                ? tracking.error.message
                : 'Tracking unavailable'
            }
            onRetry={tracking.refetch}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pad}>
        <ScreenHeader
          title="Live tracking"
          subtitle={o?.restaurantName || `#${id.slice(-6)}`}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={tracking.isRefetching}
            onRefresh={tracking.refetch}
            tintColor={authTheme.brand}
          />
        }
      >
        <View style={styles.hero}>
          <Clock3 color={ui.green} size={28} />
          <Text style={styles.eta}>
            {t?.etaText ||
              (typeof t?.etaMinutes === 'number'
                ? `${t.etaMinutes} mins`
                : 'Calculating ETA…')}
          </Text>
          <Text style={styles.status}>
            {ORDER_STATUS_LABELS[t?.status ?? o?.status ?? ''] ??
              t?.status ??
              o?.status ??
              'In progress'}
          </Text>
          <Text style={styles.hint}>Auto-refreshes every few seconds</Text>
        </View>

        <View style={styles.card}>
          <Bike color={authTheme.brand} size={18} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Delivery partner</Text>
            <Text style={styles.cardText}>
              {t?.deliveryPartnerName || 'Partner will be assigned soon'}
            </Text>
            {t?.deliveryPartnerPhone ? (
              <Pressable
                style={styles.phoneBtn}
                onPress={() =>
                  Linking.openURL(`tel:${t.deliveryPartnerPhone}`)
                }
              >
                <Phone color={authTheme.brand} size={14} />
                <Text style={styles.phoneText}>{t.deliveryPartnerPhone}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <MapPin color={authTheme.brand} size={18} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Live location</Text>
            {typeof t?.deliveryPartnerLat === 'number' &&
            typeof t?.deliveryPartnerLng === 'number' ? (
              <>
                <Text style={styles.cardText}>
                  Lat {t.deliveryPartnerLat.toFixed(5)}, Lng{' '}
                  {t.deliveryPartnerLng.toFixed(5)}
                </Text>
                <Pressable
                  style={styles.mapBtn}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps?q=${t.deliveryPartnerLat},${t.deliveryPartnerLng}`
                    )
                  }
                >
                  <Text style={styles.mapBtnText}>Open in Maps</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.cardText}>
                Partner location will appear once they are on the way.
              </Text>
            )}
          </View>
        </View>

        {t?.timeline?.length ? (
          <View style={styles.timeline}>
            <Text style={styles.section}>Timeline</Text>
            {t.timeline.map((step, index) => (
              <View key={`${step.status}-${index}`} style={styles.timelineRow}>
                <View style={styles.dot} />
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineStatus}>
                    {step.label ||
                      ORDER_STATUS_LABELS[step.status] ||
                      step.status}
                  </Text>
                  {step.at ? (
                    <Text style={styles.timelineAt}>
                      {new Date(step.at).toLocaleString()}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {o?.deliveryAddress?.formattedAddress ? (
          <View style={styles.card}>
            <MapPin color={authTheme.textMuted} size={18} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Delivering to</Text>
              <Text style={styles.cardText}>
                {o.deliveryAddress.formattedAddress}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
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
  hero: {
    backgroundColor: ui.card,
    borderRadius: ui.radius,
    padding: 22,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  eta: {
    color: ui.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  status: {
    color: ui.green,
    fontWeight: '800',
    fontSize: 14,
  },
  hint: { color: ui.textMuted, fontSize: 11, fontWeight: '500' },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: ui.card,
    borderRadius: ui.radius,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { color: ui.text, fontWeight: '800', fontSize: 14 },
  cardText: { color: ui.textSecondary, fontSize: 13, lineHeight: 18 },
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: ui.orangeSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  phoneText: { color: ui.orange, fontWeight: '800' },
  mapBtn: {
    alignSelf: 'flex-start',
    backgroundColor: ui.orange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  mapBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  timeline: {
    gap: 10,
    backgroundColor: ui.card,
    borderRadius: ui.radius,
    padding: 14,
  },
  section: { color: ui.text, fontWeight: '900', fontSize: 14 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ui.green,
    marginTop: 4,
  },
  timelineBody: { flex: 1, gap: 2 },
  timelineStatus: { color: ui.text, fontWeight: '700' },
  timelineAt: { color: ui.textMuted, fontSize: 12 },
});
