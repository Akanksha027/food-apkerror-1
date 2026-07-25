import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { DashboardTabBar } from '@/components/dashboard/DashboardTabBar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { InsightBanner } from '@/components/dashboard/InsightBanner';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { PendingOrdersSection } from '@/components/dashboard/PendingOrdersSection';
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid';
import { RevenueCard } from '@/components/dashboard/RevenueCard';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { useDashboardStats } from '@/lib/dashboard/hooks';
import { isRestaurantProfileComplete } from '@/lib/navigation/post-auth';
import { restaurantOwnerApi } from '@/lib/restaurant/api';
import { useAuthStore } from '@/store/auth-store';

export function RestaurantDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const { data, isLoading, isRefetching, refetch, error } = useDashboardStats(
    profileComplete === true
  );

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    'Partner';

  useEffect(() => {
    let active = true;
    restaurantOwnerApi
      .getMyRestaurant()
      .then((my) => {
        if (!active) return;
        setProfileComplete(isRestaurantProfileComplete(my));
      })
      .catch(() => {
        if (!active) return;
        setProfileComplete(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (profileComplete === false) {
      router.replace('/restaurant-setup');
    }
  }, [profileComplete, router]);

  if (profileComplete === null || profileComplete === false || (isLoading && !data)) {
    return (
      <View style={[styles.screen, styles.center]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={authTheme.brand} size="large" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <DashboardHeader name={displayName} />
        <View style={[styles.center, { flex: 1 }]}>
          <ActivityIndicator color={authTheme.brand} />
        </View>
        <DashboardTabBar active="stats" onNavigate={(href) => router.push(href)} />
      </View>
    );
  }

  const dashboard = data!;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={authTheme.brand}
            colors={[authTheme.brand]}
          />
        }
      >
        <DashboardHeader
          name={displayName}
          restaurantName={dashboard.restaurantName}
          restaurantCity={dashboard.city}
          activeOrders={dashboard.quickActions.activeOrders}
          onNotificationsPress={() =>
            Alert.alert('Notifications', 'Notification center is coming soon.')
          }
          onProfilePress={() => router.push('/admin')}
        />

        <View style={styles.body}>
          <InsightBanner insight={dashboard.insight} />
          <RevenueCard metrics={dashboard.metrics} />
          <MetricCards metrics={dashboard.metrics} />
          <QuickActionsGrid
            actions={dashboard.quickActions}
            onOrdersPress={() => router.push('/orders')}
            onMenuPress={() => router.push('/menu')}
          />
          <PendingOrdersSection
            orders={dashboard.pendingOrders}
            onQueuePress={() => router.push('/orders')}
          />
        </View>
      </ScrollView>

      <DashboardTabBar
        active="stats"
        centerBadge={dashboard.quickActions.activeOrders}
        onNavigate={(href) => router.push(href)}
        onCenterPress={() =>
          Alert.alert('Quick add', 'Choose Menu or Offer to add a new item.')
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF7F2',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: PARTNER_BOTTOM_NAV_INSET + 24,
  },
  body: {
    paddingHorizontal: 20,
    marginTop: -18,
    gap: 14,
  },
});
