import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardTabBar } from '@/components/dashboard/DashboardTabBar';
import { PendingOrdersSection } from '@/components/dashboard/PendingOrdersSection';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useDashboardStats } from '@/lib/dashboard/hooks';

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useDashboardStats();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.accentBar} />
        <View>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Live queue from your restaurant</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={authTheme.brand} />
        </View>
      ) : (
        <View style={styles.body}>
          <PendingOrdersSection
            orders={data?.pendingOrders ?? []}
            onQueuePress={() => undefined}
          />
        </View>
      )}

      <DashboardTabBar
        active="orders"
        centerBadge={data?.quickActions.activeOrders}
        onNavigate={(href) => router.push(href)}
        onCenterPress={() => router.push('/menu')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: authTheme.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: authTheme.bg,
    borderBottomWidth: 1,
    borderBottomColor: authTheme.cardBorder,
  },
  accentBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: authTheme.brand,
  },
  title: {
    color: authTheme.text,
    fontSize: 22,
    fontFamily: fonts.extraBold,
  },
  subtitle: {
    color: authTheme.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: PARTNER_BOTTOM_NAV_INSET,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: PARTNER_BOTTOM_NAV_INSET + 16,
  },
});
